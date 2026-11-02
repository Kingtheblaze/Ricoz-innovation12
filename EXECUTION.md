# Quickstart & Execution Guide: JurisFlow Localizer

This document details how to install dependencies, run seeders, and start the frontend and backend services for the Multi-Jurisdiction Employment Contract Localizer.

---

## Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB community edition (`mongodb://localhost:27017`) or a free MongoDB Atlas connection string.

---

## 1. Backend Setup

### Navigate to backend directory:
```bash
cd backend
```

### Install dependencies:
```bash
npm install
```

### Configure environment variables:
A sample `.env` is already created. Verify or edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/employment-contract-localizer
JWT_ACCESS_SECRET=super_secret_access_token_key_change_in_production_xyz123!
JWT_REFRESH_SECRET=super_secret_refresh_token_key_change_in_production_uvw456!
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### Seed Jurisdiction Rule Matrices:
Populate the database with California (`US-CA`) and United Kingdom (`GB-UK`) statutory rules:
```bash
npm run seed
```

### Start backend API server:
- For development with hot reloading:
  ```bash
  npm run dev
  ```
- Or production:
  ```bash
  npm start
  ```
Backend runs at: **`http://localhost:5000`**
Health check: **`http://localhost:5000/health`**

---

## 2. Frontend Setup

### Open a new terminal and navigate to frontend directory:
```bash
cd frontend
```

### Install dependencies:
```bash
npm install
```

### Start Next.js development server:
```bash
npm run dev
```

Frontend application runs at: **`http://localhost:3000`**

---

## 3. End-to-End Application Walkthrough

1. **Register Organization**:
   - Open `http://localhost:3000/register`.
   - Fill in Company Name (e.g. `Acme Global Corp`), Full Name, Email, and Password.
   - Upon submitting, a company tenant and administrative user account are created, and you are redirected to the Dashboard.

2. **Inspect Rule Matrices**:
   - Navigate to `/jurisdictions` from the top navigation.
   - Toggle between **State of California (United States)** and **United Kingdom (England & Wales)**.
   - Review statutory clauses (SB 699 non-compete void notices, ERA 1996 particulars, statutory sick pay and holiday provisions).

3. **Generate Localized Contract**:
   - Click **Generate Contract** (`/generate`).
   - **Step 1**: Choose Jurisdiction (`US-CA` or `GB-UK`) and Document Type (`Full Agreement Bundle`).
   - **Step 2**: Enter candidate details and job appointment terms.
   - **Step 3**: Configure salary, currency, and bonus/equity incentives.
   - **Step 4**: (Optional) Add custom company provisions and submit.

4. **View & Export Documents**:
   - Inspect the compiled contract on the details page with rendered statutory legal references.
   - Click **Download Official PDF** for a formatted PDF agreement with running headers, signature blocks, and disclaimer footers.
   - Click **Download Word DOCX** for an editable Microsoft Word document.
   - Check the **Audit Trail** showing timestamped generation and access history.
