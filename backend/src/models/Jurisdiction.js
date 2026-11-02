const mongoose = require('mongoose');

const ClauseRuleSchema = new mongoose.Schema({
  clauseKey: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: [
      'employment_status',
      'probation_notice',
      'working_hours_overtime',
      'compensation_pay_transparency',
      'benefits_leave',
      'intellectual_property',
      'non_compete_restrictive_covenants',
      'confidentiality_nda',
      'dispute_resolution',
      'termination_severance',
      'statutory_disclaimers',
    ],
    required: true,
  },
  isMandatory: {
    type: Boolean,
    default: true,
  },
  allowCompanyCustomization: {
    type: Boolean,
    default: false,
  },
  legalReference: {
    type: String,
    default: '',
  },
  contentTemplate: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  fallbackNotes: {
    type: String,
    default: '',
  },
});

const JurisdictionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true, // e.g. "US-CA", "GB-UK", "US-NY"
    },
    name: {
      type: String,
      required: true,
    },
    regionType: {
      type: String,
      enum: ['US_STATE', 'COUNTRY', 'PROVINCE'],
      required: true,
    },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    currentVersion: {
      type: String,
      default: '2026.1',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    governingLawDescription: {
      type: String,
      required: true,
    },
    standardCurrency: {
      type: String,
      default: 'USD',
    },
    statutoryNoticeWeeks: {
      type: Number,
      default: 0,
    },
    atWillDoctrineApplies: {
      type: Boolean,
      default: false,
    },
    nonCompeteEnforceability: {
      type: String,
      enum: ['VOID_AND_UNENFORCEABLE', 'RESTRICTED_REASONABLE', 'ENFORCEABLE_WITH_GARDEN_LEAVE'],
      default: 'RESTRICTED_REASONABLE',
    },
    rules: [ClauseRuleSchema],
    versionHistory: [
      {
        version: String,
        effectiveDate: Date,
        summaryOfChanges: String,
        rulesSnapshot: [ClauseRuleSchema],
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Jurisdiction', JurisdictionSchema);
