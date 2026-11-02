# Multi-Jurisdiction Employment Contract Localizer (JurisFlow SaaS)

## Executive Overview
**JurisFlow** is an enterprise-grade, multi-tenant SaaS application built to automate the generation, statutory customization, and compliance auditing of Offer Letters and Employment Agreements across distinct U.S. states and international jurisdictions.

Global hiring teams frequently encounter complex, contradictory labor statutes. For instance, in California, post-employment non-compete agreements are strictly prohibited by law (SB 699, AB 1076) and subject companies to private rights of action. Meanwhile, in the United Kingdom, agreements must conform with Section 1 of the Employment Rights Act 1996 ("Written Statement of Employment Particulars"), the ACAS Code of Practice, and the Working Time Regulations 1998 48-hour week.

JurisFlow solves this through an automated **Statutory Rule Matrix Engine** that enforces mandatory local labor rules while preserving company autonomy over discretionary compensation, benefits, and supplementary clauses.

---

## Architecture & Technology Stack

```
employment-contract-localizer/
├── backend/                       # Express.js REST API
│   ├── src/
│   │   ├── config/                # Database connection & configurations
│   │   ├── middleware/            # JWT authentication & Zod request validation
│   │   ├── models/                # Organization, User, Jurisdiction, GeneratedDocument
│   │   ├── routes/                # Auth, Jurisdictions, Documents, Organization
│   │   ├── seeders/               # California & UK Statutory Seed Data
│   │   ├── services/              # RuleEngine, PdfGenerator (PDFKit), DocxGenerator (docx)
│   │   └── server.js              # Application entry point with Helmet, CORS & Rate Limiting
│   └── package.json
├── frontend/                      # Next.js 14 App Router + Tailwind CSS
│   ├── src/
│   │   ├── app/                   # App Router Pages (Home, Login, Register, Dashboard, Wizard)
│   │   ├── components/            # Navbar and layout components
│   │   ├── context/               # React AuthContext (JWT tokens & multi-tenancy)
│   │   ├── lib/                   # Axios client with interceptors
│   │   └── types/                 # Shared TypeScript interfaces
│   └── package.json
├── docs/                          # Architecture blueprints and legal rule specs
├── README.md                      # Comprehensive project explanation (this document)
└── EXECUTION.md                   # Step-by-step developer setup & execution guide
```

---

## Core Capabilities

### 1. Multi-Tenant Role-Based Access Control (RBAC)
- **Organization Isolation**: Every document and user belongs to a tenant Organization identified by slug.
- **Roles**:
  - `Admin`: Full access to company profile, versioned rule updates, and team generation.
  - `HR`: Can configure and generate localized contracts, view documents, and export PDFs/DOCXs.
  - `Viewer`: Read-only access to repository documents and audit trails.

### 2. Versioned Jurisdiction Labor Rule Matrix
- Maintains statutory requirements by jurisdiction code:
  - **`US-CA` (California, USA)**:
    - Labor Code § 2922 At-Will presumption.
    - SB 699 / AB 1076 Non-Compete voiding notices and non-solicitation bounds.
    - SB 616 Paid Sick Leave (5 days / 40 hours minimum).
    - Labor Code § 2870 Inventions / IP assignment mandatory statutory carveout.
    - Labor Code § 201-203 immediate final wage disbursement.
    - SB 1162 / LC § 432.3 Pay scale transparency and salary history inquiry bans.
  - **`GB-UK` (United Kingdom - England & Wales)**:
    - Section 1 Employment Rights Act 1996 Written Particulars.
    - ERA 1996 Section 86 statutory progressive notice scaling (1 week to 12 weeks).
    - Working Time Regulations 1998 (48-hour weekly ceiling & voluntary opt-out notice).
    - WTR 1998 28-day statutory paid annual leave entitlement.
    - Pensions Act 2008 employer auto-enrolment duties (3% minimum contribution).
    - ACAS Code of Practice 1 on Disciplinary and Grievance procedures.

### 3. Dynamic Statutory Rule Engine
- **Interpolation**: Populates contract parameters (`{{candidate_name}}`, `{{base_salary}}`, `{{company_name}}`, etc.).
- **Mandatory Enforcement**: If a user attempts to override an unalterable mandatory clause, the engine preserves the statutory language and records a compliance notice.
- **Non-Compete Scrubbing**: Prohibits restrictive non-competes in California and flags risks under UK legitimate business interest standards.

### 4. Dual-Format Document Compiling & Audit Logging
- **PDF Generation**: Rendered using `PDFKit` with multi-page flow, executive typography, appointment summary cards, signature lines, and running statutory disclaimers with page counters.
- **DOCX Generation**: Built using `docx` with structured tables, Microsoft Word headings, and legal covenants.
- **Immutable Audit Trail**: Logs `GENERATED`, `VIEWED`, `DOWNLOADED_PDF`, and `DOWNLOADED_DOCX` actions with user stamps and timestamps.
