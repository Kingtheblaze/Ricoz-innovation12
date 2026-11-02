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

module.exports = router;
