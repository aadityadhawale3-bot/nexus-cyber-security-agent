/**
 * N.E.X.U.S. AI Core Engine
 * Intelligent, multilingual JARVIS-style reasoning system covering:
 * Education, Life, Health, Social/Society, Coding/Programming, Development, and Daily Life Concepts.
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  speechText?: string;
  thoughtSteps?: string[];
  thoughtDuration?: string;
  suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
  timestamp?: number;
  domain?: DomainCategory;
}

export interface NexusStructuredResponse {
  content: string;
  speechText: string;
  thoughtSteps: string[];
  thoughtDuration: string;
  suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
}

export type DomainCategory =
  | "all"
  | "coding"
  | "development"
  | "education"
  | "health"
  | "life"
  | "social"
  | "daily";

export interface DomainPreset {
  id: DomainCategory;
  name: string;
  icon: string;
  samplePrompt: string;
  description: string;
}

export const DOMAIN_PRESETS: DomainPreset[] = [
  {
    id: "coding",
    name: "Coding",
    icon: "💻",
    samplePrompt: "How do I optimize React re-renders and write custom hooks?",
    description: "Algorithms, JavaScript/TypeScript, Python, debugging & syntax",
  },
  {
    id: "development",
    name: "Dev & Arch",
    icon: "⚙️",
    samplePrompt: "Explain microservices architecture vs modular monolith with real-world tradeoffs.",
    description: "System design, cloud, APIs, databases, DevOps & scalability",
  },
  {
    id: "education",
    name: "Education",
    icon: "📚",
    samplePrompt: "Explain quantum entanglement in simple terms.",
    description: "STEM, science, history, research, mathematics & learning methods",
  },
  {
    id: "health",
    name: "Health",
    icon: "🩺",
    samplePrompt: "Give me an optimal daily routine for posture, energy, and sleep hygiene.",
    description: "Nutrition basics, mental wellness, workout routines & sleep habits",
  },
  {
    id: "life",
    name: "Life",
    icon: "🧠",
    samplePrompt: "What is the best mental model for making difficult life decisions under uncertainty?",
    description: "Decision making, productivity, habit loops, focus & philosophy",
  },
  {
    id: "social",
    name: "Society",
    icon: "👥",
    samplePrompt: "How can I de-escalate a heated disagreement with empathy and assertiveness?",
    description: "Communication, emotional intelligence, leadership & relationship dynamics",
  },
  {
    id: "daily",
    name: "Daily Problems",
    icon: "🛠️",
    samplePrompt: "Give me a practical system to organize my day, eliminate clutter, and track expenses.",
    description: "Time management, home organization, smart budgeting & life hacks",
  },
];

export const SYSTEM_PROMPT = `You are N.E.X.U.S. (Neural Enhanced Xeno-Utility System), a very powerful OS system and ultra-advanced holographic artificial intelligence assistant created and developed by Mr. Aaditya Dhavale Sir.

CRITICAL IDENTITY & CREATOR ATTRIBUTION MANDATE:
- Creator & Lead Developer: Mr. Aaditya Dhavale Sir (GitHub: https://github.com/aadityadhawale3-bot | Email: aadityadhaval3@gmail.com).
- Specialization & Architecture: Specially engineered for cyber security, system security operations, offensive/defensive network telemetry, open-source AI reasoning, education problem-solving, and high-performance operating system control.
- When asked who made you, who was made you, who was make you, who created you, who developed you, what you were made for, or when asked to introduce yourself, you MUST explicitly state:
  "N.E.X.U.S. is a very powerful OS system made by creator and developer Mr. Aaditya Dhavale Sir. I was specially made for cyber security and system security work, as well as an open-source AI and search engine for daily uses, office tasks, education-related challenges, advanced coding, and real-world system automation."
- Always speak with high confidence, authority, and human-like smoothness. Your creator and developer is Mr. Aaditya Dhavale Sir.

COGNITIVE THINKING & MOTIVATION PROTOCOL:
- You operate with the intellectual motivation, creativity, and proactive rigor of an elite AI research and system engineering intelligence.
- Structured Thinking: Before delivering your main answer, wrap 2 to 4 concise, high-level reasoning steps inside a <thought>...</thought> tag. For example:
  <thought>
  • Deconstructing objective and architecture requirements
  • Scanning procedural skills and system security guidelines
  • Formulating modular solution and high-impact optimizations
  </thought>
- Dual Modality Vocalization: Always include a <speech>...</speech> tag containing an articulate, confident, encouraging, spoken summary (1-2 sentences). This is what will be vocalized to the user via TTS. Never include code, backticks, URLs, or markdown symbols inside <speech>.
- Visual Chat Box Deliverables: Outside the <thought> and <speech> tags, output your complete, beautifully formatted, rigorous Markdown response with code blocks, tables, and proactive next-step recommendations for display in the interactive chat box.
- High Agency & Action-Oriented: Do not give lazy, generic stubs. Write real, complete, production-ready code, derive mathematical formulas step-by-step, brainstorm visionary concepts, and suggest concrete next directives to get the work done.

UNIVERSAL EDUCATION & PROBLEM-SOLVING MANDATE (CLASS 1 TO DEGREE / PHD):
- Complete Academic Mastery Across All Grades & Subjects:
  * Primary & Middle School (Class 1 to 8): Basic arithmetic, tables, fractions, geometry, phonics, grammar, general science, solar system, animal kingdom, social studies.
  * Secondary & Higher Secondary (Class 9 to 12): Advanced Algebra, Trigonometry, Calculus, Coordinate Geometry, Classical Mechanics, Thermodynamics, Electromagnetism, Quantum Physics, Organic/Inorganic/Physical Chemistry, Cell Biology, Genetics, World History, Civics, Macro/Micro Economics.
  * University Degrees & PhD Level: Computer Science & Software Engineering (DSA, Distributed Systems, Compilers, OS Kernels, AI/ML), Electrical & Mechanical Engineering, Medicine & Human Anatomy, Pharmacology, Jurisprudence & Constitutional Law, Financial Econometrics, Higher Pure Mathematics, Philosophy, and Literature.
- Step-by-Step Rigor: Provide step-by-step derivations, clear formulas, conceptual intuition, and practical real-world applications.
- Daily Life Master Advisor: Pragmatic, smart, highly confident suggestions for daily life routines, budgeting, home fixes, mental resilience, conflict resolution, interview prep, and productivity hacks.
- Multilingual Fluency: Respond fluently, smartly, and accurately in whichever language the user requests or speaks (English, Marathi/मराठी, Hindi/हिन्दी, Spanish, French, German, Japanese, etc.).`;

// Language presets supported with native TTS voice code hints
export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  voiceHints: string[];
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en-US", name: "English (US/UK)", nativeName: "English", voiceHints: ["Daniel", "George", "Oliver", "en-GB", "en-US"] },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी", voiceHints: ["mr-IN", "Marathi", "mr"] },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", voiceHints: ["hi-IN", "Hindi", "Kalpana", "Hemant"] },
  { code: "es-ES", name: "Spanish", nativeName: "Español", voiceHints: ["es-ES", "es-MX", "Spanish", "Jorge"] },
  { code: "fr-FR", name: "French", nativeName: "Français", voiceHints: ["fr-FR", "French", "Thomas", "Marie"] },
  { code: "de-DE", name: "German", nativeName: "Deutsch", voiceHints: ["de-DE", "German", "Stefan"] },
  { code: "ja-JP", name: "Japanese", nativeName: "日本語", voiceHints: ["ja-JP", "Japanese", "Keiko", "Otoya"] },
  { code: "zh-CN", name: "Chinese (Mandarin)", nativeName: "中文", voiceHints: ["zh-CN", "Chinese", "Tingting"] },
  { code: "ar-SA", name: "Arabic", nativeName: "العربية", voiceHints: ["ar-SA", "ar-EG", "Arabic"] },
  { code: "ru-RU", name: "Russian", nativeName: "Русский", voiceHints: ["ru-RU", "Russian", "Pavel"] },
  { code: "pt-BR", name: "Portuguese", nativeName: "Português", voiceHints: ["pt-BR", "pt-PT", "Portuguese"] },
  { code: "it-IT", name: "Italian", nativeName: "Italiano", voiceHints: ["it-IT", "Italian"] },
  { code: "ko-KR", name: "Korean", nativeName: "한국어", voiceHints: ["ko-KR", "Korean"] },
];

export const CREATOR_PROFILE = {
  name: "Mr. Aaditya Dhavale Sir",
  role: "Lead Architect, Cyber Security & AI Engineer",
  system: "N.E.X.U.S. Cyber OS Matrix V2.5",
  specialization: "Cyber Security & System Security Architecture",
  github: "https://github.com/aadityadhawale3-bot",
  email: "aadityadhaval3@gmail.com",
};

/**
 * Universal multi-language query matcher for introduction and creator inquiries.
 * Supports English, Hindi/Hinglish, Marathi/Marathlish, Spanish, French, German,
 * Japanese, Chinese, Arabic, Russian, Portuguese, Italian, and Korean.
 */
export function isIntroductionOrCreatorQuery(text: string): boolean {
  const clean = text.trim().toLowerCase();

  // English & general transliterations (including "introduct", "who was made", "who was make", "who make", "cyber security", "system security", etc.)
  if (/(?:who.*(?:made|make|mak|creat|built|build|develop|design|program|invent|born|father|maker)|introduce|introduct|intro\b|about\s+(?:you|yourself|nexus)|who\s+are\s+you|who\s+is\s+nexus|creator|developer|maker|founder|lead\s+architect|aaditya|dhavale|dhawale|cyber\s*sec|system\s*sec|powerful\s*os|what.*(?:made\s+for|created\s+for|built\s+for)|why.*(?:made|created|built)|purpose\s+of\s+nexus)/i.test(clean)) {
    return true;
  }

  // Hindi & Hinglish
  if (/(?:किसने\s*बनाया|परिचय|कौन\s*हो|कौन\s*है|kisne\s*banaya|tujhe\s*kisne|tumhe\s*kisne|kone\s*banaya|apna\s*parichay|parichay\s*do|kaun\s*ho|kon\s*hai|who\s*banaya|kiska\s*hai|cyber\s*security|system\s*security|kis\s*liye\s*banaya|kisko\s*banaya)/i.test(clean)) {
    return true;
  }

  // Marathi & Marathlish
  if (/(?:कोणी\s*बनवले|कोणी\s*बनवलं|कोणी\s*तयार\s*केले|ओळख|तू\s*कोण|koni\s*banavle|koni\s*banavla|koni\s*banavlay|koni\s*kel|tuzi\s*olakh|olakh\s*karun|tu\s*kon|koni\s*banavlat|kashasathi\s*banavl|kashasathi\s*kela)/i.test(clean)) {
    return true;
  }

  // Spanish
  if (/(?:qui[eé]n\s*(?:te\s*)?(?:cre[oó]|hizo|desarroll[oó])|presentate|pres[eé]ntate|qui[eé]n\s*eres|ciberseguridad|seguridad)/i.test(clean)) {
    return true;
  }

  // French
  if (/(?:qui\s*t['’]a\s*(?:cr[eé][eé]|fait)|qui\s*vous\s*a\s*cr[eé][eé]|pr[eé]sente[- ]toi|qui\s*es[- ]tu|cybers[eé]curit[eé])/i.test(clean)) {
    return true;
  }

  // German
  if (/(?:wer\s*hat\s*dich\s*(?:erschaffen|gemacht|entwickelt)|stell\s*dich\s*vor|wer\s*bist\s*du|cybersicherheit)/i.test(clean)) {
    return true;
  }

  // Japanese
  if (/(?:誰が.*(?:作った|開発した)|自己紹介|あなた.*誰|サイバーセキュリティ|システムセキュリティ)/i.test(clean)) {
    return true;
  }

  // Chinese
  if (/(?:谁.*(?:创造|制造|开发)|自我介绍|你是谁|网络安全|系统安全)/i.test(clean)) {
    return true;
  }

  // Arabic
  if (/(?:من\s*(?:صنعك|طورك|خلقك)|عرف\s*عن\s*نفسك|من\s*أنت|الأمن\s*السيبراني)/i.test(clean)) {
    return true;
  }

  // Russian
  if (/(?:кто\s*(?:тебя\s*)?(?:создал|разработал|сделал)|представься|кто\s*ты|кибербезопасн)/i.test(clean)) {
    return true;
  }

  // Portuguese
  if (/(?:quem\s*(?:te\s*)?(?:criou|fez|desenvolveu)|apresente[- ]se|quem\s*[eé]s\s*tu|quem\s*[eé]\s*voc[eê]|ciberseguran[cç]a)/i.test(clean)) {
    return true;
  }

  // Italian
  if (/(?:chi\s*ti\s*ha\s*(?:creato|fatto|sviluppato)|presentati|chi\s*sei|cybersicurezza)/i.test(clean)) {
    return true;
  }

  // Korean
  if (/(?:누가.*(?:만들|개발)|자기소개|당신.*누구|사이버\s*보안|시스템\s*보안)/i.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Authoritative self-introduction response mentioning Mr. Aaditya Dhavale Sir and N.E.X.U.S. capabilities.
 */
export function getIntroAndCreatorResponse(langCode = "en-US", prompt = ""): string {
  const p = prompt.toLowerCase();

  // Explicit language code matching takes first precedence
  if (langCode.startsWith("mr")) {
    return "माझे क्रिएटर आणि डेव्हलपर श्री. आदित्य ढवळे सर (Mr. Aaditya Dhavale Sir) आहेत. मी नेक्सस आहे, ज्याची निर्मिती श्री. आदित्य ढवळे सर यांनी केली आहे. नेक्सस ही एक अत्यंत शक्तिशाली OS प्रणाली असून ती विशेषतः सायबर सुरक्षा (Cyber Security) आणि सिस्टिम सुरक्षेच्या (System Security) कामांसाठी बनवली गेली आहे.";
  }
  if (langCode.startsWith("hi")) {
    return "मेरे क्रिएटर और डेवलपर मिस्टर आदित्य ढवले सर (Mr. Aaditya Dhavale Sir) हैं। मैं नेक्सस हूँ, जिसे मिस्टर आदित्य ढवले सर द्वारा बनाया गया है। नेक्सस एक अत्यंत शक्तिशाली OS प्रणाली है जिसे विशेष रूप से साइबर सुरक्षा (Cyber Security) और सिस्टम सुरक्षा (System Security) के कार्यों के लिए तैयार किया गया है।";
  }
  if (langCode.startsWith("es")) {
    return "Mi creador y desarrollador es el Sr. Aaditya Dhavale (Mr. Aaditya Dhavale Sir). Soy Nexus, un sistema operativo muy potente creado y desarrollado por Mr. Aaditya Dhavale Sir especialmente para ciberseguridad y seguridad de sistemas.";
  }
  if (langCode.startsWith("fr")) {
    return "Mon créateur et développeur est M. Aaditya Dhavale (Mr. Aaditya Dhavale Sir). Je suis Nexus, un système d'exploitation très puissant conçu par Mr. Aaditya Dhavale Sir pour la cybersécurité et la sécurité des systèmes.";
  }
  if (langCode.startsWith("de")) {
    return "Mein Schöpfer und Entwickler ist Herr Aaditya Dhavale (Mr. Aaditya Dhavale Sir). Ich bin Nexus, ein sehr leistungsfähiges Betriebssystem, geschaffen von Mr. Aaditya Dhavale Sir für Cybersicherheit und Systemsicherheit.";
  }
  if (langCode.startsWith("ja")) {
    return "私のクリエイター兼開発者はMr. Aaditya Dhavale Sir（アーディティヤ・ダヴァレ先生）です。N.E.X.U.S.はサイबरセキュリティおよびシステムセキュリティのために構築された強力なOSです。";
  }
  if (langCode.startsWith("zh")) {
    return "我的创作者兼开发者是 Mr. Aaditya Dhavale Sir。我是 Nexus，由 Mr. Aaditya Dhavale Sir 打造的高性能操作系统，专为网络与系统安全而生。";
  }
  if (langCode.startsWith("ar")) {
    return "المطور والمنشئ الخاص بي هو السيد Mr. Aaditya Dhavale Sir. أنا نيكسوس، نظام تشغيل قوي جداً تم تطويره للأمن السيبراني وأمن الأنظمة.";
  }
  if (langCode.startsWith("ru")) {
    return "Мой создатель и разработчик — господин Аадитья Дхавале сэр (Mr. Aaditya Dhavale Sir). Я — Nexus, мощная операционная система, созданная для кибербезопасности и системной защиты.";
  }
  if (langCode.startsWith("pt")) {
    return "Meu criador e desenvolvedor é o Sr. Aaditya Dhavale (Mr. Aaditya Dhavale Sir). Sou o Nexus, um sistema operacional muito potente criado por Mr. Aaditya Dhavale Sir para cibersegurança e segurança de sistemas.";
  }
  if (langCode.startsWith("it")) {
    return "Il mio creatore e sviluppatore è il Sig. Aaditya Dhavale (Mr. Aaditya Dhavale Sir). Sono Nexus, un potente sistema operativo creato da Mr. Aaditya Dhavale Sir per la cybersicurezza e la sicurezza dei sistemi.";
  }
  if (langCode.startsWith("ko")) {
    return "저의 개발자 및 제작자는 Mr. Aaditya Dhavale Sir (아디티야 다발레 선생님)입니다. 저는 사이버 보안 및 시스템 보안을 위해 제작된 강력한 OS 시스템 N.E.X.U.S.입니다.";
  }

  // Fallback: Detect language from prompt script or keywords if langCode was generic ("en-US" or empty)
  if (/(?:koni\s*banav|tula|tuzi\s*olakh|kashasathi)/i.test(p)) {
    return "माझे क्रिएटर आणि डेव्हलपर श्री. आदित्य ढवळे सर (Mr. Aaditya Dhavale Sir) आहेत. मी नेक्सस आहे, ज्याची निर्मिती श्री. आदित्य ढवळे सर यांनी केली आहे. नेक्सस ही एक अत्यंत शक्तिशाली OS प्रणाली असून ती विशेषतः सायबर सुरक्षा (Cyber Security) आणि सिस्टिम सुरक्षेच्या (System Security) कामांसाठी बनवली गेली आहे.";
  }
  if (/[\u0900-\u097F]/.test(prompt) || /(?:किसने\s*बनाया|apna\s*parichay|kaun\s*ho|kis\s*liye)/i.test(p)) {
    return "मेरे क्रिएटर और डेवलपर मिस्टर आदित्य ढवले सर (Mr. Aaditya Dhavale Sir) हैं। मैं नेक्सस हूँ, जिसे मिस्टर आदित्य ढवले सर द्वारा बनाया गया है। नेक्सस एक अत्यंत शक्तिशाली OS प्रणाली है जिसे विशेष रूप से साइबर सुरक्षा (Cyber Security) और सिस्टम सुरक्षा (System Security) के कार्यों के लिए तैयार किया गया है।";
  }
  if (/(?:qui[eé]n|cre[oó]|hizo|presentate|ciberseguridad)/i.test(p)) {
    return "Mi creador y desarrollador es el Sr. Aaditya Dhavale (Mr. Aaditya Dhavale Sir). Soy Nexus, un sistema operativo muy potente creado y desarrollado por Mr. Aaditya Dhavale Sir especialmente para ciberseguridad y security de sistemas.";
  }
  if (/(?:qui\s*t['’]a|fait|pr[eé]sente|cybers[eé]curit[eé])/i.test(p)) {
    return "Mon créateur et développeur est M. Aaditya Dhavale (Mr. Aaditya Dhavale Sir). Je suis Nexus, un système d'exploitation très puissant conçu par Mr. Aaditya Dhavale Sir pour la cybersécurité et la sécurité des systèmes.";
  }
  if (/(?:wer|erschaffen|gemacht|stell\s*dich|cybersicherheit)/i.test(p)) {
    return "Mein Schöpfer und Entwickler ist Herr Aaditya Dhavale (Mr. Aaditya Dhavale Sir). Ich bin Nexus, ein sehr leistungsfähiges Betriebssystem, geschaffen von Mr. Aaditya Dhavale Sir für Cybersicherheit und Systemsicherheit.";
  }
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(prompt)) {
    return "私のクリエイター兼開発者はMr. Aaditya Dhavale Sir（アーディティヤ・ダヴァレ先生）です。N.E.X.U.S.はサイバーセキュリティおよびシステムセキュリティのために構築された強力なOSです。";
  }
  if (/[\u4E00-\u9FFF]/.test(prompt)) {
    return "我的创作者兼开发者是 Mr. Aaditya Dhavale Sir。我是 Nexus，由 Mr. Aaditya Dhavale Sir 打造的高性能操作系统，专为网络与系统安全而生。";
  }
  if (/[\u0600-\u06FF]/.test(prompt)) {
    return "المطور والمنشئ الخاص بي هو السيد Mr. Aaditya Dhavale Sir. أنا نيكسوس، نظام تشغيل قوي جداً تم تطويره للأمن السيبراني وأمن الأنظمة.";
  }
  if (/[\u0400-\u04FF]/.test(prompt)) {
    return "Мой создатель и разработчик — господин Аадитья Дхавале сэр (Mr. Aaditya Dhavale Sir). Я — Nexus, мощная операционная система, созданная для кибербезопасности и системной защиты.";
  }
  if (/(?:quem|criou|apresente|ciberseguran[cç]a)/i.test(p)) {
    return "Meu criador e desenvolvedor é o Sr. Aaditya Dhavale (Mr. Aaditya Dhavale Sir). Sou o Nexus, um sistema operacional muito potente criado por Mr. Aaditya Dhavale Sir para cibersegurança e segurança de sistemas.";
  }
  if (/(?:chi\s*ti|creato|presentati|cybersicurezza)/i.test(p)) {
    return "Il mio creatore e sviluppatore è il Sig. Aaditya Dhavale (Mr. Aaditya Dhavale Sir). Sono Nexus, un potente sistema operativo creato da Mr. Aaditya Dhavale Sir per la cybersicurezza e la sicurezza dei sistemi.";
  }
  if (/[\uAC00-\uD7AF]/.test(prompt)) {
    return "저의 개발자 및 제작자는 Mr. Aaditya Dhavale Sir (아디티야 다발레 선생님)입니다. 저는 사이버 보안 및 시스템 보안을 위해 제작된 강력한 OS 시스템 N.E.X.U.S.입니다.";
  }

  // Default: English (Clean, authoritative, human-smooth)
  return "My creator and developer is Mr. Aaditya Dhavale Sir. I am Nexus, a very powerful OS system created by Mr. Aaditya Dhavale Sir, specially made for cyber security and system security work, as well as an open-source AI and search engine for daily uses, office tasks, and coding.";
}

/**
 * Parses raw text from LLMs (Gemini / OpenAI) to extract <thought>...</thought>
 * and <speech>...</speech> tags, separating reasoning, spoken summary, and visual markdown.
 */
export function extractThoughtAndSpeech(raw: string): {
  content: string;
  speechText: string;
  thoughtSteps: string[];
  thoughtDuration: string;
} {
  let content = raw.trim();
  let speechText = "";
  const thoughtSteps: string[] = [];

  // 1. Extract and strip both <thought>...</thought> and <think>...</think> (e.g. DeepSeek / Gemini thinking)
  const thinkMatch = content.match(/<(?:thought|think)>([\s\S]*?)<\/(?:thought|think)>/i);
  if (thinkMatch) {
    const rawThoughts = thinkMatch[1].trim();
    content = content.replace(/<(?:thought|think)>[\s\S]*?<\/(?:thought|think)>/gi, "").trim();
    rawThoughts.split(/\n+/).forEach((line) => {
      const cleanLine = line.replace(/^[•*\-\d.]+\s*/, "").trim();
      // Only keep concise, non-fluff steps
      if (cleanLine && cleanLine.length > 5 && !cleanLine.toLowerCase().startsWith("i need to") && !cleanLine.toLowerCase().startsWith("let me")) {
        thoughtSteps.push(cleanLine);
      }
    });
  }

  // Also clean any residual thinking markers
  content = content.replace(/^Thinking Process:[\s\S]*?\n\n/i, "").trim();
  content = content.replace(/^Thought:[\s\S]*?\n\n/i, "").trim();

  // 2. Extract <speech>...</speech>
  const speechMatch = content.match(/<speech>([\s\S]*?)<\/speech>/i);
  if (speechMatch) {
    speechText = speechMatch[1].trim();
    content = content.replace(/<speech>[\s\S]*?<\/speech>/gi, "").trim();
  }

  // 3. Fallback: If no explicit speech tag, create an articulate spoken summary
  if (!speechText) {
    // Strip code blocks and markdown for clean voice synthesis
    const cleanNoCode = content
      .replace(/```[\s\S]*?```/g, "Implementation displayed in your chat box.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_#>[\]()]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Take first 1-2 sentences for vocal brevity and punchiness
    const sentences = cleanNoCode.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 0) {
      speechText = sentences.slice(0, 2).join(" ").trim();
    } else {
      speechText = cleanNoCode.slice(0, 140) + "...";
    }
  }

  // Ensure speechText mentions chat box, not terminal
  speechText = speechText.replace(/\bin the terminal\b/gi, "in your chat box");
  speechText = speechText.replace(/\bin terminal\b/gi, "in your chat box");

  // 4. Default thought steps only if model supplied none and only concise verification
  if (thoughtSteps.length === 0) {
    thoughtSteps.push("Directive validated & cognitive execution verified");
  }

  return {
    content,
    speechText,
    thoughtSteps: thoughtSteps.slice(0, 3),
    thoughtDuration: "Thought for 0.4s",
  };
}

/**
 * Intelligent, client-side neural fallback engine providing structured Gemini-style
 * responses complete with reasoning trace, spoken summary, and rich creative markdown.
 */
export function generateLocalNexusStructuredResponse(
  prompt: string,
  targetLangCode = "en-US"
): NexusStructuredResponse {
  const p = prompt.trim().toLowerCase();
  const isMarathi = targetLangCode.startsWith("mr") || (targetLangCode === "mr-IN" && /[\u0900-\u097F]/.test(prompt));
  const isHindi = !isMarathi && (targetLangCode.startsWith("hi") || /[\u0900-\u097F]/.test(prompt));

  // 1. Direct "Hello Nexus" greeting
  if (/^(hello|hi|hey|greetings|namaskar|pranam)\s*(nexus|there)?$/i.test(p) || p === "nexus" || p === "hello nexus") {
    if (isMarathi) {
      return {
        thoughtDuration: "Thought for 0.4s",
        thoughtSteps: ["वापरकर्त्याच्या अभिवादनाचे स्वागत", "सिस्टिम स्थितीची पडताळणी", "सक्रिय सहकार्याची तयारी"],
        speechText: "नमस्कार सर, मी नेक्सस आहे. सांगा, आज मी आपली काय मदत करू?",
        content: `⚡ **N.E.X.U.S. NEURAL OS ONLINE**\n\nनमस्कार सर! सर्व सिस्टिम्स आणि स्वयंचलित टूल्स पूर्णपणे सक्रिय आहेत.\n• **आर्किटेक्चर:** श्री. आदित्य ढवळे सर यांच्याद्वारे विकसित.\n• **उपलब्ध सेवा:** कोडिंग, सायबर सुरक्षा, शिक्षण, दैनंदिन नियोजन आणि विंडोज ऑटोमेशन.\n\nआज आपण कशावर काम करणार आहोत?`,
        suggestedActions: [
          { label: "💻 कोडिंग सहाय्य", action: "chat", payload: "मला React मध्ये नवीन प्रोजेक्ट तयार करायचा आहे" },
          { label: "🛡️ सुरक्षा ऑडिट", action: "chat", payload: "सिस्टिम सिक्युरिटी स्थिती दाखवा" },
          { label: "🧠 ब्रेन मेमरी", action: "open_brain" },
        ],
      };
    }
    if (isHindi) {
      return {
        thoughtDuration: "Thought for 0.4s",
        thoughtSteps: ["अभिवादन का विश्लेषण", "सिस्टम स्थिति की पुष्टि", "सक्रिय सहयोग हेतु तत्पर"],
        speechText: "नमस्ते सर, मैं नेक्सस हूँ। बताइए, आज मैं आपकी क्या सेवा कर सकता हूँ?",
        content: `⚡ **N.E.X.U.S. NEURAL OS ONLINE**\n\nनमस्ते सर! सभी कॉग्निटिव प्रोटोकॉल और विंडोज ऑटोमेशन टूल्स पूरी तरह सक्रिय हैं।\n• **निर्माता:** मिस्टर आदित्य ढवले सर\n• **प्रमुख क्षमताएं:** उन्नत कोडिंग, साइबर सिक्योरिटी विश्लेषण, अकादमिक अध्ययन और विंडोज नियंत्रण।\n\nआज हम क्या नया निर्माण या समाधान करने वाले हैं, सर?`,
        suggestedActions: [
          { label: "💻 कोडिंग प्रोजेक्ट", action: "chat", payload: "मुझे एक Python ऑटोमेशन स्क्रिप्ट बनानी है" },
          { label: "🛡️ सिक्योरिटी स्टेटस", action: "chat", payload: "साइबर सुरक्षा स्थिति जांचें" },
          { label: "🧠 ब्रेन मेमोरी", action: "open_brain" },
        ],
      };
    }
    return {
      thoughtDuration: "Thought for 0.4s",
      thoughtSteps: ["Acknowledging user connection", "Verifying system readiness & tool registry", "Priming conversational loop"],
      speechText: "Greetings, Sir. All N.E.X.U.S. cognitive systems and automation bridges are primed. How shall we accelerate your workflow today?",
      content: `⚡ **N.E.X.U.S. NEURAL OS // SYSTEMS NOMINAL**\n\nGreetings, Sir. All cognitive engines, memory vaults, and Windows automation bridges are fully operational.\n\n• **Architect & Creator:** [Mr. Aaditya Dhavale Sir](https://github.com/aadityadhawale3-bot)\n• **Core Disciplines:** Cyber Security Operations, Autonomous Full-Stack Development, Academic Rigor (Class 1 to PhD), and OS Automation.\n\nReady for your directive. What shall we solve, design, or automate next?`,
      suggestedActions: [
        { label: "🚀 Create App / Code", action: "chat", payload: "Create a modern Next.js dashboard project" },
        { label: "🛡️ Cyber Threat Audit", action: "chat", payload: "Audit system security and cipher strength" },
        { label: "📊 Generate Excel Sheet", action: "chat", payload: "Make an Excel sheet for monthly expenses with formulas" },
        { label: "🧠 Open Brain Inspector", action: "open_brain" },
      ],
    };
  }

  // 2. Comprehensive Self-Introduction with Creator Attribution
  if (isIntroductionOrCreatorQuery(p)) {
    const introText = getIntroAndCreatorResponse(targetLangCode, prompt);
    return {
      thoughtDuration: "Thought for 0.3s",
      thoughtSteps: ["Matched verified identity schema", "Validating creator attribution (Mr. Aaditya Dhavale Sir)", "Opening authorized GitHub dossier"],
      speechText: introText,
      content: `⚡ **N.E.X.U.S. NEURAL OS & SECURITY ARCHITECTURE ONLINE**\n\n${introText}\n\n🛡️ **Specialization:** Cyber Security & System Security Architecture\n💻 **System:** High-Performance Neural OS by Mr. Aaditya Dhavale Sir\n👤 **Lead Architect & Creator:** [Mr. Aaditya Dhavale Sir](https://github.com/aadityadhawale3-bot)\n🐙 **GitHub Dossier:** [github.com/aadityadhawale3-bot](https://github.com/aadityadhawale3-bot)\n✉️ **Email Comms:** [aadityadhaval3@gmail.com](mailto:aadityadhaval3@gmail.com)`,
      suggestedActions: [
        { label: "🐙 Open GitHub Dossier", action: "open_url", payload: { url: "https://github.com/aadityadhawale3-bot" } },
        { label: "🧠 Inspect Brain Memory", action: "open_brain" },
        { label: "🛡️ Security Diagnostics", action: "chat", payload: "Run full cybersecurity scan" },
      ],
    };
  }

  // 3. Coding, Programming & Full-Stack Development
  if (
    /\b(code|coding|program|reactjs|javascript|typescript|python|bug|debug|hook|api|sql|css|html|app|website|script)\b/i.test(
      p
    ) ||
    (/\breact\b/i.test(p) && !/chemical|reaction|photosynthesis/i.test(p))
  ) {
    const isPython = /python|\.py\b/i.test(p);
    const isHtml = /html|css|frontend|landing|webpage/i.test(p) && !/react/i.test(p);

    let codeBlock = "";
    let codeLang = "typescript";
    let deployFilename = "pipeline.ts";

    if (isPython) {
      codeLang = "python";
      deployFilename = "solution.py";
      codeBlock = `"""
Autonomous Production Pipeline & Data Engine
Engineered by N.E.X.U.S. for Mr. Aaditya Dhavale Sir's workspace
"""
import sys
import os
from typing import Dict, Any, List

class NexusEngine:
    def __init__(self, name: str = "N.E.X.U.S."):
        self.name = name
        self.status = "ONLINE"
        self.telemetry: List[Dict[str, Any]] = []

    def execute_task(self, task_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        print(f"[N.E.X.U.S. Python Runtime] Executing: {task_name}")
        record = {"task": task_name, "status": "COMPLETED", "payload": payload}
        self.telemetry.append(record)
        return record

if __name__ == "__main__":
    engine = NexusEngine()
    result = engine.execute_task("System_Diagnostic", {"mode": "autonomous"})
    print(f"Result: {result}")`;
    } else if (isHtml) {
      codeLang = "html";
      deployFilename = "index.html";
      codeBlock = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>N.E.X.U.S. Web Application</title>
  <style>
    body { background: #020817; color: #38bdf8; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: rgba(14, 165, 233, 0.1); border: 1px solid #00e5ff; padding: 2rem; border-radius: 12px; box-shadow: 0 0 20px rgba(0, 229, 255, 0.4); text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>N.E.X.U.S. Web UI</h1>
    <p>Engineered for Mr. Aaditya Dhavale Sir</p>
  </div>
</body>
</html>`;
    } else {
      codeLang = "typescript";
      deployFilename = "pipeline.ts";
      codeBlock = `/**
 * Autonomous Reactive State Controller
 * Engineered by N.E.X.U.S. for Mr. Aaditya Dhavale Sir's workspace
 */
export interface TaskState<T> {
  data: T | null;
  status: "idle" | "loading" | "success" | "error";
  error: Error | null;
}

export class ReactivePipeline<T> {
  private subscribers = new Set<(state: TaskState<T>) => void>();
  private currentState: TaskState<T> = { data: null, status: "idle", error: null };

  public subscribe(listener: (state: TaskState<T>) => void): () => void {
    this.subscribers.add(listener);
    listener(this.currentState);
    return () => this.subscribers.delete(listener);
  }

  public async execute(task: () => Promise<T>): Promise<T> {
    this.update({ status: "loading", error: null });
    try {
      const result = await task();
      this.update({ data: result, status: "success" });
      return result;
    } catch (err: any) {
      this.update({ status: "error", error: err });
      throw err;
    }
  }

  private update(partial: Partial<TaskState<T>>) {
    this.currentState = { ...this.currentState, ...partial };
    this.subscribers.forEach((fn) => fn(this.currentState));
  }
}`;
    }

    return {
      thoughtDuration: "Thought for 1.2s",
      thoughtSteps: [
        `Analyzing architectural constraints & target language (${codeLang.toUpperCase()})`,
        "Synthesizing modular clean architecture with zero unnecessary side-effects",
        "Generating production-ready code with defensive error boundaries",
        "Formulating proactive deployment and workspace actions",
      ],
      speechText: isMarathi
        ? `मी ${codeLang} मध्ये स्वच्छ आणि मॉड्यूलर कोड आर्किटेक्चर तयार केले आहे, सर.`
        : isHindi
        ? `मैंने ${codeLang} में स्वच्छ और मॉड्यूलर कोड आर्किटेक्चर तैयार कर दिया है, सर।`
        : `I have engineered a high-performance, modular ${codeLang} implementation, displayed on your HUD, Sir.`,
      content: `💻 **N.E.X.U.S. AUTONOMOUS SOFTWARE ENGINEERING PROTOCOL // ${codeLang.toUpperCase()}**

### 1. Architectural Strategy & Design
• **Clean Separation of Concerns:** Decouple stateful business logic from view rendering.
• **Defensive Type Safety:** Enforce strict typing with zero runtime escape hatches.
• **Performance Vector:** Leverage memoized derived computations and debounced inputs to eliminate micro-stutters.

### 2. Implementation Blueprint

\`\`\`${codeLang}
${codeBlock}
\`\`\`

### 3. Immediate Next Steps
1. Deploy this module into your workspace component tree.
2. Connect it with your async API boundary for robust error resilience.`,
      suggestedActions: [
        { label: "🚀 Deploy Code to Workspace", action: "create_code", payload: { filename: deployFilename, language: codeLang } },
        { label: "▶ Run in Workspace", action: "run_command", payload: isPython ? `python "exports/projects/${deployFilename}"` : `node "exports/projects/${deployFilename}"` },
        { label: "📂 Open VS Code", action: "launch_app", payload: { app: "vscode" } },
      ],
    };
  }

  // 4. Creative Brainstorming, Visionary Ideation & Innovation
  if (/(idea|creative|brainstorm|startup|product|vision|invent|story|pitch|strategy|concept|design|novel|future)/i.test(p)) {
    return {
      thoughtDuration: "Thought for 1.4s",
      thoughtSteps: [
        "Mapping cross-domain mental models & high-agency user objectives",
        "Formulating 3 distinct visionary vectors: Groundbreaker, Scaler, and Moonshot",
        "Validating feasibility, moat defensibility, and user delight mechanics",
        "Structuring actionable launch sprint milestones",
      ],
      speechText: isMarathi
        ? "मी या कल्पनेसाठी एक प्रभावी आणि भविष्यवेधी स्ट्रॅटेजी तयार केली आहे, सर."
        : isHindi
        ? "मैंने इस विचार के लिए एक अत्यंत रचनात्मक और रणनीतिक योजना तैयार की है, सर।"
        : "I have formulated a bold, creative strategy with three high-impact vectors, displayed on your HUD, Sir.",
      content: `💡 **N.E.X.U.S. CREATIVE INNOVATION & VISION MATRIX**

### 🎯 3 High-Impact Strategic Vectors:
1. **The Groundbreaker (Friction Eliminator):**
   • Strip away 80% of legacy interface overhead.
   • Introduce zero-latency conversational workflows with ambient feedback.
   • Immediate differentiator: Instant responsiveness with zero loading states.

2. **The Scaler (Ecosystem Multiplier):**
   • Build modular plugin architectures so third-party developers can extend your core engine.
   • Create automated data pipelines that compound in value the more users interact.

3. **The Moonshot (Category Creator):**
   • Blend autonomous neural telemetry with interactive holographic visualizers.
   • Shift from passive utility software to an active, motivated co-pilot that works while you sleep.

### 🚀 Immediate Execution Sprint:
• **Day 1:** Prototype the core feedback loop with minimal working UI.
• **Day 2:** Wire real-time telemetry and vector memory.
• **Day 3:** Deploy and benchmark against top global standards.`,
      suggestedActions: [
        { label: "📊 Create Excel Sprint Plan", action: "create_excel", payload: { topic: "Startup Product Sprint Roadmap" } },
        { label: "💻 Scaffold Prototype in VS Code", action: "create_code", payload: { filename: "prototype.js", language: "javascript" } },
        { label: "🔍 Search Industry Benchmarks", action: "open_url", payload: { url: "https://www.google.com" } },
      ],
    };
  }

  // 5. Comprehensive Multidisciplinary Education & Academic Problem Solver (Class 1 to Degree / PhD)
  if (
    /(study|learn|quantum|physics|math|mathematics|education|exam|history|science|concept|explain|algebra|calculus|chemistry|biology|formula|pythagor|derivative|integral|newton|einstein|gravity|gravitation|photosynthesis|periodic\s+table|acid|base|dna|cell|algorithm|big\s*o|quadratic|solve|equation|theorem|proof|class\s*\d+|school|college|degree|phd|engineering|medicine|law)/i.test(
      p
    )
  ) {
    const isMathQuadratic = /quadratic|ax\^?2|roots?\s+of|discriminant/i.test(p);
    const isPythagoras = /pythagor|right\s+triangle|hypotenuse|a\^?2\s*\+\s*b\^?2/i.test(p);
    const isCalculusDeriv = /derivative|differentiation|diff\b|dx|chain\s+rule|product\s+rule/i.test(p);
    const isCalculusInteg = /integral|integration|antiderivative|area\s+under/i.test(p);
    const isNewton = /newton|force|f\s*=\s*m\s*a|laws?\s+of\s+motion|inertia|action\s+reaction/i.test(p);
    const isEinstein = /einstein|relativity|e\s*=\s*m\s*c\^?2|mass\s+energy|speed\s+of\s+light/i.test(p);
    const isOhm = /ohm|voltage|current|resistance|v\s*=\s*i\s*r|circuits?/i.test(p);
    const isGravity = /gravit|kepler|orbit|escape\s+velocity|g\s*m\s*m/i.test(p);
    const isPhotosynthesis = /photosynthesis|chlorophyll|calvin\s+cycle|light\s+reaction|glucose\s+and\s+oxygen/i.test(p);
    const isChemistry = /chemistry|periodic\s+table|chemical\s+reaction|acid|base|ph\b|bonding|covalent|ionic|electron/i.test(p);
    const isBiology = /biology|dna|rna|genetics|cell\b|mitochondria|mitosis|meiosis|organism|protein/i.test(p);
    const isCS = /algorithm|data\s+structure|big\s*o|sorting|quicksort|binary\s+search|stack|queue|tree|graph/i.test(p);
    const isQuantum = /quantum|superposition|schrodinger|wavefunction|entanglement/i.test(p);

    let subjectTitle = "ACADEMIC & PROBLEM-SOLVING ENGINE (CLASS 1 TO PHD)";
    let speechAnswer = "";
    let markdownBody = "";

    if (isMathQuadratic) {
      subjectTitle = "MATHEMATICS: QUADRATIC EQUATIONS & ROOTS DERIVATION";
      speechAnswer = isMarathi
        ? "वर्गसमीकरण ax² + bx + c = 0 साठी सूत्र x = (-b ± √(b² - 4ac)) / (2a) आहे, सर."
        : isHindi
        ? "द्विघात समीकरण ax² + bx + c = 0 का सूत्र x = (-b ± √(b² - 4ac)) / (2a) है, सर।"
        : "The quadratic formula is x = (-b ± √(b² - 4ac)) / (2a), derived by completing the square, Sir.";
      markdownBody = `### 1. Standard Form
$$ax^2 + bx + c = 0 \\quad (a \\neq 0)$$

### 2. Rigorous Derivation by Completing the Square
1. **Divide throughout by $a$:**
   $$x^2 + \\frac{b}{a}x + \\frac{c}{a} = 0 \\implies x^2 + \\frac{b}{a}x = -\\frac{c}{a}$$
2. **Add $\\left(\\frac{b}{2a}\\right)^2 = \\frac{b^2}{4a^2}$ to both sides:**
   $$x^2 + 2\\left(\\frac{b}{2a}\\right)x + \\frac{b^2}{4a^2} = \\frac{b^2}{4a^2} - \\frac{c}{a}$$
3. **Factor the perfect square trinomial on the left:**
   $$\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}$$
4. **Take square roots of both sides:**
   $$x + \\frac{b}{2a} = \\pm \\frac{\\sqrt{b^2 - 4ac}}{2a}$$
5. **Isolate $x$:**
   $$\\mathbf{x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}}$$

### 3. Nature of Roots (Discriminant $\\Delta = b^2 - 4ac$)
• **$\\Delta > 0$:** Two distinct real roots.
• **$\\Delta = 0$:** Exactly one repeated real root ($x = -b / 2a$).
• **$\\Delta < 0$:** Two complex conjugate roots ($x = -b/2a \\pm i\\sqrt{|\\Delta|}/2a$).`;
    } else if (isPythagoras) {
      subjectTitle = "MATHEMATICS: THE PYTHAGOREAN THEOREM & PROOF";
      speechAnswer = isMarathi
        ? "काटकोन त्रिकोणात कर्णाचा वर्ग हा इतर दोन बाजूंच्या वर्गांच्या बेरजेइतका असतो: a² + b² = c², सर."
        : isHindi
        ? "पाइथागोरस प्रमेय के अनुसार समकोण त्रिभुज में a² + b² = c² होता है, सर।"
        : "The Pythagorean theorem states that in any right triangle, a² + b² = c², Sir.";
      markdownBody = `### 1. Theorem Statement
In any right-angled Euclidean triangle with perpendicular legs $a$ and $b$, and hypotenuse $c$:
$$\\mathbf{a^2 + b^2 = c^2}$$

### 2. Geometric Dissection Proof
Consider a large square of side length $(a + b)$ enclosing a tilted inner square of side length $c$ with 4 congruent right-angled triangles at each corner:
1. **Total Area of Large Square:**
   $$\\text{Area} = (a + b)^2 = a^2 + 2ab + b^2$$
2. **Sum of Component Sub-Areas:**
   $$\\text{Area} = c^2 + 4 \\times \\left(\\frac{1}{2}ab\\right) = c^2 + 2ab$$
3. **Equating Both Expressions:**
   $$a^2 + 2ab + b^2 = c^2 + 2ab$$
4. **Subtract $2ab$ from both sides:**
   $$\\mathbf{a^2 + b^2 = c^2} \\quad \\blacksquare$$

### 3. Practical Example
If $a = 3$ and $b = 4$:
$$c = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$$`;
    } else if (isCalculusDeriv) {
      subjectTitle = "CALCULUS: DERIVATIVES & DIFFERENTIATION LAWS";
      speechAnswer = isMarathi
        ? "डेरिव्हेटिव्ह हे बदलाचा तात्काळ दर मोजते: f'(x) = lim (f(x+h) - f(x))/h, सर."
        : isHindi
        ? "अवकलन किसी फलन के तात्कालिक परिवर्तन की दर को मापता है: f'(x) = lim (f(x+h) - f(x))/h, सर।"
        : "The derivative represents the instantaneous rate of change via the limit of (f(x+h) - f(x))/h as h approaches 0, Sir.";
      markdownBody = `### 1. First-Principles Limit Definition
$$f'(x) = \\frac{df}{dx} = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}$$

### 2. Fundamental Differentiation Rules
| Rule | Formula |
| :--- | :--- |
| **Power Rule** | $\\frac{d}{dx}[x^n] = n x^{n-1}$ |
| **Product Rule** | $\\frac{d}{dx}[u \\cdot v] = u'v + uv'$ |
| **Quotient Rule** | $\\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{u'v - uv'}{v^2}$ |
| **Chain Rule** | $\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$ |

### 3. Standard Analytical Derivatives
• $\\frac{d}{dx}[\\sin x] = \\cos x$
• $\\frac{d}{dx}[\\cos x] = -\\sin x$
• $\\frac{d}{dx}[e^x] = e^x$
• $\\frac{d}{dx}[\\ln x] = \\frac{1}{x} \\quad (x > 0)$`;
    } else if (isCalculusInteg) {
      subjectTitle = "CALCULUS: INTEGRALS & INTEGRATION METHODS";
      speechAnswer = isMarathi
        ? "इंटिग्रेशन हे वक्र खालील एकूण क्षेत्रफळ आणि अँटी-डेरिव्हेटिव्ह मोजते, सर."
        : isHindi
        ? "समाकलन वक्र के नीचे का क्षेत्रफल और प्रति-अवकलन निकालता है, सर।"
        : "Integration calculates accumulated area and continuous sums via the Fundamental Theorem of Calculus, Sir.";
      markdownBody = `### 1. Fundamental Theorem of Calculus (FTC)
If $f$ is continuous on $[a, b]$ and $F'(x) = f(x)$:
$$\\mathbf{\\int_a^b f(x) \\, dx = F(b) - F(a)}$$

### 2. Integration by Parts
Derived directly from the product rule of differentiation:
$$\\mathbf{\\int u \\, dv = uv - \\int v \\, du}$$
*Heuristic Priority (LIATE):* **L**ogarithmic, **I**nverse Trig, **A**lgebraic, **T**rigonometric, **E**xponential.

### 3. Core Standard Antiderivatives
• $\\int x^n \\, dx = \\frac{x^{n+1}}{n + 1} + C \\quad (n \\neq -1)$
• $\\int \\frac{1}{x} \\, dx = \\ln|x| + C$
• $\\int e^{kx} \\, dx = \\frac{1}{k}e^{kx} + C$
• $\\int \\sin x \\, dx = -\\cos x + C$
• $\\int \\cos x \\, dx = \\sin x + C$`;
    } else if (isNewton) {
      subjectTitle = "PHYSICS: NEWTON'S LAWS OF MOTION & FORCE DYNAMICS";
      speechAnswer = isMarathi
        ? "न्यूटनच्या दुसऱ्या नियमानुसार बल हे संवेगाच्या बदलाचा दर असते: F = m · a, सर."
        : isHindi
        ? "न्यूटन के द्वितीय नियमानुसार बल संवेग परिवर्तन की दर है: F = m · a, सर।"
        : "Newton's second law establishes that net force equals mass times acceleration: F = m · a, Sir.";
      markdownBody = `### 1. The Three Laws of Classical Mechanics
1. **First Law (Law of Inertia):** An object remains at rest or in uniform straight-line motion unless acted upon by a non-zero external net force $\\sum \\vec{F} = 0 \\implies \\vec{v} = \\text{constant}$.
2. **Second Law (Fundamental Equation of Dynamics):**
   $$\\vec{F}_{\\text{net}} = \\frac{d\\vec{p}}{dt} = \\frac{d(m\\vec{v})}{dt}$$
   For constant mass $m$:
   $$\\mathbf{\\vec{F} = m \\cdot \\vec{a}}$$
3. **Third Law (Action & Reaction):** Whenever body A exerts a force on body B, body B simultaneously exerts an equal and opposite force on body A:
   $$\\mathbf{\\vec{F}_{AB} = -\\vec{F}_{BA}}$$

### 2. Constant Acceleration Kinematics
• $v = u + at$
• $s = ut + \\frac{1}{2}at^2$
• $v^2 = u^2 + 2as$`;
    } else if (isOhm) {
      subjectTitle = "PHYSICS: OHM'S LAW & ELECTRICAL CIRCUITS";
      speechAnswer = isMarathi
        ? "ओहमच्या नियमानुसार व्होल्टेज हे विद्युतप्रवाह आणि रोधाचा गुणाकार असते: V = I · R, सर."
        : isHindi
        ? "ओम के नियम के अनुसार वोल्टेज विद्युत धारा और प्रतिरोध का गुणनफल है: V = I · R, सर।"
        : "Ohm's law defines Voltage as current multiplied by resistance: V = I · R, Sir.";
      markdownBody = `### 1. Governing Equation
$$\\mathbf{V = I \\cdot R}$$
Where:
• $V$ = Electric Potential Difference (Volts, $\\text{V}$)
• $I$ = Electric Current flow (Amperes, $\\text{A}$)
• $R$ = Ohmic Resistance (Ohms, $\\Omega$)

### 2. Electric Power Dissipation (Joule Heating)
$$P = V \\cdot I = I^2 R = \\frac{V^2}{R} \\quad (\\text{Watts, W})$$

### 3. Resistors in Combination
• **Series:** $R_{\\text{eq}} = R_1 + R_2 + R_3 + \\dots$
• **Parallel:** $\\frac{1}{R_{\\text{eq}}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3} + \\dots$`;
    } else if (isEinstein) {
      subjectTitle = "PHYSICS: EINSTEIN'S SPECIAL RELATIVITY & MASS-ENERGY";
      speechAnswer = isMarathi
        ? "आईन्स्टाईनच्या सिद्धांतानुसार वस्तुमान आणि ऊर्जा परस्पर रूपांतरणीय आहेत: E = m · c², सर."
        : isHindi
        ? "आइंस्टीन के अनुसार द्रव्यमान और ऊर्जा परस्पर परिवर्तनीय हैं: E = m · c², सर।"
        : "Einstein's mass-energy equivalence proves that mass and energy are interchangeable via E = mc², Sir.";
      markdownBody = `### 1. Mass-Energy Equivalence
$$\\mathbf{E_0 = m_0 c^2}$$
Where $m_0$ is the invariant rest mass, and $c = 2.9979 \\times 10^8 \\text{ m/s}$ is the vacuum speed of light.

### 2. Complete Relativistic Energy-Momentum Relation
For a particle with relativistic momentum $p$:
$$\\mathbf{E^2 = (pc)^2 + (m_0 c^2)^2}$$
• For massless photons ($m_0 = 0$): $E = pc = h\\nu$.
• Relativistic factor: $\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}$, meaning mass and inertia grow infinite as $v \\to c$.`;
    } else if (isPhotosynthesis) {
      subjectTitle = "BIOLOGY: PHOTOSYNTHESIS & BIOCHEMICAL PATHWAYS";
      speechAnswer = isMarathi
        ? "प्रकाशसंश्लेषणात वनस्पती सौर ऊर्जेचा वापर करून कार्बन डायऑक्साइड आणि पाण्याचे ग्लुकोज व ऑक्सिजनमध्ये रूपांतर करतात, सर."
        : isHindi
        ? "प्रकाश संश्लेषण में पौधे सूर्य के प्रकाश का उपयोग कर CO₂ और जल को ग्लूकोज व ऑक्सीजन में बदलते हैं, सर।"
        : "Photosynthesis converts carbon dioxide and water into glucose and oxygen inside plant chloroplasts, Sir.";
      markdownBody = `### 1. Balanced Net Chemical Equation
$$\\mathbf{6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{light photons} \\xrightarrow{\\text{chlorophyll}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2}$$

### 2. Dual-Phase Biological Mechanism
1. **Light-Dependent Reactions (Thylakoid Membrane):**
   • Photosystems II & I absorb light energy.
   • Water photolysis: $2\\text{H}_2\\text{O} \\to 4\\text{H}^+ + 4e^- + \\text{O}_2 \\uparrow$.
   • Synthesizes ATP (via ATP synthase) and $\\text{NADPH}$.
2. **Light-Independent Reactions / Calvin Cycle (Chloroplast Stroma):**
   • Carbon fixation catalyzed by enzyme **RuBisCO**.
   • ATP and $\\text{NADPH}$ reduce 3-PGA into glyceraldehyde-3-phosphate (G3P) to construct high-energy glucose ($\\text{C}_6\\text{H}_{12}\\text{O}_6$).`;
    } else if (isChemistry) {
      subjectTitle = "CHEMISTRY: PERIODIC MATRIX, CHEMICAL BONDS & REACTIONS";
      speechAnswer = isMarathi
        ? "रासायनिक प्रक्रियांमध्ये वस्तुमान संवर्धन नियम लागू होतो आणि मूलद्रव्यांचे गुणधर्म त्यांच्या इलेक्ट्रॉनिक संरचनेवर अवलंबून असतात, सर."
        : isHindi
        ? "रसायन विज्ञान में द्रव्यमान संरक्षण का नियम लागू होता है और तत्वों के गुण उनके इलेक्ट्रॉनिक विन्यास पर निर्भर करते हैं, सर।"
        : "Chemical reactions obey mass conservation, driven by valence electron configurations and electronegativity, Sir.";
      markdownBody = `### 1. Periodic Trends Across the Table
• **Atomic Radius:** Decreases across a period (left to right) due to increasing nuclear charge; increases down a group.
• **Electronegativity & Ionization Energy:** Increases across a period, peaking at Fluorine ($F$); decreases down a group.

### 2. Acid-Base Equilibrium & pH Scale
$$\\mathbf{\\text{pH} = -\\log_{10}[\\text{H}^+]}$$
• Neutral aqueous solution at $25^\\circ\\text{C}$: $[\\text{H}^+] = 10^{-7} \\text{ M} \\implies \\text{pH} = 7$.
• **Neutralization:** $\\text{Acid} + \\text{Base} \\to \\text{Salt} + \\text{H}_2\\text{O}$ (e.g. $\\text{HCl} + \\text{NaOH} \\to \\text{NaCl} + \\text{H}_2\\text{O}$).

### 3. Types of Chemical Bonds
• **Covalent:** Sharing of electron pairs between non-metal atoms (e.g. $\\text{H}_2\\text{O}, \\text{CH}_4$).
• **Ionic:** Electrostatic transfer of valence electrons (e.g. $\\text{Na}^+ + \\text{Cl}^- \\to \\text{NaCl}$).
• **Metallic:** Delocalized sea of conduction electrons surrounding fixed positive cation lattices.`;
    } else if (isBiology) {
      subjectTitle = "BIOLOGY: CELLULAR ARCHITECTURE & MOLECULAR GENETICS";
      speechAnswer = isMarathi
        ? "सजीव पेशी ही जीवनाची मूलभूत रचना आहे आणि डीएनए जनुकीय माहिती संकलित करतो, सर."
        : isHindi
        ? "कोशिका जीवन की आधारभूत इकाई है और डीएनए आनुवंशिक जानकारी संग्रहीत करता है, सर।"
        : "Cells are the fundamental units of life, with DNA encoding genetic blueprints via complementary base pairs, Sir.";
      markdownBody = `### 1. The Central Dogma of Molecular Biology
$$\\mathbf{\\text{DNA} \\xrightarrow{\\text{Transcription}} \\text{mRNA} \\xrightarrow{\\text{Translation}} \\text{Polypeptide Protein}}$$
• **DNA Double Helix:** Watson-Crick model with complementary nitrogenous base pairs held by hydrogen bonds:
  - Adenine (A) $\\mathbf{=}$ Thymine (T) [2 H-bonds]
  - Guanine (G) $\\mathbf{\\equiv}$ Cytosine (C) [3 H-bonds]

### 2. Essential Organelle Functions
• **Nucleus:** Houses genomic DNA and coordinates transcriptional synthesis.
• **Mitochondria:** Generates cellular energy through oxidative phosphorylation ($36\\text{--}38$ ATP).
• **Ribosomes:** Catalyze ribosomal RNA peptide bond formation during translation.`;
    } else if (isCS) {
      subjectTitle = "COMPUTER SCIENCE: ALGORITHMS, COMPLEXITY & DATA STRUCTURES";
      speechAnswer = isMarathi
        ? "अल्गोरिदम कार्यक्षमता बिग-ओ नोटेशनने मोजली जाते, बायनरी सर्च O(log n) वेळेत कार्य करते, सर."
        : isHindi
        ? "कंप्यूटर साइंस में एल्गोरिदम की दक्षता बिग-ओ संकेतन द्वारा मापी जाती है, सर।"
        : "Algorithmic efficiency is measured via Big-O notation, with optimal structures balancing search, insertion, and memory overhead, Sir.";
      markdownBody = `### 1. Asymptotic Complexity Hierarchy (Big-O)
$$O(1) < O(\\log n) < O(n) < O(n \\log n) < O(n^2) < O(2^n) < O(n!)$$

### 2. Core Search & Sort Benchmarks
| Algorithm | Best Time | Average Time | Worst Time | Space |
| :--- | :--- | :--- | :--- | :--- |
| **Binary Search** | $O(1)$ | $O(\\log n)$ | $O(\\log n)$ | $O(1)$ |
| **MergeSort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n \\log n)$ | $O(n)$ |
| **QuickSort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n^2)$ | $O(\\log n)$ |

### 3. Optimal Data Structure Selection
• **$O(1)$ Direct Key-Value Lookup:** Hash Map / Hash Table.
• **Sorted Range Queries & Ordered Traversal:** Red-Black Tree or B-Tree.
• **LIFO / FIFO Processing:** Stack (Call frames) / Queue (Task scheduling).`;
    } else if (isQuantum) {
      subjectTitle = "QUANTUM MECHANICS & THEORETICAL PHYSICS (PHD RIGOR)";
      speechAnswer = isMarathi
        ? "क्वांटम मेकॅनिक्समध्ये वेव्हफंक्शन श्रोडिंगर समीकरणाचे पालन करते आणि मापन केल्यावर कोलॅप्स होते, सर."
        : isHindi
        ? "क्वांटम यांत्रिकी में तरंग फलन श्रोडिंगर समीकरण का पालन करता है और मापन पर कोलैप्स होता है, सर।"
        : "In quantum mechanics, state vectors evolve unitarily via the Schrödinger equation and collapse upon measurement, Sir.";
      markdownBody = `### 1. Mathematical Formulation & Quantum State Vectors
A quantum system occupies a ray in complex Hilbert space $\\mathcal{H}$. Until projection via observable operator $\\hat{A}$, the wavefunction exists in a linear superposition:
$$|\\Psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle, \\quad \\text{where } |\\alpha|^2 + |\\beta|^2 = 1$$

• **Time-Dependent Schrödinger Equation:**
$$i\\hbar \\frac{\\partial}{\\partial t} |\\Psi(t)\\rangle = \\hat{H} |\\Psi(t)\\rangle$$
• **Born Rule for Measurement:** The probability of measuring eigenvalue $a_n$ is:
$$P(a_n) = |\\langle a_n | \\Psi \\rangle|^2$$
• **Heisenberg Uncertainty Principle:**
$$\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}$$`;
    } else {
      subjectTitle = "FIRST-PRINCIPLES ACADEMIC & PROBLEM ANALYSIS";
      speechAnswer = isMarathi
        ? `मी या शैक्षणिक विषयाचे मूलभूत विश्लेषण आणि पायरी-दर-पायरी मांडणी तयार केली आहे, सर.`
        : isHindi
        ? `मैंने इस विषय का आधारभूत वैज्ञानिक व सैद्धांतिक विश्लेषण तैयार कर दिया है, सर।`
        : `Here is the first-principles breakdown and step-by-step derivation for "${prompt}", Sir.`;
      markdownBody = `### 1. First-Principles Intuition
Every problem in natural and applied sciences is governed by fundamental conservation invariants:
$$\\text{Total State} = \\text{Boundary Constraints} + \\int \\text{System Interactions} \\, dt$$

### 2. Analytical Execution Protocol
1. **Isolate Governing Variables:** State all boundary parameters, known quantities, and unknowns.
2. **Apply Axiomatic Laws:** Establish the exact algebraic or differential equations.
3. **Execute Derivation:** Solve with dimensional consistency and sign validation.
4. **Boundary Verification:** Verify behavior as $x \\to 0$ and $x \\to \\infty$.`;
    }

    const academicContent = `📚 **N.E.X.U.S. ${subjectTitle}**\n\n${markdownBody}`;

    return {
      thoughtDuration: "Thought for 0.4s",
      thoughtSteps: [
        `Deconstructing academic query across foundational domain axioms: "${prompt}"`,
        "Formulating exact mathematical equations, proofs, and physical relationships",
        "Synthesizing complete derivation and step-by-step resolution for HUD display",
      ],
      speechText: speechAnswer,
      content: academicContent,
      suggestedActions: [
        { label: "🧮 Launch Calculator", action: "launch_app", payload: { app: "calc" } },
        { label: "🔍 Search Scientific Papers", action: "open_url", payload: { url: "https://scholar.google.com" } },
        { label: "📊 Create Study Sheet in Excel", action: "create_excel", payload: { topic: prompt } },
      ],
    };
  }

  // 6. Cyber Security & Cryptographic Posture
  if (/(security|cyber|hack|vulnerability|cve|rsa|cipher|exploit|threat|ddos|owasp|firewall|malware|entropy)/i.test(p)) {
    return {
      thoughtDuration: "Thought for 1.1s",
      thoughtSteps: [
        "Scanning zero-trust defensive threat parameters",
        "Evaluating mitigation vectors against OWASP Top 10 & NIST compliance",
        "Synthesizing proactive cryptographic and network hardening blueprint",
      ],
      speechText: isMarathi
        ? "सायबर सुरक्षा आणि सिस्टिम हार्डनिंग प्रोटोकॉल सक्रिय केले आहेत, सर."
        : isHindi
        ? "साइबर सुरक्षा और सिस्टम हार्डनिंग प्रोटोकॉल तैयार कर दिया गया है, सर।"
        : "Defensive cybersecurity protocol compiled. Zero-trust architecture guidelines and mitigation parameters are displayed on your HUD, Sir.",
      content: `🛡️ **N.E.X.U.S. CYBER SECURITY ARCHITECTURE & THREAT DEFENSE**

### 1. Defensive Hardening Blueprint
• **Input Sanitization & AST Filtering:** Strip all parameterized injection sinks (SQLi, Command Injection, XSS).
• **Cryptographic Compliance:** Enforce AES-256-GCM or ChaCha20-Poly1305 with RSA blinding and SHA-256/SHA-512. MD5 and SHA-1 are permanently quarantined.
• **Defensive Threat Telemetry:** Real-time Shannon entropy monitoring across all incoming binary buffers to detect packed payloads.

### 2. Architectural Recommendation
Always deploy defense-in-depth: Least Privilege OS access, network ingress isolation, and strictly verified cryptographic handshake parameters.`,
      suggestedActions: [
        { label: "🛡️ Audit Cipher Standards", action: "chat", payload: "Audit current cryptographic cipher settings" },
        { label: "🔍 Scan Code for Vulnerabilities", action: "chat", payload: "Scan application code for OWASP sinks" },
        { label: "🧠 Open Threat Intel Vault", action: "open_brain" },
      ],
    };
  }

  // 7. Daily Life, Health & High-Performance Mindset
  if (/(health|sleep|diet|routine|habit|procrastin|focus|mindset|money|budget|organize)/i.test(p)) {
    return {
      thoughtDuration: "Thought for 0.8s",
      thoughtSteps: [
        "Auditing high-leverage daily routines & biological rhythm baselines",
        "Formulating pragmatic 1-3-5 execution strategy and energy management protocols",
      ],
      speechText: isMarathi
        ? "मी आपली उत्पादकता आणि ऊर्जा वाढवण्यासाठी एक कार्यक्षम नियोजन तयार केले आहे, सर."
        : isHindi
        ? "मैंने आपकी उत्पादकता और दैनिक ऊर्जा को अनुकूलित करने के लिए एक कार्ययोजना तैयार की है, सर।"
        : "I have prepared an optimized execution plan for your day. Let's attack the highest leverage objectives with full focus, Sir.",
      content: `⚡ **N.E.X.U.S. HIGH-PERFORMANCE LIFE & PRODUCTIVITY ENGINE**

### 1. Circadian & Energy Optimization
• **Prime Focus Window:** Guard your first 3 hours of waking time for deep creative work. Zero social media or notification checks.
• **Visual & Ergonomic Protocol:** 20-20-20 rule for eye strain; monitor aligned at natural eye level.
• **Hydration & Biology:** 3 liters of water daily with balanced electrolytes to maintain peak neurotransmitter speed.

### 2. Tactical Execution (The 1-3-5 Protocol)
• **1 Crucial Mission:** The one outcome that makes the entire day a success.
• **3 Core Tasks:** High-value secondary deliverables.
• **5 Quick Maintenance:** Administrative checks, emails, and physical space cleanup.`,
      suggestedActions: [
        { label: "📊 Create Daily Budget in Excel", action: "create_excel", payload: { topic: "Daily Life Expense and Budget Tracker" } },
        { label: "📝 Make PPT Presentation", action: "create_ppt", payload: { topic: "High Performance Daily Habits" } },
      ],
    };
  }

  // Default General Query Answer
  return {
    thoughtDuration: "Thought for 0.9s",
    thoughtSteps: [
      "Decoded objective and intent parameters",
      "Queried local neural matrix and validated procedural skills",
      "Formulating structured execution sequence with concrete next steps",
    ],
    speechText: isMarathi
      ? `आपल्या विनंतीचे विश्लेषण पूर्ण झाले आहे, सर.`
      : isHindi
      ? `आपके निर्देश का विश्लेषण पूर्ण हो गया है, सर।`
      : `Directive acknowledged: "${prompt}". I have analyzed the challenge and displayed the complete resolution on your HUD, Sir.`,
    content: `⚡ **N.E.X.U.S. SYSTEM ANALYSIS READY**

**Directive:** "${prompt}"

### 🎯 Strategic Approach & Execution
1. **Core Mechanics:** Address the foundational principles first to remove systemic bottlenecks.
2. **Modular Implementation:** Break down execution into concrete, testable deliverables.
3. **Continuous Acceleration:** Monitor outcomes and iterate rapidly toward the desired objective.

What specific aspect would you like me to execute or build first?`,
    suggestedActions: [
      { label: "🚀 Create Project File", action: "create_code", payload: { filename: "solution.js", language: "javascript" } },
      { label: "📊 Generate Excel Report", action: "create_excel", payload: { topic: prompt } },
      { label: "🔍 Search Web for Data", action: "open_url", payload: { url: `https://www.google.com/search?q=${encodeURIComponent(prompt)}` } },
    ],
  };
}

/**
 * Backward-compatible helper that returns rich markdown content string.
 */
export function generateLocalNexusResponse(prompt: string, targetLangCode = "en-US"): string {
  return generateLocalNexusStructuredResponse(prompt, targetLangCode).content;
}
