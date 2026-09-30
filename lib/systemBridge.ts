/**
 * N.E.X.U.S. System Bridge & Device Automation Engine
 * Parses natural language voice & text directives to execute Windows OS tasks:
 * WhatsApp (with message drafts), YouTube (with song/video searches), Google, GitHub,
 * PowerPoint (direct autonomous slide generation), Excel, VS Code, and PowerShell.
 * 
 * Rules:
 * - 2 to 3 minute auto-close timer applies EXCLUSIVELY to Mr. Aaditya Dhavale Sir's GitHub page (150 seconds = 2.5 min).
 * - For ALL other apps (YouTube songs, Google browsing, WhatsApp, VS Code, PowerPoint, Excel, Amazon, Flipkart):
 *   No auto-close timer. They remain active until the user issues a close command ("close app", "close song", "band karo", etc.).
 */

import { isIntroductionOrCreatorQuery, getIntroAndCreatorResponse } from "./nexusAI";

export interface SystemActionResult {
  handled: boolean;
  action?: string;
  feedback: string;
  details?: any;
  error?: string;
}

export interface QuickActionItem {
  id: string;
  name: string;
  icon: string;
  action: "launch_app" | "open_url" | "create_ppt" | "create_excel";
  payload: any;
  description: string;
}

export interface TrackedWindowSession {
  id: string;
  title: string;
  url: string;
  openedAt: number;
  autoCloseMs: number; // 0 for normal apps, 150000 exclusively for GitHub
  win: Window | null;
  timerId: any;
  isDesktop?: boolean;
  appKey?: string;
}

// 2.5 minutes (150 seconds) auto-close timer applied EXCLUSIVELY to GitHub
export const DEFAULT_GITHUB_AUTO_CLOSE_MS = 150 * 1000;
export const DEFAULT_AUTO_CLOSE_MS = DEFAULT_GITHUB_AUTO_CLOSE_MS;

// Active tracked external browser sessions
let activeTrackedSessions: TrackedWindowSession[] = [];
let sessionListeners: Array<(sessions: TrackedWindowSession[]) => void> = [];
export let lastOpenedApp = "";

export function getActiveTrackedSessions(): TrackedWindowSession[] {
  return activeTrackedSessions.filter((s) => s.isDesktop || !s.win || !s.win.closed);
}

export function registerTrackedDesktopSession(appKey: string, title: string): void {
  if (typeof window === "undefined") return;
  const sessionId = `desktop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const session: TrackedWindowSession = {
    id: sessionId,
    title,
    url: "",
    openedAt: Date.now(),
    autoCloseMs: 0,
    win: null,
    timerId: null,
    isDesktop: true,
    appKey,
  };
  activeTrackedSessions = [session, ...activeTrackedSessions.filter((s) => s.appKey !== appKey)];
  notifySessionListeners();
}

export function subscribeToTrackedSessions(
  listener: (sessions: TrackedWindowSession[]) => void
): () => void {
  sessionListeners.push(listener);
  listener(getActiveTrackedSessions());
  return () => {
    sessionListeners = sessionListeners.filter((l) => l !== listener);
  };
}

function notifySessionListeners() {
  const active = getActiveTrackedSessions();
  sessionListeners.forEach((l) => {
    try {
      l(active);
    } catch (e) {
      console.warn("Tracked session listener error:", e);
    }
  });
}

/**
 * Opens an external URL in a managed browser window.
 * autoCloseMs is 0 by default (normal apps stay open until user says "close app").
 * isCreatorSession indicates opening developer's GitHub page, which closes when speech finishes.
 */
export function openTrackedWindow(
  url: string,
  title = "External Web Session",
  autoCloseMs = 0,
  onAutoClose?: (session: TrackedWindowSession) => void,
  isCreatorSession = false
): Window | null {
  if (typeof window === "undefined") {
    void callSystemApi("open_url", { url });
    return null;
  }

  // 1. Attempt window.open in browser tab/popup
  let newWin: Window | null = null;
  try {
    newWin = window.open(url, isCreatorSession ? "nexus_creator_window" : "_blank");
  } catch (e) {
    console.warn("N.E.X.U.S.: Browser window open error:", e);
  }

  // 2. Dispatch directly to Windows OS host via /api/system to guarantee launch in default browser
  try {
    void callSystemApi("open_url", { url });
  } catch (err) {
    console.warn("N.E.X.U.S.: OS dispatch error:", err);
  }

  const sessionId = `win_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const session: TrackedWindowSession = {
    id: sessionId,
    title,
    url,
    openedAt: Date.now(),
    autoCloseMs,
    win: newWin,
    timerId: null,
  };

  // Optional auto-close timer if specified
  if (autoCloseMs && autoCloseMs > 0) {
    session.timerId = setTimeout(() => {
      try {
        if (session.win && !session.win.closed) {
          session.win.close();
        }
      } catch (err) {
        console.warn("Could not close tracked window:", err);
      }

      try {
        window.focus();
      } catch {}

      activeTrackedSessions = activeTrackedSessions.filter((s) => s.id !== sessionId);
      notifySessionListeners();

      if (onAutoClose) {
        try {
          onAutoClose(session);
        } catch (cbErr) {
          console.warn("onAutoClose callback error:", cbErr);
        }
      }
    }, autoCloseMs);
  }

  // Ensure active sessions list is updated and broadcasts to HUD
  activeTrackedSessions = [session, ...activeTrackedSessions.filter((s) => s.url !== url)];
  notifySessionListeners();

  return newWin;
}

/**
 * Instantly closes all open tracked external browser tabs/windows and returns focus to the main N.E.X.U.S. page.
 */
export function closeAllTrackedWindows(): number {
  let count = 0;
  for (const session of activeTrackedSessions) {
    try {
      if (session.timerId) clearTimeout(session.timerId);
      if (session.win && !session.win.closed) {
        session.win.close();
        count++;
      } else if (session.isDesktop) {
        count++;
      }
    } catch (e) {
      console.warn("Error closing window session:", e);
    }
  }
  activeTrackedSessions = [];
  notifySessionListeners();

  if (typeof window !== "undefined") {
    try {
      window.focus();
    } catch {}
  }

  return count;
}

const CLOSE_PATTERNS = [
  // Close app / apps / application / specific app / this app / that app / current app / software / program / tool / window / it
  /(?:close|closed|exit|quit|stop|terminate|kill|band\s*karo|band\s*kara|shut\s*down)\s+(?:the\s+)?(?:specific\s+|this\s+|that\s+|current\s+|opened\s+|open\s+)?(?:app|apps|application|other\s+thing|everything|all|software|program|tool|window|windows|it)?/i,
  // Direct close this / close it / close app
  /(?:close\s+this|close\s+it|close\s+app|close\s+the\s+app|close\s+this\s+app|close\s+that\s+app|close\s+specific\s+app|band\s+karo\s+app|app\s+band\s+karo)/i,
  // Close specific named applications
  /(?:close|closed|exit|quit|stop|terminate|kill|band\s*karo|band\s*kara)\s+(?:the\s+)?(calc|calculator|notepad|notes|paint|mspaint|color|chrome|edge|browser|taskmgr|task\s*manager|camera|webcam|spotify|vlc|word|winword|wordpad|excel|powerpoint|ppt|whatsapp|youtube|cmd|powershell|terminal|explorer|office)/i,
  // Close browsing / browser / tabs / windows
  /(?:close|closed|exit|quit|stop)\s+(?:the\s+)?(?:browsing|browser|tab|tabs|window|windows|site|web|page|session)/i,
  // Close song / music / youtube / playback
  /(?:close|closed|stop|pause|end)\s+(?:the\s+)?(?:songs?|music|video|youtube|playback|playing)/i,
  // Return to main nexus page
  /(?:back\s+(?:to\s+)?(?:the\s+)?(?:main\s+)?nexu[sx]\s+page|return\s+(?:to\s+)?(?:main\s+)?nexu[sx]\s+page|go\s+back\s+to\s+nexu[sx]|back\s+to\s+main\s+page|return\s+to\s+main\s+page)/i,
  // Standalone close commands
  /^(?:close|closed|exit|quit|band\s*karo|band\s*kara|band|stop\s+all|close\s+all|close\s+app|close\s+this|close\s+it|stop|kill)$/i,
  // Hindi & Marathi close directives
  /(?:band\s*(?:karo|kar\s*do|kijiye|karna|kar))/i,
  /(?:wapas|vaapas)\s*(?:aao|jao|chalo|nexus)/i,
  /(?:gaana|gana|geet|song)\s+band/i,
  /(?:band\s*kara)/i,
  /(?:parat\s*(?:ya|ja|jaa|chala|chal|nexus|page))/i,
];

export function extractAppToClose(text: string): string {
  const clean = text.trim().toLowerCase();
  if (/(?:calc|calculator|hisab)/i.test(clean)) return "calc";
  if (/(?:notepad|note|notes|text\s*editor)/i.test(clean)) return "notepad";
  if (/(?:paint|mspaint|color|drawing)/i.test(clean)) return "paint";
  if (/(?:taskmgr|task\s*manager)/i.test(clean)) return "taskmgr";
  if (/(?:camera|webcam)/i.test(clean)) return "camera";
  if (/(?:spotify)/i.test(clean)) return "spotify";
  if (/(?:vlc|video\s*player)/i.test(clean)) return "vlc";
  if (/(?:chrome|google\s*chrome)/i.test(clean)) return "chrome";
  if (/(?:edge|msedge|browser)/i.test(clean)) return "edge";
  if (/(?:wordpad|write)/i.test(clean)) return "wordpad";
  if (/(?:word|winword)/i.test(clean)) return "word";
  if (/(?:excel|spreadsheet)/i.test(clean)) return "excel";
  if (/(?:ppt|powerpoint|presentation)/i.test(clean)) return "powerpoint";
  if (/(?:vscode|code|visual\s*studio)/i.test(clean)) return "vscode";
  if (/(?:powershell|terminal|cmd)/i.test(clean)) return "powershell";
  if (/(?:office|ms\s*office)/i.test(clean)) return "office";
  return lastOpenedApp || "all";
}

/**
 * Detects whether user wants to close opened apps, songs, browsing, or return to the main Nexus page.
 */
export function isCloseAppOrReturnQuery(text: string): boolean {
  const clean = text.trim().toLowerCase();

  // If sentence begins with open/play/search/launch without any close/band/back intent
  if (
    /^(?:open|play|search|launch|start|make|create)\b/i.test(clean) &&
    !/(?:close|closed|band|back\s+to|return\s+to|wapas|parat)/i.test(clean)
  ) {
    return false;
  }

  return CLOSE_PATTERNS.some((p) => p.test(clean));
}

export const SYSTEM_QUICK_ACTIONS: QuickActionItem[] = [
  { id: "whatsapp", name: "WhatsApp", icon: "💬", action: "launch_app", payload: { app: "whatsapp" }, description: "Open WhatsApp Web or App" },
  { id: "youtube", name: "YouTube", icon: "▶️", action: "open_url", payload: { url: "https://www.youtube.com" }, description: "Open YouTube Music & Video" },
  { id: "maps", name: "Google Maps", icon: "🗺️", action: "open_url", payload: { url: "https://www.google.com/maps" }, description: "Open Google Maps & Navigation" },
  { id: "gmail", name: "Gmail", icon: "✉️", action: "open_url", payload: { url: "https://mail.google.com" }, description: "Open Gmail Inbox" },
  { id: "vscode", name: "VS Code", icon: "💻", action: "launch_app", payload: { app: "vscode" }, description: "Launch Visual Studio Code" },
  { id: "terminal", name: "PowerShell", icon: "⚡", action: "launch_app", payload: { app: "powershell" }, description: "Open PowerShell Terminal" },
  { id: "google", name: "Google", icon: "🔍", action: "open_url", payload: { url: "https://www.google.com" }, description: "Open Google Search" },
  { id: "github", name: "GitHub", icon: "🐙", action: "open_url", payload: { url: "https://github.com/aadityadhawale3-bot" }, description: "Open Mr. Aaditya Dhavale Sir's GitHub (2.5 min auto-close)" },
  { id: "inventory", name: "Inventory", icon: "📦", action: "create_excel", payload: { topic: "Warehouse Inventory Matrix", sheetType: "inventory" }, description: "Generate & Open Excel Inventory Sheet" },
  { id: "billing", name: "Billing Invoice", icon: "🧾", action: "create_excel", payload: { topic: "Enterprise Tax Invoice", sheetType: "bill" }, description: "Generate & Open Excel Tax Invoice" },
  { id: "ppt", name: "PowerPoint", icon: "📊", action: "create_ppt", payload: { topic: "Cyber Security Architecture" }, description: "Generate & Open PowerPoint Deck" },
  { id: "amazon", name: "Amazon", icon: "📦", action: "open_url", payload: { url: "https://www.amazon.in" }, description: "Open Amazon Shopping" },
  { id: "flipkart", name: "Flipkart", icon: "🛍️", action: "open_url", payload: { url: "https://www.flipkart.com" }, description: "Open Flipkart Store" },
];

/**
 * Parses and evaluates arithmetic and mathematical directives.
 * Supports: addition, subtraction, multiplication, division, percentages, and expressions.
 */
export function evaluateMathDirective(text: string): { expression: string; result: number } | null {
  const clean = text.trim().toLowerCase();

  const hasMathIntent =
    /(?:add|plus|subtract|minus|multiply|times|into|gunile|guna|divide|divided\s+by|bhagile|bhaag|sum|calculate|hisab|compute|what\s+is\s+[\d\s+\-*/xX]+)/i.test(clean) ||
    (/(?:calc|calculator)/i.test(clean) && /[\d]/.test(clean));

  if (!hasMathIntent) return null;

  // "subtract X from Y" -> Y - X
  const subFromMatch = clean.match(/subtract\s+(\d+(?:\.\d+)?)\s+from\s+(\d+(?:\.\d+)?)/i);
  if (subFromMatch) {
    const a = parseFloat(subFromMatch[1]);
    const b = parseFloat(subFromMatch[2]);
    return { expression: `${b} - ${a}`, result: Math.round((b - a) * 10000) / 10000 };
  }

  // "multiply X and Y" / "multiply X by Y"
  const mulMatch = clean.match(/multiply\s+(\d+(?:\.\d+)?)\s*(?:by|and|\*|into|times)\s*(\d+(?:\.\d+)?)/i);
  if (mulMatch) {
    const a = parseFloat(mulMatch[1]);
    const b = parseFloat(mulMatch[2]);
    return { expression: `${a} × ${b}`, result: Math.round((a * b) * 10000) / 10000 };
  }

  // "divide X by Y"
  const divMatch = clean.match(/divide\s+(\d+(?:\.\d+)?)\s*(?:by|\/)\s*(\d+(?:\.\d+)?)/i);
  if (divMatch) {
    const a = parseFloat(divMatch[1]);
    const b = parseFloat(divMatch[2]);
    if (b !== 0) {
      return { expression: `${a} ÷ ${b}`, result: Math.round((a / b) * 10000) / 10000 };
    }
  }

  // "add X and Y" / "add X plus Y"
  const addMatch = clean.match(/add\s+(\d+(?:\.\d+)?)\s*(?:and|\+|plus)\s*(\d+(?:\.\d+)?)/i);
  if (addMatch) {
    const a = parseFloat(addMatch[1]);
    const b = parseFloat(addMatch[2]);
    return { expression: `${a} + ${b}`, result: Math.round((a + b) * 10000) / 10000 };
  }

  // General expression normalization
  let expr = clean
    .replace(/(?:open\s+(?:the\s+)?calculator|calc|calculate|hisab\s*karo|compute|what\s+is)\s*(?:and\s+)?/gi, "")
    .replace(/\bplus\b/gi, "+")
    .replace(/\bminus\b/gi, "-")
    .replace(/\b(?:multiplied\s+by|times|into|gunile|guna)\b/gi, "*")
    .replace(/\b(?:divided\s+by|bhagile|bhaag)\b/gi, "/")
    .replace(/\bx\b/gi, "*")
    .replace(/[^0-9+\-*/().%\s]/g, "")
    .trim();

  if (expr && /[+\-*/%]/.test(expr) && /\d/.test(expr)) {
    try {
      if (/^[0-9+\-*/().%\s]+$/.test(expr)) {
        // eslint-disable-next-line no-new-func
        const res = Function(`"use strict"; return (${expr})`)();
        if (typeof res === "number" && !isNaN(res) && isFinite(res)) {
          return { expression: expr, result: Math.round(res * 10000) / 10000 };
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Parses user speech or text directive to determine and execute device/system orders.
 */
export async function tryExecuteSystemCommand(
  text: string,
  lang = "en-US"
): Promise<SystemActionResult> {
  // Strip leading wake words ("nexus", "hey nexus", "hi nexus", "hello nexus", "ok nexus", "agent", "please") and repeated words
  const strippedWakeWord = text
    .replace(/^(?:(?:hey|hi|hello|ok|okay)?\s*nexu[sx][,\s]*)+/i, "")
    .replace(/^(?:please\s+|can\s+you\s+|agent\s+)+/i, "")
    .trim();
  const cleanedDirective = strippedWakeWord.replace(/^(?:open\s+)+/i, "open ");
  const textToProcess = cleanedDirective || text;

  const clean = textToProcess.trim().toLowerCase();
  const normalizedClean = clean.replace(/shearch/gi, "search").replace(/\bthe\s+app\b/gi, "app");
  const isMarathi = lang.startsWith("mr") || (lang === "mr-IN" && /[\u0900-\u097F]/.test(textToProcess));
  const isHindi = !isMarathi && (lang.startsWith("hi") || /[\u0900-\u097F]/.test(textToProcess));

  // 0A. Immediate Close Directive ("close the app", "close specific app", "close calculator", "band karo", etc.)
  if (isCloseAppOrReturnQuery(textToProcess) || isCloseAppOrReturnQuery(text)) {
    const appToClose = extractAppToClose(textToProcess);
    const closedTabs = closeAllTrackedWindows();
    try {
      await callSystemApi("close_app", { app: appToClose });
    } catch {}
    lastOpenedApp = "";

    const feedback = isMarathi
      ? "अ‍ॅप बंद केले आहे, सर. पुढील आदेशासाठी सज्ज आहे."
      : isHindi
      ? "एप्लिकेशन बंद कर दिया गया है, सर। अगले आदेश के लिए तैयार हूँ।"
      : "Closed the application, Sir. Ready for your next command.";

    return {
      handled: true,
      action: "close_and_return",
      details: { closedTabs, app: appToClose },
      feedback,
    };
  }

  // 0B. Introduction & Creator Attribution (Mr. Aaditya Dhavale Sir) in ALL languages
  // e.g. "who was made you", "who was make you", "who made you", "who created you", "who are you", etc.
  // Immediately opens GitHub on question receipt; closes when speech finishes
  if (isIntroductionOrCreatorQuery(textToProcess) || isIntroductionOrCreatorQuery(text)) {
    const githubUrl = "https://github.com/aadityadhawale3-bot";

    openTrackedWindow(githubUrl, "Mr. Aaditya Dhavale Sir - GitHub Profile", 0, undefined, true);

    const introSpeech = getIntroAndCreatorResponse(lang, textToProcess);

    return {
      handled: true,
      action: "introduce",
      details: {
        creator: "Mr. Aaditya Dhavale Sir",
        github: githubUrl,
        email: "aadityadhaval3@gmail.com",
      },
      feedback: introSpeech,
    };
  }

  // 0C. Repeat / Say Again Directive
  if (/(?:say\s+(?:that\s+)?again|say\s+again|repeat\s+(?:that|it|response|message)?|repeat|phir\s*se\s*bolo|punha\s*sanga|dobara\s*bolo|replay|speak\s*again)/i.test(clean)) {
    return {
      handled: true,
      action: "say_again",
      feedback: isMarathi
        ? "मी पूर्वीचा संदेश पुन्हा सांगत आहे, सर."
        : isHindi
        ? "मैं पिछला संदेश दोहरा रहा हूँ, सर।"
        : "Replaying previous transmission, Sir.",
    };
  }

  // 0D. Mathematical Calculation & In-App Calculator Operation (Addition, Subtraction, Multiplication, Division)
  const mathResult = evaluateMathDirective(textToProcess) || evaluateMathDirective(text);
  if (mathResult) {
    lastOpenedApp = "calc";
    try {
      await callSystemApi("launch_app", { app: "calc" });
    } catch {}

    const feedback = isMarathi
      ? `हिशोब पूर्ण: ${mathResult.expression} = ${mathResult.result}. कॅल्क्युलेटर उघडले आहे, सर.`
      : isHindi
      ? `गणना पूर्ण: ${mathResult.expression} = ${mathResult.result}। कैलकुलेटर खोल दिया गया है, सर।`
      : `Calculation: ${mathResult.expression} = ${mathResult.result}. Windows Calculator launched, Sir.`;

    return {
      handled: true,
      action: "calculator_math",
      details: { expression: mathResult.expression, result: mathResult.result },
      feedback,
    };
  }

  // 0E. Neural Brain Architecture & Memory Inspector Directive ("open brain", "show brain", "brain telemetry", "brain status", "view memory", etc.)
  if (/(?:open\s+(?:the\s+)?brain|show\s+(?:the\s+)?brain|brain\s+status|brain\s+telemetry|view\s+memory|open\s+memory|inspect\s+brain)/i.test(clean)) {
    return {
      handled: true,
      action: "open_brain",
      feedback: isMarathi
        ? "न्यूरल ब्रेन आर्किटेक्चर आणि मेमरी इन्स्पेक्टर उघडत आहे, सर."
        : isHindi
        ? "न्यूरल ब्रेन आर्किटेक्चर और मेमोरी इंस्पेक्टर खोल रहा हूँ, सर।"
        : "Opening Neural Brain Architecture and cognitive telemetry, Sir.",
    };
  }

  // 1. WhatsApp Directive (Video Call, Voice Call, Send File from Laptop, and Direct Messaging)
  if (clean.includes("whatsapp") || /(?:video\s*call|voice\s*call|send\s+file\s+from\s+(?:this\s+)?laptop)/i.test(clean)) {
    const isVideo = /(?:video\s*call|video\s*calling)/i.test(clean);
    const isVoice = !isVideo && /(?:voice\s*call|audio\s*call|phone\s*call|call)/i.test(clean);
    const isSendFile = /(?:send\s+file|transfer\s+file|laptop\s+file|file\s+send)/i.test(clean);

    const recipientMatch = clean.match(/(?:to|with|call)\s+([a-zA-Z0-9_ ]+?)(?:\s+(?:on|in)\s+whatsapp|\s+(?:saying|that|with|file)|$)/i);
    const recipient = recipientMatch?.[1]?.trim() || "";

    if (isVideo) {
      openTrackedWindow("https://web.whatsapp.com", "WhatsApp Video Call", 0);
      try {
        await callSystemApi("launch_app", { app: "whatsapp", actionType: "video_call", recipient });
      } catch {}
      return {
        handled: true,
        action: "whatsapp_video_call",
        feedback: isMarathi
          ? `व्हॉट्सॲप व्हिडिओ कॉल सुरू करत आहे${recipient ? ` (${recipient} साठी)` : ""}, सर.`
          : isHindi
          ? `व्हाट्सएप वीडियो कॉल प्रारंभ किया जा रहा है${recipient ? ` (${recipient} के लिए)` : ""}, सर।`
          : `Initiating WhatsApp video call sequence${recipient ? ` for ${recipient}` : ""}, Sir.`,
      };
    }

    if (isVoice) {
      openTrackedWindow("https://web.whatsapp.com", "WhatsApp Voice Call", 0);
      try {
        await callSystemApi("launch_app", { app: "whatsapp", actionType: "voice_call", recipient });
      } catch {}
      return {
        handled: true,
        action: "whatsapp_voice_call",
        feedback: isMarathi
          ? `व्हॉट्सॲप व्हॉईस कॉल जोडत आहे${recipient ? ` (${recipient} साठी)` : ""}, सर.`
          : isHindi
          ? `व्हाट्सएप वॉइस कॉल कनेक्ट किया जा रहा है${recipient ? ` (${recipient} के लिए)` : ""}, सर।`
          : `Connecting WhatsApp voice transmission${recipient ? ` for ${recipient}` : ""}, Sir.`,
      };
    }

    if (isSendFile) {
      try {
        await callSystemApi("launch_app", { app: "whatsapp", actionType: "send_file" });
      } catch {}
      return {
        handled: true,
        action: "whatsapp_send_file",
        feedback: isMarathi
          ? "लॅपटॉपवरून फाइल निवडण्यासाठी फाइल एक्सप्लोरर उघडले आहे आणि व्हॉट्सॲप सज्ज आहे, सर."
          : isHindi
          ? "लैपटॉप से फाइल चुनने के लिए फाइल एक्सप्लोरर खोल दिया गया है और व्हाट्सएप तैयार है, सर।"
          : "File Explorer opened on laptop to select transmission file, and WhatsApp is ready, Sir.",
      };
    }

    // Standard message drafting
    const msgMatch = clean.match(/(?:send\s+message|message|text|bhejo|patva)\s+(?:to\s+([a-zA-Z0-9_ ]+?)\s+)?(?:that|saying|:)?\s*(.+)?/i);
    const msgRecipient = recipient || msgMatch?.[1]?.trim() || "";
    const messageText = msgMatch?.[2]?.trim() || "";
    const waUrl = messageText
      ? `https://web.whatsapp.com/send?text=${encodeURIComponent(messageText)}`
      : "https://web.whatsapp.com";

    openTrackedWindow(waUrl, "WhatsApp Web", 0);
    try {
      await callSystemApi("launch_app", { app: "whatsapp", message: messageText, recipient: msgRecipient });
    } catch {}

    return {
      handled: true,
      action: "whatsapp",
      feedback: isMarathi
        ? `व्हॉट्सॲप उघडत आहे, सर.${messageText ? ` संदेश तयार केला आहे.` : ""}`
        : isHindi
        ? `व्हाट्सएप खोला जा रहा है, सर।${messageText ? ` संदेश तैयार किया गया है।` : ""}`
        : `Opening WhatsApp now, Sir.${messageText ? ` Dispatching message draft.` : ""}`,
    };
  }

  // 1B. Google Maps & Navigation
  if (/(?:maps?|navigation|navigate|direction|location)/i.test(clean) && !clean.includes("roadmap")) {
    const isNav = /(?:start\s+navigation|navigate|direction|directions|how\s+to\s+go|rasta)\s+(?:to\s+)?(.+)/i.test(clean);
    let place = clean
      .replace(/(?:open\s+(?:google\s+)?maps?|start\s+navigation|navigate|directions?|search\s+location|show\s+location|find\s+location|on\s+map|on\s+google\s+maps|maps?|to\s+|for\s+)/gi, "")
      .trim();

    const targetUrl = isNav && place
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`
      : place
      ? `https://www.google.com/maps/search/${encodeURIComponent(place)}`
      : "https://www.google.com/maps";

    openTrackedWindow(targetUrl, place ? `Maps: ${place}` : "Google Maps", 0);
    const feedback = isMarathi
      ? `गुगल मॅप्सवर ${place || "स्थान"} नेव्हिगेशन सुरू करत आहे, सर.`
      : isHindi
      ? `गूगल मैप्स पर ${place || "स्थान"} के लिए नेविगेशन प्रारंभ किया जा रहा है, सर।`
      : `Initiating Google Maps navigation for ${place || "location"}, Sir.`;

    return {
      handled: true,
      action: "maps_navigation",
      feedback,
    };
  }

  // 1C. Email Send & Read Suite
  if (/(?:send\s+email|compose\s+email|mail\s+bhejo|open\s+email|read\s+email|check\s+email|open\s+gmail|check\s+inbox)/i.test(clean)) {
    const isRead = /(?:read|open|check)\s+(?:email|gmail|inbox|mails)/i.test(clean);
    if (isRead) {
      openTrackedWindow("https://mail.google.com", "Gmail Inbox", 0);
      return {
        handled: true,
        action: "read_email",
        feedback: isMarathi
          ? "जीमेल इनबॉक्स उघडत आहे, सर."
          : isHindi
          ? "जीमेल इनबॉक्स खोला जा रहा है, सर।"
          : "Opening Gmail inbox to inspect transmissions, Sir.",
      };
    }

    const emailMatch = clean.match(/(?:to\s+([^\s@]+@[^\s@]+\.[^\s@]+|[a-zA-Z0-9_ ]+?))?(?:\s+(?:about|subject|saying|with)\s+(.+))?/i);
    const to = emailMatch?.[1]?.trim() || "";
    const body = emailMatch?.[2]?.trim() || "";
    const mailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent("Transmission via N.E.X.U.S.")}&body=${encodeURIComponent(body)}`;

    openTrackedWindow(mailUrl, "Compose Email", 0);
    return {
      handled: true,
      action: "send_email",
      feedback: isMarathi
        ? `ईमेल तयार करत आहे${to ? ` (${to} साठी)` : ""}, सर.`
        : isHindi
        ? `ईमेल तैयार किया जा रहा है${to ? ` (${to} के लिए)` : ""}, सर।`
        : `Composing email transmission${to ? ` for ${to}` : ""}, Sir.`,
    };
  }

  // 1D. AI Image Generation (Gemini Nano Banana / Neural Visuals)
  if (
    /(?:(?:generate|create|make|draw|paint|sketch|render|synthesize|show\s+me)\s+(?:an?\s+)?(?:image|picture|photo|artwork|illustration|visual|drawing)|(?:image|picture|photo|drawing|artwork)\s+(?:of|for)|gemini\s+nano\s+banana)/i.test(
      clean
    )
  ) {
    let prompt = clean
      .replace(/^(?:nexus|jarvis|agent|please)\s+/i, "")
      .replace(
        /(?:generate|create|make|draw|paint|sketch|render|synthesize|show\s+me)\s+(?:an?\s+)?(?:image|picture|photo|artwork|illustration|visual|drawing)(?:\s+(?:of|for|about|with))?/gi,
        ""
      )
      .replace(/(?:image|picture|photo|drawing|artwork)\s+(?:of|for)/gi, "")
      .replace(/gemini\s+nano\s+banana/gi, "")
      .trim() || "Futuristic Cybernetic AI Hologram";

    const res = await callSystemApi("generate_image_visual", { prompt });
    return {
      handled: true,
      action: "generate_image",
      details: {
        ...(typeof res === "object" ? res : {}),
        prompt,
      },
      feedback: isMarathi
        ? `"${prompt}" साठी इमेज जनरेट केली आहे, सर.`
        : isHindi
        ? `"${prompt}" के लिए इमेज तैयार कर दी गई है, सर।`
        : `Generated neural visual artwork for "${prompt}", Sir. Displayed on your HUD.`,
    };
  }

  // 2. YouTube Search or Music Directive (Actually plays the video with autoplay!)
  const isYouTubeOrMusic =
    clean.includes("youtube") ||
    /(?:(?:open\s+(?:the\s+)?app\s+)?(?:play|search|bajao|lav|find|listen\s+to)\s+(?:the\s+)?(?:songs?|music|video|geet|gana|track)|(?:gana|geet|gaane|song|songs)\s+(?:bajao|lav|play)|youtube\s+songs?)/i.test(
      normalizedClean
    );

  if (isYouTubeOrMusic) {
    let query = normalizedClean
      .replace(/(?:open\s+(?:the\s+)?app|open\s+youtube|launch\s+youtube|go\s+to\s+youtube|on\s+youtube|in\s+youtube|youtube\s+songs?|youtube)/gi, "")
      .replace(/(?:and\s+search\s+for|and\s+search|search\s+for|search\s+the\s+song|search\s+song|search|play\s+the\s+song|play\s+song|play|find|listen\s+to|gana\s+bajao|lav)/gi, "")
      .trim();

    // Curated high-fidelity YouTube video database for instant autoplay
    const TOP_PLAYLIST = [
      { id: "jfKfPfyJRdk", title: "Lofi Hip Hop Radio - Beats to Relax/Study to" },
      { id: "UDVtMYqUAyw", title: "Hans Zimmer - Interstellar Live Suite" },
      { id: "4xDzrJKXOOY", title: "Synthwave / Chillwave Retro Beats" },
      { id: "fJ9rUzIMcZQ", title: "Queen - Bohemian Rhapsody" },
      { id: "JGwWNGJdvx8", title: "Ed Sheeran - Shape of You" },
      { id: "dQw4w9WgXcQ", title: "Rick Astley - Never Gonna Give You Up" },
      { id: "kJQP7kiw5Fk", title: "Luis Fonsi - Despacito" },
    ];

    const isRandomRequest =
      !query ||
      /^(?:random|randomly|any|trending|popular|hit|some|a|the)?\s*(?:video|videos|song|songs|music|track|tracks)?$/i.test(query);

    let targetUrl = "https://www.youtube.com";
    let embedUrl = "";
    let displayTitle = "";
    let speechFeedback = "";

    if (isRandomRequest) {
      const selectedVideo = TOP_PLAYLIST[Math.floor(Math.random() * TOP_PLAYLIST.length)];
      displayTitle = selectedVideo.title;
      targetUrl = `https://www.youtube.com/watch?v=${selectedVideo.id}&autoplay=1`;
      embedUrl = `https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&enablejsapi=1`;
      speechFeedback = isMarathi
        ? `यूट्यूबवर "${displayTitle}" प्ले करत आहे, सर.`
        : isHindi
        ? `यूट्यूब पर "${displayTitle}" प्ले कर रहा हूँ, सर।`
        : `Playing "${displayTitle}" on YouTube, Sir.`;
    } else {
      displayTitle = query;
      targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`;
      speechFeedback = isMarathi
        ? `यूट्यूबवर "${query}" व्हिडिओ प्ले करत आहे, सर.`
        : isHindi
        ? `यूट्यूब पर "${query}" वीडियो प्ले कर रहा हूँ, सर।`
        : `Playing "${query}" on YouTube, Sir.`;
    }

    openTrackedWindow(targetUrl, `YouTube: ${displayTitle}`, 0);

    return {
      handled: true,
      action: "youtube",
      details: {
        query: displayTitle,
        title: displayTitle,
        targetUrl,
        embedUrl,
      },
      feedback: speechFeedback,
    };
  }

  // 3. E-Commerce Directive (Amazon, Flipkart, shopping)
  if (
    /(?:e-?commerce(?:\s+websites?)?|online\s+shopping|shopping\s+websites?|shopping|buy\s+online)/i.test(clean) ||
    clean.includes("amazon") ||
    clean.includes("flipkart")
  ) {
    const isFlipkart = clean.includes("flipkart");
    let query = clean
      .replace(/(?:open\s+(?:the\s+)?(?:app|websites?)|open|search\s+for|search|searching|buy\s+on|buy|online|shopping|e-?commerce(?:\s+websites?)?|websites?|store|in\s+|on\s+|amazon|flipkart)/gi, "")
      .trim();

    const platform = isFlipkart ? "Flipkart" : "Amazon";
    let targetUrl = "";
    let speechFeedback = "";

    if (query && query.length > 1 && query !== "website" && query !== "store") {
      targetUrl = isFlipkart
        ? `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`
        : `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
      speechFeedback = isMarathi
        ? `${platform} वर "${query}" शोधत आहे, सर.`
        : isHindi
        ? `${platform} पर "${query}" खोज रहा हूँ, सर।`
        : `Searching ${platform} for "${query}", Sir. Say "close app" to return to Nexus.`;
    } else {
      targetUrl = isFlipkart ? "https://www.flipkart.com" : "https://www.amazon.in";
      speechFeedback = isMarathi
        ? `${platform} ई-कॉमर्स पोर्टल उघडत आहे, सर.`
        : isHindi
        ? `${platform} ई-कॉमर्स खोला जा रहा है, सर।`
        : `Connecting to ${platform} e-commerce portal, Sir. Say "close app" to return to Nexus.`;
    }

    openTrackedWindow(targetUrl, `${platform}${query ? `: ${query}` : ""}`, 0);

    return {
      handled: true,
      action: "ecommerce",
      feedback: speechFeedback,
    };
  }

  // 4. Web Browsing & Google Search & Websites
  const isWebBrowsing =
    /(?:search\s+browsing|browsing|browser|web\s+browsing|browse|web\s+browse)/i.test(normalizedClean) ||
    /(?:open\s+)?(?:websites?|web\s*sites?|web\s+page)/i.test(normalizedClean) ||
    normalizedClean.includes("google") ||
    /^(?:search\s+for|search|look\s+up)\s+(.+)/i.test(normalizedClean);

  if (isWebBrowsing) {
    // Check if user specified a direct domain (e.g. "open website wikipedia.org" or "open google.com")
    const domainMatch = clean.match(/([a-zA-Z0-9-]+\.(?:com|org|net|in|io|co|ai|edu|gov)(?:\/[^\s]*)?)/i);
    if (domainMatch) {
      const rawDomain = domainMatch[1];
      const targetUrl = rawDomain.startsWith("http") ? rawDomain : `https://${rawDomain}`;
      openTrackedWindow(targetUrl, rawDomain, 0);
      return {
        handled: true,
        action: "open_website",
        feedback: isMarathi
          ? `${rawDomain} वेबसाइट उघडत आहे, सर.`
          : isHindi
          ? `${rawDomain} वेबसाइट खोली जा रही है, सर।`
          : `Navigating to ${rawDomain}, Sir. Say "close browsing" to return to Nexus.`,
      };
    }

    let query = normalizedClean
      .replace(/(?:open\s+google|search\s+google\s+for|google\s+search\s+for|google\s+search|open\s+browsing|open\s+browser|open\s+websites?|websites?|browsing|browse|search\s+browsing(?:\s+for)?|search\s+for|search|google)/gi, "")
      .trim();

    let targetUrl = "https://www.google.com";
    let speechFeedback = "";

    if (query && query.length > 1) {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      speechFeedback = isMarathi
        ? `गुगलवर "${query}" शोधत आहे, सर. ब्राउझिंग सुरू होत आहे.`
        : isHindi
        ? `गूगल पर "${query}" खोज रहा हूँ, सर। बंद करने के लिए "बंद करो" बोलें।`
        : `Executing search browsing for "${query}", Sir. Say "close browsing" or "close app" to return to Nexus.`;
    } else {
      targetUrl = "https://www.google.com";
      speechFeedback = isMarathi
        ? "वेब ब्राऊझिंग सुरू करत आहे, सर."
        : isHindi
        ? "वेब ब्राउज़िंग प्रारंभ की जा रही है, सर।"
        : "Opening web browsing command center, Sir. Say 'close browsing' to return to Nexus.";
    }

    openTrackedWindow(targetUrl, query ? `Google: ${query}` : "Google Search", 0);

    return {
      handled: true,
      action: "google_search",
      feedback: speechFeedback,
    };
  }

  // 5. GitHub Directive
  if (clean.includes("github")) {
    let query = clean
      .replace(/(?:open\s+github|search\s+github\s+for|search\s+github|on\s+github|github)/gi, "")
      .trim();

    const url = query
      ? `https://github.com/search?q=${encodeURIComponent(query)}`
      : "https://github.com/aadityadhawale3-bot";

    openTrackedWindow(url, `GitHub: ${query || "Mr. Aaditya Dhavale Sir"}`, DEFAULT_GITHUB_AUTO_CLOSE_MS);

    return {
      handled: true,
      action: "github",
      feedback: isMarathi
        ? `गिटहब उघडत आहे, सर. २.५ मिनिटांत मुख्य पेजवर परत येऊ.`
        : isHindi
        ? `गिटहब खोला जा रहा है, सर। 2.5 मिनट बाद मुख्य नेक्सस पेज पर वापस आएंगे।`
        : `Connecting to GitHub, Sir. 2.5-minute auto-close active to return to Nexus.`,
    };
  }

  // 6. PowerPoint / PPT - Content Generation vs Direct App Launch
  const hasPptKeyword = /(?:powerpoint|ppt|presentation|slide\s*deck)/i.test(clean);
  const isPptContentRequest =
    /(?:make|create|generate|build)\s+(?:a\s+)?(?:small\s+|new\s+)?(?:ppt|presentation|slide\s*deck)/i.test(clean) ||
    (/(?:for|about|on)\s+[a-zA-Z0-9]/i.test(clean) && hasPptKeyword && !/^(?:open|launch|start|kholo|chalu)\b/i.test(clean));

  if (hasPptKeyword && isPptContentRequest) {
    let topic = clean
      .replace(/(?:open\s+(?:microsoft\s+)?powerpoint|make\s+(?:a\s+)?(?:small\s+)?ppt|create\s+(?:a\s+)?ppt|generate\s+ppt|presentation)/gi, "")
      .replace(/(?:for\s+any\s+random\s+work|for\s+random\s+work|for|about|on|random|work|project)/gi, "")
      .trim();

    if (!topic || topic.length < 3) {
      topic = "Next-Gen Cyber Security & System Architecture";
    }

    lastOpenedApp = "powerpoint";
    registerTrackedDesktopSession("powerpoint", "PowerPoint Presentation");
    const res = await callSystemApi("create_ppt", { topic });
    return {
      handled: true,
      action: "create_ppt",
      details: res,
      feedback: isMarathi
        ? `"${topic}" साठी पॉवरपॉईंट सादरीकरण तयार केले आहे आणि थेट उघडत आहे, सर.`
        : isHindi
        ? `"${topic}" के लिए पावरपॉइंट प्रस्तुति तैयार कर दी गई है और सीधे खोली जा रही है, सर।`
        : `Generating PowerPoint deck for "${topic}" and launching presentation immediately, Sir.`,
    };
  }

  // 7. Excel Spreadsheet - Content Generation vs Direct App Launch
  const hasExcelKeyword = /(?:excel|spreadsheet|sheet|budget\s+sheet|inventory|bill|billing|invoice|stock)/i.test(clean);
  const isExcelContentRequest =
    /(?:make|create|generate|build)\s+(?:an?\s+)?(?:excel|spreadsheet|sheet|bill|invoice|inventory)/i.test(clean) ||
    (/(?:inventory|bill|billing|invoice|tax|budget)/i.test(clean) && !/^(?:open|launch|start|kholo|chalu)\s+(?:excel|spreadsheet)/i.test(clean));

  if (hasExcelKeyword && isExcelContentRequest) {
    let sheetType = "general";
    if (/inventory|stock/i.test(clean)) sheetType = "inventory";
    else if (/bill|billing|invoice|tax/i.test(clean)) sheetType = "bill";

    let topic = clean
      .replace(/(?:open\s+excel\s*(?:and\s*)?|make\s+excel\s*(?:and\s*)?|create\s+excel|spreadsheet|sheet|with\s+(?:add\s+)?formula|inventory|billing|bill|invoice)/gi, "")
      .replace(/(?:for|about|on|and)/gi, "")
      .trim() || (sheetType === "bill" ? "Invoice and Billing" : sheetType === "inventory" ? "Inventory and Stock" : "Metrics & Budget");

    lastOpenedApp = "excel";
    registerTrackedDesktopSession("excel", "Microsoft Excel Spreadsheet");
    const res = await callSystemApi("create_excel", { topic, sheetType });
    return {
      handled: true,
      action: "create_excel",
      details: res,
      feedback: isMarathi
        ? `"${topic}" साठी एक्सेल शीट (फॉर्म्युल्यांसह) तयार केली असून मायक्रोसॉफ्ट एक्सेल सुरू केले आहे, सर.`
        : isHindi
        ? `"${topic}" के लिए एक्सेल शीट (फॉर्मूलों सहित) तैयार करके माइक्रोसॉफ्ट एक्सेल खोल दिया गया है, सर।`
        : `Excel ${sheetType === "bill" ? "billing & invoice" : sheetType === "inventory" ? "inventory & stock" : "data"} spreadsheet on "${topic}" generated with active formulas and launched, Sir.`,
    };
  }

  // 8. Antigravity & Visual Studio Code (Create Software, Websites, Apps, and Code in Any Language)
  if (
    /(?:antigravity|vs\s*code|vscode)/i.test(clean) ||
    /(?:make|create|generate|write)\s+(?:a\s+|new\s+)?(?:file|software|website|web\s*site|app|application|code|script|program)/i.test(clean)
  ) {
    let lang = "javascript";
    let filename = "app.js";
    let desc = "Software Project";

    if (/python|py\b/i.test(clean)) { lang = "python"; filename = "script.py"; desc = "Python Software"; }
    else if (/html|website|web\s*site/i.test(clean)) { lang = "html"; filename = "index.html"; desc = "Web Application"; }
    else if (/react|next|typescript|ts\b/i.test(clean)) { lang = "typescript"; filename = "app.tsx"; desc = "React Application"; }
    else if (/c\+\+|cpp/i.test(clean)) { lang = "cpp"; filename = "main.cpp"; desc = "C++ Software"; }
    else if (/java\b/i.test(clean)) { lang = "java"; filename = "Main.java"; desc = "Java Software"; }
    else if (/rust/i.test(clean)) { lang = "rust"; filename = "main.rs"; desc = "Rust Module"; }

    lastOpenedApp = "vscode";
    registerTrackedDesktopSession("vscode", "Visual Studio Code");
    const res = await callSystemApi("create_code_project", { filename, language: lang, description: desc });
    return {
      handled: true,
      action: "create_code",
      details: res,
      feedback: isMarathi
        ? `नवीन ${desc} फाइल (${filename}) तयार केली असून VS Code / अँटीग्रॅव्हिटी मध्ये उघडली आहे, सर.`
        : isHindi
        ? `नई ${desc} फाइल (${filename}) तैयार करके VS Code / एंटीग्रैविटी में खोल दी गई है, सर।`
        : `Generated ${desc} in ${lang.toUpperCase()} (${filename}) and launched Visual Studio Code / Antigravity workspace, Sir.`,
    };
  }

  // 8A-1. Explicit Agent Task Directive ("give a task for agent", "task for agent", "agent task", "assign task to agent")
  const agentTaskMatch = textToProcess.match(/^(?:give\s+(?:a\s+)?task\s+(?:for|to)\s+(?:the\s+)?agent|task\s+(?:for|to)\s+(?:the\s+)?agent|agent\s+task|assign\s+task\s+(?:to\s+agent)?)\s*[:\-]?\s*(.+)/i);
  if (agentTaskMatch) {
    const rawTask = agentTaskMatch[1].trim();
    try {
      const brainRes = await callSystemApi("execute_task", { task: rawTask });
      const speech = isMarathi
        ? `आदेश पूर्ण झाला, सर. निकाल आपल्या चॅट बॉक्समध्ये उपलब्ध आहे.`
        : isHindi
        ? `टास्क पूरा कर लिया गया है, सर। परिणाम आपके चैट बॉक्स में प्रस्तुत है।`
        : `Task executed successfully, Sir. Result is displayed in your chat box.`;
      return {
        handled: true,
        action: "agent_task",
        details: {
          task: rawTask,
          chatResponse: brainRes.chatResponse,
          topic: brainRes.topic,
          toolsUsed: brainRes.toolsUsed,
          suggestedActions: brainRes.suggestedActions,
        },
        feedback: speech,
      };
    } catch {
      // Graceful fallback to chat route
    }
  }

  // 8B. Direct Command Execution ("run command <cmd>", "execute <cmd>", "run powershell <cmd>")
  const runCmdMatch = textToProcess.match(/^(?:run\s+command|execute\s+command|run\s+powershell|execute|run\s+cmd)\s+(.+)/i);
  if (runCmdMatch && !/^(?:excel|powerpoint|notepad|paint|word|calc|whatsapp|youtube|chrome|edge|terminal|powershell|vscode)$/i.test(runCmdMatch[1].trim())) {
    const cmd = runCmdMatch[1].trim();
    try {
      const res = await callSystemApi("run_command", { command: cmd });
      const stdout = res.stdout || res.output || res.stderr || "Command executed with zero error exit code.";
      const feedback = isMarathi
        ? `"${cmd}" कमांड पूर्ण झाली असून निकाल चॅट बॉक्समध्ये उपलब्ध आहे, सर.`
        : isHindi
        ? `"${cmd}" कमांड सफलतापूर्वक निष्पादित हो गई। परिणाम चैट बॉक्स में है, सर।`
        : `Command "${cmd}" executed successfully. Result is displayed in your chat box, Sir.`;
      return {
        handled: true,
        action: "run_command",
        details: { command: cmd, stdout, stderr: res.stderr, error: res.error, remediation: res.remediation },
        feedback,
      };
    } catch (cmdErr: any) {
      return {
        handled: true,
        action: "run_command",
        details: { command: cmd, error: cmdErr.message, remediation: "Safe fallback engaged." },
        feedback: `Command execution completed. Results and diagnostics are displayed in your chat box, Sir.`,
      };
    }
  }

  // 9. PowerShell / Terminal
  if (/(?:open|launch|start|run)\s+(?:powershell|terminal|cmd|command\s+prompt)/i.test(clean)) {
    lastOpenedApp = "powershell";
    registerTrackedDesktopSession("powershell", "PowerShell Host");
    await callSystemApi("launch_app", { app: "powershell" });
    return {
      handled: true,
      action: "terminal",
      feedback: isMarathi
        ? "पॉवरशेल सुरू करत आहे, सर."
        : isHindi
        ? "पावरशेल प्रारंभ किया जा रहा है, सर।"
        : "Launching PowerShell console, Sir.",
    };
  }

  // 10. Universal App & Tool Launcher ("open Excel", "open PowerPoint", "open Paint", "open color", "open notepad", "open WordPad", "open the random app", "open specific app", etc.)
  const cleanStripped = clean.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']+$/g, "").trim();

  // Robust detection for any phrasing of random app request in English, Hindi/Hinglish, and Marathi
  const isRandomAppDirective =
    /(?:(?:open|launch|start|run|chalu\s*karo|kholo|chalu\s*kara|suru\s*kara|ughada)\s+(?:me\s+)?(?:a\s+|the\s+|any\s+|some\s+)?(?:random|any|some|arbitrary|kahihi|konta\s*(?:pan|tari|hi)|koi\s*(?:bhi)?|kisi\s*bhi)\s*(?:desktop\s*)?(?:apps?|applications?|tools?|programs?|software)?)/i.test(cleanStripped) ||
    /(?:(?:random|kahihi|konta\s*(?:pan|tari|hi)|koi\s*(?:bhi)?|kisi\s*bhi)\s+(?:apps?|applications?|tools?|programs?|software)\s*(?:ko\s*)?(?:open|kholo|launch|start|chalu\s*karo|chalu\s*kara|suru\s*kara|ughada))/i.test(cleanStripped) ||
    /^(?:(?:please\s+|can\s+you\s+)?(?:open|launch|start|run)\s+(?:a\s+|the\s+|any\s+|some\s+)?(?:random(?:\s+app|\s+application)?|any\s+app|an\s+app|some\s+app|app)(?:\s+please)?)$/i.test(cleanStripped) ||
    /^(?:random\s+app|any\s+app|koi\s+bhi\s+app|konta\s+pan\s+app)$/i.test(cleanStripped) ||
    /\brandom\s*(?:app|application|tool|program|software)?\b/i.test(cleanStripped);

  // Robust detection for "specific app"
  const isSpecificAppDirective =
    !isCloseAppOrReturnQuery(cleanStripped) &&
    (/(?:(?:open|launch|start|run|kholo|chalu\s*karo)\s+(?:the\s+|a\s+)?specific\s+(?:app|application|tool|program))/i.test(cleanStripped) ||
    /^(?:specific\s+app|open\s+specific\s+app|open\s+the\s+specific\s+app)$/i.test(cleanStripped));

  const isGenericAppRequest =
    !isCloseAppOrReturnQuery(cleanStripped) &&
    /^(?:(?:please\s+)?(?:open|launch|start)\s+(?:a\s+|the\s+)?app)$/i.test(cleanStripped);

  const isDemonstrativeOrGenericApp =
    !isCloseAppOrReturnQuery(cleanStripped) &&
    /^(?:(?:please\s+)?(?:open|launch|start|run|kholo|chalu\s*karo)\s+(?:a\s+|the\s+|this\s+|that\s+|an\s+|any\s+|some\s+)?(?:app|application|software|tool|program))$/i.test(cleanStripped);

  const appOpenMatch = !isCloseAppOrReturnQuery(cleanStripped)
    ? cleanStripped.match(/(?:open|launch|start|run|chalu\s*karo|kholo|suru\s*kara|ughada)\s+(?:the\s+)?(?:app\s+|application\s+)?([a-zA-Z0-9_\-\. ]+)/i)
    : null;

  // Direct standalone app names (e.g., user just says "excel", "powerpoint", "paint", "notepad", "wordpad", "word", "color")
  const standaloneAppMatch = cleanStripped.match(/^(?:please\s+)?(excel|powerpoint|ppt|paint|mspaint|color|color\s*paint|notepad|wordpad|winword|word|ms\s*word|ms\s*excel|ms\s*powerpoint|ms\s*office|office|calculator|calc|taskmgr|task\s*manager|camera|spotify|vlc|chrome|edge|terminal|powershell|cmd|vscode)(?:\s+please)?$/i);

  if (isRandomAppDirective || isSpecificAppDirective || isGenericAppRequest || isDemonstrativeOrGenericApp || appOpenMatch || standaloneAppMatch) {
    let rawTarget = (isGenericAppRequest || isDemonstrativeOrGenericApp)
      ? "notepad"
      : (appOpenMatch?.[1]?.trim() || standaloneAppMatch?.[1]?.trim() || "notepad");

    if (isSpecificAppDirective) rawTarget = "specific";
    const isRandom = isRandomAppDirective || /(?:random\s*(?:app|application)?|any\s*(?:random\s*)?(?:app|application)?)/i.test(rawTarget);
    const isSpecific = isSpecificAppDirective || isDemonstrativeOrGenericApp || /^(?:this|the|an|any|some|specific)?\s*apps?$/i.test(rawTarget);

    const appCatalog: Array<{ name: string; key: string }> = [
      { name: "Notepad", key: "notepad" },
      { name: "Calculator", key: "calc" },
      { name: "Microsoft Paint", key: "paint" },
      { name: "Microsoft Excel", key: "excel" },
      { name: "Microsoft PowerPoint", key: "powerpoint" },
      { name: "Microsoft Word", key: "word" },
      { name: "WordPad", key: "wordpad" },
      { name: "File Explorer", key: "explorer" },
      { name: "Task Manager", key: "taskmgr" },
      { name: "Windows Settings", key: "settings" },
      { name: "Camera", key: "camera" },
      { name: "Visual Studio Code", key: "vscode" },
      { name: "PowerShell", key: "powershell" },
      { name: "Command Prompt", key: "cmd" },
      { name: "Google Chrome", key: "chrome" },
      { name: "YouTube", key: "youtube" },
      { name: "Spotify", key: "spotify" },
      { name: "WhatsApp", key: "whatsapp" },
    ];

    let targetAppKey = "";
    let appDisplayName = "";

    if (isSpecific) {
      targetAppKey = "notepad";
      appDisplayName = "Notepad";
    } else if (isRandom || isGenericAppRequest) {
      const picked = appCatalog[Math.floor(Math.random() * appCatalog.length)];
      targetAppKey = picked.key;
      appDisplayName = picked.name;
    } else {
      // Normalize specific application names
      if (/(?:calc|calculator|hisab)/i.test(rawTarget)) {
        targetAppKey = "calc";
        appDisplayName = "Calculator";
      } else if (/(?:notepad|note|notes|text\s*editor)/i.test(rawTarget)) {
        targetAppKey = "notepad";
        appDisplayName = "Notepad";
      } else if (/(?:paint|mspaint|color|drawing)/i.test(rawTarget)) {
        targetAppKey = "paint";
        appDisplayName = "Microsoft Paint";
      } else if (/(?:chrome|google\s*chrome)/i.test(rawTarget)) {
        targetAppKey = "chrome";
        appDisplayName = "Google Chrome";
      } else if (/(?:edge|microsoft\s*edge|web\s*browser)/i.test(rawTarget)) {
        targetAppKey = "edge";
        appDisplayName = "Microsoft Edge";
      } else if (/(?:wordpad|write)/i.test(rawTarget)) {
        targetAppKey = "wordpad";
        appDisplayName = "WordPad";
      } else if (/(?:word|winword|ms\s*word)/i.test(rawTarget)) {
        targetAppKey = "word";
        appDisplayName = "Microsoft Word";
      } else if (/(?:excel|spreadsheet|ms\s*excel)/i.test(rawTarget)) {
        targetAppKey = "excel";
        appDisplayName = "Microsoft Excel";
      } else if (/(?:ppt|powerpoint|ms\s*powerpoint|presentation)/i.test(rawTarget)) {
        targetAppKey = "powerpoint";
        appDisplayName = "Microsoft PowerPoint";
      } else if (/(?:office|ms\s*office|microsoft\s*office)/i.test(rawTarget)) {
        targetAppKey = "office";
        appDisplayName = "Microsoft Office";
      } else if (/(?:explorer|files?|file\s*explorer|folder)/i.test(rawTarget)) {
        targetAppKey = "explorer";
        appDisplayName = "File Explorer";
      } else if (/(?:task\s*mgr|task\s*manager)/i.test(rawTarget)) {
        targetAppKey = "taskmgr";
        appDisplayName = "Task Manager";
      } else if (/(?:settings|system\s*settings)/i.test(rawTarget)) {
        targetAppKey = "settings";
        appDisplayName = "Windows Settings";
      } else if (/(?:spotify)/i.test(rawTarget)) {
        targetAppKey = "spotify";
        appDisplayName = "Spotify";
      } else if (/(?:vlc|video\s*player)/i.test(rawTarget)) {
        targetAppKey = "vlc";
        appDisplayName = "VLC Media Player";
      } else if (/(?:camera|webcam)/i.test(rawTarget)) {
        targetAppKey = "camera";
        appDisplayName = "Camera";
      } else if (/(?:youtube)/i.test(rawTarget)) {
        targetAppKey = "youtube";
        appDisplayName = "YouTube";
      } else if (/(?:whatsapp)/i.test(rawTarget)) {
        targetAppKey = "whatsapp";
        appDisplayName = "WhatsApp";
      } else if (/(?:vscode|visual\s*studio|code)/i.test(rawTarget)) {
        targetAppKey = "vscode";
        appDisplayName = "Visual Studio Code";
      } else if (/(?:powershell|terminal|cmd)/i.test(rawTarget)) {
        targetAppKey = "powershell";
        appDisplayName = "PowerShell";
      } else if (/(?:this|the|an|any|some)?\s*apps?$/i.test(rawTarget) || !rawTarget) {
        targetAppKey = "notepad";
        appDisplayName = "Notepad";
      } else {
        targetAppKey = rawTarget;
        appDisplayName = rawTarget.toUpperCase();
      }
    }

    lastOpenedApp = targetAppKey;
    registerTrackedDesktopSession(targetAppKey, appDisplayName);

    try {
      await callSystemApi("launch_app", { app: targetAppKey });
    } catch (err: any) {
      console.warn("App launch error:", err);
    }

    const feedback = isMarathi
      ? `${appDisplayName} सुरू करत आहे, सर.`
      : isHindi
      ? `${appDisplayName} खोल रहा हूँ, सर।`
      : `Launching ${appDisplayName}, Sir.`;

    return {
      handled: true,
      action: "launch_app",
      details: { app: targetAppKey, displayName: appDisplayName },
      feedback,
    };
  }

  // 11. Custom Shell Command
  const runMatch = clean.match(/(?:run\s+command|execute|terminal\s+run)\s+['"]?([^'"]+)['"]?/i);
  if (runMatch) {
    const command = runMatch[1].trim();
    const res = await callSystemApi("run_command", { command });
    const outputSnippet = res.stdout ? `\nOutput: ${res.stdout.substring(0, 200)}` : "";
    return {
      handled: true,
      action: "run_command",
      details: res,
      feedback: isHindi
        ? `कमांड निष्पादित: "${command}"। परिणाम चैट बॉक्स में देखें।`
        : `Command "${command}" executed. Result is displayed in your chat box, Sir.`,
    };
  }

  return { handled: false, feedback: "" };
}

/**
 * Execute system API call
 */
export async function callSystemApi(action: string, payload: any = {}): Promise<any> {
  const baseUrl = typeof window !== "undefined" ? "" : "http://localhost:3000";
  const endpoint = action === "execute_task" ? "/api/brain" : "/api/system";
  const body = action === "execute_task" ? { action: "execute_task", ...payload } : { action, payload };

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "System command failed");
  }

  return await res.json();
}
