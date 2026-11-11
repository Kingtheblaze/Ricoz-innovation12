const mongoose = require('mongoose');

const DocumentAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['GENERATED', 'VIEWED', 'DOWNLOADED_PDF', 'DOWNLOADED_DOCX', 'CUSTOM_CLAUSE_OVERRIDDEN'],
      default: 'GENERATED',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    performedByName: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const GeneratedDocumentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documentType: {
      type: String,
      enum: ['OFFER_LETTER', 'EMPLOYMENT_AGREEMENT', 'FULL_COMPLIANCE_BUNDLE'],
      default: 'FULL_COMPLIANCE_BUNDLE',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'SIGNED', 'EXPIRED', 'REVOKED'],
      default: 'DRAFT',
      index: true,
    },
    signingToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    signingTokenExpiresAt: {
      type: Date,
    },
    signature: {
      signedBy: String,
      signedAt: Date,
      signatureImage: String,
      signerIp: String,
      signerEmail: String,
    },
    title: {
      type: String,
      required: true,
    },
    candidate: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' },
      residentialAddress: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
      },
    },
    roleDetails: {
      jobTitle: { type: String, required: true },
      department: { type: String, default: 'Engineering' },
      reportingTo: { type: String, default: 'Director / Manager' },
      employmentType: {
        type: String,
        enum: ['Full-Time', 'Part-Time', 'Contractor', 'Fixed-Term'],
        default: 'Full-Time',
      },
      workArrangement: {
        type: String,
        enum: ['Remote', 'Hybrid', 'On-Site'],
        default: 'Remote',
      },
      workLocation: { type: String, default: 'Remote / Home Office' },
      startDate: { type: Date, required: true },
      endDate: { type: Date }, // For fixed-term
    },
    compensation: {
      baseSalary: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
      payFrequency: {
        type: String,
        enum: ['Annual', 'Monthly', 'Bi-Weekly', 'Semi-Monthly', 'Hourly'],
        default: 'Annual',
      },
      equityGrantDetails: { type: String, default: '' },
      bonusStructure: { type: String, default: '' },
      benefitsSummary: { type: String, default: '' },
    },
    jurisdictionSnapshot: {
      code: { type: String, required: true },
      name: { type: String, required: true },
      versionUsed: { type: String, required: true },
      governingLaw: { type: String, required: true },
      nonCompeteStatus: { type: String },
    },
    appliedClauses: [
      {
        clauseKey: String,
        title: String,
        category: String,
        isMandatory: Boolean,
        wasCustomized: Boolean,
        legalReference: String,
        renderedText: String,
      },
    ],
    customClausesAdded: [
      {
        title: String,
        content: String,
        category: String,
      },
    ],
    legalDisclaimer: {
      type: String,
      required: true,
    },
    auditTrail: [DocumentAuditLogSchema],
    metadata: {
      generatedAt: { type: Date, default: Date.now },
      fileToken: { type: String, required: true, unique: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GeneratedDocument', GeneratedDocumentSchema);
