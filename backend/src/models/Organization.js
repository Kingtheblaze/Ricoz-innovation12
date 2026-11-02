const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    defaultJurisdiction: {
      type: String,
      default: 'US-CA',
    },
    companyAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'United States' },
    },
    settings: {
      standardNoticeDays: { type: Number, default: 14 },
      allowCustomClauses: { type: Boolean, default: true },
      primarySignatoryName: { type: String, default: 'Authorized Representative' },
      primarySignatoryTitle: { type: String, default: 'Head of People / Director' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Organization', OrganizationSchema);
