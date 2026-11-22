# AIbook — Literary Studio & AI Co-Authoring Workspace

A web app that helps you think, research, structure, and write your book alongside a multi-role AI Council.

## Features (Phase 1 — Static / Local-First MVP)

- **Hybrid Book Onboarding Wizard:** Choose from 12 curated genres or brainstorm freely with AI, customize typography & special elements (images, tables, footnotes, bibliography), and co-generate your book concept + chapter outline.
- **3-Column Editorial Studio:**
  - **Chapters & Book Bible:** Structured continuity memory (premise, characters/concepts, open threads, chapter summaries, saved research).
  - **Rich Markdown Editor:** Live split/preview modes, Markdown table builder, local image upload, optional AI image generation, and customizable book typography.
  - **Multi-Role AI Council:** 13 roles grouped into *Creation*, *Quality & Continuity*, and *Market & Audience* (Co-Author, Assistant, Researcher, Art Director, Editor, Continuity Guardian, Analyst, Reader, Buyer, Publisher, Critic, Marketer, Competitor). Supports **Single Role Chat**, **3 Next Direction Scenarios**, and **Ask the Council** (2–3 roles simultaneously).
- **Fresh Context Window per Chapter:** Each chapter runs with a clean context fed by the Book Bible, prior chapter summaries, and saved references.
- **Cross-Chapter Ripple Effect Checker:** Automatically runs when completing a chapter (or on demand) to detect impacts on other chapters and propose before/after updates requiring explicit user approval.
- **Research & Bibliography Hub:** Search competing books & scientific papers via **Open Library**, **Crossref**, and **OpenAlex**, save them to your Book Bible with APA citations, and run AI competitive/literature analysis.
- **Compile & Export:** Full-book preview, Markdown (`.md`) download, Print-to-PDF book layout, and AI Distribution & Evolution Plan.
- **Bilingual UI (EL / EN) & Warm Editorial Theme (Light / Dark).**
- **Local-First Storage:** Saved locally in browser `IndexedDB` with JSON backup export/import, plus BYOK (Bring Your Own Key) Gemini API support.

## Local Development

```bash
npm install
npm run dev
```

## Build & GitHub Pages Deployment

```bash
npm run build
```

Push to `main` and enable **Settings → Pages → Source: GitHub Actions** in your repository to automatically deploy via `.github/workflows/deploy.yml`.
