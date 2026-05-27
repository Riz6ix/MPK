<div align="center">
  <br />
  <a href="https://github.com/Riz6ix/MPK">
    <img src="public/images/Logo_MPK.jpeg" alt="MPK Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(74, 85, 69, 0.3); border: 2px solid #e2ebd9;" />
  </a>
  <br />
  <br />

  <h1>🍂 MAJELIS PERWAKILAN KELAS 🍃</h1>
  <p><sub>SMA Negeri 1 Malingping</sub></p>

  <p>
    <strong>A simple, cozy, and highly secure student governance portal.</strong>
    <br />
    <em>Friendly user experience · optimized database queries · tight privacy protection</em>
  </p>

  <p>
    <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-FF5D01?style=flat-square&logo=astro&logoColor=white" alt="Astro" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  </p>

  <p>
    <kbd> <a href="README.md">🌐 English</a> </kbd> • <kbd> <a href="README.id.md">🇮🇩 Bahasa Indonesia</a> </kbd>
  </p>
</div>

---

### ✦ 🍃 Cozy & Warm UI/UX

*Designed with a welcoming, natural interface for school-friendly engagement:*

- 🌿 **Warm Colors** — Soft forest greens, warm amber accents, and clean parchment backdrops
- 🍂 **Smooth Transitions** — Natural animations on accordion panels and dropdowns for a cozy feel
- ✨ **Floating Gold Dust** — Subtle Minecraft-inspired gold dust drifting gently in the background

---

### ✦ 🕸️ The Roots (Relational Data Flow)

*All student data flows seamlessly through interconnected database relations:*

```mermaid
flowchart LR
    classDef default fill:#faf6f0,stroke:#2e473b,stroke-width:2px,color:#2e473b

    A[🗳 Student Voice] --> B[🏛 Class Directory]
    B <--> C[👥 Active Council]
    C <--> D[🌿 Role Hierarchy]
```

- 🌱 **Automatic Sorting** — Aspirations are auto-sorted under classes and linked to active rosters
- 📜 **Alumni Directory** — Senior and purna-tenure records are automatically preserved in dedicated tables

---

### ✦ ⚡ Smart Admin Desk

*Functional tools built to simplify student council operations:*

- 📋 **Smart List Import** — Simply paste raw rosters; the system auto-parses name, class, commission, gender, and seeds avatars
- 🔏 **Developer Constraint** — Built-in database rule locks the **"Developer"** role exclusively to **Rizky Setiawan**
- 📎 **Cozy Notes & Quotes** — Interactive board for sticky notes and a wisdom quote generator

---

### ✦ 🛡️ Security & Privacy Shield

*Ensuring student voices are sent safely with multi-layered backend protection:*

```mermaid
flowchart TD
    classDef default fill:#faf6f0,stroke:#2e473b,stroke-width:2px,color:#2e473b
    classDef safe fill:#eef7e8,stroke:#4a7c59,stroke-width:2px,color:#2e473b
    classDef block fill:#fdf0f0,stroke:#c05c5c,stroke-width:2px,color:#803030
    classDef dec fill:#fffdf3,stroke:#c5a880,stroke-width:2px,color:#4a3b2f

    A[🗳 Student Voice] --> B{🕸 Honeypot OK?}:::dec
    B -- Bot --> C[🍂 Dropped]:::block
    B -- Human --> D{⏳ Device Cooldown?}:::dec
    D -- Locked --> E[💤 Rest]:::block
    D -- Free --> F{🌲 IP Limit OK?}:::dec
    F -- Exceeded --> G[🛡 Sentinel Hold]:::block
    F -- Allowed --> H[🍃 Stored Safely]:::safe
```

- 🕷️ **Honeypot Trap** — Hidden input fields capture and discard spam bots silently
- ⏱️ **Rate Limiting** — Smart post-per-hour limit and device cooldown to prevent database flooding
- 🧱 **PostgreSQL RLS** — Secure Row-Level Security active on all core database tables

---

### 🚀 Developer Setup

```bash
# Clone and install dependencies
git clone https://github.com/Riz6ix/MPK.git && cd MPK && npm install

# Add your credentials to .env
echo 'PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="your-anon-key"' > .env

# Run local dev server
npm run dev
```
> Open [http://localhost:4321](http://localhost:4321) · requires Supabase credentials

---
<div align="center">
  <sub>Developed with dedication by <strong>Angkatan Primordial</strong> · SMAN 1 Malingping</sub>
</div>