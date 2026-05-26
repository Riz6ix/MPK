<div align="center">
  <img src="public/images/Logo_MPK.jpeg" alt="MPK Logo" width="120" style="border-radius: 12px;"/>
  <h1>Website Majelis Perwakilan Kelas SMA</h1>
  <p><strong>A modern, centralized platform for Student Council (MPK) governance and administration.</strong></p>
  
  <p>
    <a href="https://astro.build"><img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" alt="Build Status"/></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License"/></a>
    <img src="https://img.shields.io/badge/Version-1.0.0-lightgrey?style=flat-square" alt="Version"/>
  </p>
</div>

<div align="center">
  🌐 English | <a href="README.id.md">🇮🇩 Bahasa Indonesia</a>
</div>

---

## 🎯 The Why

Managing a Student Council (Majelis Perwakilan Kelas) often involves scattered spreadsheets, physical feedback boxes, and fragmented communication. 

This project aims to solve that by providing a **centralized digital workspace**. It acts as a single source of truth for student aspirations, alumni tracking, and organizational structure, built upon a high-performance modern web stack (Astro + React + Supabase).

## ⚡ Core Architecture & Capabilities

Instead of listing trivial features, here is the architectural matrix of what this platform actually handles:

| Capability | Module | Description |
| :--- | :--- | :--- |
| 🗳️ **Aspiration Intake** | `Aspirasi Form` | A secure, structured ingestion system for student feedback, utilizing Supabase for real-time data persistence. |
| 👥 **HR & Roster** | `Alumni & Member Table` | Centralized relational tables for tracking active organizational members and preserving historical alumni data. |
| 🏛️ **Governance** | `Class Manager` | Administrative dashboard components to manage class delegations, hierarchical structures, and internal data. |
| 🚀 **Delivery** | `Astro SSR` | Optimized Server-Side Rendering (SSR) pipeline ensuring lightning-fast load times and accessible static assets. |

## 🛠️ Quick Start

Follow these instructions to spin up the development environment locally.

<details>
<summary><b>1. System Requirements</b></summary>
<br>

Ensure your local development environment meets the following specifications:
- **Node.js**: `v22.12.0` or higher.
- **Git**: Installed and configured.
- **Supabase**: An active Supabase project for the backend database.

</details>

<details>
<summary><b>2. Installation & Setup</b></summary>
<br>

Clone the repository and install the required dependencies:

```bash
# Clone the repository
git clone https://github.com/Riz6ix/MPK.git

# Navigate into the directory
cd MPK

# Install Node.js dependencies
npm install
```
</details>

<details>
<summary><b>3. Configuration (Environment Variables)</b></summary>
<br>

The application relies on Supabase for data handling. You must define your environment variables before running the server.

Create a `.env` file in the root directory:

```env
PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```
> **Security Note:** Never commit your `.env` file to version control. It is already included in `.gitignore`.
</details>

<details>
<summary><b>4. Running the Development Server</b></summary>
<br>

Initialize the Astro development server:

```bash
npm run dev
```
The server will start, and the application will be accessible at <samp>http://localhost:4321</samp>.
</details>

## ☁️ Deployment

This project is configured for continuous deployment out-of-the-box. 

By utilizing Netlify's GitHub integration, any commits pushed to the `main` branch will automatically trigger the build pipeline (`npm run build`) and deploy the `dist` artifact to production. No complex GitHub Actions workflows are required for basic hosting.

---
*Built with ❤️ for better student governance.*