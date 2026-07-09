<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# External Accounts & Services

Inventory of cloud accounts, publish targets, and secrets used by Zombobs.  
Last reviewed: 2026-07-09.

Related docs: [SERVER_SETUP.md](./SERVER_SETUP.md) · [MONGODB.md](./MONGODB.md) · [SBOM.md](./SBOM.md) · [ITCH/DOCS/ITCH_IO_GUIDE.md](../ITCH/DOCS/ITCH_IO_GUIDE.md)

---

## Live infrastructure (need login)

| Service | Purpose | URLs / IDs | Secrets / notes |
|---------|---------|------------|-----------------|
| **MongoDB Atlas** | Persistent global highscores | Project/cluster: typically `Zombobs`. DB `zombobs`, collection `highscores`. Free **M0** tier. | Connection string → HF Space secret `MONGO_URI` (also accepts `MONGODB_URI`). Network Access must allow `0.0.0.0/0` (HF egress IPs are dynamic). Optional — server falls back to in-memory if unavailable. |
| **Hugging Face Spaces** | Production multiplayer + highscore API | Space: https://huggingface.co/spaces/OttertonDays/zombs · Client (Socket.IO): https://ottertondays-zombs.hf.space · Port **7860** | Settings → Secrets → `MONGO_URI`. Deploy from `huggingface-space-SERVER/` (Dockerfile + server.js + package.json at Space root). Use `.hf.space` URL in the game client (not the iframe wrapper). |
| **itch.io** | Browser HTML game distribution | https://otterdays.itch.io/zombobs · Account brand: OtterDays | Upload zip from `ITCH/build-itch.ps1` only (forward-slash paths). Guide: `ITCH/DOCS/ITCH_IO_GUIDE.md`. |
| **GitHub** | Source repo + GitHub Pages static host | Repo: https://github.com/AfyKirby1/Zombobs · Pages: https://afykirby1.github.io/Zombobs/ · Releases: https://github.com/AfyKirby1/Zombobs/releases | Pages via `.github/workflows/deploy-pages.yml` (push to `main`). No game secrets in repo. |

---

## Local / tooling (no cloud game account)

| Tool | Purpose | Notes |
|------|---------|-------|
| **npm** | Server + mobile deps | `LOCAL_SERVER/`, `huggingface-space-SERVER/`, `mobile/` only. Frontend game has zero npm runtime deps. |
| **Android Studio + JDK 17/19** | Capacitor Android builds | `cd mobile && npm run sync:web` then `npx cap open android`. Gradle 8.13. No Play Store listing documented. |
| **LOCAL_SERVER** | Dev multiplayer on port 3000 | No MongoDB by default; can set `MONGO_URI` optionally. |

---

## Community (optional)

| Service | Purpose | Notes |
|---------|---------|-------|
| **Discord** | Community invite (itch dev log) | https://discord.gg/hv9ZBbQV — not wired into game runtime. |

---

## Not accounts (bundled / no login)

| Resource | Status |
|----------|--------|
| **Google Fonts** | Vendored under `assets/fonts/` — no runtime Google account. |
| **Socket.IO client** | Vendored at `js/vendor/socket.io.min.js` (avoids itch CSP blocking CDN). |

---

## Mentioned but not set up

| Platform | Status |
|----------|--------|
| **Steam** | License / roadmap only — no Steamworks account in docs. |
| **Google Play** | Capacitor Android wrapper exists; no store listing documented. |

---

## Secret checklist

1. **MongoDB Atlas** — create DB user + connection string (`mongodb+srv://...`).
2. **Hugging Face Space** → Settings → Secrets → `MONGO_URI` = that string (password URL-encoded if needed).
3. Never commit connection strings, HF tokens, or itch API keys into the repo.
4. After rotating Atlas password, update the HF secret and restart/redeploy the Space.

---

## Owner / brand aliases (docs)

- GitHub: **AfyKirby1**
- itch / HF Space org naming: **OtterDays** / **OttertonDays**
- Legal: AfyKirby1 (OtterDays) — see `LEGAL/LICENSE.md`
