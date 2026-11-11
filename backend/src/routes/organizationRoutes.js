const express = require('express');
const Organization = require('../models/Organization');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/organization
 * @desc    Get current organization settings and profile
 */
router.get('/', protect, async (req, res) => {
  try {
    const org = await Organization.findById(req.organization._id);
    res.json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/organization
 * @desc    Update organization settings (Admin only)
 */
router.put('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name, companyAddress, settings, defaultJurisdiction } = req.body;

    const org = await Organization.findById(req.organization._id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    if (name) org.name = name;
    if (defaultJurisdiction) org.defaultJurisdiction = defaultJurisdiction;
    if (companyAddress) org.companyAddress = { ...org.companyAddress, ...companyAddress };
    if (settings) org.settings = { ...org.settings, ...settings };

    await org.save();

    res.json({ success: true, message: 'Organization details updated', data: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/organization/audit-ledger
 * @desc    Get complete organization compliance audit ledger (Admin only)
 */
router.get('/audit-ledger', protect, authorize('Admin'), async (req, res) => {
  try {
    const GeneratedDocument = require('../models/GeneratedDocument');
    const docs = await GeneratedDocument.find({ organizationId: req.organization._id })
      .select('title candidate roleDetails jurisdictionSnapshot status auditTrail createdAt')
      .sort({ createdAt: -1 });

    const auditLedger = [];
    docs.forEach((doc) => {
      doc.auditTrail.forEach((log) => {
        auditLedger.push({
          documentId: doc._id,
          documentTitle: doc.title,
          candidateName: doc.candidate.fullName,
          jurisdiction: doc.jurisdictionSnapshot.code,
          status: doc.status,
          action: log.action,
          performedByName: log.performedByName || 'System / Candidate',
          timestamp: log.timestamp,
          details: log.details,
        });
      });
    });

    auditLedger.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ success: true, count: auditLedger.length, data: auditLedger });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
