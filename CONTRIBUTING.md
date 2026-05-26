# Contributing to MPK Governance Platform

First off, thank you for considering contributing to the MPK project! It's people like you that make this platform a powerful tool for student governance.

## 🚀 How to Contribute

### 1. Reporting Anomalies (Bugs)
If you encounter a bug or unexpected behavior, please open an issue using the `Bug Report` template. 
- Ensure the bug hasn't already been reported by searching existing issues.
- Provide clear steps to reproduce and system telemetry.

### 2. Suggesting Architectural Changes (Features)
For new features or architectural improvements, please open an issue using the `Feature Proposal` template.
- Clearly define the pain point and how your proposed architecture solves it.
- Wait for a maintainer to approve the concept before writing code to ensure it aligns with the project's vision.

### 3. Submitting Pull Requests
1. **Fork** the repository and create your branch from `main`.
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Commit** your changes following [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `chore:` for tooling or configuration changes
3. **Test** your changes locally. Run `npm run build` to ensure the SSR build passes without errors.
4. **Push** to your fork and submit a Pull Request using the provided PR template.

## 💻 Development Standards
- **Component Architecture:** We use React and Astro components. Keep components modular and focused on a single responsibility.
- **Styling:** We enforce utility-first styling using Tailwind CSS. Avoid writing custom CSS files unless absolutely necessary.
- **Types:** If migrating to strict TypeScript, ensure interfaces and types are properly exported and utilized.

*By contributing to this repository, you agree to abide by our Code of Conduct and license your work under the MIT License.*