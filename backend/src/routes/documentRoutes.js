const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');
const Jurisdiction = require('../models/Jurisdiction');
const GeneratedDocument = require('../models/GeneratedDocument');
const RuleEngine = require('../services/ruleEngine');
const PdfGeneratorService = require('../services/pdfGenerator');
const DocxGeneratorService = require('../services/docxGenerator');
const { protect, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

const generateDocSchema = z.object({
  jurisdictionCode: z.string().min(2, 'Jurisdiction code is required'),
  documentType: z.enum(['OFFER_LETTER', 'EMPLOYMENT_AGREEMENT', 'FULL_COMPLIANCE_BUNDLE']).default('FULL_COMPLIANCE_BUNDLE'),
  candidate: z.object({
    fullName: z.string().min(2, 'Candidate full name is required'),
    email: z.string().email('Valid candidate email is required'),
    phone: z.string().optional().default(''),
    residentialAddress: z
      .object({
        street: z.string().optional().default(''),
        city: z.string().optional().default(''),
        state: z.string().optional().default(''),
        postalCode: z.string().optional().default(''),
        country: z.string().optional().default(''),
      })
      .optional(),
  }),
  roleDetails: z.object({
    jobTitle: z.string().min(2, 'Job title is required'),
    department: z.string().optional().default('Engineering'),
    reportingTo: z.string().optional().default('Engineering Director'),
    employmentType: z.enum(['Full-Time', 'Part-Time', 'Contractor', 'Fixed-Term']).default('Full-Time'),
    workArrangement: z.enum(['Remote', 'Hybrid', 'On-Site']).default('Remote'),
    workLocation: z.string().optional().default('Remote / Home Office'),
    startDate: z.string().min(4, 'Start date is required'),
  }),
  compensation: z.object({
    baseSalary: z.number().positive('Base salary must be positive'),
    currency: z.string().optional().default('USD'),
    payFrequency: z.enum(['Annual', 'Monthly', 'Bi-Weekly', 'Semi-Monthly', 'Hourly']).default('Annual'),
    equityGrantDetails: z.string().optional().default(''),
    bonusStructure: z.string().optional().default(''),
    benefitsSummary: z.string().optional().default(''),
  }),
  customClauses: z
    .array(
      z.object({
        clauseKey: z.string().optional(),
        title: z.string().min(2),
        content: z.string().min(2),
        category: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

/**
 * @route   POST /api/documents/generate
 * @desc    Generate a compliant employment contract and persist in DB with audit trail
 */
router.post('/generate', protect, authorize('Admin', 'HR'), validateBody(generateDocSchema), async (req, res) => {
  try {
    const { jurisdictionCode, documentType, candidate, roleDetails, compensation, customClauses } = req.body;

    // 1. Fetch Jurisdiction Rule Matrix
    const jurisdiction = await Jurisdiction.findOne({
      code: jurisdictionCode.toUpperCase(),
      isActive: true,
    });

    if (!jurisdiction) {
      return res.status(404).json({
        success: false,
        message: `Jurisdiction [${jurisdictionCode}] is invalid or not currently active.`,
      });
    }

    // 2. Prepare Context for Rule Engine
    const context = {
      candidate,
      roleDetails,
      compensation,
      company: {
        name: req.organization.name,
        companyAddress: req.organization.companyAddress,
        settings: req.organization.settings,
      },
    };

    // 3. Process Rules via RuleEngine
    const engineResult = RuleEngine.processContractRules(jurisdiction, context, customClauses);

    const docTitle =
      documentType === 'OFFER_LETTER'
        ? `Offer of Employment: ${candidate.fullName}`
        : documentType === 'EMPLOYMENT_AGREEMENT'
        ? `Employment Agreement: ${candidate.fullName}`
        : `Executive Employment Agreement & Statutory Offer Bundle: ${candidate.fullName}`;

    const fileToken = crypto.randomBytes(24).toString('hex');

    // 4. Save to Database with initial AUDIT TRAIL entry
    const newDoc = await GeneratedDocument.create({
      organizationId: req.organization._id,
      createdBy: req.user._id,
      documentType,
      title: docTitle,
      candidate,
      roleDetails: {
        ...roleDetails,
        startDate: new Date(roleDetails.startDate),
      },
      compensation,
      jurisdictionSnapshot: engineResult.jurisdictionSnapshot,
      appliedClauses: engineResult.appliedClauses,
      customClausesAdded: engineResult.standaloneCustomClauses,
      legalDisclaimer: engineResult.legalDisclaimer,
      metadata: {
        generatedAt: new Date(),
        fileToken,
      },
      auditTrail: [
        {
          action: 'GENERATED',
          performedBy: req.user._id,
          performedByName: req.user.fullName,
          timestamp: new Date(),
          details: {
            jurisdictionCode: jurisdiction.code,
            versionUsed: jurisdiction.currentVersion,
            clausesCount: engineResult.appliedClauses.length,
          },
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Document generated and localized successfully',
      data: {
        document: newDoc,
        complianceWarnings: engineResult.complianceWarnings,
      },
    });
  } catch (error) {
    console.error('[Document Generate Error]:', error);
    res.status(500).json({ success: false, message: 'Document generation failed', error: error.message });
  }
});

/**
 * @route   GET /api/documents
 * @desc    List all documents generated for the current organization tenant
 */
router.get('/', protect, async (req, res) => {
  try {
    const docs = await GeneratedDocument.find({ organizationId: req.organization._id })
      .sort({ createdAt: -1 })
      .select('-appliedClauses.renderedText') // lighter payload for list
      .populate('createdBy', 'fullName email');

    res.json({ success: true, count: docs.length, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/documents/:id
 * @desc    Get detailed document view including full rendered clauses and audit history
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await GeneratedDocument.findOne({
      _id: req.params.id,
      organizationId: req.organization._id,
    }).populate('createdBy', 'fullName email');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Append to audit trail
    doc.auditTrail.push({
      action: 'VIEWED',
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      timestamp: new Date(),
    });
    await doc.save();

    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/documents/:id/pdf
 * @desc    Export generated document as professional PDF
 */
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const doc = await GeneratedDocument.findOne({
      _id: req.params.id,
      organizationId: req.organization._id,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Audit log
    doc.auditTrail.push({
      action: 'DOWNLOADED_PDF',
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      timestamp: new Date(),
    });
    await doc.save();

    const pdfStream = PdfGeneratorService.generateDocumentPdf(doc);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Employment_Agreement_${doc.candidate.fullName.replace(/\s+/g, '_')}_${doc.jurisdictionSnapshot.code}.pdf"`
    );

    pdfStream.pipe(res);
    pdfStream.end();
  } catch (error) {
    res.status(500).json({ success: false, message: 'PDF export failed', error: error.message });
  }
});

/**
 * @route   GET /api/documents/:id/docx
 * @desc    Export generated document as editable Microsoft Word DOCX
 */
router.get('/:id/docx', protect, async (req, res) => {
  try {
    const doc = await GeneratedDocument.findOne({
      _id: req.params.id,
      organizationId: req.organization._id,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Audit log
    doc.auditTrail.push({
      action: 'DOWNLOADED_DOCX',
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      timestamp: new Date(),
    });
    await doc.save();

    const docxBuffer = await DocxGeneratorService.generateDocumentDocx(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Employment_Agreement_${doc.candidate.fullName.replace(/\s+/g, '_')}_${doc.jurisdictionSnapshot.code}.docx"`
    );

    res.send(docxBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'DOCX export failed', error: error.message });
  }
});

/**
 * @route   PATCH /api/documents/:id/clauses/:clauseKey
 * @desc    In-place discretionary clause editing with compliance guardrails
 */
router.patch('/:id/clauses/:clauseKey', protect, authorize('Admin', 'HR'), async (req, res) => {
  try {
    const { id, clauseKey } = req.params;
    const { renderedText } = req.body;

    if (!renderedText || typeof renderedText !== 'string') {
      return res.status(400).json({ success: false, message: 'Updated clause text is required.' });
    }

    const doc = await GeneratedDocument.findOne({
      _id: id,
      organizationId: req.organization._id,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const clauseIndex = doc.appliedClauses.findIndex((c) => c.clauseKey === clauseKey);
    if (clauseIndex === -1) {
      return res.status(404).json({ success: false, message: `Clause [${clauseKey}] not found in document.` });
    }

    const targetClause = doc.appliedClauses[clauseIndex];
    if (targetClause.isMandatory) {
      return res.status(403).json({
        success: false,
        message: 'Statutory mandatory clauses cannot be modified without statutory amendment.',
      });
    }

    targetClause.renderedText = renderedText;
    targetClause.wasCustomized = true;

    doc.auditTrail.push({
      action: 'CUSTOM_CLAUSE_OVERRIDDEN',
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      timestamp: new Date(),
      details: { clauseKey },
    });

    await doc.save();
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Clause update failed', error: error.message });
  }
});

/**
 * @route   POST /api/documents/:id/send
 * @desc    Generate secure token and mark document as sent for candidate e-signature
 */
router.post('/:id/send', protect, authorize('Admin', 'HR'), async (req, res) => {
  try {
    const doc = await GeneratedDocument.findOne({
      _id: req.params.id,
      organizationId: req.organization._id,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    doc.signingToken = token;
    doc.signingTokenExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days validity
    doc.status = 'SENT';

    doc.auditTrail.push({
      action: 'VIEWED',
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      timestamp: new Date(),
      details: { event: 'SENT_FOR_E_SIGNATURE', recipient: doc.candidate.email },
    });

    await doc.save();
    res.json({ success: true, data: { signingToken: token, status: doc.status } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to issue signing token', error: error.message });
  }
});

/**
 * @route   GET /api/documents/sign/:token
 * @desc    Public endpoint for candidate to view agreement via secure token
 */
router.get('/sign/:token', async (req, res) => {
  try {
    const doc = await GeneratedDocument.findOne({
      signingToken: req.params.token,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Signing invitation link is invalid or expired.' });
    }

    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve document', error: error.message });
  }
});

/**
 * @route   POST /api/documents/sign/:token
 * @desc    Public endpoint to execute digital e-signature
 */
router.post('/sign/:token', async (req, res) => {
  try {
    const { fullName, signatureImage } = req.body;
    if (!fullName || !signatureImage) {
      return res.status(400).json({ success: false, message: 'Candidate full name and signature image are required.' });
    }

    const doc = await GeneratedDocument.findOne({
      signingToken: req.params.token,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Signing token is invalid or expired.' });
    }

    doc.status = 'SIGNED';
    doc.signature = {
      signedBy: fullName,
      signedAt: new Date(),
      signatureImage,
      signerIp: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      signerEmail: doc.candidate.email,
    };

    doc.auditTrail.push({
      action: 'GENERATED',
      performedByName: `${fullName} (Candidate)`,
      timestamp: new Date(),
      details: { event: 'DIGITALLY_EXECUTED_BY_CANDIDATE' },
    });

    await doc.save();
    res.json({ success: true, data: { status: doc.status, signedAt: doc.signature.signedAt } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Digital execution failed', error: error.message });
  }
});

/**
 * @route   POST /api/documents/scan-risk
 * @desc    AI & Heuristic statutory compliance risk scanner
 */
router.post('/scan-risk', protect, async (req, res) => {
  try {
    const { text, jurisdictionCode } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Clause text is required.' });
    }

    const issues = [];
    const normalized = text.toLowerCase();
    const jur = (jurisdictionCode || 'US-CA').toUpperCase();

    // 1. California Checks
    if (jur === 'US-CA') {
      if (
        normalized.includes('compete') ||
        normalized.includes('non-compete') ||
        normalized.includes('restrictive covenant') ||
        normalized.includes('directly or indirectly engage in')
      ) {
        issues.push({
          severity: 'HIGH',
          ruleKey: 'CA_SB699_NON_COMPETE',
          title: 'Unlawful Non-Compete Covenant',
          statute: 'California Business & Professions Code § 16600, SB 699, AB 1076',
          foundTextSample: text.substring(0, 100),
          explanation: 'Post-employment non-compete agreements are void ab initio in California and subject employers to civil liability and private right of action.',
          recommendation: 'Remove restrictive non-compete covenants entirely. Use confidentiality and trade secret protections instead.',
        });
      }

      if (
        (normalized.includes('invention') || normalized.includes('intellectual property')) &&
        !normalized.includes('2870')
      ) {
        issues.push({
          severity: 'MEDIUM',
          ruleKey: 'CA_LC2870_INVENTIONS',
          title: 'Missing Mandatory Labor Code § 2870 Carve-Out',
          statute: 'California Labor Code § 2870',
          foundTextSample: 'Inventions assignment without statutory notice',
          explanation: 'Employers must provide written notice that IP assignments do not apply to inventions developed entirely on employee own time without company assets.',
          recommendation: 'Append statutory notice: "Pursuant to CA Labor Code § 2870, this assignment does not apply to inventions developed entirely on personal time without employer resources."',
        });
      }
    }

    // 2. UK Checks
    if (jur === 'GB-UK') {
      if (
        normalized.includes('2 days') ||
        normalized.includes('48 hours') ||
        normalized.includes('immediate termination') ||
        normalized.includes('at will')
      ) {
        issues.push({
          severity: 'HIGH',
          ruleKey: 'UK_ERA1996_NOTICE',
          title: 'Sub-Statutory Termination Notice',
          statute: 'Employment Rights Act 1996 Section 86',
          foundTextSample: text.substring(0, 100),
          explanation: 'UK law imposes minimum statutory notice of at least 1 week per year of service (up to 12 weeks). At-will termination does not exist in English law.',
          recommendation: 'Incorporate standard statutory notice periods (minimum 1 week to 12 weeks based on continuous service).',
        });
      }
    }

    // 3. New York Checks
    if (jur === 'US-NY') {
      if (normalized.includes('salary history') || normalized.includes('prior compensation')) {
        issues.push({
          severity: 'HIGH',
          ruleKey: 'NY_SALARY_HISTORY_BAN',
          title: 'Unlawful Salary History Inquiry',
          statute: 'New York Labor Law § 194-a',
          foundTextSample: text.substring(0, 100),
          explanation: 'Inquiring about or setting wages based on prior compensation history is unlawful in New York State.',
          recommendation: 'Base all compensation strictly on role salary band transparency.',
        });
      }
    }

    const score = Math.max(10, 100 - issues.length * 30);
    const summary = issues.length === 0 ? 'Compliant' : `${issues.length} statutory liabilities detected`;

    res.json({
      success: true,
      data: { score, issues, summary },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Risk scan failed', error: error.message });
  }
});

module.exports = router;
