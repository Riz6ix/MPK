<div align="center">
  <br />
  <a href="https://github.com/Riz6ix/MPK">
    <img src="public/images/Logo_MPK.jpeg" alt="MPK Logo" width="140" style="border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);" />
  </a>
  <br />
  <br />

  <h1 align="center">Website Majelis Perwakilan Kelas SMA</h1>

  <p align="center">
    <strong>A centralized, high-performance governance platform for modern Student Councils.</strong>
    <br />
    <br />
    <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-FF5D01?style=for-the-badge&logo=astro&logoColor=white" alt="Astro" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  </p>
</div>

<p align="center">
  <kbd> <a href="README.md">🌐 English</a> </kbd> • <kbd> <a href="README.id.md">🇮🇩 Bahasa Indonesia</a> </kbd>
</p>

---

## ✦ The Vision

Managing student governance often relies on fragmented tools—scattered spreadsheets, physical suggestion boxes, and disconnected communication channels. 

This platform reengineers the **Student Council (MPK)** workflow into a single, unified digital workspace. It acts as the definitive source of truth for student aspirations, roster management, and structural organization, engineered on a modern, edge-ready technology stack.

<br />

## ✦ Core Architecture

We prioritize system integrity and performance over feature bloat. Here is the architectural breakdown:

| Module | Subsystem | Technical Description |
| :--- | :--- | :--- |
| 🗳️ **Intake** | `Aspirations` | Secure ingestion pipeline for student feedback. Built with edge-function validation and Supabase real-time persistence. |
| 👥 **Roster** | `Alumni & HR` | Centralized relational schemas to track active members, hierarchical data, and historical alumni records. |
| 🏛️ **Governance**| `Class Manager` | Administrative interfaces handling class delegations, representative structures, and internal permissions. |
| 🚀 **Delivery** | `Astro SSR` | Highly optimized Server-Side Rendering (SSR) ensuring zero-layout-shift and sub-second load times. |

<br />

## ✦ Developer Guide

Spin up the local environment in seconds. We enforce strict node versioning for consistency.

### 1. Environment Setup

Ensure you have **Node.js v22.12.0+** and an active **Supabase** instance. Clone the repository and install dependencies:

```bash
git clone https://github.com/Riz6ix/MPK.git
cd MPK
npm install
```

### 2. Configuration

Duplicate the environment template (if available) or create a `.env` file at the project root. Securely inject your Supabase credentials:

```env
# .env
PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

> **Warning:** Never commit your `.env` file. This repository uses strict `.gitignore` rules to prevent credential leaks.

### 3. Initialize Server

Boot the Astro development server with Hot Module Replacement (HMR):

```bash
npm run dev
```
> The application will safely ignite at `http://localhost:4321`.

<br />

## ✦ Deployment Infrastructure

This repository is optimized for **Continuous Deployment (CD)** via Netlify.

Pushing to the `main` branch automatically triggers the CI/CD pipeline. Netlify reads the pre-configured `netlify.toml`, executes `npm run build`, and distributes the static/SSR artifacts globally. No manual intervention is required.

---
<div align="center">
  <i>Engineered for better student governance.</i>
</div>