export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'HR' | 'Viewer';
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  defaultJurisdiction: string;
  companyAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  settings?: {
    standardNoticeDays?: number;
    allowCustomClauses?: boolean;
    primarySignatoryName?: string;
    primarySignatoryTitle?: string;
  };
}

export interface ClauseRule {
  clauseKey: string;
  title: string;
  category: string;
  isMandatory: boolean;
  allowCompanyCustomization: boolean;
  legalReference?: string;
  contentTemplate: string;
  description?: string;
}

export interface Jurisdiction {
  code: string;
  name: string;
  regionType: 'US_STATE' | 'COUNTRY' | 'PROVINCE';
  countryCode: string;
  currentVersion: string;
  isActive: boolean;
  governingLawDescription: string;
  standardCurrency: string;
  statutoryNoticeWeeks: number;
  atWillDoctrineApplies: boolean;
  nonCompeteEnforceability: 'VOID_AND_UNENFORCEABLE' | 'RESTRICTED_REASONABLE' | 'ENFORCEABLE_WITH_GARDEN_LEAVE';
  rules?: ClauseRule[];
}

export interface AppliedClause {
  clauseKey: string;
  title: string;
  category: string;
  isMandatory: boolean;
  wasCustomized: boolean;
  legalReference?: string;
  renderedText: string;
}

export interface AuditTrailItem {
  action: string;
  performedBy?: string;
  performedByName?: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface GeneratedDocument {
  _id: string;
  title: string;
  documentType: 'OFFER_LETTER' | 'EMPLOYMENT_AGREEMENT' | 'FULL_COMPLIANCE_BUNDLE';
  candidate: {
    fullName: string;
    email: string;
    phone?: string;
    residentialAddress?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  roleDetails: {
    jobTitle: string;
    department: string;
    reportingTo: string;
    employmentType: string;
    workArrangement: string;
    workLocation: string;
    startDate: string;
  };
  compensation: {
    baseSalary: number;
    currency: string;
    payFrequency: string;
    equityGrantDetails?: string;
    bonusStructure?: string;
    benefitsSummary?: string;
  };
  jurisdictionSnapshot: {
    code: string;
    name: string;
    versionUsed: string;
    governingLaw: string;
    nonCompeteStatus?: string;
  };
  appliedClauses: AppliedClause[];
  customClausesAdded?: Array<{ title: string; content: string; category?: string }>;
  legalDisclaimer: string;
  auditTrail: AuditTrailItem[];
  createdAt: string;
}
