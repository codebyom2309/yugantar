# YUGANTAR 2026 — Official Festival Platform

> **Priyadarshini College of Engineering (PCE), Nagpur**  
> **Department of Electronics & Telecommunication Engineering (ETC)**  
> *In association with the TELE-ERA Student Forum & the TurboBits Student Organizing Team*

[![Next.js](https://img.shields.io/badge/Next.js-16.4.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![TiDB Cloud](https://img.shields.io/badge/Database-TiDB%20Serverless%20(MySQL%208.0+)-green?logo=mysql)](https://tidbcloud.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
  - [1.1 Purpose & Scope](#11-purpose--scope)
  - [1.2 Institutional Context & Organizing Bodies](#12-institutional-context--organizing-bodies)
  - [1.3 User Personas](#13-user-personas)
- [2. Technology Stack](#2-technology-stack)
- [3. Project Directory Structure](#3-project-directory-structure)
- [4. Step-by-Step Local Development Setup](#4-step-by-step-local-development-setup)
- [5. Environment Variables Reference](#5-environment-variables-reference)
- [6. Application Architecture & Data Flow](#6-application-architecture--data-flow)
  - [6.1 Architecture Overview](#61-architecture-overview)
  - [6.2 Registration Dual-Write Pipeline](#62-registration-dual-write-pipeline)
  - [6.3 On-Demand PDF Stream Pipeline](#63-on-demand-pdf-stream-pipeline)
- [7. Database Architecture (TiDB Cloud Serverless)](#7-database-architecture-tidb-cloud-serverless)
- [8. Google Sheets & Forms Integration](#8-google-sheets--forms-integration)
- [9. Pass & Certificate Studio](#9-pass--certificate-studio)
- [10. Organizer & Student Team Management](#10-organizer--student-team-management)
- [11. Storage & File Handling](#11-storage--file-handling)
- [12. Caching & Performance Optimization](#12-caching--performance-optimization)
- [13. Security & Access Control](#13-security--access-control)
- [14. Production Deployment Guide](#14-production-deployment-guide)
- [15. Troubleshooting & Diagnostic Guide](#15-troubleshooting--diagnostic-guide)
- [16. Testing & Quality Verification](#16-testing--quality-verification)
- [17. Contribution & Engineering Guidelines](#17-contribution--engineering-guidelines)
- [18. Project Status, Verified Features & Known Limitations](#18-project-status-verified-features--known-limitations)
- [19. Technical SEO, Google Indexing & Search Visibility](#19-technical-seo-google-indexing--search-visibility)
  - [19.1 Architecture & Primary Canonical Domain](#191-architecture--primary-canonical-domain)
  - [19.2 Sitemap & Robots.txt Routing](#192-sitemap--robotstxt-routing)
  - [19.3 Per-Page & Dynamic Metadata Implementation](#193-per-page--dynamic-metadata-implementation)
  - [19.4 Structured Data (Schema.org JSON-LD)](#194-structured-data-schemaorg-json-ld)
  - [19.5 Privacy, Security & Indexing Boundaries](#195-privacy-security--indexing-boundaries)
  - [19.6 Google Search Console Manual Verification Guide](#196-google-search-console-manual-verification-guide)
  - [19.7 Automated SEO Verification](#197-automated-seo-verification)

---

## 1. Project Overview

### 1.1 Purpose & Scope
**YUGANTAR 2026** is the unified web portal and event operating system for the national-level inter-collegiate technical festival hosted by Priyadarshini College of Engineering (PCE), Nagpur. The platform manages the entire event lifecycle:
- Public competition discovery and interactive festival journey guides.
- Multi-member team registrations with validation, deduplication, and payment verification.
- Pass & Certificate Studio with an interactive canvas designer.
- On-demand vector PDF rendering for delegate passes and participation/merit certificates.
- Dual-write integration between TiDB Cloud Serverless and official department Google Sheets.
- Administrative management for organizer profiles, competition rules, and audit logs.

### 1.2 Institutional Context & Organizing Bodies
The platform reflects the collaborative organizational structure of the festival:
1. **Priyadarshini College of Engineering (PCE), Nagpur:** The host institution providing administrative patronage and campus venues.
2. **Department of Electronics & Telecommunication Engineering (ETC):** The academic department providing faculty mentors, track advisors, and lab facilities.
3. **TELE-ERA Student Forum:** The departmental student body coordinating student governance and inter-college relations.
4. **TurboBits Student Organizing Team:** The dedicated student technical engineering, design, and operations unit responsible for platform development, lab hardware setups, jury coordination, and day-of-event logistics.

### 1.3 User Personas
- **Participants & Team Leaders:** Browse competition tracks, register individually or as a squad, submit payment proofs, download digital delegate passes, and receive certificates.
- **Track Coordinators & Judges:** Access check-in rosters via Google Sheets, verify physical delegate passes via QR verification, and review participant dossiers.
- **Festival Administrators:** Design certificate/pass templates, configure global registration gating, review payments, manage committee profiles, and batch issue credentials.

---

## 2. Technology Stack

The application uses modern web technologies and strictly maintains backward-compatible database operations:

| Layer | Technology | Version | Purpose in Codebase |
|---|---|---|---|
| **Framework** | **Next.js** | `16.4.0` | App Router, Turbopack, React Server Components (RSC), and Edge Route Proxy (`src/proxy.ts`). |
| **UI Library** | **React** | `19.3.0` | Component state management, concurrent transitions, and hooks. |
| **Language** | **TypeScript** | `^5.0.0` | Full end-to-end static type safety across API routes, database models, and canvas elements. |
| **Styling** | **Tailwind CSS** | `^4.0.0` | Utility styling powered by `@tailwindcss/turbopack` and CSS custom design tokens. |
| **Icons** | **Lucide React** | `^1.55.0` | Modern, consistent iconography across public and administrative views. |
| **Database** | **TiDB Serverless** | MySQL 8.0+ | Distributed, low-latency relational database with SSL enforcement. |
| **DB Client** | **mysql2** | `^3.24.5` | Native connection pooling with prepared statements and SSL support (`src/lib/db.ts`). |
| **Auth** | **NextAuth / Auth.js** | `^5.0.0-beta.32` | JWT session management with credentials (bcrypt) and optional Google SSO. |
| **Password Hash** | **bcryptjs** | `^3.0.3` | Cryptographic password hashing for administrative user accounts. |
| **PDF Engine** | **pdf-lib** | `^1.17.1` | Vector-accurate client/server PDF generation without external headless browser dependencies. |
| **QR Engine** | **qrcode** | `^1.5.4` | Generation of 2D verification matrices with cryptographically signed tokens. |
| **Image Processing**| **sharp** | `^0.35.5` | Server-side image optimization, background compression, and format conversions. |
| **Primary Storage** | **Filebase** | `@aws-sdk/client-s3` | S3-compatible decentralized IPFS object storage for uploaded assets. |
| **Secondary CDN** | **Cloudinary** | REST API | Dual-account signed media CDN for competition banners and portraits. |
| **Animations** | **framer-motion** & **canvas-confetti** | `^14.1.0` / `^1.9.4` | Fluid UI transitions and registration completion celebrations. |

---

## 3. Project Directory Structure

```text
e:/new project/
├── .env.example                     # Environment variables configuration template
├── package.json                     # Dependencies, scripts, and engine specifications
├── tsconfig.json                    # TypeScript compiler configuration
├── next.config.ts                   # Next.js configuration and image domains
├── AGENTS.md                        # Next.js 16 App Router agent conventions
│
├── docs/                            # Deep-dive architecture and technical manuals
│   ├── architecture.md              # System architecture, sequence diagrams & failure flows
│   ├── database-schema.md           # TiDB SQL DDL, table relationships & index dictionary
│   └── studio-guide.md              # Studio canvas coordinate math, presets & PDF engine
│
├── scripts/                         # Database migrations, seeders & QA benchmarks
│   ├── init-db.mjs                  # Core registrations table initializer
│   ├── migrate-admin.mjs            # Admin users, settings, and competition tables
│   ├── migrate-studio.mjs           # Pass templates & template assignments
│   ├── migrate-certificates.mjs     # Issued certificates ledger
│   └── test-stage2-e2e.mjs          # End-to-end registration verification script
│
├── src/
│   ├── proxy.ts                     # Next.js 16 route proxy (replaces legacy middleware)
│   │
│   ├── app/                         # Next.js App Router (Pages, Layouts & API routes)
│   │   ├── layout.tsx               # Root application layout with festival fonts
│   │   ├── page.tsx                 # Festival landing page (Hero, Arena, Journey, Map)
│   │   ├── globals.css              # Global Tailwind tokens, glassmorphism & gradients
│   │   │
│   │   ├── about/                   # About page (PCE, ETC Dept, TELE-ERA, TurboBits)
│   │   ├── competitions/            # Competition catalog & details pages
│   │   │   └── [slug]/              # Competition details, tracks, and rules
│   │   │       └── register/        # Competition-specific registration wizard
│   │   ├── pass/[id]/               # Public delegate pass viewer with PDF download
│   │   ├── verify/                  # QR code verification scanner and validation screen
│   │   │
│   │   ├── admin/                   # Administrative Portal (Protected by proxy.ts)
│   │   │   ├── login/               # Admin authentication screen
│   │   │   ├── studio/              # Pass & Certificate Studio template manager
│   │   │   │   └── designer/[id]/   # Interactive canvas designer & inspector
│   │   │   ├── registrations/       # Live participant dossiers, payment audit & pass issue
│   │   │   ├── organizers/          # Committee & TurboBits photo editor & order controls
│   │   │   ├── competitions/        # Competition configuration & fee settings
│   │   │   ├── spreadsheets/        # Centralized Google Sheets links directory
│   │   │   └── audit-log/           # System activity and security audit trail
│   │   │
│   │   └── api/                     # RESTful Server Route Handlers
│   │       ├── register/            # Registration submission & Google Form forwarder
│   │       ├── pass/[id]/pdf/       # In-memory vector PDF generator
│   │       ├── certificate/[code]/  # Certificate verification and PDF stream
│   │       └── admin/               # Admin endpoints (Studio, Organizers, Media, Settings)
│   │
│   ├── components/                  # Reusable React 19 Client & Server Components
│   │   ├── Navbar.tsx               # Responsive header navigation
│   │   ├── Hero.tsx                 # Animated hero banner with countdown
│   │   ├── RegistrationForm.tsx     # Dynamic multi-step registration form
│   │   ├── admin/                   # Admin navigation and dashboard widgets
│   │   └── organizers/              # Committee preview and TurboBits mobile observer
│   │
│   ├── data/                        # Static metadata and verified configurations
│   │   ├── events.ts                # Authoritative festival competitions and schedules
│   │   └── registrationForms.ts     # Google Form field entry IDs and response URLs
│   │
│   ├── lib/                         # Core utilities, services, and backend libraries
│   │   ├── db.ts                    # TiDB connection pool singleton with SSL
│   │   ├── auth.ts                  # NextAuth v5 session configuration & callbacks
│   │   ├── storage.ts               # Filebase & Cloudinary multi-provider file handler
│   │   ├── studioPdfRenderer.ts     # pdf-lib vector PDF assembly engine
│   │   ├── certificateService.ts    # Certificate batch generation & deduplication logic
│   │   ├── studioTokens.ts          # Dynamic token replacement engine
│   │   └── passToken.ts             # HMAC-signed pass token encoder/decoder
│   │
│   └── types/                       # Shared TypeScript interface definitions
│       ├── studio.ts                # Studio canvas, presets, and element types
│       └── next-auth.d.ts           # NextAuth session and token type augmentation
```

---

## 4. Step-by-Step Local Development Setup

Follow these instructions to configure and run the application on a local development machine.

### 4.1 Prerequisites
- **Node.js:** Supported versions are `^20.0.0` or `^22.0.0` (Verified on Node.js `v24.x` / `v20.x`).
- **Package Manager:** `npm` (included with Node.js).
- **Database:** Access to a TiDB Cloud Serverless cluster or a local MySQL 8.0+ server.

### 4.2 Clone and Install Dependencies
```bash
# 1. Clone repository
git clone <repository-url>
cd "new project"

# 2. Install dependencies (strictly adhering to package-lock.json)
npm install
```

### 4.3 Configure Environment Variables
Copy the example environment file and fill in your database credentials:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your valid database connection string and a random 32-character `AUTH_SECRET`:
```ini
DATABASE_URL="mysql://<user>:<password>@<host>:4000/<database>?ssl={\"rejectUnauthorized\":true}"
AUTH_SECRET="e9a7c3b2f1e8d4a6c0b5e3f2a1d9c8b7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4.4 Initialize and Migrate the Database
Run the additive database migration scripts to provision the tables:
```bash
# 1. Provision registrations table
npm run db:init

# 2. Provision admin users, competitions, settings, and audit log
npm run db:migrate

# 3. Provision Pass & Certificate Studio templates
node scripts/migrate-studio.mjs

# 4. Provision Issued Certificates ledger
node scripts/migrate-certificates.mjs
```

### 4.5 Start the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

### 4.6 Administrator Credentials
To log in to the administrative portal at `http://localhost:3000/admin/login`:
- **Default Email:** `om@gmail.com`
- **Default Password:** `admin123`
*(Ensure passwords are changed before deploying to production via the Admin Users management panel).*

---

## 5. Environment Variables Reference

All environment variables used by the codebase are documented below:

| Variable Name | Required | Scope | Purpose | Example Placeholder |
|---|---|---|---|---|
| `DATABASE_URL` | **Yes** | Server | TiDB Cloud / MySQL connection string with SSL configuration. | `mysql://user:pass@host:4000/yugantar?ssl={"rejectUnauthorized":true}` |
| `AUTH_SECRET` | **Yes** | Server | Cryptographic key for signing JWT session cookies and pass tokens. | `openssl rand -base64 32` |
| `NEXTAUTH_SECRET`| No | Server | Fallback secret for legacy NextAuth session checks. | `same-as-auth-secret` |
| `NEXTAUTH_URL` | **Yes** | Server | Canonical base URL for NextAuth callbacks. | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Public | Public festival domain for QR codes and verification links. | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | No | Server | Google OAuth Client ID for Admin Single Sign-On. | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| No | Server | Google OAuth Client Secret for Admin Single Sign-On. | `GOCSPX-xxxxxxxxx` |
| `FILEBASE_ENDPOINT` | No | Server | S3-compatible IPFS object storage endpoint. | `https://s3.filebase.io` |
| `FILEBASE_REGION` | No | Server | Filebase region identifier. | `auto` |
| `FILEBASE_ACCESS_KEY` | No | Server | Filebase access key ID. | `FILEBASE_ACCESS_KEY` |
| `FILEBASE_SECRET_KEY` | No | Server | Filebase secret access key. | `FILEBASE_SECRET_KEY` |
| `FILEBASE_BUCKET` | No | Server | Bucket name for festival media assets. | `teleera` |
| `CLOUDINARY_A_CLOUD_NAME` | No | Server | Cloudinary Account A (Technical Tracks). | `cloud_a_name` |
| `CLOUDINARY_A_API_KEY` | No | Server | Cloudinary Account A API Key. | `123456789012345` |
| `CLOUDINARY_A_API_SECRET` | No | Server | Cloudinary Account A API Secret. | `secret_a` |
| `CLOUDINARY_B_CLOUD_NAME` | No | Server | Cloudinary Account B (Creative Tracks). | `cloud_b_name` |
| `CLOUDINARY_B_API_KEY` | No | Server | Cloudinary Account B API Key. | `987654321098765` |
| `CLOUDINARY_B_API_SECRET` | No | Server | Cloudinary Account B API Secret. | `secret_b` |

---

## 6. Application Architecture & Data Flow

Detailed architectural documentation and sequence diagrams are maintained in [`docs/architecture.md`](file:///e:/new%20project/docs/architecture.md).

### 6.1 Architecture Overview
- **Server-Side Rendering (SSR) & Server Components:** The public landing, competition catalogs, and about pages fetch from the local database or in-memory caches and stream HTML to the browser.
- **Edge Route Proxy (`src/proxy.ts`):** Enforces authentication before any administrative page or layout code executes.

### 6.2 Registration Dual-Write Pipeline
Registrations submitted to `POST /api/register` execute in an ordered sequence:
1. **Server Gating & Deduplication:** Checks if registration is globally open, track deadlines have not passed, and validates against duplicate email submissions.
2. **Primary DB Persistence:** Records the submission in TiDB Cloud with status `'pending'`. If this step fails, execution halts and returns a 500 error.
3. **Google Form Forwarding:** If `send_to_spreadsheet` is active in `site_settings`, an asynchronous `application/x-www-form-urlencoded` post is dispatched to the competition's verified Google Form URL.
4. **Status Reconciliation:** Upon confirmed Google response, status is updated to `'confirmed'` (for free tracks) or `'submitted'` (for paid tracks awaiting verification). If Google times out, status is marked as `'failed'` with error details, but data remains intact in TiDB.

### 6.3 On-Demand PDF Stream Pipeline
- When a user downloads their pass (`GET /api/pass/:id/pdf`) or an administrator issues certificates:
- The system loads the active template from `pass_templates`.
- Dynamic tokens (`{{recipient_name}}`, `{{registration_id}}`, etc.) are resolved from the participant dossier.
- `pdf-lib` constructs the vector PDF in server memory, embeds the background image, and draws a 2D QR verification matrix.
- The document is serialized into a buffer and streamed directly to the browser as `application/pdf`. **No binary PDF files are stored in TiDB.**

---

## 7. Database Architecture (TiDB Cloud Serverless)

Complete schema specifications, data dictionary, and migration notes are maintained in [`docs/database-schema.md`](file:///e:/new%20project/docs/database-schema.md).

Key tables in the system:
- **`registrations`:** Primary participant ledger with JSON `form_data` and secure `verification_token`.
- **`competitions`:** Authoritative metadata for all festival tracks, fees, team size limits, and Google Form mappings.
- **`pass_templates`:** Canvas definitions, paper presets, and vector element arrays.
- **`issued_certificates`:** Verifiable ledger of issued participant and merit certificates.
- **`organizer_members`:** Committee profiles with photo crop coordinates and forum designations.
- **`site_settings`:** Global system settings and operational toggles.
- **`registration_spreadsheets`:** Administrative directory linking official Google Sheets.
- **`audit_log`:** Administrative action trail with user IDs and timestamps.

---

## 8. Google Sheets & Forms Integration

### 8.1 How Submissions Reach Google Sheets
The platform does not require fragile service account OAuth tokens or private Google Drive API credentials to append rows. Instead, each competition in [`src/data/registrationForms.ts`](file:///e:/new%20project/src/data/registrationForms.ts) is mapped to its official Google Form:
- Submissions are transformed to `entry.XXXX` parameters.
- Dispatched via an HTTP POST directly to the Google Form's `formResponseUrl`.
- Google Forms automatically appends the record into the linked Department Google Sheet.

### 8.2 Spreadsheet Manager (`/admin/spreadsheets`)
The Spreadsheet Manager is a centralized administrative directory:
- It organizes and launches official Google Sheets in a new browser tab.
- **Limitation:** It does not parse or replicate spreadsheet cells back into TiDB. Standard Google Account permissions govern sheet access.

---

## 9. Pass & Certificate Studio

Full technical specifications, coordinate systems, and token manuals are detailed in [`docs/studio-guide.md`](file:///e:/new%20project/docs/studio-guide.md).

### 9.1 Canvas Designer (`/admin/studio/designer/[id]`)
- **Document Units:** PostScript Points ($72\text{ pt} = 1\text{ in}$).
- **Selection Persistence:** Element wrappers use `e.stopPropagation()` on `onClick` to keep the inspector open during left-click element selection.
- **Right-Click Context Menu:** Supports *Duplicate*, *Bring Forward*, *Send Backward*, *Lock*, and *Delete*.
- **Real Fit-to-Screen:** Automatically calculates zoom based on container bounds:
  $$\text{Zoom} = \min\left(\frac{W_{\text{container}} - 64}{W_{\text{template}}}, \frac{H_{\text{container}} - 64}{H_{\text{template}}}, 1.8\right)$$
- **Sidebar Collapse:** Left and right panels can be collapsed to give the canvas full screen width.
- **Paper Presets:** Supports **A4 Portrait/Landscape**, **A5 Portrait/Landscape**, **Certificate**, **ID Badge**, and **Custom Dimensions**.

### 9.2 Multi-Member Team Certificate Issuance
In `/admin/studio`:
- **Individual Policy:** Unpacks all team members from `form_data` so that each eligible team member receives an individually personalized certificate with their name.
- **Leader / Solo Policy:** Generates certificates for the primary registrant only.
- The duplicate check in [`src/lib/certificateService.ts`](file:///e:/new%20project/src/lib/certificateService.ts) checks `registration_id` **and** `recipient_name`, preventing team members from being skipped as duplicates.

---

## 10. Organizer & Student Team Management

Managed at `/admin/organizers`:
- **Interactive Photo Crop Editor:** Features Circle, Rounded Rectangle, and Square masks with interactive drag panning, zoom scaling ($0.5\times$ to $3.0\times$), horizontal/vertical sliders, and live preview. Crop metadata is saved as JSON in `organizer_members.crop_data`.
- **Public Order Visibility Toggle:** An administrative toggle backed by `site_settings.show_organizer_order` allows administrators to hide public `Order #` badges on the About page while maintaining internal administrative ordering.
- **TELE-ERA Forum Designations:** Allows optional designations (e.g., *TELE-ERA Student Forum Secretary*) alongside festival roles.
- **TurboBits Team Cards:** The public About page displays accurate roles (only true leads display the *TurboBits Lead* badge) with electric-blue hover glow and mobile center-focus highlighting.

---

## 11. Storage & File Handling

- **Structured Metadata:** Stored in TiDB Cloud Serverless.
- **Participant Dossiers:** Stored in TiDB Cloud and streamed to official Google Sheets.
- **Media & Assets:**
  - **Primary:** Filebase S3-compatible IPFS object storage (`src/lib/storage.ts`).
  - **Secondary:** Dual-account Cloudinary signed upload fallback.
  - **Google Drive CDN:** Direct link transformation (`src/lib/drive.ts`) transforms Google Drive links into high-performance `lh3.googleusercontent.com` CDN images.
  - **Local Fallback:** Saved to `public/uploads/`.
- **Generated PDFs:** Created on-the-fly in memory via `pdf-lib` and returned as streams. Never stored permanently as database binary blobs.

---

## 12. Caching & Performance Optimization

- **Next.js 16 Partial Prefetching & Turbopack:** Dynamic routes compile on demand.
- **Targeted Cache Invalidation:** Handled via [`src/lib/cache-invalidation.ts`](file:///e:/new%20project/src/lib/cache-invalidation.ts) using `revalidateTag(domain, 'max')` and `revalidatePath(...)` across competitions, organizers, settings, and FAQs.
- **Database Connection Reuse:** Connection pool cached on `globalThis` in development avoids exhausting serverless connection limits during hot reloading.
- **Image Optimization:** Next.js `<Image>` optimizes external images with allowed remote host patterns (`lh3.googleusercontent.com`, `res.cloudinary.com`).

---

## 13. Security & Access Control

- **Edge Proxy Gate (`src/proxy.ts`):** Validates session tokens before admin pages load.
- **Role-Based Authorization (RBAC):** Roles include `super_admin`, `content_admin`, `registration_admin`, and `readonly_admin`.
- **Password Hashing:** Passwords hashed using `bcryptjs` with salt rounds.
- **Pass Verification Tokens:** Passes carry HMAC-signed tokens (`src/lib/passToken.ts`) embedding registration UUID and checksum to prevent forgery.
- **Audit Logging:** Administrative actions are logged to `audit_log` with admin ID, action, entity, IP address, and timestamp.
- **Unicode Sanitization:** All text drawn to PDFs is sanitized to prevent font stream exploits.

---

## 14. Production Deployment Guide

The application is optimized for deployment on **Vercel** with **TiDB Cloud Serverless**:

1. **Vercel Project Setup:**
   - Framework Preset: Next.js
   - Node.js Version: `20.x` or `22.x`
   - Build Command: `next build`
   - Output Directory: `.next`
2. **Environment Variables:** Configure all variables from `.env.example` in the Vercel Dashboard under **Project Settings > Environment Variables**.
3. **Database Preparation:** Run database migrations against the production TiDB cluster prior to deployment.
4. **Post-Deployment Smoke Test:**
   - Verify public landing page loads at root URL.
   - Test a free track registration submission.
   - Verify pass download PDF generation.
   - Log in to `/admin/login` and verify Studio and Organizers pages.

---

## 15. Troubleshooting & Diagnostic Guide

### 15.1 Port 3000 Conflict
- **Symptom:** Next.js warns `Port 3000 is in use, using available port 3001 instead`.
- **Cause:** A stale Next.js dev server or production process is holding the port.
- **Fix:** In PowerShell, identify and terminate the process:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  ```

### 15.2 TiDB SSL Handshake Failure
- **Symptom:** `Error: self-signed certificate in certificate chain` or `Connection lost: The server closed the connection`.
- **Cause:** TiDB Cloud Serverless requires SSL enabled.
- **Fix:** Ensure `DATABASE_URL` contains `?ssl={"rejectUnauthorized":true}`.

### 15.3 Google Forms HTTP 200 But Response Not Recorded
- **Symptom:** Database status shows `failed` with message `Google Forms returned HTTP 200 but did not confirm response recorded`.
- **Cause:** Google Forms returns 200 even when a required form field is missing from the POST payload.
- **Fix:** Inspect [`src/data/registrationForms.ts`](file:///e:/new%20project/src/data/registrationForms.ts) and verify the `entryId` mappings match the live Google Form schema.

### 15.4 Slow Initial Route Compilation on Windows
- **Symptom:** `○ Compiling /about ...` takes 30-45 seconds on first access.
- **Cause:** Turbopack filesystem scan on non-system drives (e.g., `E:\`). Subsequent requests are served from cache.

---

## 16. Testing & Quality Verification

### 16.1 Available Quality Commands
```bash
# 1. Typecheck the entire codebase (zero tolerance for type errors)
npx tsc --noEmit

# 2. Run ESLint across source files
npm run lint

# 3. Create a production build locally to verify bundle health
npm run build

# 4. Start the local production build
npm run start
```

### 16.2 Critical Workflows to Test Before Release
1. **Pass & Certificate Studio:** Select elements, verify inspector stays open, collapse sidebars, test fit zoom, and export a test PDF.
2. **Multi-Member Issuance:** Verify batch certificate issuance unpacks team members without duplicate skips.
3. **Organizer Photo Cropper:** Open crop modal, test drag pan, zoom slider, reset button, and verify public card rendering.
4. **Registration Gating:** Test submission when registration is globally closed and confirm proper gating messages.

---

## 17. Contribution & Engineering Guidelines

1. **App Router Conventions:** Follow Next.js 16 conventions documented in `AGENTS.md`. Use `proxy.ts` instead of `middleware.ts`.
2. **Database Migrations:** Never execute destructive SQL (`DROP TABLE`, `TRUNCATE`) on shared databases. All migrations must be additive and use `IF NOT EXISTS`.
3. **PDF & Storage Boundaries:** Do not store binary PDF buffers or raw image files in TiDB. Store metadata and URLs in TiDB; generate PDFs in memory on demand.
4. **Git Practices:** Review `git status` before committing. Never commit `.env.local` or files containing participant information or secrets.

---

## 18. Project Status, Verified Features & Known Limitations

### 18.1 Verified Working Functionality
- [x] **Pass & Certificate Studio:** Left-click element selection bug resolved (inspector remains open); canvas panning, fit-to-screen scaling, paper preset reflow (A4, A5, ID Badge, Certificate), and vector PDF generation verified.
- [x] **Multi-Member Certificate Issuance:** Team member parsing from `form_data` and duplicate checks updated to issue individual certificates to all eligible squad members.
- [x] **Organizer Photo Editor:** Interactive modal photo cropper (Circle, Rounded Rect, Square) with pan/zoom and persistent `crop_data` metadata.
- [x] **Public Order Visibility:** Toggle switch in admin hides public order badges on About page while maintaining internal sorting.
- [x] **TurboBits Student Team Experience:** Accurate introductory copy for PCE, ETC Department, TELE-ERA Forum, and TurboBits team; distinct lead designations and electric-blue hover glow.
- [x] **Type Safety:** `npx tsc --noEmit` passes with **0 errors**.

### 18.2 Known Limitations
1. **Spreadsheet Manager (`/admin/spreadsheets`):** Operates as a link and metadata directory. It does not pull or synchronize spreadsheet cell contents back into TiDB.
2. **Google Forms Forwarding:** Does not support automatic background retries if Google Forms is unavailable during registration; submissions remain safely recorded in TiDB with status `'failed'` for admin review.
3. **Playwright Driver:** In restricted network environments where `azureedge.net` is blocked, automated browser Playwright drivers may fail to download. Quality verification should rely on TypeScript compilation, unit scripts, and standard browser interaction.

---

## 19. Technical SEO, Google Indexing & Search Visibility

### 19.1 Architecture & Primary Canonical Domain
- **Primary Canonical Production Origin:** `https://teleera.turbobits.in`
- **Configuration Module:** [`src/lib/site-url.ts`](file:///e:/new%20project/src/lib/site-url.ts)
  - Exports `PRIMARY_PRODUCTION_ORIGIN = 'https://teleera.turbobits.in'`
  - `getSiteUrl()` reads `NEXT_PUBLIC_SITE_URL` or `SITE_URL` from trusted environment variables and falls back safely to the primary origin.
  - `getAbsoluteUrl(path)` constructs canonical URLs without ever trusting incoming client HTTP headers (`x-forwarded-host`, etc.).

### 19.2 Sitemap & Robots.txt Routing
- **XML Sitemap Route (`/sitemap.xml`):** Implemented in [`src/app/sitemap.ts`](file:///e:/new%20project/src/app/sitemap.ts) using Next.js App Router conventions.
  - Dynamically discovers all published competitions from the authoritative loader (`getPublicCompetitions()`).
  - Includes:
    - `/` (Priority: 1.0, ChangeFrequency: daily)
    - `/competitions` (Priority: 0.9, ChangeFrequency: daily)
    - `/competitions/[slug]` for every published arena (Priority: 0.8, ChangeFrequency: daily)
    - `/about` (Priority: 0.7, ChangeFrequency: weekly)
    - `/districts` (Priority: 0.7, ChangeFrequency: weekly)
    - `/journey` (Priority: 0.6, ChangeFrequency: weekly)
    - `/faq` (Priority: 0.6, ChangeFrequency: weekly)
  - **Strictly Excludes:** `/admin/*`, `/api/*`, `/pass/*`, `/verify/*`, `/city` (redirect), and `/*/register` sub-routes.
- **Robots.txt Route (`/robots.txt`):** Implemented in [`src/app/robots.ts`](file:///e:/new%20project/src/app/robots.ts).
  - Explicitly allows public pages, `/_next/static/*`, `/images/*`, and `/api/media/*`.
  - Disallows crawler access to `/admin/`, `/pass/`, `/verify/`, `/api/`, and `/competitions/*/register`.
  - Declares canonical sitemap: `https://teleera.turbobits.in/sitemap.xml`.

### 19.3 Per-Page & Dynamic Metadata Implementation
- **Root Layout ([`src/app/layout.tsx`](file:///e:/new%20project/src/app/layout.tsx)):** Sets `metadataBase`, global Open Graph (`og:url`, `og:image`, `og:type`), Twitter Large Card metadata, and indexing permissions for Googlebot (`max-image-preview: large`).
- **Dynamic Competition Pages ([`src/app/competitions/[slug]/page.tsx`](file:///e:/new%20project/src/app/competitions/%5Bslug%5D/page.tsx)):**
  - Implements `generateMetadata({ params })` fetching the specific competition details.
  - Sets unique title (`{Name} — Arena 0{Index} | YUGANTAR 2026`), concise description, self-referencing canonical URL (`/competitions/{slug}`), and competition hero banner Open Graph artwork.
  - Directly returns HTTP 404 via `notFound()` for unpublished or nonexistent competition slugs.
- **Competitions Directory ([`src/app/competitions/page.tsx`](file:///e:/new%20project/src/app/competitions/page.tsx)):** Server component delivering descriptive title, meta description, and canonical link.
- **About Page ([`src/app/about/page.tsx`](file:///e:/new%20project/src/app/about/page.tsx)):** Dedicated institutional metadata highlighting PCE, Department of ETC, TELE-ERA, and IIC Cell.
- **Districts Page ([`src/app/districts/page.tsx`](file:///e:/new%20project/src/app/districts/page.tsx)):** Metadata for NEXUS CITY districts and interactive floor maps.
- **Journey Page ([`src/app/journey/page.tsx`](file:///e:/new%20project/src/app/journey/page.tsx)):** Delegate timeline and festival schedule metadata.
- **FAQ Page ([`src/app/faq/page.tsx`](file:///e:/new%20project/src/app/faq/page.tsx)):** Logistics, registration, and payment proof FAQ metadata.

### 19.4 Structured Data (Schema.org JSON-LD)
All schemas are centralized in [`src/lib/seo-schema.ts`](file:///e:/new%20project/src/lib/seo-schema.ts) using verified institutional data:
1. **Organization (`EducationalOrganization` + `CollegeOrUniversity`):** Injected globally in root layout for PCE Nagpur, Department of ETC, and TELE-ERA Student Forum.
2. **WebSite:** Injected globally in root layout with canonical domain and publisher reference.
3. **Festival Event:** Injected on homepage (`/`) for YUGANTAR 2026 on 19 October 2026 at PCE Campus.
4. **Competition Event:** Injected on each competition detail page (`/competitions/[slug]`) describing arena venue, dates, pricing/offers, and organizer links.
5. **ItemList:** Injected on `/competitions` listing all eight flagship arenas for search crawler discovery.
6. **FAQPage:** Injected on `/faq` with verified questions and answers.
7. **BreadcrumbList:** Injected on all sub-pages for rich navigational breadcrumbs in SERPs.

### 19.5 Privacy, Security & Indexing Boundaries
To ensure that confidential participant and administrative data is never indexed:
- **Participant Passes (`/pass/[id]`):** Injected with `robots: { index: false, follow: false, nocache: true }` and blocked in `robots.txt`.
- **Credential Verification (`/verify/[token]`):** Injected with `robots: { index: false, follow: false, nocache: true }` and blocked in `robots.txt`.
- **Admin Panel & Login (`/admin`, `/admin/login`):** Protected by `robots: { index: false, follow: false, nocache: true }` and authentication session checks.
- **Registration Subpages (`/competitions/[slug]/register`):** Given `robots: { index: false, follow: true }` with canonical pointing to the parent competition page to eliminate duplicate form indexing.

### 19.6 Google Search Console Manual Verification Guide
To complete domain ownership verification and sitemap indexing in Google Search Console:

1. **Add Property:**
   - Log into [Google Search Console](https://search.google.com/search-console).
   - Click **Add Property**.
   - Select **Domain** (recommended: `turbobits.in`) OR **URL Prefix** (`https://teleera.turbobits.in`).
2. **DNS Verification via GoDaddy:**
   - When selecting Domain property verification, Google provides a TXT record value (e.g., `google-site-verification=XXXXXXXXXXXXXXXXXXXX`).
   - Log into your GoDaddy DNS Management console for `turbobits.in`.
   - Add a new DNS record:
     - **Type:** `TXT`
     - **Name:** `@` (or `teleera` if verifying subdomain prefix)
     - **Value:** The verification string copied from Google Search Console
     - **TTL:** 1 Hour (or 1/2 Hour)
   - Save the record. Wait 5–15 minutes for DNS propagation, then click **Verify** in Search Console.
3. **Submit Sitemap:**
   - In Search Console, navigate to **Sitemaps** in the left sidebar.
   - Enter `sitemap.xml` under *Add a new sitemap*.
   - Click **Submit**. Verify that the status shows **Success**.
4. **URL Inspection & Live Test:**
   - Use the **URL Inspection** bar at the top to test `https://teleera.turbobits.in` and `https://teleera.turbobits.in/competitions/ideathon`.
   - Click **Test Live URL** to confirm that Googlebot can fetch the HTML, reads the self-referencing canonical, and detects the JSON-LD Event and Organization schemas.
   - Click **Request Indexing**.

### 19.7 Automated SEO Verification
Run the automated test suite locally at any time:
```bash
node scripts/test-seo.mjs
```
The suite executes 46 assertions validating `robots.txt`, `sitemap.xml`, canonical origins, OpenGraph tags, dynamic competition metadata, JSON-LD schemas, and `noindex` privacy enforcement.

---

*For further technical details, consult the dedicated guides in the [`docs/`](file:///e:/new%20project/docs) directory.*

