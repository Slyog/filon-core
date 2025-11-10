# FILON

**FILON** is a visual knowledge system that lets you **think, learn, and plan through connected ideas**.  
It represents thoughts as interactive nodes, forming a living graph of knowledge.

> “The mind that visualizes itself.”

---

### ✨ What is FILON?

FILON combines **visual thinking**, **AI assistance**, and **knowledge organization**.  
It’s built to help creators, developers, and researchers link their ideas dynamically —  
not just store notes, but *see relationships* between them.

---

### 🧠 Core Features

- **Interactive Graph Canvas** powered by ReactFlow  
- **Autosave + Feedback System** (intelligent save states with toasts)  
- **Offline Storage** (localforage + IndexedDB)  
- **AI Co-Pilot Layer** *(coming soon)* for summaries & context linking  
- **Modular Architecture** – open-core with proprietary extensions  

---

### 🧩 Tech Stack

Next.js 14  ·  React 18  ·  TailwindCSS  ·  TypeScript  ·  Prisma  ·  ReactFlow  

---

### ⚙️ Development Setup

```bash
npm install
npx prisma generate
npm run dev
```

Environment:

```
DATABASE_URL="file:./prisma/dev.db"
```

---

### ✅ QA Stabilization & CI Workflow

Use the bundled script to self-heal dependencies, execute the Playwright sweep headlessly, and repair QA reports:

```bash
./scripts/qa-stabilize.sh
```

The script automatically:

- Switches `npm install` to `--legacy-peer-deps` and stubs the optional `filon-proprietary` workspace.
- Installs Chromium for Playwright and runs `npm run qa:all` (with a retry of failed specs only).
- Sanitizes JSON output under `qa-output/` and `qa/reports/`, patching missing meta fields.

For long-running QA inside SSH/EC2, prefer a screen session:

```bash
screen -S filon-qa
./scripts/qa-stabilize.sh
# Detach with Ctrl+A, then D. Reattach via:
screen -r filon-qa
```

---

### 📜 License

FILON Core is licensed under the GNU GPL v3.0.
You may use, modify and redistribute the core under the same license terms.
Commercial and closed-source modules (Proprietary Layer) are not covered by this license.

---

### 🧩 Status

Active development – Alpha build.
Core is open; advanced AI and collaboration layers will launch as proprietary extensions.

---

### 🌐 Links

Repo: github.com/Slyog/filon-core

