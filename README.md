<div align="center">
  <img src="public/images/Logo_MPK.jpeg" alt="MPK Logo" width="150"/>
  <h1>Website Majelis Perwakilan Kelas SMA</h1>
  <p><strong>A modern, interactive platform for Student Council (MPK) management.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Astro-FF5D01?style=for-the-badge&logo=astro&logoColor=white" alt="Astro" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify" />
  </p>
</div>

---

## 🌟 Key Features

- 📝 **Aspirasi Form:** Allow students to easily submit aspirations and feedback.
- 🎓 **Alumni Table:** Maintain records of alumni and past council members.
- 🏫 **Class Manager:** Efficiently organize and manage class data.
- ⚡ **Lightning Fast:** Built with Astro for optimal performance.

## 🗂️ Project Structure

```text
/
├── public/          # Static assets (images, favicons)
│   └── images/
├── src/             # Application source code
│   ├── components/  # React/Astro UI components
│   ├── layouts/     # Page layouts
│   ├── lib/         # Utility functions (Supabase, Security)
│   ├── pages/       # File-based routing
│   └── styles/      # Global CSS (Tailwind)
├── supabase/        # Database migrations
├── astro.config.mjs # Astro configuration
├── netlify.toml     # Netlify deployment configuration
└── package.json     # Dependencies & Scripts
```

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v22.12.0 or higher recommended)
- A Supabase account for backend services

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd WEB-MPK
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   Your site will be available at `http://localhost:4321`

## ☁️ Deployment (Cozy Deploy to Netlify)

This project is configured for seamless deployment to Netlify via GitHub.

1. Push your code to a GitHub repository.
2. Log in to [Netlify](https://app.netlify.com/) and click **"Add new site" -> "Import an existing project"**.
3. Select your GitHub repository.
4. Netlify will automatically detect the `netlify.toml` configuration (Build command: `npm run build`, Publish directory: `dist`).
5. Click **"Deploy site"**. Every future push to the `main` branch will automatically trigger a new deployment!