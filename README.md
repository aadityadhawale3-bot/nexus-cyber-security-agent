# 🛡️ N.E.X.U.S — Cyber Security AI Agent

**N.E.X.U.S** (Network Examination & eXensible Security Agent) is a Python and Next.js-based intelligent cyber security assistant. Built in **VS Code** using the **Google GenAI SDK** (Gemini API), this agent safely scans source code to detect exposed API keys, credentials, and software vulnerabilities, managed through an immersive 3D user interface.

---

## 🚀 Project Overview
* **Project Name:** N.E.X.U.S
* **Development Environment:** VS Code (Visual Studio Code)
* **Development Status:** 🛠️ In Progress / Active Development
* **Target Evaluation:** Kyoto University of Advanced Science (KUAS) Portfolio

---

## 🔮 N.E.X.U.S. Orb UI

> 🔮 This is the open-source **interface** of [N.E.X.U.S.]() by **Mr. Aaditya Dhavale Sir** — AI that talks in real time and controls systems and devices autonomously.

![N.E.X.U.S. orb UI](docs/screenshot.png)

### Getting started

```bash
npm install
npm run dev
```

On Windows, you can also simply double-click or run:
```cmd
run.bat
```

Open [http://localhost:3000](http://localhost:3000).

### Controls

#### Mouse / touch

| Input | Action |
| --- | --- |
| Drag | Spin the orb |
| Scroll / pinch | Zoom in & out |

#### Voice & Hands-Free

- Click the **Holographic Mic** at the bottom center or enable **AUTO-LISTEN** for hands-free JARVIS operation.
- Speak in **English, Marathi (मराठी), Hindi (हिन्दी)** or any supported language.
- Solve queries across 7 core domains: Coding, Dev Architecture, Education, Health, Life, Society, and Daily Problems.
- Issue local device directives to open apps (VS Code, WhatsApp, PowerShell), search the web (Google, Amazon, Flipkart, YouTube, GitHub), or generate presentations and spreadsheets.

#### Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` | Toggle Voice Recognition |
| `T` | Toggle Terminal Protocol Drawer |
| `R` | Reset 3D camera view |
| `+` / `−` | Zoom in / out |

---

## 🛠️ Technical Stack & Architecture

### Frontend Interface
- **`lib/orbScene.ts`** — High-definition cybernetic 3D orb rendered with Three.js, bold structural borders, subtle holographic bloom, sound reactivity, and camera controls.
- **`lib/voiceEngine.ts`** — Continuous Speech Recognition (STT), multilingual speech synthesis (TTS) with Indian voice routing for Marathi/Hindi, and audio energy analysis.
- **components/NexusOrb.tsx** — Central interactive HUD, streamlined bottom console, and protocol terminal.

### Backend Intelligence & Security
- **`lib/nexusAI.ts`** — Multilingual intelligence engine covering 7 multidisciplinary domains and fast conversational reasoning powered by Google Gemini API (`google-genai`).
- **`lib/systemBridge.ts`** — Windows OS automation bridge (PowerShell, App Launcher, Web & Office generation).
- **`main.py`** — Primary local backend scanner using `python-dotenv` to safely isolate secret API credentials from the codebase.

---

## ✨ Core Features (Under Development)
* **Code Leak Prevention:** Scans your VS Code workspace files to find and report accidentally exposed API keys or tokens.
* **Security Auditing:** Uses Google Gemini's reasoning capabilities to analyze local source code for common security bugs.
* **Multilingual JARVIS Protocol:** Fully understands and interacts autonomously via speech directives in English, Marathi, and Hindi.

---

## 🔒 License

MIT License — Copyright (c) 2026 Mr. Aaditya Dhavale Sir

