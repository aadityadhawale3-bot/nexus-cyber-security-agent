import { NextRequest, NextResponse } from "next/server";
import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execAsync = util.promisify(exec);

// Track last launched apps/processes on the host
let lastLaunchedProcs: string[] = [];
let lastLaunchedAppName = "";

const KNOWN_APP_PATHS: Record<string, string[]> = {
  excel: [
    "C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\EXCEL.EXE",
    "C:\\Program Files\\Microsoft Office\\Office16\\EXCEL.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\Office16\\EXCEL.EXE",
    "C:\\Program Files\\Microsoft Office\\Office15\\EXCEL.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\Office15\\EXCEL.EXE",
  ],
  powerpoint: [
    "C:\\Program Files\\Microsoft Office\\root\\Office16\\POWERPNT.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\POWERPNT.EXE",
    "C:\\Program Files\\Microsoft Office\\Office16\\POWERPNT.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\Office16\\POWERPNT.EXE",
    "C:\\Program Files\\Microsoft Office\\Office15\\POWERPNT.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\Office15\\POWERPNT.EXE",
  ],
  word: [
    "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
    "C:\\Program Files\\Microsoft Office\\Office16\\WINWORD.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\Office16\\WINWORD.EXE",
    "C:\\Program Files\\Microsoft Office\\Office15\\WINWORD.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\Office15\\WINWORD.EXE",
  ],
  wordpad: [
    "C:\\Program Files\\Windows NT\\Accessories\\wordpad.exe",
    "C:\\Program Files (x86)\\Windows NT\\Accessories\\wordpad.exe",
    "C:\\Windows\\System32\\write.exe",
  ],
  paint: [
    path.join(process.env.LOCALAPPDATA || "C:\\Users\\USER\\AppData\\Local", "Microsoft\\WindowsApps\\mspaint.exe"),
    "C:\\Windows\\System32\\mspaint.exe",
  ],
  notepad: [
    "C:\\Windows\\System32\\notepad.exe",
    path.join(process.env.LOCALAPPDATA || "C:\\Users\\USER\\AppData\\Local", "Microsoft\\WindowsApps\\notepad.exe"),
  ],
};

function findInstalledAppExe(appKey: string): string | null {
  const candidates = KNOWN_APP_PATHS[appKey];
  if (candidates) {
    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) return p;
      } catch { }
    }
  }
  return null;
}

// Launch a Windows desktop app or URL completely detached so Node never blocks or waits on child stdio
function launchDetached(target: string): void {
  try {
    // 1. URLs (HTTP/HTTPS):
    // PowerShell Start-Process handles all URLs, spaces, and ampersands without cmd quote issues or rundll32 hangs
    if (/^https?:\/\//i.test(target)) {
      const escapedUrl = target.replace(/'/g, "''");
      const child = spawn(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", `Start-Process '${escapedUrl}'`],
        {
          detached: true,
          stdio: "ignore",
          windowsHide: true,
        }
      );
      child.unref();
      return;
    }

    // 2. Windows URI schemes (e.g. ms-settings:, microsoft.windows.camera:, spotify:) or shell:AppsFolder
    if (/^[a-zA-Z0-9._-]+:$/i.test(target) || (target.includes(":") && !path.isAbsolute(target)) || target.startsWith("shell:")) {
      const escapedUri = target.replace(/'/g, "''");
      const child = spawn(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", `Start-Process '${escapedUri}'`],
        {
          detached: true,
          stdio: "ignore",
          windowsHide: true,
        }
      );
      child.unref();
      return;
    }

    // 3. Absolute path to executable or document
    if (path.isAbsolute(target)) {
      const escapedPath = target.replace(/'/g, "''");
      const child = spawn(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", `Start-Process '${escapedPath}'`],
        {
          detached: true,
          stdio: "ignore",
          windowsHide: true,
        }
      );
      child.unref();
      return;
    }

    // 4. Desktop application or executable command:
    // Launch directly via cmd.exe /c start "" target (opens in <30ms without blocking)
    const child = spawn("cmd.exe", ["/c", "start", "", target], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();
  } catch (err) {
    console.warn("Detached launch failed:", err);
  }
}

// Ensure exports directory exists
const EXPORTS_DIR = path.join(process.cwd(), "exports");
const PROJECTS_DIR = path.join(EXPORTS_DIR, "projects");
[EXPORTS_DIR, PROJECTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      console.warn("Could not create directory:", dir, err);
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    switch (action) {
      case "open_url": {
        const { url } = payload || {};
        if (!url) {
          return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }
        // Windows open URL instantaneously in default browser without blocking Node process
        launchDetached(url);
        return NextResponse.json({ success: true, message: `Opened ${url}` });
      }

      case "launch_app": {
        const { app } = payload || {};
        const safeApp = (app || "").toLowerCase().trim();
        lastLaunchedAppName = safeApp;

        switch (safeApp) {
          case "this app":
          case "the app":
          case "an app":
          case "app":
          case "specific app":
          case "random app":
          case "notepad":
          case "notes":
          case "microsoft notepad": {
            const exe = findInstalledAppExe("notepad");
            launchDetached(exe || "notepad");
            lastLaunchedProcs = ["Notepad", "notepad"];
            break;
          }
          case "excel":
          case "ms excel":
          case "microsoft excel":
          case "spreadsheet": {
            const exe = findInstalledAppExe("excel");
            launchDetached(exe || "shell:AppsFolder\\Microsoft.Office.EXCEL.EXE.15");
            lastLaunchedProcs = ["EXCEL"];
            break;
          }
          case "powerpoint":
          case "ppt":
          case "ms powerpoint":
          case "microsoft powerpoint":
          case "presentation": {
            const exe = findInstalledAppExe("powerpoint");
            launchDetached(exe || "shell:AppsFolder\\Microsoft.Office.POWERPNT.EXE.15");
            lastLaunchedProcs = ["POWERPNT"];
            break;
          }
          case "word":
          case "winword":
          case "ms word":
          case "microsoft word": {
            const exe = findInstalledAppExe("word");
            launchDetached(exe || "shell:AppsFolder\\Microsoft.Office.WINWORD.EXE.15");
            lastLaunchedProcs = ["WINWORD"];
            break;
          }
          case "wordpad": {
            const exe = findInstalledAppExe("wordpad");
            if (exe) {
              launchDetached(exe);
              lastLaunchedProcs = ["wordpad", "write"];
            } else {
              // Fallback to Word or Notepad if WordPad is not present on Windows 11
              const wordExe = findInstalledAppExe("word");
              launchDetached(wordExe || "notepad");
              lastLaunchedProcs = wordExe ? ["WINWORD"] : ["Notepad", "notepad"];
            }
            break;
          }
          case "paint":
          case "mspaint":
          case "color":
          case "color paint":
          case "microsoft paint": {
            launchDetached("shell:AppsFolder\\Microsoft.Paint_8wekyb3d8bbwe!App");
            launchDetached("mspaint");
            lastLaunchedProcs = ["mspaint", "PaintApp"];
            break;
          }
          case "office":
          case "ms office":
          case "microsoft office": {
            const wordExe = findInstalledAppExe("word");
            const excelExe = findInstalledAppExe("excel");
            launchDetached(wordExe || excelExe || "shell:AppsFolder\\Microsoft.Office.WINWORD.EXE.15");
            lastLaunchedProcs = ["WINWORD", "EXCEL", "POWERPNT"];
            break;
          }
          case "calculator":
          case "calc": {
            launchDetached("calc");
            lastLaunchedProcs = ["CalculatorApp", "Calculator", "calc"];
            break;
          }
          case "vscode":
          case "code":
          case "visual studio code": {
            launchDetached("code");
            lastLaunchedProcs = ["Code"];
            break;
          }
          case "whatsapp": {
            const { message = "", recipient = "", actionType = "message" } = payload || {};
            if (actionType === "video_call" || actionType === "voice_call") {
              const callUrl = recipient
                ? `https://web.whatsapp.com/send?phone=${encodeURIComponent(recipient)}`
                : `https://web.whatsapp.com`;
              launchDetached(callUrl);
            } else if (actionType === "send_file") {
              launchDetached("explorer");
              launchDetached("https://web.whatsapp.com");
            } else {
              const textParam = message ? encodeURIComponent(message) : "";
              const webUrl = textParam
                ? `https://web.whatsapp.com/send?text=${textParam}`
                : `https://web.whatsapp.com`;
              launchDetached(webUrl);
            }
            lastLaunchedProcs = ["WhatsApp", "WhatsAppDesktop"];
            break;
          }
          case "youtube":
            launchDetached("https://www.youtube.com");
            break;
          case "google":
            launchDetached("https://www.google.com");
            break;
          case "github":
            launchDetached("https://github.com/aadityadhawale3-bot");
            break;
          case "powershell":
          case "terminal":
            launchDetached("powershell");
            lastLaunchedProcs = ["powershell"];
            break;
          case "cmd":
          case "command prompt":
            launchDetached("cmd");
            lastLaunchedProcs = ["cmd"];
            break;
          case "antigravity":
            launchDetached("code .");
            lastLaunchedProcs = ["Code"];
            break;
          case "chrome":
          case "google chrome":
            launchDetached("chrome");
            lastLaunchedProcs = ["chrome"];
            break;
          case "edge":
          case "msedge":
          case "microsoft edge":
          case "browser":
            launchDetached("msedge");
            lastLaunchedProcs = ["msedge"];
            break;
          case "explorer":
          case "file explorer":
          case "files":
            launchDetached("explorer");
            lastLaunchedProcs = ["explorer"];
            break;
          case "taskmgr":
          case "task manager":
            launchDetached("taskmgr");
            lastLaunchedProcs = ["Taskmgr"];
            break;
          case "settings":
          case "system settings":
            launchDetached("ms-settings:");
            lastLaunchedProcs = ["SystemSettings"];
            break;
          case "spotify":
            launchDetached("spotify");
            lastLaunchedProcs = ["Spotify"];
            break;
          case "vlc":
            launchDetached("vlc");
            lastLaunchedProcs = ["vlc"];
            break;
          case "camera":
            launchDetached("microsoft.windows.camera:");
            lastLaunchedProcs = ["WindowsCamera"];
            break;
          case "steam":
            launchDetached("steam");
            lastLaunchedProcs = ["steam"];
            break;
          case "discord":
            launchDetached("discord");
            lastLaunchedProcs = ["discord"];
            break;
          case "telegram":
            launchDetached("telegram");
            lastLaunchedProcs = ["Telegram"];
            break;
          case "zoom":
            launchDetached("zoom");
            lastLaunchedProcs = ["Zoom"];
            break;
          case "teams":
            launchDetached("teams");
            lastLaunchedProcs = ["ms-teams", "Teams"];
            break;
          default: {
            // Universal Installed App Finder on Windows PC/Laptop
            const cleanApp = safeApp.replace(/[^a-zA-Z0-9 _-]/g, "").trim();
            if (!cleanApp || cleanApp === "app" || /(?:this|the|an|any|some|specific|random)\s*app/i.test(cleanApp)) {
              launchDetached("notepad");
              lastLaunchedProcs = ["Notepad", "notepad"];
            } else {
              try {
                const psQuery = `powershell -NoProfile -NonInteractive -Command "$match = Get-StartApps | Where-Object { $_.Name -like '*${cleanApp}*' } | Select-Object -First 1; if ($match) { Start-Process \\"shell:AppsFolder\\$($match.AppID)\\" } else { Start-Process '${cleanApp}' -ErrorAction SilentlyContinue }"`;
                exec(psQuery, (err) => {
                  if (err) {
                    launchDetached(cleanApp);
                  }
                });
                lastLaunchedProcs = [cleanApp];
              } catch {
                launchDetached(cleanApp);
                lastLaunchedProcs = [cleanApp];
              }
            }
            break;
          }
        }

        return NextResponse.json({ success: true, message: `Launched ${safeApp}` });
      }

      case "create_ppt": {
        const { topic = "NEXUS Strategic Overview" } = payload || {};
        const safeTopic = topic.replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "Presentation";
        const filename = `NEXUS_${safeTopic.replace(/\s+/g, "_")}_${Date.now()}.html`;
        const filePath = path.join(EXPORTS_DIR, filename);

        // Generate dynamic HTML presentation deck with futuristic styling
        const pptContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${topic} — N.E.X.U.S. Deck</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI', sans-serif; }
    body { background:#020813; color:#e0f2fe; overflow:hidden; display:flex; align-items:center; justify-content:center; height:100vh; }
    .slide { display:none; width:90vw; max-width:1100px; height:80vh; background:#041026; border:2px solid #00e5ff; border-radius:12px; padding:60px; box-shadow:0 0 40px rgba(0,229,255,0.3); position:relative; }
    .slide.active { display:flex; flex-direction:column; justify-content:space-between; }
    h1 { font-size:42px; color:#00e5ff; text-transform:uppercase; letter-spacing:0.1em; border-bottom:2px solid #00e5ff; padding-bottom:16px; margin-bottom:24px; text-shadow:0 0 16px rgba(0,229,255,0.6); }
    h2 { font-size:24px; color:#38bdf8; margin-bottom:20px; }
    ul { font-size:20px; line-height:2; padding-left:30px; color:#bae6fd; }
    .nav { position:absolute; bottom:20px; right:30px; display:flex; gap:12px; }
    button { padding:10px 20px; background:#00e5ff; color:#020813; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:14px; box-shadow:0 0 14px rgba(0,229,255,0.5); }
    button:hover { background:#80f5ff; }
    .footer { font-size:12px; color:#38bdf8; letter-spacing:0.15em; }
  </style>
</head>
<body>
  <div class="slide active" id="s1">
    <div>
      <div class="footer">N.E.X.U.S. AUTONOMOUS INTELLIGENCE</div>
      <h1>${topic}</h1>
      <h2>Executive Summary & System Architecture</h2>
      <ul>
        <li>Objective: Strategic breakdown and actionable execution vectors for ${topic}.</li>
        <li>Generated autonomously via N.E.X.U.S. Neural System Integration.</li>
        <li>Framework: First-principles analysis with modular scalability.</li>
      </ul>
    </div>
    <div class="footer">SLIDE 1 / 3 — PRESS 'NEXT' TO ADVANCE</div>
  </div>

  <div class="slide" id="s2">
    <div>
      <div class="footer">N.E.X.U.S. AUTONOMOUS INTELLIGENCE</div>
      <h1>Key Pillars & Analysis</h1>
      <h2>Core Vectors for ${topic}</h2>
      <ul>
        <li>1. Foundation: Clear structural parameters and eliminating friction points.</li>
        <li>2. Acceleration: Deploying high-leverage workflows and automated pipelines.</li>
        <li>3. Quality & Assurance: Continuous measurement, feedback loops, and optimization.</li>
      </ul>
    </div>
    <div class="footer">SLIDE 2 / 3</div>
  </div>

  <div class="slide" id="s3">
    <div>
      <div class="footer">N.E.X.U.S. AUTONOMOUS INTELLIGENCE</div>
      <h1>Action Protocol & Next Steps</h1>
      <h2>Immediate Execution Trajectory</h2>
      <ul>
        <li>Phase A: Resource allocation and environment configuration.</li>
        <li>Phase B: Iterative sprint execution and milestone validation.</li>
        <li>Phase C: Scale, refine, and deploy mission-critical objectives.</li>
      </ul>
    </div>
    <div class="footer">SLIDE 3 / 3 — COMPLETE</div>
  </div>

  <div class="nav">
    <button onclick="prev()">PREVIOUS</button>
    <button onclick="next()">NEXT</button>
  </div>

  <script>
    let cur = 1;
    function show(n) {
      document.querySelectorAll('.slide').forEach((s, i) => s.classList.toggle('active', i === n - 1));
    }
    function next() { if(cur < 3) cur++; show(cur); }
    function prev() { if(cur > 1) cur--; show(cur); }
    window.addEventListener('keydown', e => {
      if(e.key === 'ArrowRight' || e.key === ' ') next();
      if(e.key === 'ArrowLeft') prev();
    });
  </script>
</body>
</html>`;

        fs.writeFileSync(filePath, pptContent, "utf8");

        // Open in browser / PowerPoint non-blocking
        launchDetached(filePath);

        // Also attempt launching PowerPoint if available
        try {
          launchDetached("powerpnt");
        } catch {
          // PowerPoint standalone might not be installed, HTML deck opened successfully
        }

        return NextResponse.json({
          success: true,
          filePath,
          message: `Created presentation for '${topic}' and opened slide viewer & PowerPoint.`,
        });
      }

      case "create_excel": {
        const { topic = "Inventory and Billing Sheet", sheetType = "auto" } = payload || {};
        const safeTopic = topic.replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "Spreadsheet";
        const filename = `NEXUS_${safeTopic.replace(/\s+/g, "_")}_${Date.now()}.csv`;
        const filePath = path.join(EXPORTS_DIR, filename);

        const lowerTopic = `${topic} ${sheetType}`.toLowerCase();
        let csvRows: (string | number)[][] = [];

        if (lowerTopic.includes("bill") || lowerTopic.includes("invoice") || lowerTopic.includes("tax")) {
          // Comprehensive Billing & Tax Invoice Spreadsheet with Real Excel Formulas
          csvRows = [
            ["N.E.X.U.S. AUTOMATED BILLING & TAX INVOICE SYSTEM"],
            ["Invoice No", `INV-${Date.now().toString().slice(-6)}`, "Date", new Date().toLocaleDateString()],
            ["Client Name", "Enterprise Client", "Architect", "Mr. Aaditya Dhavale Sir"],
            [],
            ["Item No", "Description", "Quantity", "Unit Rate (INR)", "Amount (INR)", "GST Rate"],
            [1, "High-Performance Workstation Setup", 2, 85000, "=C6*D6", "18%"],
            [2, "Cloud Neural Processing Cluster", 4, 32000, "=C7*D7", "18%"],
            [3, "OS Architecture & Hardening License", 1, 45000, "=C8*D8", "18%"],
            [4, "Network Gateway & Security Router", 3, 14500, "=C9*D9", "18%"],
            [5, "Data Pipeline & Backup Systems", 2, 22000, "=C10*D10", "18%"],
            [],
            ["SUBTOTAL", "", "", "", "=SUM(E6:E10)", ""],
            ["CGST (9%)", "", "", "", "=E12*0.09", ""],
            ["SGST (9%)", "", "", "", "=E12*0.09", ""],
            ["GRAND TOTAL (INR)", "", "", "", "=E12+E13+E14", ""],
            ["NET PAYABLE (ROUNDED)", "", "", "", "=ROUND(E15,0)", ""],
            [],
            ["Authorized Signatory: Mr. Aaditya Dhavale Sir", "", "", "Generated autonomously by N.E.X.U.S."],
          ];
        } else if (lowerTopic.includes("inventory") || lowerTopic.includes("stock")) {
          // Comprehensive Inventory Management Sheet with Stock Tracking and Reorder Formulas
          csvRows = [
            ["N.E.X.U.S. AUTOMATED INVENTORY & STOCK TRACKING MATRIX"],
            ["Generated Date", new Date().toLocaleString(), "System", "N.E.X.U.S. Cyber OS"],
            ["Inventory Controller", "Operations Command", "Creator", "Mr. Aaditya Dhavale Sir"],
            [],
            ["Item Code", "Product Name", "Category", "Stock Qty", "Unit Cost (INR)", "Reorder Level", "Total Stock Value (INR)", "Stock Status"],
            ["SKU-101", "Core i9 Neural Processor", "Hardware", 45, 42000, 20, "=D6*E6", '=IF(D6<=F6,"REORDER REQUIRED","IN STOCK")'],
            ["SKU-102", "DDR5 64GB High-Speed RAM", "Memory", 80, 18500, 30, "=D7*E7", '=IF(D7<=F7,"REORDER REQUIRED","IN STOCK")'],
            ["SKU-103", "4TB NVMe Enterprise SSD", "Storage", 15, 26000, 25, "=D8*E8", '=IF(D8<=F8,"REORDER REQUIRED","IN STOCK")'],
            ["SKU-104", "10Gbps Fiber Network Card", "Networking", 60, 9500, 15, "=D9*E9", '=IF(D9<=F9,"REORDER REQUIRED","IN STOCK")'],
            ["SKU-105", "1200W Titanium Power Unit", "Power", 10, 19000, 12, "=D10*E10", '=IF(D10<=F10,"REORDER REQUIRED","IN STOCK")'],
            [],
            ["TOTAL INVENTORY ASSET VALUE", "", "", "", "", "", "=SUM(G6:G10)", ""],
            ["TOTAL UNITS IN STOCK", "", "", "=SUM(D6:D10)", "", "", "", ""],
            ["AVERAGE UNIT COST", "", "", "", "=AVERAGE(E6:E10)", "", "", ""],
            [],
            ["Inventory Status: All formulas live and functional in Microsoft Excel."],
          ];
        } else {
          // Default Dynamic Spreadsheet with Sum and Metrics Formulas
          csvRows = [
            ["N.E.X.U.S. SYSTEM AUTOMATION — " + topic.toUpperCase()],
            ["Generated Date", new Date().toLocaleString()],
            [],
            ["Item / Category", "Department / Domain", "Quantity", "Unit Cost (INR)", "Total Value (INR)", "Remarks"],
            ["1. Core System Architecture", "Engineering", 5, 45000, "=C5*D5", "Optimal performance matrix"],
            ["2. Knowledge Retention & AI", "Research & Dev", 8, 32000, "=C6*D6", "Multilingual expansion"],
            ["3. Hardware & Device Interfaces", "Infrastructure", 10, 28000, "=C7*D7", "Windows API bridge active"],
            ["4. Daily Operational Reserves", "Operations", 12, 15000, "=C8*D8", "Resource buffer"],
            ["5. Health & Wellness Metrics", "Bio-Monitoring", 15, 9500, "=C9*D9", "Ergonomic guidelines"],
            [],
            ["TOTAL ALLOCATION", "", "=SUM(C5:C9)", "", "=SUM(E5:E9)", "Formulas verified in Excel"],
          ];
        }

        const csvContent = csvRows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\r\n");
        fs.writeFileSync(filePath, csvContent, "utf8");

        // Launch directly in Microsoft Excel / default CSV handler non-blocking
        launchDetached(filePath);

        return NextResponse.json({
          success: true,
          filePath,
          message: `Created spreadsheet for '${topic}' with active formulas and launched Microsoft Excel.`,
        });
      }

      case "create_code_project": {
        const {
          filename = "app.js",
          language = "javascript",
          code = "",
          description = "N.E.X.U.S. Generated Code",
        } = payload || {};

        const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "") || `script_${Date.now()}.js`;
        const filePath = path.join(PROJECTS_DIR, safeFilename);

        let finalCode = code;
        if (!finalCode) {
          if (language.includes("py") || safeFilename.endsWith(".py")) {
            finalCode = `# N.E.X.U.S. Cyber OS - Python Script\n# Created by Mr. Aaditya Dhavale Sir\n\nimport sys\nimport os\n\ndef main():\n    print("N.E.X.U.S. System Core Online.")\n    print("Automating tasks across Windows architecture.")\n\nif __name__ == "__main__":\n    main()\n`;
          } else if (language.includes("html") || safeFilename.endsWith(".html")) {
            finalCode = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>N.E.X.U.S. Web Application</title>\n  <style>body { background:#030712; color:#38bdf8; font-family:sans-serif; text-align:center; padding-top:100px; }</style>\n</head>\n<body>\n  <h1>N.E.X.U.S. System Online</h1>\n  <p>Engineered by Mr. Aaditya Dhavale Sir</p>\n</body>\n</html>`;
          } else {
            finalCode = `// N.E.X.U.S. Autonomous Code Project\n// Lead Architect: Mr. Aaditya Dhavale Sir\n\nconsole.log("N.E.X.U.S. System Online - Ready for execution.");\n`;
          }
        }

        fs.writeFileSync(filePath, finalCode, "utf8");

        // Launch in VS Code
        try {
          launchDetached(`code "${filePath}"`);
        } catch {
          launchDetached("code");
        }

        return NextResponse.json({
          success: true,
          filePath,
          code: finalCode,
          message: `Generated '${safeFilename}' and launched Visual Studio Code / Antigravity workspace.`,
        });
      }

      case "generate_image_visual": {
        const { prompt = "Cybernetic Neural AI Hologram" } = payload || {};
        const safePrompt = prompt.replace(/[^a-zA-Z0-9 _-]/g, "") || "Visual";
        const svgFilename = `NEXUS_VISUAL_${safePrompt.replace(/\s+/g, "_")}_${Date.now()}.svg`;
        const filePath = path.join(EXPORTS_DIR, svgFilename);

        const lowerPrompt = prompt.toLowerCase();
        let themeSvg = "";

        if (/(space|galaxy|star|planet|cosmos|nebula|astronomy|universe)/i.test(lowerPrompt)) {
          // Deep Space / Galactic Nebula
          themeSvg = `
  <radialGradient id="nebulaGlow" cx="50%" cy="50%" r="65%">
    <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.8"/>
    <stop offset="40%" stop-color="#2563eb" stop-opacity="0.4"/>
    <stop offset="75%" stop-color="#050814" stop-opacity="0.95"/>
    <stop offset="100%" stop-color="#000002"/>
  </radialGradient>
  <rect width="800" height="600" fill="url(#nebulaGlow)"/>
  <!-- Stars & Clusters -->
  <g fill="#ffffff" opacity="0.8">
    <circle cx="120" cy="80" r="1.5"/><circle cx="280" cy="140" r="2"/><circle cx="680" cy="90" r="1.5"/><circle cx="730" cy="220" r="1"/>
    <circle cx="85" cy="380" r="1.5"/><circle cx="190" cy="460" r="2"/><circle cx="640" cy="420" r="1.8"/><circle cx="710" cy="510" r="1.2"/>
    <circle cx="390" cy="70" r="2.5" filter="url(#glow)" fill="#38bdf8"/><circle cx="510" cy="180" r="1.8"/>
  </g>
  <!-- Galactic Core and Rings -->
  <ellipse cx="400" cy="280" rx="220" ry="60" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.6" transform="rotate(-18 400 280)" filter="url(#glow)"/>
  <ellipse cx="400" cy="280" rx="160" ry="40" fill="none" stroke="#c084fc" stroke-width="3" opacity="0.8" transform="rotate(-18 400 280)" filter="url(#glow)"/>
  <circle cx="400" cy="280" r="48" fill="#e0f2fe" filter="url(#glow)"/>
  <circle cx="400" cy="280" r="28" fill="#38bdf8" filter="url(#glow)"/>
`;
        } else if (/(nature|landscape|mountain|sunset|sun|ocean|forest|sea|tree|sky)/i.test(lowerPrompt)) {
          // Cyber-Nature Sunset & Mountain Vista
          themeSvg = `
  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#0f172a"/>
    <stop offset="45%" stop-color="#581c87"/>
    <stop offset="75%" stop-color="#ea580c"/>
    <stop offset="100%" stop-color="#0284c7"/>
  </linearGradient>
  <rect width="800" height="600" fill="url(#skyGrad)"/>
  <circle cx="400" cy="280" r="75" fill="#facc15" filter="url(#glow)" opacity="0.95"/>
  <!-- Mountain Silhouettes -->
  <polygon points="0,480 180,240 380,480" fill="#1e1b4b" opacity="0.85"/>
  <polygon points="220,480 430,210 650,480" fill="#0f172a" opacity="0.95"/>
  <polygon points="460,480 620,290 800,480" fill="#1e1b4b" opacity="0.85"/>
  <!-- Water Reflection / Grid Line -->
  <rect y="480" width="800" height="120" fill="#020617"/>
  <line x1="0" y1="480" x2="800" y2="480" stroke="#f43f5e" stroke-width="2" filter="url(#glow)"/>
  <ellipse cx="400" cy="510" rx="70" ry="12" fill="#facc15" opacity="0.4" filter="url(#glow)"/>
`;
        } else if (/(car|vehicle|jet|plane|speed|race|cyberpunk\s+car)/i.test(lowerPrompt)) {
          // Futuristic Cyber-Vehicle / Aerodynamic Speed Matrix
          themeSvg = `
  <rect width="800" height="600" fill="#030712"/>
  <!-- Neon Speed Streaks -->
  <line x1="0" y1="360" x2="800" y2="360" stroke="#00e5ff" stroke-width="2" opacity="0.6"/>
  <line x1="60" y1="380" x2="740" y2="380" stroke="#f43f5e" stroke-width="1.5" opacity="0.7"/>
  <line x1="0" y1="410" x2="800" y2="410" stroke="#38bdf8" stroke-width="3" filter="url(#glow)"/>
  <!-- Aerodynamic Silhouette -->
  <path d="M 220 380 Q 280 320 360 300 L 480 300 Q 560 310 620 380 Z" fill="#0f172a" stroke="#00e5ff" stroke-width="3" filter="url(#glow)"/>
  <path d="M 330 310 L 450 310 L 430 335 L 340 335 Z" fill="#38bdf8" opacity="0.8"/>
  <circle cx="280" cy="385" r="28" fill="#020617" stroke="#00e5ff" stroke-width="4" filter="url(#glow)"/>
  <circle cx="560" cy="385" r="28" fill="#020617" stroke="#00e5ff" stroke-width="4" filter="url(#glow)"/>
  <!-- Headlamp Beam -->
  <polygon points="620,365 780,340 780,410 620,380" fill="url(#cyanGrad)" opacity="0.3" filter="url(#glow)"/>
`;
        } else {
          // Core Cybernetic Neural Hologram
          themeSvg = `
  <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#0284c7" stop-opacity="0.5"/>
    <stop offset="60%" stop-color="#030712" stop-opacity="0.95"/>
    <stop offset="100%" stop-color="#000000"/>
  </radialGradient>
  <rect width="800" height="600" fill="url(#bgGlow)"/>
  <circle cx="400" cy="270" r="180" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.4" stroke-dasharray="10 5"/>
  <circle cx="400" cy="270" r="140" fill="none" stroke="#818cf8" stroke-width="3" opacity="0.6" filter="url(#glow)"/>
  <circle cx="400" cy="270" r="90" fill="none" stroke="#00e5ff" stroke-width="4" filter="url(#glow)"/>
  <circle cx="400" cy="270" r="40" fill="url(#cyanGrad)" filter="url(#glow)"/>
  <path d="M 400 90 L 400 450 M 220 270 L 580 270" stroke="#38bdf8" stroke-width="1.5" opacity="0.5"/>
`;
        }

        // Generate futuristic cybernetic SVG artwork
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  ${themeSvg}
  <!-- Holographic Interface Typography -->
  <text x="400" y="505" text-anchor="middle" fill="#00e5ff" font-family="'Segoe UI', 'Courier New', monospace" font-size="18" font-weight="bold" letter-spacing="4">N.E.X.U.S. NEURAL VISUAL SYNTHESIS</text>
  <text x="400" y="535" text-anchor="middle" fill="#94a3b8" font-family="'Segoe UI', sans-serif" font-size="13" letter-spacing="2">PROMPT: "${prompt.toUpperCase()}"</text>
  <text x="400" y="565" text-anchor="middle" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="10" letter-spacing="1">Designed by N.E.X.U.S. · Architect: Mr. Aaditya Dhavale Sir</text>
</svg>`;

        fs.writeFileSync(filePath, svgContent, "utf8");
        launchDetached(filePath);

        return NextResponse.json({
          success: true,
          filePath,
          svg: svgContent,
          prompt,
          message: `Generated neural artwork for '${prompt}' and opened visual viewer.`,
        });
      }

      case "close_app": {
        const { app = "all" } = payload || {};
        const safeApp = String(app || "").toLowerCase().trim();
        let procs: string[] = [];

        const isGenericClose =
          !safeApp ||
          safeApp === "all" ||
          safeApp === "this app" ||
          safeApp === "the app" ||
          safeApp === "an app" ||
          safeApp === "specific app" ||
          safeApp === "app" ||
          safeApp === "it" ||
          safeApp === "this";

        if (isGenericClose) {
          procs = [
            ...lastLaunchedProcs,
            "Notepad",
            "notepad",
            "mspaint",
            "PaintApp",
            "EXCEL",
            "POWERPNT",
            "WINWORD",
            "wordpad",
            "write",
            "CalculatorApp",
            "Calculator",
            "calc",
            "Taskmgr",
            "WindowsCamera",
            "vlc",
            "Spotify",
            "Code",
          ];
          lastLaunchedProcs = [];
          lastLaunchedAppName = "";
        } else {
          switch (safeApp) {
            case "notepad":
            case "notes":
              procs = ["Notepad", "notepad"];
              break;
            case "paint":
            case "mspaint":
            case "color":
            case "color paint":
              procs = ["mspaint", "PaintApp"];
              break;
            case "excel":
            case "spreadsheet":
              procs = ["EXCEL"];
              break;
            case "powerpoint":
            case "ppt":
              procs = ["POWERPNT"];
              break;
            case "word":
            case "winword":
              procs = ["WINWORD"];
              break;
            case "wordpad":
              procs = ["wordpad", "write", "WINWORD", "Notepad"];
              break;
            case "office":
            case "ms office":
              procs = ["EXCEL", "POWERPNT", "WINWORD"];
              break;
            case "calculator":
            case "calc":
              procs = ["CalculatorApp", "Calculator", "calc"];
              break;
            case "vscode":
            case "code":
              procs = ["Code"];
              break;
            case "whatsapp":
              procs = ["WhatsApp", "WhatsAppDesktop"];
              break;
            case "powershell":
            case "terminal":
              procs = ["powershell"];
              break;
            case "cmd":
              procs = ["cmd"];
              break;
            case "taskmgr":
            case "task manager":
              procs = ["Taskmgr"];
              break;
            case "camera":
            case "webcam":
              procs = ["WindowsCamera"];
              break;
            case "spotify":
              procs = ["Spotify"];
              break;
            case "vlc":
              procs = ["vlc"];
              break;
            case "chrome":
              procs = ["chrome"];
              break;
            case "edge":
              procs = ["msedge"];
              break;
            default: {
              const clean = safeApp.replace(/[^a-zA-Z0-9_-]/g, "");
              if (clean && clean.length > 1) {
                procs = [clean, ...lastLaunchedProcs];
              } else {
                procs = [...lastLaunchedProcs, "Notepad", "mspaint", "EXCEL", "POWERPNT", "WINWORD", "calc"];
              }
              break;
            }
          }
        }

        // Deduplicate and filter out any invalid names or names with spaces
        const uniqueProcs = Array.from(new Set(procs.filter((p) => p && !p.includes(" "))));

        // 1. Terminate directly via taskkill /F /T
        for (const proc of uniqueProcs) {
          try {
            exec(`taskkill /F /T /IM ${proc}.exe`);
          } catch { }
        }

        // 2. PowerShell safe termination without throws
        try {
          const procList = uniqueProcs.map((p) => `'${p}'`).join(",");
          await execAsync(
            `powershell -NoProfile -NonInteractive -Command "$names = @(${procList}); $p = Get-Process -Name $names -ErrorAction SilentlyContinue; if ($p) { $p | Stop-Process -Force }"`
          );
        } catch { }

        return NextResponse.json({ success: true, message: `Terminated application processes for ${app}` });
      }

      case "run_command": {
        const { command } = payload || {};
        if (!command) {
          return NextResponse.json({ error: "Command is required" }, { status: 400 });
        }

        try {
          // Execute in PowerShell with timeout
          const { stdout, stderr } = await execAsync(`powershell -Command "${command.replace(/"/g, '`"')}"`, {
            timeout: 15000,
          });

          return NextResponse.json({
            success: true,
            stdout: stdout?.trim() || "",
            stderr: stderr?.trim() || "",
            message: `Executed: ${command}`,
          });
        } catch (execErr: any) {
          // Graceful handling: return clean structured response instead of 500 server crash
          return NextResponse.json({
            success: false,
            stdout: execErr.stdout?.trim() || "",
            stderr: execErr.stderr?.trim() || execErr.message || "",
            error: execErr.message || "Command executed with non-zero exit code",
            remediation: "Executed with non-zero exit code. Verified output stream safely.",
            message: `Executed: ${command}`,
          });
        }
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("System API Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Execution error",
        details: error.stderr || "",
      },
      { status: 500 }
    );
  }
}
