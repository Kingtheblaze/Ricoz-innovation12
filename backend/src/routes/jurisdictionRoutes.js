const express = require('express');
const { z } = require('zod');
const Jurisdiction = require('../models/Jurisdiction');
const { protect, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

/**
 * @route   GET /api/jurisdictions
 * @desc    Get all active jurisdictions with rule summary
 */
router.get('/', protect, async (req, res) => {
  try {
    const jurisdictions = await Jurisdiction.find({ isActive: true }).select(
      'code name regionType countryCode currentVersion standardCurrency statutoryNoticeWeeks atWillDoctrineApplies nonCompeteEnforceability governingLawDescription updatedAt'
    );
    res.json({ success: true, count: jurisdictions.length, data: jurisdictions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/jurisdictions/:code
 * @desc    Get specific jurisdiction with complete versioned rule matrix
 */
router.get('/:code', protect, async (req, res) => {
  try {
    const jurisdiction = await Jurisdiction.findOne({
      code: req.params.code.toUpperCase(),
      isActive: true,
    });

    if (!jurisdiction) {
      return res.status(404).json({ success: false, message: `Jurisdiction [${req.params.code}] not found` });
    }

    res.json({ success: true, data: jurisdiction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Schema for updating rules or creating new version
 */
const updateRulesSchema = z.object({
  version: z.string().min(1, 'Version label is required'),
  summaryOfChanges: z.string().min(3, 'Summary of changes is required'),
  rules: z.array(
    z.object({
      clauseKey: z.string(),
      title: z.string(),
      category: z.string(),
      isMandatory: z.boolean(),
      allowCompanyCustomization: z.boolean(),
      legalReference: z.string().optional(),
      contentTemplate: z.string(),
      description: z.string().optional(),
    })
  ),
});

/**
 * @route   PUT /api/jurisdictions/:code/rules
 * @desc    Update rule matrix and bump version (Admin only)
 */
router.put('/:code/rules', protect, authorize('Admin'), validateBody(updateRulesSchema), async (req, res) => {
  try {
    const jurisdiction = await Jurisdiction.findOne({ code: req.params.code.toUpperCase() });
    if (!jurisdiction) {
      return res.status(404).json({ success: false, message: 'Jurisdiction not found' });
    }

    // Save snapshot to history
    jurisdiction.versionHistory.push({
      version: jurisdiction.currentVersion,
      effectiveDate: new Date(),
      summaryOfChanges: req.body.summaryOfChanges,
      rulesSnapshot: jurisdiction.rules,
    });

    // Update to new version
    jurisdiction.currentVersion = req.body.version;
    jurisdiction.rules = req.body.rules;
    await jurisdiction.save();

    res.json({
      success: true,
      message: `Jurisdiction ${jurisdiction.name} updated to version ${jurisdiction.currentVersion}`,
      data: jurisdiction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
