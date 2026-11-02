/**
 * Core Rule Engine for Multi-Jurisdiction Employment Contracts
 * Resolves statutory clauses, applies parameter interpolation, validates non-competes,
 * and merges permitted company custom clauses without violating statutory mandatory rules.
 */

class RuleEngine {
  /**
   * Evaluates rules against contract context
   * @param {Object} jurisdiction - The Jurisdiction document containing rules
   * @param {Object} context - Candidate, Role, Compensation, and Company context
   * @param {Array} customClauses - Optional user-defined clauses
   */
  static processContractRules(jurisdiction, context, customClauses = []) {
    const appliedClauses = [];
    const complianceWarnings = [];

    // Helper map of variables for placeholder interpolation
    const placeholders = {
      '{{candidate_name}}': context.candidate?.fullName || 'Employee',
      '{{candidate_email}}': context.candidate?.email || '',
      '{{candidate_address}}': RuleEngine.formatAddress(context.candidate?.residentialAddress),
      '{{company_name}}': context.company?.name || 'The Company',
      '{{company_address}}': RuleEngine.formatAddress(context.company?.companyAddress),
      '{{job_title}}': context.roleDetails?.jobTitle || 'Team Member',
      '{{department}}': context.roleDetails?.department || 'Operations',
      '{{reporting_to}}': context.roleDetails?.reportingTo || 'Management',
      '{{employment_type}}': context.roleDetails?.employmentType || 'Full-Time',
      '{{work_arrangement}}': context.roleDetails?.workArrangement || 'Remote',
      '{{work_location}}': context.roleDetails?.workLocation || 'Remote',
      '{{start_date}}': context.roleDetails?.startDate ? new Date(context.roleDetails.startDate).toLocaleDateString('en-US', { dateStyle: 'long' }) : 'TBD',
      '{{base_salary}}': Number(context.compensation?.baseSalary || 0).toLocaleString(),
      '{{currency}}': context.compensation?.currency || jurisdiction.standardCurrency || 'USD',
      '{{pay_frequency}}': context.compensation?.payFrequency || 'Annual',
      '{{bonus_details}}': context.compensation?.bonusStructure || 'Discretionary, based on performance milestones.',
      '{{equity_details}}': context.compensation?.equityGrantDetails || 'Subject to separate equity incentive documentation.',
      '{{benefits_summary}}': context.compensation?.benefitsSummary || 'Comprehensive health, retirement, and statutory paid leave.',
      '{{governing_law}}': jurisdiction.governingLawDescription || jurisdiction.name,
      '{{jurisdiction_version}}': jurisdiction.currentVersion || '2026.1',
      '{{signatory_name}}': context.company?.settings?.primarySignatoryName || 'Authorized Officer',
      '{{signatory_title}}': context.company?.settings?.primarySignatoryTitle || 'Director of Human Resources',
    };

    // 1. Process mandatory & statutory rules defined in Jurisdiction
    for (const rule of jurisdiction.rules) {
      let clauseContent = rule.contentTemplate;

      // Interpolate placeholders
      for (const [token, value] of Object.entries(placeholders)) {
        clauseContent = clauseContent.split(token).join(value);
      }

      // Check if user submitted a customized version of this clause
      const customMatch = customClauses.find((c) => c.clauseKey === rule.clauseKey);
      let wasCustomized = false;

      if (customMatch && customMatch.content) {
        if (!rule.allowCompanyCustomization && rule.isMandatory) {
          complianceWarnings.push({
            clauseKey: rule.clauseKey,
            title: rule.title,
            warning: `Jurisdiction ${jurisdiction.name} does not permit modifying mandatory rule [${rule.title}]. Statutory language was retained to preserve enforceability.`,
          });
        } else {
          // Allowed customization
          clauseContent = customMatch.content;
          wasCustomized = true;
        }
      }

      appliedClauses.push({
        clauseKey: rule.clauseKey,
        title: rule.title,
        category: rule.category,
        isMandatory: rule.isMandatory,
        wasCustomized,
        legalReference: rule.legalReference,
        renderedText: clauseContent,
      });
    }

    // 2. Validate restrictive covenants / Non-competes based on jurisdiction
    if (jurisdiction.nonCompeteEnforceability === 'VOID_AND_UNENFORCEABLE') {
      const nonCompeteClause = appliedClauses.find((c) => c.category === 'non_compete_restrictive_covenants');
      if (nonCompeteClause) {
        complianceWarnings.push({
          clauseKey: nonCompeteClause.clauseKey,
          title: nonCompeteClause.title,
          warning: `Under ${jurisdiction.name} law (e.g. CA Bus & Prof Code § 16600), post-termination non-compete agreements are void and illegal. Statutory non-solicitation of trade secrets is enforced instead.`,
        });
      }
    }

    // 3. Process optional standalone custom clauses
    const standaloneCustomClauses = [];
    const existingKeys = new Set(jurisdiction.rules.map((r) => r.clauseKey));

    for (const c of customClauses) {
      if (!c.clauseKey || !existingKeys.has(c.clauseKey)) {
        let content = c.content || '';
        for (const [token, value] of Object.entries(placeholders)) {
          content = content.split(token).join(value);
        }
        standaloneCustomClauses.push({
          title: c.title || 'Supplementary Company Clause',
          content,
          category: c.category || 'company_custom',
        });
      }
    }

    // Standardized legal disclaimer
    const disclaimer = `LEGAL DISCLAIMER: This document was programmatically assembled based on labor rules configured for jurisdiction [${jurisdiction.name} (Code: ${jurisdiction.code})] version ${jurisdiction.currentVersion}. This document constitutes a localized template and does not establish an attorney-client relationship. Both Employer and Employee are advised to consult licensed legal counsel within the relevant jurisdiction.`;

    return {
      appliedClauses,
      standaloneCustomClauses,
      complianceWarnings,
      legalDisclaimer: disclaimer,
      jurisdictionSnapshot: {
        code: jurisdiction.code,
        name: jurisdiction.name,
        versionUsed: jurisdiction.currentVersion,
        governingLaw: jurisdiction.governingLawDescription,
        nonCompeteStatus: jurisdiction.nonCompeteEnforceability,
      },
    };
  }

  static formatAddress(addr) {
    if (!addr) return 'Remote Office';
    const parts = [addr.street, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not Specified';
  }
}

module.exports = RuleEngine;
