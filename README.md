<div align="center">
  <br />
  <a href="https://github.com/Riz6ix/MPK">
    <img src="public/images/Logo_MPK.jpeg" alt="MPK Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(74, 85, 69, 0.3); border: 2px solid #e2ebd9;" />
  </a>
  <br />
  <br />

  <h1>🌲 Majelis Perwakilan Kelas 🍂</h1>
  <p>🏛️ <em>SMA Negeri 1 Malingping</em></p>

  <p>
    <strong>A sanctuary for student governance — warm forest aesthetics, high-performance engineering.</strong>
    <br />
    <em>Whispering relational roots · sub-millisecond queries · sentinel-shielded privacy</em>
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

### ✦ 🍃 The Forest Academy & Parchment Aesthetics

*Crafted with visual psychology for warmth, calm, and natural engagement:*

- 🌿 **Warm Forest Canvas** — Deep forest green `#2e473b`, soft amber accents, warm parchment backdrops
- 🍂 **Fluid Leaf Transitions** — Smooth accordion panels and dropdowns that feel like rustling leaves
- ✨ **Suspended Gold Dust** — Pixelated Minecraft-inspired gold particles drifting gently in the background

---

### ✦ 🕸️ The Whispering Roots (Relational Architecture)

*Student voices flow through interconnected roots — like a living forest data tree:*

```mermaid
flowchart LR
    classDef default fill:#faf6f0,stroke:#2e473b,stroke-width:2px,color:#2e473b

    A[🗳 Student Voice] --> B[🏛 Class Directory]
    B <--> C[👥 Active Council]
    C <--> D[🌿 Role Hierarchy]
```

- 🌱 **Living Root Sync** — Aspirations auto-filed under class directories, bound to active rosters in real-time
- 📜 **Ancient Archives** — Alumni and purna-tenure records preserved in a dedicated relational node

---

### ✦ ⚡ The Oak Desk (Smart Admin Tools)

- 📋 **Smart Quill Import** — Paste raw rosters; system auto-parses class, commission, gender & seeds Dicebear avatars
- 🔏 **Royal Seal Lock** — Database-level constraint pins **"Developer"** exclusively to **Rizky Setiawan** *(Angkatan Primordial)*
- 📎 **Parchment Memos** — Local-storage sticky notes & a daily leadership quote widget

---

### ✦ 🛡️ The Oak Sentinel (Privacy & Access Shield)

*Every student voice passes through three guardian gates before reaching the roots:*

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

- 🕷️ **Honeypot Spiderweb** — Hidden fields silently catch and drop spam bots
- ⏱️ **Friendly Rate Limit** — 5 posts/hour per IP, 1-hour device cooldown; gentle on shared school Wi-Fi
- 🧱 **Stone Wall RLS** — Full Postgres Row-Level Security on all 7 core tables

---

### 🚀 Lighting the Lanterns *(Developer Setup)*

```bash
# Clone & install
git clone https://github.com/Riz6ix/MPK.git && cd MPK && npm install

# Add credentials to .env
echo 'PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="your-anon-key"' > .env

# Start local dev server
npm run dev
```
> Open [http://localhost:4321](http://localhost:4321) · requires Supabase project credentials

---
<div align="center">
  <sub>Developed with sustainable dedication by <strong>Angkatan Primordial</strong> · All Rights Reserved</sub>
</div>