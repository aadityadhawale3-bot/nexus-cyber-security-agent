"use client";


import React, { useCallback, useEffect, useRef, useState } from "react";
import { createOrbScene, type OrbSceneApi, type AgentState } from "@/lib/orbScene";
import { VoiceEngine, type VoiceGender } from "@/lib/voiceEngine";
import {
  SUPPORTED_LANGUAGES,
  DOMAIN_PRESETS,
  CREATOR_PROFILE,
  type ChatMessage,
  generateLocalNexusResponse,
  isIntroductionOrCreatorQuery,
} from "@/lib/nexusAI";
import {
  tryExecuteSystemCommand,
  callSystemApi,
  SYSTEM_QUICK_ACTIONS,
  type QuickActionItem,
  type TrackedWindowSession,
  openTrackedWindow,
  closeAllTrackedWindows,
  subscribeToTrackedSessions,
  DEFAULT_GITHUB_AUTO_CLOSE_MS,
} from "@/lib/systemBridge";
import EarthGlobeWidget from "@/components/EarthGlobeWidget";
import WeatherWidget from "@/components/WeatherWidget";

export default function NexusOrb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<OrbSceneApi | null>(null);
  const voiceEngineRef = useRef<VoiceEngine | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);

  const [toast, setToast] = useState<string | null>(null);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [language, setLanguage] = useState<string>("en-US");
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("male");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.0-flash");
  const [autoListen, setAutoListen] = useState<boolean>(true);
  const [caption, setCaption] = useState<{
    speaker: string;
    text: string;
    fullContent?: string;
    mediaType?: "video" | "image" | null;
    mediaPayload?: any;
  } | null>({
    speaker: "N.E.X.U.S.",
    text: "Neural OS Core Online. Standing by for voice orders, Sir.",
    fullContent:
      "⚡ **N.E.X.U.S. NEURAL OS // SYSTEMS OPERATIONAL**\n\nGreetings, Sir. All cognitive matrices, continuous speech recognition, and OS bridges are active.\n\n• **Voice Mode:** Continuous Auto-Listen enabled. Speak freely.\n• **Problem Solving:** Multidisciplinary academic rigor (Math, Physics, Chemistry, Biology, CS).\n• **Autonomous Tools:** YouTube video player, SVG image generation, and system automation.",
  });
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [liveAudioLevel, setLiveAudioLevel] = useState<number>(0);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [micTestActive, setMicTestActive] = useState<boolean>(false);
  const [micTestEnergy, setMicTestEnergy] = useState<number>(0);
  const handleUserQueryRef = useRef<(text: string) => Promise<void>>(async () => { });

  // Universal Agent Brain State (Episodic, Semantic, Procedural)
  const [brainOpen, setBrainOpen] = useState<boolean>(false);
  const [brainTelemetry, setBrainTelemetry] = useState<{
    agentName: string;
    episodicCount: number;
    semanticCount: number;
    proceduralCount: number;
    lastActive: number;
    storagePath: string;
  } | null>(null);
  const [brainEpisodic, setBrainEpisodic] = useState<Array<{ role: string; content: string; timestamp: number }>>([]);
  const [brainSemantic, setBrainSemantic] = useState<Array<{ id: string; document: string; metadata: any; timestamp: number }>>([]);
  const [brainTools, setBrainTools] = useState<Array<{ name: string; description: string; schema?: any }>>([]);
  const [brainActiveTab, setBrainActiveTab] = useState<"semantic" | "episodic" | "procedural" | "security">("semantic");
  const [brainQuery, setBrainQuery] = useState<string>("");
  const [brainRecallResults, setBrainRecallResults] = useState<Array<{ id: string; document: string; score: number }>>([]);
  const [newFactDoc, setNewFactDoc] = useState<string>("");
  const [newFactCategory, setNewFactCategory] = useState<string>("user_preference");
  const [toolResultOutput, setToolResultOutput] = useState<string | null>(null);

  // Security Agent Brain (Threat Intelligence & Defensive Cryptography)
  const [threatIntelList, setThreatIntelList] = useState<Array<{ intelId: string; domain: string; description: string; remediation: string }>>([]);
  const [entropyInput, setEntropyInput] = useState<string>("U2VjdXJlX1BheWxvYWRfMjAyNg==");
  const [entropyResult, setEntropyResult] = useState<any>(null);
  const [cryptoCipher, setCryptoCipher] = useState<string>("AES-256-GCM");
  const [cryptoHash, setCryptoHash] = useState<string>("SHA-256");
  const [cryptoKeyLen, setCryptoKeyLen] = useState<number>(256);
  const [cryptoBlinded, setCryptoBlinded] = useState<boolean>(true);
  const [cryptoAuditResult, setCryptoAuditResult] = useState<any>(null);
  const [owaspCode, setOwaspCode] = useState<string>("const query = 'SELECT * FROM users WHERE id = ' + req.body.id;");
  const [owaspResult, setOwaspResult] = useState<any>(null);
  const [securityReasoningQuery, setSecurityReasoningQuery] = useState<string>("What is the industry mitigation strategy for timing anomalies in an RSA cipher implementation?");
  const [securityReasoningResult, setSecurityReasoningResult] = useState<any>(null);
  const [newIntelId, setNewIntelId] = useState<string>("");
  const [newIntelDomain, setNewIntelDomain] = useState<string>("cryptography");
  const [newIntelDesc, setNewIntelDesc] = useState<string>("");
  const [newIntelRemediation, setNewIntelRemediation] = useState<string>("");

  const DEFAULT_WELCOME_MSG: ChatMessage = {
    role: "assistant",
    content:
      "Greetings. I am N.E.X.U.S., an advanced neural artificial intelligence created by Mr. Aaditya Dhavale Sir. All cognitive protocols, memory matrices, and OS automation bridges are operational. You can give me any task directly in this chat box, Sir.",
    speechText: "Greetings. I am Nexus, created by Mr. Aaditya Dhavale Sir. All cognitive protocols and automation systems are operational. How may I assist you, Sir?",
    thoughtSteps: [
      "Bootstrapped N.E.X.U.S. Cognitive Architecture",
      "Loaded Episodic, Semantic, and Procedural Memory registries",
      "Verified local OS automation bridges and interactive Chat Box",
    ],
    thoughtDuration: "Thought for 0.2s",
    suggestedActions: [
      { label: "🚀 Create App / Code", action: "chat", payload: "Create a modern Next.js dashboard project" },
      { label: "🛡️ Cyber Threat Audit", action: "chat", payload: "Audit system security and cipher strength" },
      { label: "📊 Generate Excel Sheet", action: "chat", payload: "Make an Excel sheet for monthly expenses with formulas" },
      { label: "🧠 Open Brain Inspector", action: "open_brain" },
    ],
    timestamp: Date.now(),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME_MSG]);
  const [textInput, setTextInput] = useState<string>("");

  // Gemini-style Cognitive Thinking & Interactive Actions State
  const [expandedThoughts, setExpandedThoughts] = useState<Record<number, boolean>>({ 0: false });
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const toggleThought = (idx: number) => {
    setExpandedThoughts((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      showToast("Code copied to clipboard!");
      setTimeout(() => setCopiedCodeId((cur) => (cur === id ? null : cur)), 2500);
    } catch {
      showToast("Could not copy to clipboard.");
    }
  };

  const handleRunCodeInWorkspace = async (code: string, lang = "javascript") => {
    try {
      showToast("Deploying code to workspace & executing...");
      const isPy = lang.includes("python") || /import |def |print\(/.test(code);
      const isHtml = lang.includes("html") || /<html|<!DOCTYPE/i.test(code);
      const targetFilename = isPy ? `script_${Date.now()}.py` : isHtml ? `page_${Date.now()}.html` : `app_${Date.now()}.js`;

      await callSystemApi("create_code_project", {
        filename: targetFilename,
        code,
        language: isPy ? "python" : isHtml ? "html" : "javascript",
      });

      if (isHtml) {
        showToast("HTML web application deployed & opened in browser!");
        return;
      }

      const runCmd = isPy ? `python "exports/projects/${targetFilename}"` : `node "exports/projects/${targetFilename}"`;
      const runRes = await callSystemApi("run_command", { command: runCmd });
      const out = runRes.stdout || runRes.stderr || runRes.output || "Execution completed with code 0.";
      const remediation = runRes.remediation ? `\n\n💡 **Advisory:** ${runRes.remediation}` : "";

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: `⚡ **WORKSPACE RUNNER // ${targetFilename}**\n\n\`\`\`\n${out}\n\`\`\`${remediation}`,
        speechText: `Execution completed for ${targetFilename}. Result is displayed in your chat box, Sir.`,
        thoughtSteps: [
          `Wrote code to exports/projects/${targetFilename}`,
          `Spawned ${isPy ? "Python" : "Node.js"} runtime environment`,
          "Captured standard output stream telemetry",
        ],
        thoughtDuration: "Thought for 0.4s",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setChatOpen(true);
      voiceEngineRef.current?.speak("Execution completed. Result is displayed in your chat box, Sir.");
    } catch (err: any) {
      showToast(`Run error: ${err.message}`);
    }
  };

  const handleActionChipClick = (act: { label: string; action: string; payload?: any }) => {
    if (act.action === "chat" && typeof act.payload === "string") {
      void handleUserQuery(act.payload);
    } else if (act.action === "open_brain") {
      setBrainOpen(true);
      void fetchBrainState();
    } else if (act.action === "open_url" && act.payload?.url) {
      openTrackedWindow(act.payload.url, act.label, 0);
    } else if (act.action === "launch_app" && act.payload?.app) {
      void callSystemApi("launch_app", { app: act.payload.app });
      showToast(`Launched ${act.payload.app}`);
    } else if (act.action === "create_code") {
      void callSystemApi("create_code_project", act.payload || {});
      showToast("Code project created and opened in VS Code!");
    } else if (act.action === "create_excel") {
      void callSystemApi("create_excel", act.payload || {});
      showToast("Excel spreadsheet created!");
    } else if (act.action === "run_command" && act.payload) {
      void handleUserQuery(`run command ${act.payload}`);
    } else if (typeof act.payload === "string") {
      void handleUserQuery(act.payload);
    }
  };

  const streamAssistantMessage = (msg: ChatMessage, onComplete?: () => void) => {
    setIsStreaming(true);
    const fullContent = msg.content;
    const initialMsg: ChatMessage = { ...msg, content: "" };

    setMessages((prev) => [...prev, initialMsg]);

    let charIndex = 0;
    const totalChars = fullContent.length;

    const timer = setInterval(() => {
      const chunk = Math.max(4, Math.min(16, Math.ceil((totalChars - charIndex) / 18)));
      charIndex += chunk;

      if (charIndex >= totalChars) {
        clearInterval(timer);
        setIsStreaming(false);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = msg;
          return updated;
        });
        onComplete?.();
      } else {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...msg,
            content: fullContent.slice(0, charIndex),
          };
          return updated;
        });
      }
    }, 16);
  };

  // --- Cyber-Markdown & Terminal Code Formatter ---
  const renderInline = (str: string): React.ReactNode[] => {
    const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyIdx = 0;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(
          <strong key={`b-${keyIdx++}`} className="msg-bold">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(
          <code key={`c-${keyIdx++}`} className="msg-inline-code">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
        const endLabel = token.indexOf("](");
        const label = token.slice(1, endLabel);
        const url = token.slice(endLabel + 2, -1);
        parts.push(
          <a
            key={`a-${keyIdx++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="msg-link"
            onClick={(e) => {
              if (url.startsWith("http")) {
                e.preventDefault();
                openTrackedWindow(url, label, 0);
              }
            }}
          >
            {label}
          </a>
        );
      }
      lastIndex = match.index + token.length;
    }
    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }
    return parts.length > 0 ? parts : [str];
  };

  const renderMarkdownText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lIdx) => {
      if (!line.trim()) {
        return <div key={`sp-${lIdx}`} className="msg-line-spacer" />;
      }
      if (line.startsWith("### ")) {
        return <h4 key={`h4-${lIdx}`} className="msg-heading-h4">{renderInline(line.slice(4))}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={`h3-${lIdx}`} className="msg-heading-h3">{renderInline(line.slice(3))}</h3>;
      }
      if (line.startsWith("# ")) {
        return <h2 key={`h2-${lIdx}`} className="msg-heading-h2">{renderInline(line.slice(2))}</h2>;
      }
      if (/^\s*[•\-\*]\s+/.test(line)) {
        const clean = line.replace(/^\s*[•\-\*]\s+/, "");
        return (
          <div key={`li-${lIdx}`} className="msg-bullet-line">
            <span className="bullet-point">▸</span>
            <span>{renderInline(clean)}</span>
          </div>
        );
      }
      return (
        <p key={`p-${lIdx}`} className="msg-paragraph-line">
          {renderInline(line)}
        </p>
      );
    });
  };

  const renderFormattedMessage = (content: string, isStreamingThis: boolean) => {
    // Purify content: strip off-topic thinking tags and leaked speech markers
    const cleanContent = (content || "")
      .replace(/<(?:thought|think)>[\s\S]*?<\/(?:thought|think)>/gi, "")
      .replace(/<speech>[\s\S]*?<\/speech>/gi, "")
      .trim();

    const parts: React.ReactNode[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_\-\+\.]*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let partIdx = 0;

    while ((match = codeBlockRegex.exec(cleanContent)) !== null) {
      const textBefore = cleanContent.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(
          <div key={`text-${partIdx++}`} className="msg-markdown-block">
            {renderMarkdownText(textBefore)}
          </div>
        );
      }

      const lang = (match[1] || "code").toLowerCase();
      const code = match[2].trim();
      const codeId = `code-${partIdx++}`;

      parts.push(
        <div key={codeId} className="terminal-code-card">
          <div className="code-card-header">
            <span className="code-lang-tag">
              <span className="code-lang-dot" />
              {lang.toUpperCase() || "SNIPPET"}
            </span>
            <div className="code-card-actions">
              <button
                type="button"
                className="code-action-btn copy-btn"
                onClick={() => handleCopyCode(code, codeId)}
                title="Copy code to clipboard"
              >
                {copiedCodeId === codeId ? "✓ COPIED" : "📋 COPY"}
              </button>
              <button
                type="button"
                className="code-action-btn run-btn"
                onClick={() => handleRunCodeInWorkspace(code, lang)}
                title="Execute autonomously in local workspace runner"
              >
                ▶ RUN IN WORKSPACE
              </button>
            </div>
          </div>
          <pre className="code-card-pre">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    const remainingText = cleanContent.substring(lastIndex);
    if (remainingText || parts.length === 0) {
      parts.push(
        <div key="text-remaining" className="msg-markdown-block">
          {renderMarkdownText(remainingText)}
          {isStreamingThis && <span className="streaming-cursor">▍</span>}
        </div>
      );
    } else if (isStreamingThis) {
      parts.push(<span key="cursor" className="streaming-cursor">▍</span>);
    }

    return parts;
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = createOrbScene(container);
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Load saved conversation history & preferences
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("nexus_conversation_history");
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
      const savedKey = localStorage.getItem("nexus_api_key");
      if (savedKey) setApiKey(savedKey);
      const savedLang = localStorage.getItem("nexus_lang");
      if (savedLang) setLanguage(savedLang);
      const savedGender = localStorage.getItem("nexus_voice_gender") as VoiceGender;
      if (savedGender === "male" || savedGender === "female") setVoiceGender(savedGender);
      const savedModel = localStorage.getItem("nexus_model");
      if (savedModel) setSelectedModel(savedModel);
      const savedAutoListen = localStorage.getItem("nexus_auto_listen");
      if (savedAutoListen !== null) setAutoListen(savedAutoListen === "true");
      else setAutoListen(true);
    } catch {
      // ignore
    }
  }, []);

  // Automatic Hands-Free Microphone Activation on Mount / First User Interaction
  useEffect(() => {
    if (!autoListen) return;
    const triggerAutoListen = () => {
      if (voiceEngineRef.current && !voiceEngineRef.current.getIsListening() && !voiceEngineRef.current.getIsSpeaking()) {
        try {
          void voiceEngineRef.current.startListening(true, false);
        } catch { }
      }
    };

    const timer = setTimeout(triggerAutoListen, 800);

    const onUserInteraction = () => {
      triggerAutoListen();
      window.removeEventListener("click", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
    };

    window.addEventListener("click", onUserInteraction, { once: true });
    window.addEventListener("keydown", onUserInteraction, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
    };
  }, [autoListen]);

  // Persist conversation history to localStorage on updates
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && messages.length > 0) {
        localStorage.setItem("nexus_conversation_history", JSON.stringify(messages));
      }
    } catch (e) {
      console.warn("Could not save conversation history:", e);
    }
  }, [messages]);

  // Purge recorded conversation history
  const clearConversationHistory = () => {
    try {
      localStorage.removeItem("nexus_conversation_history");
    } catch { }
    setMessages([DEFAULT_WELCOME_MSG]);
    showToast("Conversation memory cleared & reset.");
  };

  // Load Brain Telemetry & Knowledge State
  const fetchBrainState = async () => {
    try {
      const res = await fetch("/api/brain");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBrainTelemetry(data.telemetry);
          setBrainEpisodic(data.episodic || []);
          setBrainSemantic(data.semantic || []);
          setBrainTools(data.tools || []);
          setThreatIntelList(data.threatIntel || []);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch brain state:", e);
    }
  };

  useEffect(() => {
    void fetchBrainState();
  }, []);

  const handleMemorizeFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactDoc.trim()) return;
    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "memorize",
          document: newFactDoc.trim(),
          metadata: { category: newFactCategory, source: "brain_inspector" },
        }),
      });
      if (res.ok) {
        setNewFactDoc("");
        showToast("Fact committed to long-term semantic memory.");
        void fetchBrainState();
      }
    } catch {
      showToast("Error memorizing fact.");
    }
  };

  const handleRecallSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brainQuery.trim()) return;
    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recall",
          query: brainQuery.trim(),
          limit: 6,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBrainRecallResults(data.results || []);
      }
    } catch {
      showToast("Recall query failed.");
    }
  };

  const handleDeleteFact = async (factId: string) => {
    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_fact", factId }),
      });
      if (res.ok) {
        showToast(`Fact '${factId}' removed from memory.`);
        void fetchBrainState();
      }
    } catch {
      showToast("Failed to delete fact.");
    }
  };

  const handleClearEpisodic = async () => {
    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_episodic" }),
      });
      if (res.ok) {
        showToast("Episodic memory buffer cleared.");
        void fetchBrainState();
      }
    } catch {
      showToast("Failed to clear episodic buffer.");
    }
  };

  const handleExecuteTool = async (toolName: string) => {
    try {
      setToolResultOutput(`Executing skill '${toolName}'...`);
      let args: any[] = [];
      if (toolName === "web_search") args = ["AI Agent standards 2026"];
      else if (toolName === "read_file") args = ["package.json"];
      else if (toolName === "system_status") args = [];
      else if (toolName === "recall_memory") args = ["creator"];
      else if (toolName === "entropy_analysis") args = ["U2VjdXJlX1BheWxvYWRfMjAyNg=="];

      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute_tool", tool: toolName, args }),
      });
      if (res.ok) {
        const data = await res.json();
        setToolResultOutput(JSON.stringify(data.result, null, 2));
        showToast(`Skill '${toolName}' executed.`);
      }
    } catch (err: any) {
      setToolResultOutput(`Error executing ${toolName}: ${err.message}`);
    }
  };

  // Specialized Cyber Security Handlers
  const handleRunEntropy = async () => {
    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "entropy_analysis", data: entropyInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setEntropyResult(data.result);
        showToast(`Entropy calculated: ${data.result.entropy}`);
      }
    } catch {
      showToast("Entropy analysis failed.");
    }
  };

  const handleRunCryptoAudit = async () => {
    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cryptographic_validator",
          config: {
            cipher: cryptoCipher,
            hashAlgorithm: cryptoHash,
            keyLength: Number(cryptoKeyLen),
            isBlinded: cryptoBlinded,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCryptoAuditResult(data.result);
        showToast(data.result.compliant ? "Cipher configuration approved." : "Vulnerabilities detected!");
      }
    } catch {
      showToast("Crypto validation failed.");
    }
  };

  const handleRunOwaspScan = async () => {
    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "owasp_static_scanner", code: owaspCode }),
      });
      if (res.ok) {
        const data = await res.json();
        setOwaspResult(data.result);
        showToast(`OWASP scan complete: ${data.result.vulnerabilities?.length || 0} findings.`);
      }
    } catch {
      showToast("OWASP scan failed.");
    }
  };

  const handleRunSecurityThink = async () => {
    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "security_think", query: securityReasoningQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        setSecurityReasoningResult(data.reasoning);
        showToast(`CoT Reasoning: ${data.reasoning.execution_status}`);
      }
    } catch {
      showToast("Security reasoning query failed.");
    }
  };

  const handleIngestThreatIntel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntelId.trim() || !newIntelDesc.trim() || !newIntelRemediation.trim()) {
      showToast("Please provide Intel ID, Description, and Remediation.");
      return;
    }
    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ingest_threat_intel",
          intelId: newIntelId.trim(),
          domain: newIntelDomain,
          description: newIntelDesc.trim(),
          remediation: newIntelRemediation.trim(),
        }),
      });
      if (res.ok) {
        setNewIntelId("");
        setNewIntelDesc("");
        setNewIntelRemediation("");
        showToast("Threat intel ingested into vault.");
        void fetchBrainState();
      }
    } catch {
      showToast("Threat intel ingestion failed.");
    }
  };

  // Replay a message via speech synthesis
  const handleReplayMessage = (content: string) => {
    isProcessingRef.current = false;
    voiceEngineRef.current?.stopSpeaking();
    showToast("Replaying message...");
    setCaption({ speaker: "N.E.X.U.S.", text: content });
    voiceEngineRef.current?.speak(content);
  };

  // Audio visualizer drawing loop
  const drawVisualizer = useCallback((energy: number) => {
    const canvas = visualizerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bars = 10;
    const barWidth = 6;
    const gap = 3;
    const startX = (canvas.width - (bars * (barWidth + gap) - gap)) / 2;

    for (let i = 0; i < bars; ++i) {
      const midDist = 1 - Math.abs(i - bars / 2) / (bars / 2);
      const h = Math.max(
        3,
        Math.min(canvas.height - 4, (energy * 0.8 + 0.15) * (canvas.height - 4) * (0.4 + midDist * 0.6))
      );
      const y = (canvas.height - h) / 2;

      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, "#80f5ff");
      grad.addColorStop(1, "#0099ff");

      ctx.fillStyle = grad;
      ctx.fillRect(startX + i * (barWidth + gap), y, barWidth, h);
    }
  }, []);

  // System action notification toast
  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => {
      setToast((cur) => (cur === text ? null : cur));
    }, 4000);
  };

  // AI Response & System Command Generator
  const handleUserQuery = async (queryText: string) => {
    const cleanText = queryText.trim();
    if (!cleanText) return;

    // Acoustic Echo Shield: Reject any transcript that mirrors the AI's recent speech
    if (voiceEngineRef.current?.isAcousticEcho(cleanText)) {
      console.log("[NexusOrb] Acoustic echo loop suppressed in handleUserQuery:", cleanText);
      return;
    }

    // Interrupt any ongoing speech when user speaks a new command or close directive
    voiceEngineRef.current?.stopSpeaking();
    isProcessingRef.current = true;

    // Safety watchdog: Guarantee unlock after 4s under any unforeseen condition
    const safetyUnlock = setTimeout(() => {
      isProcessingRef.current = false;
    }, 4000);

    const doneProcessing = () => {
      clearTimeout(safetyUnlock);
      isProcessingRef.current = false;
    };

    // Add user message
    const userMsg: ChatMessage = { role: "user", content: cleanText, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setTextInput("");
    setAgentState("thinking");
    sceneRef.current?.setAgentState("thinking");
    setCaption({ speaker: "USER", text: cleanText });
    // 1. Check if directive is a Windows/Device System Command
    try {
      const sysResult = await tryExecuteSystemCommand(cleanText, language);
      if (sysResult.handled) {
        if (sysResult.action === "say_again") {
          const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
          const textToRepeat = lastAssistant
            ? lastAssistant.content.replace(/⚡.*?ONLINE/s, "").replace(/\[SYSTEM DIRECTIVE.*?\]/s, "").trim()
            : "All neural systems operational, Sir.";
          const speechText = `${sysResult.feedback} ${textToRepeat}`;
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: `[REPLAYED TRANSMISSION]\n${textToRepeat}`,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setCaption({ speaker: "N.E.X.U.S.", text: speechText, fullContent: assistantMsg.content });
          showToast("Replaying previous transmission...");
          voiceEngineRef.current?.speak(speechText, () => {
            doneProcessing();
          });
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 300);
          return;
        }

        let sysAssistantMsg: ChatMessage | null = null;

        if (sysResult.action === "introduce") {
          const introMsg: ChatMessage = {
            role: "assistant",
            content: `⚡ **N.E.X.U.S. NEURAL OS & SECURITY ARCHITECTURE ONLINE**\n\n${sysResult.feedback}\n\n🛡️ **Specialization:** Cyber Security & System Security Architecture\n💻 **System:** High-Performance Neural OS by Mr. Aaditya Dhavale Sir\n👤 **Lead Architect & Creator:** [Mr. Aaditya Dhavale Sir](https://github.com/aadityadhawale3-bot)\n🐙 **GitHub Dossier:** [github.com/aadityadhawale3-bot](https://github.com/aadityadhawale3-bot)\n✉️ **Email Comms:** [aadityadhaval3@gmail.com](mailto:aadityadhaval3@gmail.com)`,
            speechText: sysResult.feedback,
            thoughtSteps: [
              "Matched verified creator query",
              "Retrieved lead architect dossier: Mr. Aaditya Dhavale Sir",
              "Dispatched GitHub window session and system bio",
            ],
            thoughtDuration: "Thought for 0.3s",
            suggestedActions: [
              { label: "🐙 Open GitHub Dossier", action: "open_url", payload: { url: "https://github.com/aadityadhawale3-bot" } },
              { label: "🧠 Inspect Brain Memory", action: "open_brain" },
            ],
            timestamp: Date.now(),
          };
          sysAssistantMsg = introMsg;
          streamAssistantMessage(introMsg);
        } else if (sysResult.action === "agent_task") {
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: sysResult.details?.chatResponse || `⚡ **AGENT DIRECTIVE EXECUTED**\n\n${sysResult.feedback}`,
            speechText: sysResult.feedback,
            thoughtSteps: [
              `Received task directive: "${sysResult.details?.task || cleanText}"`,
              "Executed autonomous procedural tools & vector memory recall",
              "Synthesized professional deliverables in chat box",
            ],
            thoughtDuration: "Thought for 0.4s",
            suggestedActions: sysResult.details?.suggestedActions || [
              { label: "🚀 Deploy Code", action: "create_code", payload: { filename: "solution.js", language: "javascript" } },
              { label: "📊 Generate Excel Report", action: "create_excel", payload: { topic: cleanText } },
            ],
            timestamp: Date.now(),
          };
          sysAssistantMsg = assistantMsg;
          streamAssistantMessage(assistantMsg);
        } else if (sysResult.action === "run_command") {
          const outText = sysResult.details?.stdout || sysResult.details?.stderr || sysResult.details?.error || "// Command finished with zero exit code.";
          const remediationNote = sysResult.details?.remediation ? `\n\n💡 **Advisory:** ${sysResult.details?.remediation}` : "";
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: `⚡ **POWERSHELL SUBPROCESS EXECUTED**\n\n**Command:** \`${sysResult.details?.command}\`\n\n\`\`\`powershell\n${outText}\n\`\`\`${remediationNote}\n\n${sysResult.feedback}`,
            speechText: sysResult.feedback,
            thoughtSteps: [
              `Executed directive: "${sysResult.details?.command}"`,
              "Captured standard output stream telemetry",
              "Verified exit code and formatted deliverables",
            ],
            thoughtDuration: "Thought for 0.3s",
            suggestedActions: [
              { label: "⚡ Re-run Command", action: "run_command", payload: sysResult.details?.command },
              { label: "📂 Open PowerShell", action: "launch_app", payload: { app: "powershell" } },
            ],
            timestamp: Date.now(),
          };
          sysAssistantMsg = assistantMsg;
          streamAssistantMessage(assistantMsg);
        } else if (sysResult.action === "calculator_math") {
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: `🧮 **MATHEMATICAL CALCULATION EXECUTED**\n\n**Expression:** \`${sysResult.details?.expression}\`\n**Result:** **${sysResult.details?.result}**\n\n⚡ ${sysResult.feedback}`,
            speechText: sysResult.feedback,
            thoughtSteps: [
              "Parsed mathematical expression and arithmetic tokens",
              "Evaluated computation with floating-point precision",
              "Launched Windows Calculator desktop process",
            ],
            thoughtDuration: "Thought for 0.2s",
            suggestedActions: [
              { label: "🧮 Launch Calculator", action: "launch_app", payload: { app: "calc" } },
              { label: "📊 Create Excel Formula Sheet", action: "create_excel", payload: { topic: "Calculation and Formulas" } },
            ],
            timestamp: Date.now(),
          };
          sysAssistantMsg = assistantMsg;
          streamAssistantMessage(assistantMsg);
        } else if (sysResult.action === "create_code") {
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: `💻 **AUTONOMOUS CODE & PROJECT GENERATED**\n\n**File:** \`${sysResult.details?.filePath}\`\n\n\`\`\`${sysResult.details?.filePath?.endsWith(".py") ? "python" : sysResult.details?.filePath?.endsWith(".html") ? "html" : "javascript"}\n${sysResult.details?.code || "// Code deployed to workspace"}\n\`\`\`\n\n⚡ ${sysResult.feedback}`,
            speechText: sysResult.feedback,
            thoughtSteps: [
              "Analyzed software project scaffold request",
              `Engineered production code and saved to: ${sysResult.details?.filePath}`,
              "Connected Visual Studio Code / Antigravity workspace bridge",
            ],
            thoughtDuration: "Thought for 0.8s",
            suggestedActions: [
              { label: "▶ Run in Workspace", action: "run_command", payload: `node "${sysResult.details?.filePath}"` },
              { label: "📂 Open in VS Code", action: "launch_app", payload: { app: "vscode" } },
            ],
            timestamp: Date.now(),
          };
          sysAssistantMsg = assistantMsg;
          streamAssistantMessage(assistantMsg);
        } else if (sysResult.action === "create_excel") {
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: `📊 **EXCEL WORKBOOK GENERATED WITH ACTIVE FORMULAS**\n\n**File:** \`${sysResult.details?.filePath}\`\n\n⚡ ${sysResult.feedback}\n• Active formulas for SUM, IF, and GST calculations deployed.`,
            speechText: sysResult.feedback,
            thoughtSteps: [
              "Computed spreadsheet columns and active Excel mathematical formulas",
              "Generated structured CSV with live SUM, AVERAGE, and IF syntax",
              "Launched Microsoft Excel process",
            ],
            thoughtDuration: "Thought for 0.7s",
            suggestedActions: [
              { label: "📊 Open Excel", action: "launch_app", payload: { app: "excel" } },
              { label: "📦 Inventory Matrix", action: "create_excel", payload: { topic: "Warehouse Tech Stock", sheetType: "inventory" } },
            ],
            timestamp: Date.now(),
          };
          sysAssistantMsg = assistantMsg;
          streamAssistantMessage(assistantMsg);
        } else if (sysResult.action === "generate_image") {
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: `🎨 **AI NEURAL VISUAL GENERATED**\n\n**Prompt:** "${sysResult.details?.prompt || cleanText}"\n**Saved File:** \`${sysResult.details?.filePath}\`\n\n⚡ ${sysResult.feedback}`,
            speechText: sysResult.feedback,
            thoughtSteps: [
              "Synthesized SVG vector geometric artwork from neural prompt",
              "Saved visual asset to exports directory",
              "Rendered visual art preview on holographic HUD",
            ],
            thoughtDuration: "Thought for 0.5s",
            timestamp: Date.now(),
          };
          sysAssistantMsg = assistantMsg;
          streamAssistantMessage(assistantMsg);
        } else if (sysResult.action === "open_brain") {
          setBrainOpen(true);
          void fetchBrainState();
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: `🧠 **UNIVERSAL AGENT BRAIN ONLINE**\n\n${sysResult.feedback}\n• Episodic short-term buffer active.\n• Long-term semantic vector database loaded.\n• Procedural skills registry operational.`,
            speechText: sysResult.feedback,
            thoughtSteps: [
              "Loaded 3-tier cognitive architecture telemetry",
              "Synchronized vector embeddings and skills registry",
              "Rendered cognitive memory inspector modal",
            ],
            thoughtDuration: "Thought for 0.3s",
            suggestedActions: [
              { label: "🧬 Inspect Vector DB", action: "open_brain" },
              { label: "🛡️ Cyber Threat Vault", action: "open_brain" },
            ],
            timestamp: Date.now(),
          };
          sysAssistantMsg = assistantMsg;
          streamAssistantMessage(assistantMsg);
        } else {
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: `[SYSTEM DIRECTIVE EXECUTED]\n${sysResult.feedback}`,
            speechText: sysResult.feedback,
            thoughtSteps: [
              `Parsed directive and matched action: ${sysResult.action || "os_control"}`,
              "Executed instruction via Windows System Bridge",
              "Confirmed execution feedback",
            ],
            thoughtDuration: "Thought for 0.3s",
            timestamp: Date.now(),
          };
          sysAssistantMsg = assistantMsg;
          streamAssistantMessage(assistantMsg);
        }

        let mediaType: "video" | "image" | null = null;
        let mediaPayload: any = null;

        if (sysResult.action === "youtube") {
          mediaType = "video";
          mediaPayload = {
            embedUrl: sysResult.details?.embedUrl,
            targetUrl: sysResult.details?.targetUrl,
            title: sysResult.details?.title || cleanText,
          };
        } else if (sysResult.action === "generate_image") {
          mediaType = "image";
          const svgDataUrl = sysResult.details?.svg
            ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sysResult.details.svg)}`
            : null;
          mediaPayload = {
            imageUrl: svgDataUrl,
            filePath: sysResult.details?.filePath,
            prompt: sysResult.details?.prompt || cleanText,
          };
        }

        const speechToVocalize = sysResult.feedback;
        setCaption({
          speaker: "N.E.X.U.S.",
          text: speechToVocalize,
          fullContent: sysAssistantMsg ? sysAssistantMsg.content : speechToVocalize,
          mediaType,
          mediaPayload,
        });
        showToast(speechToVocalize);
        voiceEngineRef.current?.speak(speechToVocalize, () => {
          doneProcessing();
          if (sysResult.action === "introduce") {
            showToast("Mr. Aaditya Dhavale Sir's GitHub page opened in browser.");
          }
        });

        setTimeout(() => {
          isProcessingRef.current = false;
        }, 300);
        return;
      }
    } catch (sysErr: any) {
      console.warn("System directive warning:", sysErr);
    }

    // 2. Conversational AI reasoning matrix (Fast execution with rich dual-modality & streaming)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          language,
          model: selectedModel,
          apiKey: apiKey || undefined,
        }),
      });

      let reply = "";
      let speechText = "";
      let thoughtSteps: string[] = [];
      let thoughtDuration = "Thought for 1.1s";
      let suggestedActions: any[] = [];

      if (res.ok) {
        const data = await res.json();
        if (data.brainTelemetry) {
          setBrainTelemetry(data.brainTelemetry);
        }
        reply = data.reply || generateLocalNexusResponse(queryText, language);
        speechText = data.speechText || "";
        thoughtSteps = data.thoughtSteps || [];
        thoughtDuration = data.thoughtDuration || "Thought for 1.1s";
        suggestedActions = data.suggestedActions || [];

        if (data.source === "nexus-identity" || isIntroductionOrCreatorQuery(queryText)) {
          const githubUrl = "https://github.com/aadityadhawale3-bot";
          if (typeof window !== "undefined") {
            try {
              openTrackedWindow(githubUrl, "Mr. Aaditya Dhavale Sir - GitHub Profile", 0, undefined, true);
            } catch { }
          }
        }
      } else {
        reply = generateLocalNexusResponse(queryText, language);
      }

      const fullContent = isIntroductionOrCreatorQuery(queryText)
        ? `⚡ **N.E.X.U.S. NEURAL OS & SECURITY ARCHITECTURE ONLINE**\n\n${reply}\n\n🛡️ **Specialization:** Cyber Security & System Security Architecture\n💻 **System:** High-Performance Neural OS by Mr. Aaditya Dhavale Sir\n👤 **Lead Architect & Creator:** [Mr. Aaditya Dhavale Sir](https://github.com/aadityadhawale3-bot)\n🐙 **GitHub Dossier:** [github.com/aadityadhawale3-bot](https://github.com/aadityadhawale3-bot)\n✉️ **Email Comms:** [aadityadhaval3@gmail.com](mailto:aadityadhaval3@gmail.com)`
        : reply;

      const vocalSummary =
        speechText ||
        (isIntroductionOrCreatorQuery(queryText)
          ? reply
          : reply.replace(/```[\s\S]*?```/g, "Code output displayed in your chat box.").slice(0, 160));

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: fullContent,
        speechText: vocalSummary,
        thoughtSteps: thoughtSteps.length > 0 ? thoughtSteps : [
          "Directive validated & cognitive execution verified",
        ],
        thoughtDuration,
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : [
          { label: "🚀 Deploy Code", action: "create_code", payload: { filename: "solution.js", language: "javascript" } },
          { label: "📊 Generate Excel Report", action: "create_excel", payload: { topic: queryText } },
        ],
        timestamp: Date.now(),
      };

      // Silky progressive streaming typewriter delivery
      streamAssistantMessage(assistantMsg);
      setCaption({
        speaker: "N.E.X.U.S.",
        text: vocalSummary,
        fullContent: fullContent,
      });

      // Fast, motivated speech vocalization
      voiceEngineRef.current?.speak(vocalSummary, () => {
        doneProcessing();
        if (isIntroductionOrCreatorQuery(queryText)) {
          showToast("Mr. Aaditya Dhavale Sir's GitHub page opened in browser.");
        }
      });
    } catch {
      const fallbackReply = generateLocalNexusResponse(queryText, language);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: fallbackReply,
        speechText: fallbackReply.slice(0, 140),
        thoughtSteps: [
          "Client offline / API fallback active",
          "Synthesized local neural matrix response",
        ],
        thoughtDuration: "Thought for 0.4s",
        timestamp: Date.now(),
      };
      streamAssistantMessage(assistantMsg);
      setCaption({
        speaker: "N.E.X.U.S.",
        text: assistantMsg.speechText || fallbackReply,
        fullContent: fallbackReply,
      });
      voiceEngineRef.current?.speak(assistantMsg.speechText || fallbackReply, () => {
        doneProcessing();
      });
    }
  };

  useEffect(() => {
    handleUserQueryRef.current = handleUserQuery;
  });

  const handleTestMic = async () => {
    if (!voiceEngineRef.current) return;
    setMicTestActive(true);
    setMicTestEnergy(0);
    showToast("Speak into your microphone now... Testing for 4 seconds");
    const ok = await voiceEngineRef.current.testMicrophone((vol) => {
      setMicTestEnergy(vol);
      drawVisualizer(vol);
    }, 4000);
    if (!ok) {
      showToast("Microphone test could not access hardware. Check browser permissions.");
    }
    setTimeout(() => {
      setMicTestActive(false);
      setMicTestEnergy(0);
      showToast("Microphone calibration complete.");
    }, 4200);
  };

  // Voice Engine setup
  useEffect(() => {
    const engine = new VoiceEngine({
      language,
      voiceGender,
      autoListen, // Controls hands-free vs single-query push-to-talk
      onStateChange: (st) => {
        setAgentState(st);
        sceneRef.current?.setAgentState(st);
      },
      onTranscript: (transcript, isFinal) => {
        setCaption({ speaker: "USER", text: transcript });
        if (isFinal && transcript.trim()) {
          void handleUserQueryRef.current(transcript.trim());
        }
      },
      onAudioEnergy: (energy) => {
        setLiveAudioLevel(energy);
        sceneRef.current?.setAgentState(
          engine.getIsSpeaking() ? "speaking" : engine.getIsListening() ? "listening" : "idle",
          energy
        );
        drawVisualizer(energy);
      },
      onError: (msg) => {
        showToast(msg);
      },
    });

    voiceEngineRef.current = engine;
    setSpeechSupported(engine.isSpeechRecognitionSupported());

    return () => {
      engine.dispose();
    };
  }, [language, voiceGender, autoListen, drawVisualizer]);

  // Execute Quick Action from UI
  const handleTriggerAction = async (action: QuickActionItem) => {
    try {
      if (action.action === "open_url") {
        const isGitHub = action.id === "github";
        const autoClose = isGitHub ? DEFAULT_GITHUB_AUTO_CLOSE_MS : 0;
        openTrackedWindow(action.payload.url, action.name, autoClose, (sess) => {
          showToast(`Session for ${sess.title} completed (2.5 min) · Nexus active`);
          voiceEngineRef.current?.speak("External session completed. Returned to main N.E.X.U.S. page, Sir.");
        });

        const feedback = isGitHub
          ? `Opening ${action.name} with 2.5-minute auto-close lifetime. Will return to Nexus automatically, Sir.`
          : `Opening ${action.name}, Sir. Say "close app" or "close browsing" when you wish to return to Nexus.`;
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: `[DIRECTIVE: ${action.name}]\n${feedback}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        showToast(feedback);
        setCaption({ speaker: "N.E.X.U.S.", text: feedback });
        voiceEngineRef.current?.speak(feedback);
        return;
      }

      const res = await callSystemApi(action.action, action.payload);

      const feedback =
        res.feedback ||
        `Protocol '${action.name}' dispatched successfully.`;

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: `[DIRECTIVE: ${action.name}]\n${feedback}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      showToast(feedback);
      setCaption({ speaker: "N.E.X.U.S.", text: feedback });
      voiceEngineRef.current?.speak(feedback);
    } catch (err: any) {
      const errorMsg = `Command failed: ${err.message || err}`;
      showToast(errorMsg);
      setCaption({ speaker: "N.E.X.U.S. [ERROR]", text: errorMsg });
    }
  };

  // Scroll chat messages
  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen]);

  const toggleVoice = useCallback(() => {
    isProcessingRef.current = false;
    if (voiceEngineRef.current?.getIsSpeaking()) {
      voiceEngineRef.current.stopSpeaking();
      return;
    }
    const listening = voiceEngineRef.current?.toggleListening(autoListen);
    if (listening) {
      if (autoListen) {
        showToast("Microphone active (Hands-Free JARVIS mode). Speak freely Sir.");
      } else {
        showToast("Microphone active (Single-Query mode). Speak freely Sir.");
      }
    }
  }, [autoListen]);

  const toggleAutoListen = () => {
    setAutoListen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("nexus_auto_listen", String(next));
      } catch { }
      voiceEngineRef.current?.setAutoListen(next);
      if (next) {
        showToast("⚡ Auto-Listen ON: Hands-free conversation with Acoustic Echo Shield.");
      } else {
        showToast("🎙️ Single-Query ON: Microphone turns off after answering.");
        if (agentState === "listening") {
          voiceEngineRef.current?.stopListening(true);
        }
      }
      return next;
    });
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") {
        if (e.key === "Escape") {
          (e.target as HTMLElement)?.blur();
        }
        return;
      }

      switch (e.key) {
        case "v":
        case "V":
        case " ":
          e.preventDefault();
          toggleVoice();
          break;
        case "t":
        case "T":
          e.preventDefault();
          setChatOpen((prev) => !prev);
          break;
        case "Escape":
          voiceEngineRef.current?.stopSpeaking();
          voiceEngineRef.current?.stopListening();
          setChatOpen(false);
          setSettingsOpen(false);
          break;
        case "+":
        case "=":
          sceneRef.current?.zoomIn();
          break;
        case "-":
        case "_":
          sceneRef.current?.zoomOut();
          break;
        case "r":
        case "R":
          sceneRef.current?.resetView();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleVoice]);

  const isListening = agentState === "listening";

  return (
    <>
      <div ref={containerRef} className="orb-root" />

      <div className="overlay-vignette" />
      <div className="overlay-grain" />
      <div className="overlay-scanlines" />

      {/* System Action Toast Notification */}
      {toast && <div className="system-toast">{toast}</div>}

      {/* Unified Holographic Top Header */}
      <header className="hud-header">
        <div className="hud-brand-wrapper">
          <div className="hud-brand">
            <span className="brand-title">N.E.X.U.S.</span>
            <span className="brand-tag">AI CORE // V2.5</span>
          </div>
          {/* Top Destination Weather & Live Clock HUD Widget */}
          <WeatherWidget />
        </div>

        {/* Top Right HUD Controls */}
        <div className="hud-top-right">
          <div className="status-badge">
            <div className={`status-dot ${agentState}`} />
            <span>
              {agentState === "listening"
                ? "LISTENING (MIC ACTIVE)"
                : agentState === "thinking"
                  ? "PROCESSING"
                  : agentState === "speaking"
                    ? "VOCALIZING RESPONSE"
                    : "SYSTEM ONLINE"}
            </span>
          </div>

          <canvas ref={visualizerRef} width={80} height={24} className="visualizer-canvas" />

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => {
              const l = e.target.value;
              setLanguage(l);
              try {
                localStorage.setItem("nexus_lang", l);
              } catch { }
            }}
            className="hud-select"
            title="Select Language"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.code})
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`hud-btn ${autoListen ? "hud-btn-active-neon" : ""}`}
            onClick={toggleAutoListen}
            title={
              autoListen
                ? "Auto-Listen is ACTIVE (Hands-Free JARVIS mode). Click to switch to Single-Query (Push-to-Talk)."
                : "Single-Query mode is ACTIVE. Click to enable Hands-Free Auto-Listen."
            }
          >
            {autoListen ? "⚡ AUTO-LISTEN: ON" : "🎙️ AUTO-LISTEN: OFF"}
          </button>

          <button
            type="button"
            className={`hud-btn ${chatOpen ? "hud-btn-active-neon" : ""}`}
            onClick={() => setChatOpen(!chatOpen)}
            title="Toggle Chat Box & Agent Console (T)"
          >
            {chatOpen ? "✕ CHAT BOX" : "💬 CHAT BOX"}
          </button>

          <button
            type="button"
            className="hud-btn hud-btn-brain"
            onClick={() => {
              setBrainOpen(true);
              void fetchBrainState();
            }}
            title="Open Universal Agent Brain Architecture & Memory Inspector"
          >
            🧠 BRAIN {brainTelemetry ? `(${brainTelemetry.semanticCount})` : ""}
          </button>

          <button
            type="button"
            className="hud-btn"
            onClick={() => setSettingsOpen(true)}
            title="AI Model & Matrix Settings"
          >
            ⚙
          </button>
        </div>
      </header>


      {/* Bottom Left: Rotating Earth Globe Widget & Controls Telemetry */}
      <div className="hud-bottom-left-panel">
        <EarthGlobeWidget />
        <div className="hud-hint">
          <div>
            <span className="key">SPACE / V</span> tap to speak&nbsp;&nbsp;
            <span className="key">T</span> chat box&nbsp;&nbsp;
            <span className="key">ESC</span> mute / cancel
          </div>
          <div>
            <span className="key">DRAG</span> rotate&nbsp;&nbsp;
            <span className="key">SCROLL / + −</span> zoom&nbsp;&nbsp;
            <span className="key">R</span> reset
          </div>
        </div>
      </div>

      {/* Unified Bottom Console (Captions + Smart Mic) */}
      <div className="hud-bottom-console">
        {caption && (
          <div className="hud-caption-card">
            <div className="caption-header">
              <span className="caption-speaker-label">
                {caption.speaker === "USER" && isListening ? (
                  <span className="user-listening-badge">
                    <span className="pulse-dot" /> USER · LISTENING (PAUSE 2-3s TO EXECUTE)
                  </span>
                ) : (
                  <span className="agent-badge">
                    <span className="pulse-dot neon-cyan" /> {caption.speaker}
                  </span>
                )}
              </span>
              <div className="caption-header-actions">
                {isListening && caption.speaker === "USER" && caption.text && (
                  <button
                    type="button"
                    className="hud-btn-mini hud-btn-send-now"
                    onClick={() => voiceEngineRef.current?.commitCurrentTranscript()}
                    title="Execute immediately without waiting for silence"
                  >
                    SEND NOW ↵
                  </button>
                )}
                {agentState === "speaking" && (
                  <button
                    type="button"
                    className="hud-btn-mini"
                    onClick={() => voiceEngineRef.current?.stopSpeaking()}
                  >
                    STOP AUDIO
                  </button>
                )}
                {caption.speaker !== "USER" && (
                  <>
                    <button
                      type="button"
                      className="hud-btn-mini"
                      onClick={() => {
                        const contentToCopy = caption.fullContent || caption.text;
                        if (contentToCopy) {
                          void navigator.clipboard?.writeText(contentToCopy);
                          showToast("Copied result to clipboard!");
                        }
                      }}
                      title="Copy result"
                    >
                      📋 COPY
                    </button>
                    {caption.text && (
                      <button
                        type="button"
                        className="hud-btn-mini"
                        onClick={() => voiceEngineRef.current?.speak(caption.text)}
                        title="Replay speech audio"
                      >
                        🔊 REPLAY
                      </button>
                    )}
                    <button
                      type="button"
                      className="hud-btn-mini hud-btn-close-card"
                      onClick={() => setCaption(null)}
                      title="Dismiss card"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="caption-body">
              {/* YouTube Video Player Embed */}
              {caption.mediaType === "video" && caption.mediaPayload?.embedUrl && (
                <div className="hud-video-container">
                  <iframe
                    src={caption.mediaPayload.embedUrl}
                    title={caption.mediaPayload.title || "YouTube Player"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* AI Generated Neural Visual Artwork Preview */}
              {caption.mediaType === "image" && caption.mediaPayload?.imageUrl && (
                <div className="hud-image-container">
                  <img
                    src={caption.mediaPayload.imageUrl}
                    alt={caption.mediaPayload.prompt || "Generated Art"}
                    className="hud-generated-img"
                  />
                  <div className="hud-image-toolbar">
                    <a
                      href={caption.mediaPayload.imageUrl}
                      download={`nexus_visual_${Date.now()}.svg`}
                      className="hud-btn-mini hud-btn-download"
                    >
                      💾 DOWNLOAD SVG
                    </a>
                    {caption.mediaPayload.filePath && (
                      <span className="hud-filepath-badge">
                        📁 {caption.mediaPayload.filePath.split(/[\\/]/).pop()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Render Full Rich Markdown Content */}
              {caption.speaker === "USER" ? (
                <div className="caption-user-text">{caption.text}</div>
              ) : caption.fullContent ? (
                <div className="caption-rich-content">
                  {renderFormattedMessage(caption.fullContent, false)}
                </div>
              ) : (
                <div className="caption-text-only">{caption.text}</div>
              )}
            </div>
          </div>
        )}

        <div className="mic-wrapper">
          <div className="mic-row-controls">
            <button
              type="button"
              className={`mic-btn${isListening ? " active" : ""}`}
              onClick={toggleVoice}
              title={
                isListening
                  ? "Click to stop listening"
                  : agentState === "speaking"
                    ? "Click to stop voice playback"
                    : "Click to speak (Press Space or V)"
              }
              aria-label="Toggle Voice"
            >
              <div className="mic-ripple" />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
          </div>

          {isListening && (
            <div className="mic-meter-box" title="Real-time Microphone Audio Input Meter">
              <div className="mic-meter-track">
                <div
                  className="mic-meter-fill"
                  style={{ width: `${Math.min(100, Math.max(6, Math.round(liveAudioLevel * 100)))}%` }}
                />
              </div>
              <span className="mic-meter-text">VAD {Math.round(liveAudioLevel * 100)}%</span>
            </div>
          )}

          <div className="mic-status-text">
            {isListening
              ? "● LISTENING... (SPEAK MULTI-LINE COMMAND · PAUSE 2-3s TO EXECUTE)"
              : agentState === "thinking"
                ? "⚡ EXECUTING DIRECTIVE..."
                : agentState === "speaking"
                  ? `🔊 N.E.X.U.S. SPEAKING (${voiceGender.toUpperCase()}) · ECHO SHIELD MUTED`
                  : autoListen
                    ? "● AUTO-LISTEN STANDBY (CLICK MIC OR PRESS SPACE)"
                    : "● TAP MIC TO SPEAK (SINGLE-QUERY · SPACE / V)"}
          </div>

          {!speechSupported && (
            <div className="mic-warn-text">
              ⚠️ Native speech recognition unavailable. Open in Chrome or Edge, or type in terminal.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Right Zoom & View Controls Panel */}
      <div className="hud hud-controls">
        <div className="hud-row">
          <button
            type="button"
            className="hud-btn"
            onClick={() => sceneRef.current?.zoomIn()}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="hud-btn"
            onClick={() => sceneRef.current?.zoomOut()}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="hud-btn"
            onClick={() => sceneRef.current?.resetView()}
          >
            RESET
          </button>
        </div>
      </div>

      {/* Interactive Chat & Diagnostics Drawer */}
      <div className={`hud-drawer${chatOpen ? " open" : ""}`}>
        <div className="drawer-header">
          <span>N.E.X.U.S. AI AGENT CHAT CONSOLE</span>
          <button
            type="button"
            className="hud-btn"
            onClick={() => setChatOpen(false)}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Creator Dossier Profile Card */}
        <div className="terminal-creator-card">
          <div className="creator-badge">CREATOR & ARCHITECT</div>
          <div className="creator-name">{CREATOR_PROFILE.name}</div>
          <div className="creator-meta">{CREATOR_PROFILE.role} · {CREATOR_PROFILE.system}</div>
          <div className="creator-links">
            <a
              href={CREATOR_PROFILE.github}
              target="_blank"
              rel="noreferrer"
              className="creator-link"
              onClick={(e) => {
                e.preventDefault();
                openTrackedWindow(CREATOR_PROFILE.github, "Mr. Aaditya Dhavale Sir - GitHub Profile", DEFAULT_GITHUB_AUTO_CLOSE_MS);
                void callSystemApi("open_url", { url: CREATOR_PROFILE.github });
              }}
            >
              GitHub Profile ↗
            </a>
            <a href={`mailto:${CREATOR_PROFILE.email}`} className="creator-link">
              Contact Creator ↗
            </a>
          </div>
        </div>

        {/* Domain Presets Shortcuts */}
        <div className="terminal-domains-section">
          <div className="terminal-section-title">PROBLEM-SOLVING PROTOCOLS</div>
          <div className="terminal-domains-grid">
            {DOMAIN_PRESETS.map((dp) => (
              <button
                key={dp.id}
                type="button"
                className="domain-chip"
                onClick={() => void handleUserQuery(dp.samplePrompt)}
                title={dp.description}
              >
                <span>{dp.icon}</span>
                <span>{dp.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick System Action Directives */}
        <div className="terminal-system-section">
          <div className="terminal-section-title">LOCAL DEVICE & APP ACTIONS</div>
          <div className="quick-actions-grid">
            {SYSTEM_QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className="action-btn"
                onClick={() => void handleTriggerAction(action)}
              >
                <span>{action.icon}</span>
                <span>{action.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat History & Autosaved Memory Section Header */}
        <div className="terminal-history-header">
          <div className="history-status">
            <span className="status-dot-active" />
            <span>RECORDED CONVERSATION ({messages.length} LOGS PERSISTED)</span>
          </div>
          <button
            type="button"
            className="clear-history-btn"
            onClick={clearConversationHistory}
            title="Clear saved conversation history from memory"
          >
            🗑️ RESET MEMORY
          </button>
        </div>

        {/* Chat History Messages with Thinking Chain, Code Cards & Action Chips */}
        <div className="drawer-messages">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`drawer-msg ${m.role === "user" ? "user" : "assistant"}`}
            >
              <div className="msg-header">
                <span className="msg-speaker">
                  {m.role === "user" ? "USER DIRECTIVE" : "N.E.X.U.S."}
                </span>
                <button
                  type="button"
                  className="msg-replay-btn"
                  onClick={() => handleReplayMessage(m.speechText || m.content)}
                  title={m.role === "user" ? "Replay user directive audio" : "Say this response aloud again"}
                >
                  🔊 {m.role === "user" ? "REPLAY" : "SAY AGAIN"}
                </button>
              </div>

              {/* Gemini-style Cognitive Reasoning Chain of Thought */}
              {m.role === "assistant" && m.thoughtSteps && m.thoughtSteps.length > 0 && (
                <div className="thinking-accordion">
                  <button
                    type="button"
                    className="thinking-toggle-btn"
                    onClick={() => toggleThought(idx)}
                    aria-expanded={!!expandedThoughts[idx]}
                  >
                    <span className="thinking-icon">💭</span>
                    <span className="thinking-label">{m.thoughtDuration || "Thought for 1.1s"}</span>
                    <span className={`thinking-arrow ${expandedThoughts[idx] ? "open" : ""}`}>▾</span>
                  </button>
                  {expandedThoughts[idx] && (
                    <div className="thinking-steps-panel">
                      {m.thoughtSteps.map((step, sIdx) => (
                        <div key={sIdx} className="thinking-step-item">
                          <span className="thinking-step-bullet">●</span>
                          <span className="thinking-step-text">{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Formatted Content with Interactive Code Run / Copy Cards */}
              <div className="msg-content">
                {m.role === "user" ? (
                  m.content
                ) : (
                  renderFormattedMessage(m.content, idx === messages.length - 1 && isStreaming)
                )}
              </div>

              {/* Proactive Action Chips */}
              {m.role === "assistant" && m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="action-chips-container">
                  {m.suggestedActions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      type="button"
                      className="action-chip"
                      onClick={() => handleActionChipClick(act)}
                    >
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Real-time Thinking Pulse Card */}
          {agentState === "thinking" && (
            <div className="drawer-msg assistant thinking-live-card">
              <div className="thinking-live-header">
                <span className="thinking-live-dot" />
                <span className="thinking-live-title">N.E.X.U.S. COGNITIVE ENGINE REASONING...</span>
              </div>
              <div className="thinking-live-shimmer" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Terminal Input Form */}
        <form
          className="drawer-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (textInput.trim()) {
              void handleUserQuery(textInput.trim());
            }
          }}
        >
          <input
            type="text"
            className="drawer-input"
            placeholder="Type directive (e.g. 'open whatsapp', 'search youtube for songs', 'make ppt')..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            suppressHydrationWarning
          />
          <button type="submit" className="hud-btn primary">
            TRANSMIT
          </button>
        </form>
      </div>

      {/* Settings / API Key & Model Configuration Modal */}
      {settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>NEURAL MATRIX CONFIGURATION</span>
              <button
                type="button"
                className="hud-btn"
                onClick={() => setSettingsOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                N.E.X.U.S. includes a built-in neural reasoning matrix that operates offline.
                You can link an API key to leverage Google Gemini 2.0 or OpenAI models.
              </p>

              {/* Model Selector */}
              <div className="form-group">
                <label>AI Model Engine:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="modal-input"
                  style={{ width: "100%", background: "#020f26" }}
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended — Ultra-Fast)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Multidisciplinary Reasoning)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Lightweight)</option>
                  <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
                </select>
              </div>

              {/* Voice Persona Selector */}
              <div className="form-group">
                <label>Voice Persona:</label>
                <select
                  value={voiceGender}
                  onChange={(e) => {
                    const g = e.target.value as VoiceGender;
                    setVoiceGender(g);
                    voiceEngineRef.current?.setVoiceGender(g);
                  }}
                  className="modal-input"
                  style={{ width: "100%", background: "#020f26" }}
                >
                  <option value="male">N.E.X.U.S. Male (Deep Bass Thriller Voice)</option>
                  <option value="female">N.E.X.U.S. Female (Crisp & Elegant Voice)</option>
                </select>
              </div>

              {/* Microphone & Speech Recognition Diagnostics */}
              <div className="form-group" style={{ background: "rgba(0, 229, 255, 0.05)", padding: "12px", borderRadius: "6px", border: "1px solid rgba(0, 229, 255, 0.2)" }}>
                <label style={{ color: "#38bdf8", fontWeight: "bold" }}>🎤 Microphone & Speech Recognition Diagnostics:</label>
                <div style={{ fontSize: "11px", color: "#e0f2fe", margin: "6px 0", lineHeight: "1.5" }}>
                  Status:{" "}
                  <strong style={{ color: speechSupported ? "#34d399" : "#f87171" }}>
                    {speechSupported ? "Web Speech API Operational (Chrome/Edge Ready)" : "Speech API Unsupported in this browser"}
                  </strong>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }}>
                  <button
                    type="button"
                    className="hud-btn"
                    style={{ fontSize: "11px", padding: "0 12px", height: "34px" }}
                    onClick={handleTestMic}
                  >
                    {micTestActive ? "CALIBRATING (SPEAK NOW)..." : "⚡ TEST MICROPHONE (4S)"}
                  </button>
                  <div style={{ flex: 1, background: "rgba(2, 14, 34, 0.8)", height: "14px", borderRadius: "3px", overflow: "hidden", border: "1px solid rgba(0, 229, 255, 0.4)", position: "relative" }}>
                    <div
                      style={{
                        width: `${Math.round(micTestEnergy * 100)}%`,
                        height: "100%",
                        background: micTestEnergy > 0.6 ? "#f59e0b" : "#00e5ff",
                        boxShadow: "0 0 8px #00e5ff",
                        transition: "width 0.05s ease-out",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "10px", color: "#38bdf8", minWidth: "32px", textAlign: "right" }}>
                    {Math.round(micTestEnergy * 100)}%
                  </span>
                </div>
              </div>

              {/* API Key */}
              <div className="form-group">
                <label>API Key (Google Gemini or OpenAI):</label>
                <input
                  type="password"
                  className="modal-input"
                  placeholder="AIzaSy... or sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="hud-btn"
                  onClick={() => {
                    localStorage.removeItem("nexus_api_key");
                    setApiKey("");
                    showToast("API key removed. Running on internal neural matrix.");
                  }}
                >
                  CLEAR KEY
                </button>
                <button
                  type="button"
                  className="hud-btn primary"
                  onClick={() => {
                    localStorage.setItem("nexus_api_key", apiKey.trim());
                    localStorage.setItem("nexus_model", selectedModel);
                    localStorage.setItem("nexus_voice_gender", voiceGender);
                    showToast("Configuration saved successfully.");
                    setSettingsOpen(false);
                  }}
                >
                  SAVE CONFIG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Agent Brain Inspector Modal */}
      {brainOpen && (
        <div className="brain-modal-overlay" onClick={() => setBrainOpen(false)}>
          <div className="brain-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="brain-modal-header">
              <div className="brain-modal-title">
                <span>🧠</span>
                <span>UNIVERSAL AGENT BRAIN // COGNITIVE ARCHITECTURE</span>
              </div>
              <button
                type="button"
                className="hud-btn"
                onClick={() => setBrainOpen(false)}
                title="Close Brain Inspector"
              >
                ✕
              </button>
            </div>

            {/* Telemetry Strip */}
            <div className="brain-telemetry-strip">
              <span className="brain-pill episodic">
                💬 EPISODIC BUFFER: {brainTelemetry?.episodicCount ?? brainEpisodic.length} TURNS
              </span>
              <span className="brain-pill semantic">
                🧬 SEMANTIC VECTOR DB: {brainTelemetry?.semanticCount ?? brainSemantic.length} FACTS
              </span>
              <span className="brain-pill procedural">
                ⚙️ PROCEDURAL SKILLS: {brainTelemetry?.proceduralCount ?? brainTools.length} TOOLS
              </span>
              <span className="brain-pill" style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.45)", color: "#fca5a5" }}>
                🛡️ THREAT INTEL: {threatIntelList.length} PROFILES
              </span>
              <span className="brain-pill" style={{ background: "rgba(0, 229, 255, 0.1)", border: "1px solid rgba(0, 229, 255, 0.3)", color: "#38bdf8" }}>
                💾 PERSISTENCE: brain_memory.json
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="brain-tabs">
              <button
                type="button"
                className={`brain-tab-btn ${brainActiveTab === "semantic" ? "active" : ""}`}
                onClick={() => setBrainActiveTab("semantic")}
              >
                🧬 LONG-TERM SEMANTIC ({brainSemantic.length})
              </button>
              <button
                type="button"
                className={`brain-tab-btn ${brainActiveTab === "episodic" ? "active" : ""}`}
                onClick={() => setBrainActiveTab("episodic")}
              >
                💬 SHORT-TERM EPISODIC ({brainEpisodic.length})
              </button>
              <button
                type="button"
                className={`brain-tab-btn ${brainActiveTab === "procedural" ? "active" : ""}`}
                onClick={() => setBrainActiveTab("procedural")}
              >
                ⚙️ PROCEDURAL SKILLS ({brainTools.length})
              </button>
              <button
                type="button"
                className={`brain-tab-btn ${brainActiveTab === "security" ? "active" : ""}`}
                onClick={() => setBrainActiveTab("security")}
                style={{ color: brainActiveTab === "security" ? "#f87171" : undefined }}
              >
                🛡️ CYBER SECURITY VAULT ({threatIntelList.length})
              </button>
            </div>

            {/* Tab 1: Semantic Memory */}
            {brainActiveTab === "semantic" && (
              <div className="brain-content-area">
                {/* Search Bar for Semantic Recall Testing */}
                <form onSubmit={handleRecallSearch} className="brain-input-row">
                  <input
                    type="text"
                    className="brain-input"
                    placeholder="Vector search (e.g. 'creator', 'cyber security', 'specs', 'python')..."
                    value={brainQuery}
                    onChange={(e) => setBrainQuery(e.target.value)}
                  />
                  <button type="submit" className="brain-action-btn">
                    🔍 VECTOR RECALL
                  </button>
                </form>

                {/* Recall Test Results */}
                {brainRecallResults.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(168, 85, 247, 0.08)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(168, 85, 247, 0.3)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "bold", color: "#c084fc", letterSpacing: "0.1em" }}>
                      TOP SEMANTIC VECTOR MATCHES FOR &ldquo;{brainQuery}&rdquo;:
                    </div>
                    {brainRecallResults.map((r, i) => (
                      <div key={i} className="brain-card" style={{ padding: "10px" }}>
                        <div className="brain-card-header">
                          <span className="brain-card-id">#{r.id}</span>
                          <span className="brain-card-score">Cosine Score: {Math.round(r.score * 100)}%</span>
                        </div>
                        <div className="brain-card-doc">{r.document}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Custom Fact Form */}
                <form onSubmit={handleMemorizeFact} style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(2, 10, 24, 0.6)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(0, 229, 255, 0.2)" }}>
                  <div style={{ fontSize: "11px", fontWeight: "bold", color: "#7dd3fc", letterSpacing: "0.1em" }}>
                    MEMORIZE NEW KNOWLEDGE / FACT:
                  </div>
                  <div className="brain-input-row">
                    <input
                      type="text"
                      className="brain-input"
                      placeholder="Enter knowledge (e.g. 'User prefers Python architecture for AI automation tools')..."
                      value={newFactDoc}
                      onChange={(e) => setNewFactDoc(e.target.value)}
                    />
                    <select
                      value={newFactCategory}
                      onChange={(e) => setNewFactCategory(e.target.value)}
                      className="brain-input"
                      style={{ maxWidth: "160px" }}
                    >
                      <option value="user_preference">User Preference</option>
                      <option value="projects">Projects</option>
                      <option value="architecture">Architecture</option>
                      <option value="cyber_security">Cyber Security</option>
                      <option value="general">General</option>
                    </select>
                    <button type="submit" className="brain-action-btn">
                      💾 COMMIT FACT
                    </button>
                  </div>
                </form>

                {/* All Memorized Facts List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "bold", color: "#94a3b8", letterSpacing: "0.1em" }}>
                    STORED VECTOR FACTS ({brainSemantic.length}):
                  </div>
                  {brainSemantic.map((fact) => (
                    <div key={fact.id} className="brain-card">
                      <div className="brain-card-header">
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span className="brain-card-id">#{fact.id}</span>
                          <span style={{ fontSize: "10px", color: "#94a3b8", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px" }}>
                            {fact.metadata?.category || "general"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="brain-action-btn danger"
                          style={{ padding: "3px 8px", fontSize: "10px" }}
                          onClick={() => void handleDeleteFact(fact.id)}
                          title="Delete fact"
                        >
                          DELETE
                        </button>
                      </div>
                      <div className="brain-card-doc">{fact.document}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Episodic Buffer */}
            {brainActiveTab === "episodic" && (
              <div className="brain-content-area">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "11px", color: "#7dd3fc", letterSpacing: "0.1em" }}>
                    SHORT-TERM CONVERSATIONAL BUFFER (LAST {brainEpisodic.length} TURNS):
                  </div>
                  <button
                    type="button"
                    className="brain-action-btn danger"
                    onClick={handleClearEpisodic}
                  >
                    🗑️ CLEAR SHORT-TERM BUFFER
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {brainEpisodic.length === 0 ? (
                    <div style={{ color: "#64748b", fontStyle: "italic", padding: "20px", textAlign: "center" }}>
                      Episodic buffer is currently empty.
                    </div>
                  ) : (
                    brainEpisodic.map((entry, idx) => (
                      <div
                        key={idx}
                        className="brain-card"
                        style={{
                          borderLeft: entry.role === "user" ? "3px solid #00e5ff" : "3px solid #a855f7",
                        }}
                      >
                        <div className="brain-card-header">
                          <span style={{ fontSize: "10px", fontWeight: "bold", color: entry.role === "user" ? "#38bdf8" : "#c084fc" }}>
                            {entry.role.toUpperCase()}
                          </span>
                          <span style={{ fontSize: "10px", color: "#64748b" }}>
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="brain-card-doc">{entry.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Procedural Tools */}
            {brainActiveTab === "procedural" && (
              <div className="brain-content-area">
                <div style={{ fontSize: "11px", color: "#86efac", letterSpacing: "0.1em" }}>
                  REGISTERED PROCEDURAL SKILLS & SYSTEM TOOLS ({brainTools.length}):
                </div>

                {toolResultOutput && (
                  <div style={{ background: "rgba(2, 6, 23, 0.9)", border: "1px solid #22c55e", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "bold", color: "#86efac", marginBottom: "4px" }}>
                      SKILL EXECUTION OUTPUT:
                    </div>
                    <pre style={{ fontSize: "11px", color: "#e2e8f0", whiteSpace: "pre-wrap", maxHeight: "140px", overflowY: "auto" }}>
                      {toolResultOutput}
                    </pre>
                  </div>
                )}

                <div className="brain-tools-grid">
                  {brainTools.map((t) => (
                    <div key={t.name} className="brain-tool-card">
                      <div>
                        <div className="brain-tool-name">⚡ {t.name}</div>
                        <div className="brain-tool-desc">{t.description}</div>
                      </div>
                      <button
                        type="button"
                        className="brain-action-btn"
                        style={{ marginTop: "8px", width: "100%", textAlign: "center" }}
                        onClick={() => void handleExecuteTool(t.name)}
                      >
                        RUN SKILL ▶
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Cyber Security Vault */}
            {brainActiveTab === "security" && (
              <div className="brain-content-area">
                {/* 1. Chain-of-Thought (CoT) Security Reasoning Matrix */}
                <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "16px", borderRadius: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#fca5a5", letterSpacing: "0.1em" }}>
                      🛡️ PRINCIPAL CYBER SECURITY RESEARCHER // REASONING MATRIX (THINK)
                    </div>
                    {securityReasoningResult && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "bold",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: securityReasoningResult.execution_status === "PROCEED" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.25)",
                          border: securityReasoningResult.execution_status === "PROCEED" ? "1px solid #22c55e" : "1px solid #ef4444",
                          color: securityReasoningResult.execution_status === "PROCEED" ? "#4ade80" : "#fca5a5",
                        }}
                      >
                        STATUS: {securityReasoningResult.execution_status}
                      </span>
                    )}
                  </div>
                  <div className="brain-input-row" style={{ marginBottom: "10px" }}>
                    <input
                      type="text"
                      className="brain-input"
                      placeholder="Enter security inquiry (e.g. 'Mitigation strategy for RSA timing anomaly')..."
                      value={securityReasoningQuery}
                      onChange={(e) => setSecurityReasoningQuery(e.target.value)}
                    />
                    <button type="button" className="brain-action-btn" onClick={handleRunSecurityThink} style={{ borderColor: "#ef4444", color: "#fca5a5" }}>
                      ⚡ EXECUTE THINK
                    </button>
                  </div>
                  {securityReasoningResult && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", background: "rgba(2, 6, 23, 0.8)", padding: "10px", borderRadius: "6px" }}>
                      <div style={{ color: "#7dd3fc" }}>
                        <strong>Phase 1 (Intent Parsing):</strong> {securityReasoningResult.cognitive_steps?.phase_1_intent_parsing}
                      </div>
                      <div style={{ color: "#86efac" }}>
                        <strong>Phase 2 (Threat Vault Matches):</strong>{" "}
                        {securityReasoningResult.cognitive_steps?.phase_2_historical_context?.length > 0
                          ? securityReasoningResult.cognitive_steps.phase_2_historical_context.join(" | ")
                          : "No prior matching CVE profiles in vault."}
                      </div>
                      <div style={{ color: "#c084fc" }}>
                        <strong>Phase 3 (Mapped Security Primitives):</strong>{" "}
                        {securityReasoningResult.cognitive_steps?.phase_3_tool_mapping?.join(", ") || "General Defensive Reasoning"}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Specialized Security Primitives Toolset */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                  {/* Primitive A: Shannon Entropy Analysis */}
                  <div className="brain-card" style={{ border: "1px solid rgba(14, 165, 233, 0.4)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>
                      📊 SHANNON ENTROPY DETECTOR
                    </div>
                    <input
                      type="text"
                      className="brain-input"
                      style={{ marginBottom: "8px", width: "100%" }}
                      placeholder="Enter string/payload for entropy analysis..."
                      value={entropyInput}
                      onChange={(e) => setEntropyInput(e.target.value)}
                    />
                    <button type="button" className="brain-action-btn" style={{ width: "100%", marginBottom: "8px" }} onClick={handleRunEntropy}>
                      CALCULATE SHANNON ENTROPY
                    </button>
                    {entropyResult && (
                      <div style={{ fontSize: "10px", background: "rgba(2, 6, 23, 0.7)", padding: "8px", borderRadius: "4px" }}>
                        <div><strong>Score:</strong> <span style={{ color: "#00e5ff", fontWeight: "bold" }}>{entropyResult.entropy} / 8.0</span></div>
                        <div><strong>Classification:</strong> <span style={{ color: "#4ade80" }}>{entropyResult.classification}</span></div>
                        <div style={{ color: "#94a3b8", marginTop: "2px" }}>{entropyResult.details}</div>
                      </div>
                    )}
                  </div>

                  {/* Primitive B: Cryptographic Validator */}
                  <div className="brain-card" style={{ border: "1px solid rgba(168, 85, 247, 0.4)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "bold", color: "#c084fc", marginBottom: "8px" }}>
                      🔒 CRYPTOGRAPHIC CONFIG VALIDATOR
                    </div>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                      <select value={cryptoCipher} onChange={(e) => setCryptoCipher(e.target.value)} className="brain-input" style={{ fontSize: "11px" }}>
                        <option value="AES-256-GCM">AES-256-GCM (Approved)</option>
                        <option value="AES-128-ECB">AES-128-ECB (Weak Mode)</option>
                        <option value="3DES-CBC">3DES-CBC (Deprecated)</option>
                        <option value="RSA-1024">RSA-1024 (Insecure Key)</option>
                        <option value="RSA-4096">RSA-4096 (Secure)</option>
                      </select>
                      <select value={cryptoHash} onChange={(e) => setCryptoHash(e.target.value)} className="brain-input" style={{ fontSize: "11px" }}>
                        <option value="SHA-256">SHA-256</option>
                        <option value="SHA-512">SHA-512</option>
                        <option value="MD5">MD5 (Broken)</option>
                        <option value="SHA-1">SHA-1 (Broken)</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", fontSize: "11px", color: "#cbd5e1" }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={cryptoBlinded}
                          onChange={(e) => setCryptoBlinded(e.target.checked)}
                          style={{ marginRight: "6px" }}
                        />
                        RSA Blinding Active
                      </label>
                      <button type="button" className="brain-action-btn" onClick={handleRunCryptoAudit} style={{ padding: "4px 8px" }}>
                        AUDIT CIPHER
                      </button>
                    </div>
                    {cryptoAuditResult && (
                      <div style={{ fontSize: "10px", background: "rgba(2, 6, 23, 0.7)", padding: "8px", borderRadius: "4px" }}>
                        <div style={{ color: cryptoAuditResult.compliant ? "#4ade80" : "#fca5a5", fontWeight: "bold" }}>
                          {cryptoAuditResult.compliant ? "✓ NIST COMPLIANT PROFILE" : "⚠ SECURITY VULNERABILITIES IDENTIFIED"}
                        </div>
                        {cryptoAuditResult.findings?.map((f: string, idx: number) => (
                          <div key={idx} style={{ color: "#fca5a5", marginTop: "2px" }}>• {f}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Primitive C: OWASP Static Scanner */}
                  <div className="brain-card" style={{ border: "1px solid rgba(34, 197, 94, 0.4)", gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "11px", fontWeight: "bold", color: "#86efac", marginBottom: "8px" }}>
                      🛡️ OWASP TOP 10 STATIC CODE SCANNER
                    </div>
                    <textarea
                      rows={2}
                      className="brain-input"
                      style={{ marginBottom: "8px", width: "100%", resize: "vertical" }}
                      value={owaspCode}
                      onChange={(e) => setOwaspCode(e.target.value)}
                    />
                    <button type="button" className="brain-action-btn" style={{ width: "100%", marginBottom: "8px" }} onClick={handleRunOwaspScan}>
                      SCAN CODE FOR VULNERABILITY SINKS (SQLi, EVAL, CMD INJECTION)
                    </button>
                    {owaspResult && (
                      <div style={{ fontSize: "10px", background: "rgba(2, 6, 23, 0.7)", padding: "8px", borderRadius: "4px" }}>
                        <div style={{ color: owaspResult.vulnerabilities?.length > 0 ? "#fca5a5" : "#4ade80", fontWeight: "bold" }}>
                          {owaspResult.vulnerabilities?.length > 0 ? `⚠ ${owaspResult.vulnerabilities.length} VULNERABILITIES DETECTED:` : "✓ NO KNOWN INJECTION SINKS DETECTED"}
                        </div>
                        {owaspResult.vulnerabilities?.map((v: any, idx: number) => (
                          <div key={idx} style={{ marginTop: "4px", padding: "4px", borderLeft: "2px solid #ef4444", background: "rgba(239, 68, 68, 0.1)" }}>
                            <span style={{ color: "#f87171", fontWeight: "bold" }}>[{v.severity}] {v.type}</span>: {v.snippet}
                            <div style={{ color: "#86efac", marginTop: "2px" }}>Remediation: {v.remediation}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Threat Intelligence Vault (Ingestion & Profiles) */}
                <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "14px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "bold", color: "#fca5a5", marginBottom: "8px", letterSpacing: "0.1em" }}>
                    INGEST THREAT INTEL NODE (CVE / VULNERABILITY PROFILE):
                  </div>
                  <form onSubmit={handleIngestThreatIntel} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div className="brain-input-row">
                      <input
                        type="text"
                        className="brain-input"
                        placeholder="Intel ID (e.g. INTEL-CVE-2026-X)"
                        value={newIntelId}
                        onChange={(e) => setNewIntelId(e.target.value)}
                        style={{ maxWidth: "200px" }}
                      />
                      <select value={newIntelDomain} onChange={(e) => setNewIntelDomain(e.target.value)} className="brain-input" style={{ maxWidth: "180px" }}>
                        <option value="cryptography">Cryptography</option>
                        <option value="application_security">Application Security</option>
                        <option value="system_security">System Security</option>
                        <option value="network_security">Network Security</option>
                        <option value="reverse_engineering">Reverse Engineering</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      className="brain-input"
                      placeholder="Threat Profile Description..."
                      value={newIntelDesc}
                      onChange={(e) => setNewIntelDesc(e.target.value)}
                    />
                    <div className="brain-input-row">
                      <input
                        type="text"
                        className="brain-input"
                        placeholder="Remediation Strategy / Hardening Patch..."
                        value={newIntelRemediation}
                        onChange={(e) => setNewIntelRemediation(e.target.value)}
                      />
                      <button type="submit" className="brain-action-btn" style={{ borderColor: "#ef4444", color: "#fca5a5" }}>
                        🛡️ INGEST INTEL
                      </button>
                    </div>
                  </form>
                </div>

                {/* Ingested Threat Intel Profiles List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "bold", color: "#94a3b8", letterSpacing: "0.1em" }}>
                    ACTIVE THREAT INTEL VAULT PROFILES ({threatIntelList.length}):
                  </div>
                  {threatIntelList.map((node) => (
                    <div key={node.intelId} className="brain-card" style={{ borderLeft: "3px solid #ef4444" }}>
                      <div className="brain-card-header">
                        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#fca5a5" }}>{node.intelId}</span>
                        <span style={{ fontSize: "10px", color: "#cbd5e1", background: "rgba(239, 68, 68, 0.15)", padding: "2px 6px", borderRadius: "4px" }}>
                          {node.domain}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#e2e8f0", marginBottom: "4px" }}>{node.description}</div>
                      <div style={{ fontSize: "11px", color: "#86efac" }}>
                        <strong>Remediation:</strong> {node.remediation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
