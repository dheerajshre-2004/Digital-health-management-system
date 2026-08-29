# DHMS Dual-Deployment Guide (Vercel)

This repository is configured for **Dual-Deployment Mode** on Vercel. You can run two separate, live websites from the exact same Git repository:

1. **Hospital & Staff Portal** (Doctors, Nurses, Receptionists, Lab, Pharmacy, Cashier, Admin)
2. **Patient Health Portal** (Dedicated patient-only web portal for appointments, prescriptions, reports, and real-time care)

Both deployments connect to the **same Supabase database backend**, ensuring real-time data synchronization.

---

## Architecture Overview

```
                        ┌──────────────────────────────────────────────┐
                        │              GitHub Repository               │
                        │         (Digital Health MS MCware)          │
                        └──────────────┬───────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
     ┌─────────────────────────────┐       ┌─────────────────────────────┐
     │      Vercel Project 1       │       │      Vercel Project 2       │
     │      [Hospital Portal]      │       │      [Patient Portal]       │
     │  Build: npm run build       │       │  Build: npm run build:patient│
     │  URL: dhms-hospital.vercel  │       │  URL: dhms-patient.vercel   │
     └──────────────┬──────────────┘       └──────────────┬──────────────┘
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       ▼
                        ┌──────────────────────────────┐
                        │      Supabase Database       │
                        │  (Live Real-time Sync)       │
                        └──────────────────────────────┘
```

---

## Step 1: Deploy Hospital / Staff Portal on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New..."** > **"Project"**.
3. Import your GitHub repository (`Digital Health MS MCware`).
4. Set the project name: e.g., `dhms-hospital` or `dhms-staff`.
5. Under **Build and Output Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build` *(default)*
   - **Output Directory**: `dist` *(default)*
6. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = `https://iuthkyvoogajhvaoxbny.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dGhreXZvb2dhamh2YW94Ym55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MTYzODAsImV4cCI6MjEwMTk5MjM4MH0.2FVR_O9i-veV2_GaZuuJSG-hnuTLM4kg1XueDKB0hSs`
7. Click **Deploy**.

---

## Step 2: Deploy Dedicated Patient Portal on Vercel

1. On your Vercel Dashboard, click **"Add New..."** > **"Project"** again.
2. Select the **same GitHub repository** (`Digital Health MS MCware`).
3. Set the project name: e.g., `dhms-patient` or `patient-health-portal`.
4. Under **Build and Output Settings**:
   - **Framework Preset**: `Vite`
   - Toggle **Override** on **Build Command** and enter:
     ```bash
     npm run build:patient
     ```
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = `https://iuthkyvoogajhvaoxbny.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dGhreXZvb2dhamh2YW94Ym55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MTYzODAsImV4cCI6MjEwMTk5MjM4MH0.2FVR_O9i-veV2_GaZuuJSG-hnuTLM4kg1XueDKB0hSs`
   - `VITE_APP_MODE` = `patient`
6. Click **Deploy**.

---

## Step 3: Custom Domains (Optional)

You can assign custom domains in Vercel under **Project Settings > Domains**:
- Hospital Site: `hospital.yourdomain.com` or `app.yourdomain.com`
- Patient Site: `patient.yourdomain.com` or `myhealth.yourdomain.com`

*Note: Any domain or subdomain containing `patient` is automatically detected and locked into Patient Portal mode.*

---

## Local Testing

You can run both modes locally at any time:

- **Run Staff / Hospital Portal**:
  ```bash
  npm run dev
  ```
  Open: `http://localhost:5173`

- **Run Patient Portal**:
  ```bash
  npm run dev:patient
  ```
  Open: `http://localhost:5173`

- **Test Patient Portal via URL parameter**:
  Open: `http://localhost:5173/?portal=patient`
