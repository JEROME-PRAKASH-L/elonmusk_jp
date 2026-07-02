# Jerome Prakash L — Terminal Portfolio

A single-page developer portfolio styled as a **terminal / file-system OS**.
Built from my résumé. Pure HTML + CSS + JavaScript — **no build step, no dependencies**,
so it drops straight onto GitHub Pages, Netlify, Vercel, or any static host.

```
~/jerome
 > whoami        about + focus areas
 > experience    timeline
 > projects      AI Daily Inbox Recap · OpenClaw
 > skills        skills.json
 > education      DMI College of Engineering
 > certs         certifications
 > writing       LinkedIn / building in public
 > contact       email · phone · linkedin
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup + all content (incl. JSON-LD structured data) |
| `styles.css` | Theme, layout, responsive, terminal aesthetic |
| `script.js`  | Active-nav, theme toggle, typed name, interactive console |
| `404.html`   | Terminal-styled "file not found" page (GitHub Pages picks it up automatically) |
| `robots.txt` / `sitemap.xml` | Crawler hints for search engines |
| `Jerome_Prakash_L_Resume.pdf` | Linked from the sidebar (`↓ resume.pdf`) |

## Features

- **Click *or* type to navigate.** Sidebar links work with zero typing; the
  command line (`help`, `ls`, `open projects`, `skills`, `resume`, `theme`,
  `neofetch`, …) is an optional delight layer — with Tab completion, ↑/↓
  history browsing, and a `history` command.
- **Two themes** — phosphor green (default) and amber — toggle in the title bar,
  remembered via `localStorage`.
- **Accessible & responsive** — semantic landmarks, keyboard focus rings, a skip
  link, AA-contrast colors, and honors `prefers-reduced-motion` / `prefers-contrast`.
  Collapses to a top nav bar on phones.
- **Progressive enhancement** — every section is in the HTML and reachable by
  scroll/click even if JavaScript never loads.

## Run locally

Just open `index.html` in a browser. For the résumé link and fonts to behave
exactly like production, serve it:

```bash
# any one of these
python -m http.server 8000
npx serve .
```

Then visit <http://localhost:8000>.

## Deploy to GitHub Pages

This repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`) that
publishes the site automatically on every push to `main` — no build step.

1. Push these files to a repo (e.g. `jerome-portfolio`).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main` (or run the workflow manually from the **Actions** tab). The
   site goes live at `https://<your-username>.github.io/<repo>/`.

A `.nojekyll` file is included so GitHub serves every asset as-is (no Jekyll
processing).

## Customize

- **Content** lives in `index.html` — edit the text directly.
- **Colors / fonts** are CSS variables at the top of `styles.css` (`:root`).
- **Project links:** each project card has a commented `project__links` row —
  add your repo / live-demo URLs and uncomment to show `code →` / `demo →`.
- **Social preview:** `og-image.png` (1200×630) is exported from `og-image.svg`
  and wired up in `index.html`'s `<head>`. If you edit the SVG, re-export the
  PNG (e.g. `rsvg-convert og-image.svg -o og-image.png` or a headless-browser
  screenshot) so the two stay in sync.
- **Console commands** are in the `consoleApp()` function in `script.js`.

---

Built as a terminal — `view-source` welcome.
