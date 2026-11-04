# 🚀 Single-Project Vercel Deployment Guide

Just like your **Clubcore** project, this entire application (**Next.js Frontend + Express Serverless API**) is now configured to deploy together **100% directly onto Vercel** under a single project URL.

---

## What Was Configured
1. **Serverless API Bridge** ([`api/index.js`](file:///d:/VALORANT/Project/employment-contract-localizer/api/index.js)): Routes all `/api/*` requests into the Express backend as a Vercel Serverless Function.
2. **Serverless DB Connection Pooling** ([`backend/src/config/db.js`](file:///d:/VALORANT/Project/employment-contract-localizer/backend/src/config/db.js)): Added cached MongoDB connections so lambda cold starts don't create new connection spikes.
3. **Vercel Routing** ([`vercel.json`](file:///d:/VALORANT/Project/employment-contract-localizer/vercel.json)): Rewrites `/api/(.*)` to `/api/index.js` while Next.js handles all client routes (`/`, `/dashboard`, `/generate`, `/jurisdictions`, `/documents`).
4. **Root Package Config** ([`package.json`](file:///d:/VALORANT/Project/employment-contract-localizer/package.json)): Provides the root build trigger (`npm --prefix frontend run build`) and dependencies needed by the `/api` function.

---

## Steps to Deploy on Vercel

### Step 1: Import Repository
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... -> Project**.
2. Select your repository.
3. Leave **Root Directory** as `./` (default, don't change it).
4. Vercel will detect Next.js.
5. In **Build & Development Settings**, set:
   * **Output Directory**: `frontend/.next` (or leave default if Next.js auto-detects it)

---

### Step 2: Environment Variables to Add in Vercel

Go to the **Environment Variables** section in your Vercel Project Settings and add these:

| Name | Example Value | Notes |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.mongodb.net/contracts?retryWrites=true&w=majority` | **Required.** Free MongoDB Atlas connection string. |
| `JWT_ACCESS_SECRET` | `long_random_alphanumeric_string_32_chars` | **Required.** Secret for JWT signing. |
| `JWT_REFRESH_SECRET` | `another_long_random_alphanumeric_string` | **Required.** Secret for refresh tokens. |
| `JWT_ACCESS_EXPIRES_IN` | `1h` | Optional (defaults to 1h) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Optional (defaults to 7d) |
| `NODE_ENV` | `production` | Production mode |

> ⚠️ **Important for MongoDB Atlas:**
> In your MongoDB Atlas Dashboard, go to **Network Access** and ensure `0.0.0.0/0` (Allow access from anywhere) is added so Vercel's serverless IP pool can reach your database.

---

### Step 3: Seed Legal Jurisdictions Once

After deploying, run the seed script locally once pointing to your Atlas database to populate California (`US-CA`) and UK (`GB-UK`) legal rules:

```bash
cd backend
# Windows PowerShell
$env:MONGODB_URI="your_mongodb_atlas_connection_string"; npm run seed
```
Once seeded, all contract generations and statutory clauses will work immediately on your Vercel site!
