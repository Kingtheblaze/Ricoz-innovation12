const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Jurisdiction = require('../models/Jurisdiction');

dotenv.config();

const californiaRules = [
  {
    clauseKey: 'at_will_employment_ca',
    title: 'At-Will Employment Status',
    category: 'employment_status',
    isMandatory: true,
    allowCompanyCustomization: false,
    legalReference: 'California Labor Code § 2922',
    contentTemplate:
      'Employment with {{company_name}} is at-will. This means that either {{candidate_name}} or {{company_name}} may terminate the employment relationship at any time, with or without cause, and with or without advance notice. Nothing in this Agreement, nor any oral representations or course of conduct, alters the at-will nature of this employment unless explicitly set forth in a formal written amendment executed by an authorized executive officer.',
    description: 'Statutory at-will presumption under California Labor Code.',
  },
  {
    clauseKey: 'non_compete_prohibition_ca',
    title: 'Prohibition on Non-Compete Covenants (SB 699 & AB 1076 Compliance)',
    category: 'non_compete_restrictive_covenants',
    isMandatory: true,
    allowCompanyCustomization: false,
    legalReference: 'Cal. Bus. & Prof. Code §§ 16600, 16600.1, 16600.5 (SB 699 / AB 1076)',
    contentTemplate:
      'In strict compliance with California Business and Professions Code Section 16600 et seq., {{company_name}} does not impose, enforce, or seek to enforce any post-employment non-compete covenant or customer non-solicitation restraint upon {{candidate_name}}. This agreement shall not restrain {{candidate_name}} from engaging in any lawful profession, trade, or business after separation. Protection of {{company_name}}\'s legitimate trade secrets under the Uniform Trade Secrets Act (Cal. Civ. Code § 3426) remains in full effect.',
    description: 'Mandatory California notice voiding non-competes regardless of where signed.',
  },
  {
    clauseKey: 'wage_transparency_timely_pay_ca',
    title: 'Wage Transparency and Pay Frequency',
    category: 'compensation_pay_transparency',
    isMandatory: true,
    allowCompanyCustomization: false,
    legalReference: 'California Labor Code §§ 204, 432.3 (SB 1162)',
    contentTemplate:
      '{{candidate_name}} shall receive base compensation of {{currency}} {{base_salary}}, payable on a {{pay_frequency}} schedule in accordance with California Labor Code Section 204. In accordance with California Labor Code Section 432.3, compensation ranges and promotional scales have been made available, and compensation is determined without reliance on prior salary history.',
    description: 'Mandatory California wage disclosure and semimonthly/biweekly pay schedule rules.',
  },
  {
    clauseKey: 'paid_sick_leave_healthy_workplaces_ca',
    title: 'Paid Sick and Safe Leave (Healthy Workplaces Healthy Families Act)',
    category: 'benefits_leave',
    isMandatory: true,
    allowCompanyCustomization: true,
    legalReference: 'Cal. Labor Code §§ 245-249 (SB 616 amendments)',
    contentTemplate:
      '{{candidate_name}} is entitled to paid sick and safe leave in full compliance with the California Healthy Workplaces, Healthy Families Act (as expanded by SB 616). {{candidate_name}} shall accrue or be frontloaded with no less than five (5) days or forty (40) hours of paid sick leave per 12-month period. Sick leave may be used for the diagnosis, care, or treatment of an existing health condition or preventative care for the employee or their designated family members.',
    description: 'Mandatory statutory paid sick leave provision (40 hours / 5 days min).',
  },
  {
    clauseKey: 'ip_assignment_labor_code_2870_ca',
    title: 'Intellectual Property Assignment and Labor Code § 2870 Notice',
    category: 'intellectual_property',
    isMandatory: true,
    allowCompanyCustomization: false,
    legalReference: 'California Labor Code § 2870 - 2872',
    contentTemplate:
      '{{candidate_name}} agrees to promptly disclose and assign to {{company_name}} all right, title, and interest in work product created during employment. MANDATORY STATUTORY NOTICE: This assignment does NOT apply to an invention for which no equipment, supplies, facility, or trade secret information of {{company_name}} was used and which was developed entirely on {{candidate_name}}\'s own time, unless (a) the invention relates at the time of conception to {{company_name}}\'s business or actual demonstrably anticipated research, or (b) the invention results from any work performed by {{candidate_name}} for {{company_name}} (Cal. Lab. Code § 2870).',
    description: 'Mandatory statutory carveout required in all California IP agreements.',
  },
  {
    clauseKey: 'final_pay_severance_ca',
    title: 'Termination and Final Pay Mechanics',
    category: 'termination_severance',
    isMandatory: true,
    allowCompanyCustomization: false,
    legalReference: 'California Labor Code §§ 201 - 203',
    contentTemplate:
      'Upon involuntary termination of employment by {{company_name}}, all accrued wages, earned but unused vested PTO/vacation, and expense reimbursements shall be paid immediately on the date of termination pursuant to Cal. Labor Code § 201. If {{candidate_name}} resigns without at least 72 hours prior notice, final wages shall be disbursed within 72 hours under Cal. Labor Code § 202.',
    description: 'Strict immediate final paycheck timing under California labor statutes.',
  },
];

const ukRules = [
  {
    clauseKey: 'written_statement_employment_particulars_uk',
    title: 'Section 1 Written Statement of Employment Particulars',
    category: 'employment_status',
    isMandatory: true,
    allowCompanyCustomization: false,
    legalReference: 'UK Employment Rights Act 1996 (ERA 1996) Section 1',
    contentTemplate:
      'This document constitutes {{candidate_name}}\'s Written Statement of Employment Particulars under Section 1 of the Employment Rights Act 1996. The employer is {{company_name}} (registered office: {{company_address}}). The employee is {{candidate_name}}, whose employment commenced on {{start_date}}. No period of employment with a previous employer counts as continuous employment.',
    description: 'Day 1 mandatory statutory particulars required by UK law.',
  },
  {
    clauseKey: 'statutory_notice_periods_uk',
    title: 'Probationary Period and Statutory Notice of Termination',
    category: 'probation_notice',
    isMandatory: true,
    allowCompanyCustomization: true,
    legalReference: 'UK Employment Rights Act 1996 Section 86',
    contentTemplate:
      'During the initial probationary period of three (3) months, either party may terminate employment by giving one (1) week of written notice. Following completion of probation, statutory notice applies pursuant to Section 86 of the Employment Rights Act 1996: one week notice for continuous service between one month and two years, followed by one additional week per complete year of continuous service up to a maximum of twelve (12) weeks. {{company_name}} reserves the right to make a payment in lieu of notice (PILON).',
    description: 'Statutory minimum notice scaling from 1 week up to 12 weeks.',
  },
  {
    clauseKey: 'working_time_regulations_48hr_optout_uk',
    title: 'Working Hours and 48-Hour Maximum Working Week (WTR 1998)',
    category: 'working_hours_overtime',
    isMandatory: true,
    allowCompanyCustomization: true,
    legalReference: 'UK Working Time Regulations 1998 (SI 1998/1833) Regulation 4 & 5',
    contentTemplate:
      'Normal working hours are 37.5 hours per week, Monday through Friday. Under the UK Working Time Regulations 1998, average weekly working time must not exceed 48 hours unless {{candidate_name}} expressly signs a separate voluntary opt-out agreement. {{candidate_name}} is entitled to daily rest of 11 consecutive hours and a weekly rest break of 24 uninterrupted hours.',
    description: 'Statutory limit of 48 hours average weekly limit with optional individual opt-out.',
  },
  {
    clauseKey: 'statutory_holiday_entitlement_uk',
    title: 'Paid Annual Leave (Statutory 28 Days / 5.6 Weeks Entitlement)',
    category: 'benefits_leave',
    isMandatory: true,
    allowCompanyCustomization: true,
    legalReference: 'UK Working Time Regulations 1998 Regulations 13 & 13A',
    contentTemplate:
      '{{candidate_name}} is entitled to a minimum of 28 days (5.6 weeks) of paid holiday per holiday year, inclusive of recognised English and Welsh public/bank holidays, in strict adherence to Regulations 13 and 13A of the Working Time Regulations 1998. Holiday pay is calculated at the employee\'s normal rate of remuneration.',
    description: 'Statutory 28 days paid annual holiday minimum.',
  },
  {
    clauseKey: 'post_termination_restrictive_covenants_uk',
    title: 'Restrictive Covenants and Legitimate Business Interest Protection',
    category: 'non_compete_restrictive_covenants',
    isMandatory: true,
    allowCompanyCustomization: true,
    legalReference: 'UK Common Law Restraint of Trade Doctrine & Tillman v Egon Zehnder [2019] UKSC 32',
    contentTemplate:
      'For a reasonable period of up to three (3) months post-termination, {{candidate_name}} shall not solicit or entice away key clients, customers, or prospective customers with whom {{candidate_name}} had material personal dealings during the final 12 months of employment. Any covenant herein is narrowly tailored solely to safeguard {{company_name}}\'s legitimate business interests and proprietary goodwill.',
    description: 'UK common-law enforceable restrictive covenants restricted to legitimate interest test.',
  },
  {
    clauseKey: 'pension_auto_enrolment_pensions_act_uk',
    title: 'Workplace Pension Auto-Enrolment (Pensions Act 2008)',
    category: 'compensation_pay_transparency',
    isMandatory: true,
    allowCompanyCustomization: false,
    legalReference: 'UK Pensions Act 2008 & Occupational Pension Schemes Regulations',
    contentTemplate:
      'In compliance with employer duties under the Pensions Act 2008, {{company_name}} will automatically enrol {{candidate_name}} into a qualifying workplace pension scheme if {{candidate_name}} meets the eligible jobholder criteria. {{company_name}} shall make statutory minimum employer contributions (currently 3% of qualifying earnings) with mandatory employee deductions.',
    description: 'Mandatory UK employer pension auto-enrolment scheme.',
  },
  {
    clauseKey: 'disciplinary_grievance_acas_code_uk',
    title: 'Disciplinary and Grievance Procedures (ACAS Code of Practice)',
    category: 'dispute_resolution',
    isMandatory: true,
    allowCompanyCustomization: false,
    legalReference: 'ACAS Code of Practice 1 on Disciplinary and Grievance Procedures (s.199 TULR(C)A 1992)',
    contentTemplate:
      'Disciplinary and grievance matters shall be handled in accordance with the ACAS Code of Practice on Disciplinary and Grievance Procedures. If {{candidate_name}} is dissatisfied with any disciplinary decision or wishes to raise a workplace grievance, {{candidate_name}} may lodge an appeal in writing to {{reporting_to}}.',
    description: 'Mandatory statutory grievance and ACAS procedure reference.',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/employment-contract-localizer');
    console.log('[Seeder] Connected to database');

    await Jurisdiction.deleteMany({});
    console.log('[Seeder] Cleared previous jurisdiction records');

    const caJurisdiction = new Jurisdiction({
      code: 'US-CA',
      name: 'State of California (United States)',
      regionType: 'US_STATE',
      countryCode: 'US',
      currentVersion: '2026.1',
      isActive: true,
      governingLawDescription: 'State of California and applicable federal laws of the United States of America',
      standardCurrency: 'USD',
      statutoryNoticeWeeks: 0,
      atWillDoctrineApplies: true,
      nonCompeteEnforceability: 'VOID_AND_UNENFORCEABLE',
      rules: californiaRules,
      versionHistory: [
        {
          version: '2026.1',
          effectiveDate: new Date('2026-01-01'),
          summaryOfChanges: 'Updated for SB 699, AB 1076 non-compete notices, SB 616 5-day sick leave, and pay transparency compliance.',
          rulesSnapshot: californiaRules,
        },
      ],
    });

    const ukJurisdiction = new Jurisdiction({
      code: 'GB-UK',
      name: 'United Kingdom (England & Wales)',
      regionType: 'COUNTRY',
      countryCode: 'GB',
      currentVersion: '2026.1',
      isActive: true,
      governingLawDescription: 'Laws of England and Wales and jurisdiction of the English courts',
      standardCurrency: 'GBP',
      statutoryNoticeWeeks: 1,
      atWillDoctrineApplies: false,
      nonCompeteEnforceability: 'RESTRICTED_REASONABLE',
      rules: ukRules,
      versionHistory: [
        {
          version: '2026.1',
          effectiveDate: new Date('2026-01-01'),
          summaryOfChanges: 'Updated Section 1 ERA 1996 Day-One Particulars, ACAS code, and statutory 28-day holiday rules.',
          rulesSnapshot: ukRules,
        },
      ],
    });

    await caJurisdiction.save();
    await ukJurisdiction.save();

    console.log('[Seeder] Successfully seeded California (US-CA) and United Kingdom (GB-UK) rule matrices!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[Seeder Error]:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed, californiaRules, ukRules };
