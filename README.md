# 🛡️ N.E.X.U.S — Cyber Security AI Agent

<p align="center">
  <strong>Network Examination & eXtensible Security Agent</strong>
</p>

<p align="center">
  <img src="https://shields.io" alt="Development Status">
  <img src="https://shields.io" alt="License">
  <img src="https://shields.io" alt="Platform">
</p>

<p align="center">
  <img src="./Screenshot.%20PNG.png" alt="N.E.X.U.S Orb UI Live Showcase" width="900">
</p>

---

## 🚀 Project Overview

**N.E.X.U.S** is an intelligent cyber security assistant built with Python and Next.js using the **Google GenAI SDK (Gemini API)**. It scans local source code for exposed credentials and vulnerabilities via a beautifully rendered cybernetic 3D orb interface, developed by **Mr. Aaditya Dhavale Sir** for the **Kyoto University of Advanced Science (KUAS) Portfolio**.

---

## 🔮 Core Features

* **Code Leak Prevention:** Scans local project workspaces for accidentally exposed API keys, tokens, and credentials.
* **Security Auditing:** Leverages Gemini's advanced semantic reasoning to parse source code files for logical vulnerabilities and security bugs.
* **Global JARVIS Voice Protocol:** Interacts natively via speech directives across **9 major languages**:
  * *Regional:* English, Marathi (मराठी), Hindi (हिन्दी)
  * *International:* Japanese (日本語), Chinese (中文), Korean (한국어), Russian (Русский), Portuguese (Português), French (Français)
* **OS Automation Bridge:** Safely triggers local automation scripts to open apps (VS Code, WhatsApp, PowerShell), search web platforms, or generate office spreadsheets and presentations.

---

## 🧠 The 7 Core Multi-Disciplinary Domains

The agent handles cross-functional logic and processes data stream tracks via the **BRAIN (7)** configuration:

1. **💻 Coding:** Deep static analysis, syntax optimization, refactoring, and secure code generation.
2. **🏗️ Dev Architecture:** System design orchestration, microservices blueprinting, and CI/CD pipelines.
3. **🎓 Education:** Smart portfolio evaluation pipelines and targeted learning modules tailored for academic assessment.
4. **🏥 Health:** General informational synthesis regarding engineering wellness and cognitive safety protocols.
5. **🌱 Life:** Productivity tracking, daily scheduling optimizations, and smart home workspace management.
6. **🌐 Society:** AI ethics guidelines, open-source compliance standards, and digital equity analysis.
7. **🛠️ Daily Problems:** Fast automation workflows for hardware troubleshooting, local OS bugs, and productivity obstacles.

---

## 🛠️ Technical Stack & Architecture

* **Frontend HUD:** Three.js 3D orb (`lib/orbScene.ts`), continuous multilingual Speech-to-Text/TTS engine with custom VAD (`lib/voiceEngine.ts`), and real-time environment HUD consoles (`components/NexusOrb.tsx`).
* **Backend Engines:** Deep-reasoning python cores (`agent_brain.py` / `security_brain.py`), secure environment isolation (`.env`), and Next.js local system pipelines (`lib/systemBridge.ts`).

---

## 💻 Getting Started

### 1. Frontend Setup
```bash
# Clone the repository
git clone https://github.com
cd nexus-cyber-security-agent

# Install dependencies
npm install

# Start the local development server
npm run dev
```

### 2. Python Backend Setup
The local security intelligence core requires Python 3.10+.
```bash
# Install required dependencies
pip install google-genai python-dotenv

# Configure environment keys
# Copy .env.example to .env and append your credentials:
# GEMINI_API_KEY=your_api_key_here
```

### 3. Execution
On Windows environments, boot the system components simultaneously by running:
```bash
run.bat
```
Navigate your browser to [http://localhost:3000](http://localhost:3000).

---

## 🕹️ Controls & Navigation

### Mouse & Touch
* **Drag:** Spin the 3D cybernetic orb scene.
* **Scroll / Pinch:** Dynamic camera zoom in & out.

### Keyboard Shortcuts
* <kbd>Space</kbd> / <kbd>V</kbd> — Toggle Voice Recognition (Auto-Listen Protocol)
* <kbd>T</kbd> — Open Chat Box Terminal Drawer
* <kbd>Esc</kbd> — Mute / Cancel operation
* <kbd>R</kbd> — Reset 3D camera default coordinates
* <kbd>+</kbd> / <kbd>−</kbd> — Manual zoom controls

---

## 🔒 License

Distributed under the MIT License. Copyright © 2026 **Mr. Aaditya Dhavale Sir**.
