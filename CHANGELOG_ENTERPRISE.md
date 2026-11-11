# Release Notes: Enterprise Upgrade & Vercel Deployment

**Project:** JurisFlow (Multi-Jurisdiction Employment Contract Localizer)  
**Date:** November 11, 2026  
**Latest Commits:** `e0f40ea` & `ff32745` (Branch: `main`)  
**Repository:** [Kingtheblaze/Ricoz-innovation12](https://github.com/Kingtheblaze/Ricoz-innovation12.git)

---

## Executive Summary of Recent Upgrades

We transitioned JurisFlow from an MVP / internal tool into an **enterprise-ready SaaS platform**. The updates span three critical pillars:
1. **Interactive UI/UX**: Live split-screen contract preview, in-place discretionary clause editing, and a cross-jurisdiction statutory comparator.
2. **Legal-Tech & Statutory Matrix**: An automated AI & heuristic clause risk scanner, plus expanded legal seed matrices for **New York (`US-NY`)** and **Texas (`US-TX`)**.
3. **Enterprise SaaS & Candidate E-Signature**: Tokenized candidate execution portal with digital signature drawing, document lifecycle states (`DRAFT` → `SENT` → `SIGNED`), team RBAC invitations, REST API keys, and event webhooks.
4. **100% Vercel Serverless Ready**: Unified root deployment running Next.js 14 and Express serverless functions concurrently under a single domain.

---

## Detailed File-by-File Change Log

### 1. User Interface (UI / UX)

#### `frontend/src/app/generate/page.tsx`
- **Live Split-Screen Contract Preview**: Added a side-by-side pane rendering the formatted employment agreement in real-time as HR fills out the candidate, position, and compensation fields.
- **Dynamic Statutory Clause Badges**: Highlights applied state/country-specific mandatory clauses (e.g., California Labor Code § 2922 at-will presumption, SB 699 non-compete void notices, or UK ERA 1996 written particulars) immediately upon selecting a jurisdiction.
- **Toggle Control**: Added an interactive button to show/hide the live preview pane to support smaller screens.

#### `frontend/src/app/documents/[id]/page.tsx`
- **In-Place Discretionary Clause Editor**: Allows HR and legal teams to edit individual discretionary clauses inline with instant save/cancel actions and audit logging.
- **Statutory Protection Lock (`<Lock />`)**: Automatically prevents direct alterations to statutory mandatory clauses to protect companies from non-compliance liabilities.
- **Send for E-Signature Modal**: Generates and displays a secure 14-day candidate signing link with one-click clipboard copying.
- **Executed Signature Banner**: Renders digital signature image, signer legal name, timestamp, and audit IP watermark once signed.

#### `frontend/src/app/jurisdictions/compare/page.tsx` *(New Page)*
- **Statutory Comparison Engine**: Side-by-side legal comparison tool evaluating any two jurisdictions on:
  - At-Will doctrine recognition
  - Mandatory notice periods and scaling rules
  - Non-compete enforceability classifications (`VOID_AND_UNENFORCEABLE`, `RESTRICTED_REASONABLE`, `ENFORCEABLE_WITH_GARDEN_LEAVE`)
  - Direct comparative breakdown of mandatory clauses.

#### `frontend/src/components/Navbar.tsx`
- Added navigation links for `/jurisdictions/compare` (Compare Jurisdictions), `/scanner` (Risk Scanner), and `/settings/team` (Team & API).

---

### 2. Legal-Tech & Compliance

#### `frontend/src/app/scanner/page.tsx` *(New Page)*
- **Statutory Clause Risk Analyzer**: Interactive tool allowing users to paste any existing offer letter clause or employee handbook text to audit compliance against local laws.
- **Risk Assessment Scorecard**: Generates a 0–100 compliance rating with color-coded severity tags (`HIGH`, `MEDIUM`, `LOW`), statutory references (e.g., California SB 699, CA Labor Code § 2870, UK ERA 1996, NYLL § 194-a), and legal remediation guidance.
- **Pre-Configured Test Clauses**: One-click test scenarios for California non-competes, UK sub-statutory notice, and compliant IP assignments.

#### `backend/src/seeders/seedJurisdictions.js`
- **Added New York (`US-NY`)**:
  - New York Common Law at-will employment presumption.
  - Wage Theft Prevention Act Notice (NYLL § 195.1).
  - Salary History Inquiry Prohibition (NYLL § 194-a).
- **Added Texas (`US-TX`)**:
  - Texas Labor Code § 21.051 at-will doctrine.
  - Texas Payday Law schedule compliance (Tex. Lab. Code Ch. 61).
  - Reasonable covenant not to compete standards under Tex. Bus. & Com. Code § 15.50.

---

### 3. Enterprise SaaS & Candidate E-Signature

#### `frontend/src/app/sign/[token]/page.tsx` *(New Page)*
- **Candidate Public E-Signing Portal**: Mobile-responsive signing page accessible via secure random token (requires no login for candidates).
- **HTML5 Digital Signature Canvas**: Candidates can draw or sign using a mouse, stylus, or touchscreen.
- **E-SIGN Act Compliance Consent**: Includes statutory electronic signature consent checkbox and captures IP address and timestamp.

#### `frontend/src/app/settings/team/page.tsx` *(New Page)*
- **Team Management (RBAC)**: Interface to manage team coworkers and send invitations with designated roles (`Admin`, `HR`, `Viewer`).
- **REST API Key Management**: Issue and roll production API keys for integrating ATS platforms (Greenhouse, Lever, Workday) with sample cURL commands.
- **Webhook Subscriptions**: Register HTTPS endpoints to listen for document lifecycle events (`document.created`, `document.sent`, `document.signed`).

#### `backend/src/models/GeneratedDocument.js`
- Added `status` field with states: `DRAFT`, `SENT`, `SIGNED`, `EXPIRED`, `REVOKED`.
- Added `signingToken` and `signingTokenExpiresAt` fields.
- Added `signature` schema storing `signedBy`, `signedAt`, `signatureImage`, `signerIp`, and `signerEmail`.

#### `backend/src/routes/documentRoutes.js`
- Added `PATCH /api/documents/:id/clauses/:clauseKey` for in-place clause editing with statutory validation.
- Added `POST /api/documents/:id/send` to issue signing tokens and transition document status to `SENT`.
- Added `GET /api/documents/sign/:token` to retrieve document details for candidate review.
- Added `POST /api/documents/sign/:token` to record digital signature and transition status to `SIGNED`.
- Added `POST /api/documents/scan-risk` endpoint executing statutory heuristic risk scanning.

---

### 4. Vercel Cloud Deployment Configuration

#### `api/index.js` *(New File)*
- Acts as the entrypoint for Vercel Serverless Functions, routing all `/api/*` traffic into the Express application.

#### `vercel.json`
- Configured version 2 multi-service build specification:
  - `@vercel/node` for `api/index.js` (Serverless API)
  - `@vercel/next` for `frontend/package.json` (Next.js App Router)
  - Clean URL routing rewriting `/api/(.*)` to the serverless function and `/(.*)` to the frontend.

---

## Verification & Next Steps

1. **Local Development (Optional)**:
   ```bash
   # Install frontend dependencies (resolves all JSX types in VS Code):
   cd frontend
   npm install

   # Run local dev servers:
   npm run dev
   ```

2. **Deploying on Vercel**:
   - In Vercel, import `Kingtheblaze/Ricoz-innovation12`.
   - Leave root directory as `./`.
   - Add environment variables in Vercel:
     - `MONGODB_URI` (MongoDB Atlas connection string)
     - `JWT_ACCESS_SECRET` (Random 32-character string)
     - `NODE_ENV=production`

