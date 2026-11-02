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

module.exports = router;
