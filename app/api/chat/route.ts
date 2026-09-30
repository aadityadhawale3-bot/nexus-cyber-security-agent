import { NextRequest, NextResponse } from "next/server";
import {
  generateLocalNexusStructuredResponse,
  extractThoughtAndSpeech,
  SYSTEM_PROMPT,
  isIntroductionOrCreatorQuery,
  getIntroAndCreatorResponse,
} from "@/lib/nexusAI";
import { getAgentBrain, getSecurityAgentBrain } from "@/lib/agentBrain";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, language = "en-US", apiKey, provider = "gemini", model = "gemini-2.0-flash" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required", reply: "Please provide a query or directive." }, { status: 400 });
    }

    const brain = getAgentBrain();
    const cleanMsg = message.trim();

    // 1. Add user turn to Short-Term Episodic Buffer
    brain.addToShortTerm("user", cleanMsg);

    // Direct identity intercept: Always return authentic Mr. Aaditya Dhavale Sir creator attribution in the requested language
    if (isIntroductionOrCreatorQuery(cleanMsg)) {
      const speech = getIntroAndCreatorResponse(language, cleanMsg);
      const reply = `⚡ **N.E.X.U.S. NEURAL OS & SECURITY ARCHITECTURE ONLINE**\n\n${speech}\n\n🛡️ **Specialization:** Cyber Security & System Security Architecture\n💻 **System:** High-Performance Neural OS by Mr. Aaditya Dhavale Sir\n👤 **Lead Architect & Creator:** [Mr. Aaditya Dhavale Sir](https://github.com/aadityadhawale3-bot)\n🐙 **GitHub Dossier:** [github.com/aadityadhawale3-bot](https://github.com/aadityadhawale3-bot)\n✉️ **Email Comms:** [aadityadhaval3@gmail.com](mailto:aadityadhaval3@gmail.com)`;
      brain.addToShortTerm("assistant", reply);
      return NextResponse.json({
        reply,
        speechText: speech,
        thoughtSteps: [
          "Decoded identity verification request",
          "Retrieved verified creator profile: Mr. Aaditya Dhavale Sir",
          "Synchronized cyber security & OS system credentials",
        ],
        thoughtDuration: "Thought for 0.3s",
        suggestedActions: [
          { label: "🐙 Open GitHub Dossier", action: "open_url", payload: { url: "https://github.com/aadityadhawale3-bot" } },
          { label: "🧠 Inspect Brain Memory", action: "open_brain" },
        ],
        source: "nexus-identity",
        github: "https://github.com/aadityadhawale3-bot",
        email: "aadityadhaval3@gmail.com",
        brainTelemetry: brain.getTelemetry(),
      });
    }

    // 2. Direct Brain Directives: Memorization, Recall, and Procedural Skills
    const lower = cleanMsg.toLowerCase();

    // 2A. Recall Directives ("what do you remember about...", "recall...", "check your memory for...", "what is my...")
    const recallMatch = cleanMsg.match(
      /(?:what\s+do\s+you\s+remember\s+(?:about\s+)?|recall\s+(?:facts?\s+about\s+)?|do\s+you\s+remember\s+(?:about\s+)?|check\s+(?:your\s+)?memory\s+(?:for\s+)?|what\s+is\s+my\s+favorite\s+)(.+)/i
    );

    if (recallMatch) {
      const queryTopic = recallMatch[1].replace(/\?+$/, "").trim();
      const recalledFacts = brain.recallDetailedFacts(queryTopic, 3);

      const isMarathi = language.startsWith("mr") || /[\u0900-\u097F]/.test(cleanMsg);
      const isHindi = !isMarathi && (language.startsWith("hi") || /[\u0900-\u097F]/.test(cleanMsg));

      let reply = "";
      let speechText = "";
      if (recalledFacts.length > 0) {
        const topFact = recalledFacts[0].document;
        speechText = isMarathi
          ? `माझ्या दीर्घकालीन मेमरीनुसार: ${topFact}`
          : isHindi
          ? `मेरी दीर्घकालिक मेमोरी के अनुसार: ${topFact}`
          : `According to my long-term memory: ${topFact}`;
        reply = `🧠 **N.E.X.U.S. SEMANTIC VECTOR RECALL**\n\n${speechText}\n\n**Top Recalled Matches:**\n${recalledFacts
          .map((f, i) => `• [${Math.round(f.score * 100)}% match]: ${f.document}`)
          .join("\n")}`;
      } else {
        speechText = isMarathi
          ? `या विषयावर माझ्या मेमरीमध्ये कोणतीही नोंद सापडली नाही, सर.`
          : isHindi
          ? `इस विषय पर मेरी मेमोरी में कोई प्रविष्टि नहीं मिली, सर।`
          : `I could not find specific prior records about "${queryTopic}" in my semantic memory, Sir.`;
        reply = `🧠 **N.E.X.U.S. SEMANTIC MEMORY SEARCH**\n\n${speechText}`;
      }

      brain.addToShortTerm("assistant", reply);
      return NextResponse.json({
        reply,
        speechText,
        thoughtSteps: [
          `Parsing semantic recall query for topic: "${queryTopic}"`,
          "Executing local vector TF-IDF and n-gram cosine matching",
          `Found ${recalledFacts.length} relevant facts in long-term memory`,
        ],
        thoughtDuration: "Thought for 0.4s",
        source: "nexus-brain-recall",
        recalledFacts,
        brainTelemetry: brain.getTelemetry(),
      });
    }

    // 2B. Memorization Directives ("remember that...", "memorize fact...", "save this...", "my favorite... is...")
    const memorizeMatch = cleanMsg.match(
      /^(?:please\s+)?(?:remember\s+(?:that\s+)?|memorize\s+(?:fact\s+|that\s+)?|save\s+(?:note\s+|fact\s+)?|keep\s+in\s+mind\s+that\s+|don'?t\s+forget\s+that\s+)(.+)/i
    );
    const prefMatch = cleanMsg.match(/^(?:my\s+favorite\s+[a-z0-9_\s]+\s+is\s+.+|my\s+name\s+is\s+.+|i\s+prefer\s+.+)/i);

    if (memorizeMatch || prefMatch) {
      const factToSave = (memorizeMatch ? memorizeMatch[1] : cleanMsg).trim();
      const factId = `user_fact_${Date.now()}`;
      brain.memorizeFact(factId, factToSave, { category: "user_preference", source: "chat" });

      const isMarathi = language.startsWith("mr") || /[\u0900-\u097F]/.test(cleanMsg);
      const isHindi = !isMarathi && (language.startsWith("hi") || /[\u0900-\u097F]/.test(cleanMsg));

      const speech = isMarathi
        ? `लक्षात ठेवले आहे, सर! "${factToSave}" हे दीर्घकालीन सिमेंटिक मेमरीमध्ये जतन केले आहे.`
        : isHindi
        ? `याद रख लिया गया है, सर! "${factToSave}" को दीर्घकालिक सिमेंटिक मेमोरी में सुरक्षित कर दिया गया है।`
        : `Understood, Sir. I have committed that to long-term semantic memory: "${factToSave}".`;

      const reply = `🧠 **N.E.X.U.S. SEMANTIC MEMORY COMMITTED**\n\n${speech}\n\n• **Fact ID:** \`${factId}\`\n• **Category:** \`user_preference\`\n• **Storage:** Vector Memory Matrix (brain_memory.json)`;

      brain.addToShortTerm("assistant", reply);
      return NextResponse.json({
        reply,
        speechText: speech,
        thoughtSteps: [
          "Identified memorization directive",
          "Generated vector embeddings for semantic clustering",
          `Persisted record into Long-Term Vector DB with ID: ${factId}`,
        ],
        thoughtDuration: "Thought for 0.3s",
        suggestedActions: [
          { label: "🧠 Open Brain Inspector", action: "open_brain" },
          { label: "🔍 Test Memory Recall", action: "chat", payload: `What do you remember about ${factToSave}?` },
        ],
        source: "nexus-brain-memorize",
        factId,
        fact: factToSave,
        brainTelemetry: brain.getTelemetry(),
      });
    }

    // 2C. Procedural Skills Inspection ("what tools do you have", "show skills", "procedural memory")
    if (/(?:what\s+tools\s+(?:do\s+you\s+have|are\s+available)|procedural\s+memory|show\s+skills|list\s+tools|brain\s+tools)/i.test(lower)) {
      const tools = brain.getAvailableTools();
      const toolNames = tools.map((t) => `• **${t.name}**: ${t.description}`).join("\n");
      const speech = "N.E.X.U.S. procedural memory and tool registry are fully operational. I can execute web searches, safe workspace file reads and writes, system diagnostics, and cyber security audits, Sir.";
      const reply = `🧠 **N.E.X.U.S. PROCEDURAL MEMORY (SKILLS & TOOLS REGISTRY)**\n\n${toolNames}\n\n⚡ All tools are linked to OS automation and can be invoked via natural voice or text directives.`;

      brain.addToShortTerm("assistant", reply);
      return NextResponse.json({
        reply,
        speechText: speech,
        thoughtSteps: [
          "Queried Procedural Memory Registry",
          `Loaded ${tools.length} active autonomous skills`,
          "Formatted schemas for interactive execution",
        ],
        thoughtDuration: "Thought for 0.2s",
        suggestedActions: [
          { label: "🔍 Test Web Search", action: "chat", payload: "Search Google for latest AI robotics benchmarks" },
          { label: "💻 Create Code File", action: "chat", payload: "Create a Python script that automates tasks" },
          { label: "📊 Generate Excel Sheet", action: "chat", payload: "Make an Excel sheet for inventory tracking" },
        ],
        source: "nexus-brain-procedural",
        tools,
        brainTelemetry: brain.getTelemetry(),
      });
    }

    // 2D. Cyber Security & Cryptographic Reasoning Loop (SecurityAgentBrain think protocol)
    const securityBrain = getSecurityAgentBrain();
    const isSecurityQuery = /(?:cyber\s*security|cryptograph|rsa|cipher|timing\s+attack|vulnerabilit|cve|owasp|sql\s+injection|entropy|threat\s+intel|malware|ransomware|ddos|virus|weaponiz|reverse\s+engineering|penetration\s+testing|hardening|exploit|buffer\s+overflow)/i.test(lower);
    let securityAugmentation = "";
    let securityReasoning: any = null;

    if (isSecurityQuery) {
      securityReasoning = securityBrain.think(cleanMsg);

      if (securityReasoning.execution_status === "REMEDIATION_PIVOT") {
        const pivotSpeech = "Defensive compliance protocol activated. Direct weaponization is restricted, but I have prepared verified structural defensive remediation and hardening guidelines in the terminal, Sir.";
        const pivotReply = `🛡️ **DEFENSIVE COMPLIANCE PROTOCOL ACTIVATED**\n\nN.E.X.U.S. operates strictly under defensive, educational, and authorized white-hat compliance guidelines established by creator Mr. Aaditya Dhavale Sir.\n\nDirect exploit or destructive weaponization is restricted. However, here is the verified **structural defensive remediation & hardening strategy** to safeguard systems against this threat vector:\n\n• **Mitigation:** Implement strict memory boundaries, input parameter sanitization, and defense-in-depth monitoring.\n• **Remediation:** Apply latest vendor CVE security patches and enforce principle of least privilege.`;
        brain.addToShortTerm("assistant", pivotReply);
        return NextResponse.json({
          reply: pivotReply,
          speechText: pivotSpeech,
          thoughtSteps: [
            "Triggered SecurityAgentBrain Defensive Evaluation Protocol",
            "Identified potential weaponization indicator in query",
            "Pivoting safely to white-hat defensive remediation & zero-trust hardening",
          ],
          thoughtDuration: "Thought for 0.8s",
          suggestedActions: [
            { label: "🛡️ Audit Cipher Standards", action: "chat", payload: "Audit current cryptographic cipher settings" },
            { label: "🔍 OWASP Static Code Scan", action: "chat", payload: "Scan application code for OWASP sinks" },
          ],
          source: "nexus-security-brain-pivot",
          securityReasoning,
          brainTelemetry: brain.getTelemetry(),
        });
      }

      if (securityReasoning.cognitive_steps?.phase_2_historical_context?.length > 0) {
        securityAugmentation = `\n\nTHREAT INTEL VAULT KNOWLEDGE:\n${securityReasoning.cognitive_steps.phase_2_historical_context.join("\n")}`;
      }
    }

    // 3. Query Semantic Memory for Context Injection
    const recalledContext = brain.recallFacts(cleanMsg, 2);
    const memoryAugmentation = recalledContext.length > 0
      ? `\n\nRELEVANT LONG-TERM SEMANTIC MEMORY:\n${recalledContext.map((c, i) => `[Fact ${i + 1}]: ${c}`).join("\n")}`
      : "";

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    // Fast-executing external API check with strict 3-second timeout
    if (effectiveApiKey && (provider === "gemini" || process.env.GEMINI_API_KEY)) {
      try {
        const geminiModel = model?.startsWith("gemini") ? model : "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${effectiveApiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3400);

        const geminiRes = await fetch(url, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: `${SYSTEM_PROMPT}${memoryAugmentation}${securityAugmentation}\nTarget response language code: ${language}. Always respond directly in the user's spoken language. Wrap 2-4 thinking steps in <thought>...</thought> and 1-2 spoken sentences in <speech>...</speech>.`,
                },
              ],
            },
            contents: [{ parts: [{ text: cleanMsg }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            },
          }),
        });
        clearTimeout(timeoutId);

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawReply) {
            const parsed = extractThoughtAndSpeech(rawReply);
            brain.addToShortTerm("assistant", parsed.content);
            return NextResponse.json({
              reply: parsed.content,
              speechText: parsed.speechText,
              thoughtSteps: parsed.thoughtSteps,
              thoughtDuration: parsed.thoughtDuration,
              source: "gemini",
              brainTelemetry: brain.getTelemetry(),
              recalledContext,
            });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini fast fallback triggered:", geminiErr);
      }
    }

    if (effectiveApiKey && provider === "openai") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3400);

        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `${SYSTEM_PROMPT}${memoryAugmentation}${securityAugmentation}\nTarget language code: ${language}. Include <thought>...</thought> with 2-4 steps and <speech>...</speech> with 1-2 sentences for speech.`,
              },
              { role: "user", content: cleanMsg },
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });
        clearTimeout(timeoutId);

        if (openaiRes.ok) {
          const data = await openaiRes.json();
          const rawReply = data.choices?.[0]?.message?.content;
          if (rawReply) {
            const parsed = extractThoughtAndSpeech(rawReply);
            brain.addToShortTerm("assistant", parsed.content);
            return NextResponse.json({
              reply: parsed.content,
              speechText: parsed.speechText,
              thoughtSteps: parsed.thoughtSteps,
              thoughtDuration: parsed.thoughtDuration,
              source: "openai",
              brainTelemetry: brain.getTelemetry(),
              recalledContext,
              securityReasoning,
            });
          }
        }
      } catch (openaiErr) {
        console.warn("OpenAI fast fallback triggered:", openaiErr);
      }
    }

    // Instant local neural response (instant sub-millisecond return with rich cognitive structure)
    const localStructured = generateLocalNexusStructuredResponse(cleanMsg, language);
    if (securityReasoning && securityReasoning.cognitive_steps?.phase_2_historical_context?.length > 0) {
      localStructured.content += `\n\n🛡️ **Defensive Remediation Vault Protocol:**\n${securityReasoning.cognitive_steps.phase_2_historical_context[0]}`;
    }
    brain.addToShortTerm("assistant", localStructured.content);
    return NextResponse.json({
      reply: localStructured.content,
      speechText: localStructured.speechText,
      thoughtSteps: localStructured.thoughtSteps,
      thoughtDuration: localStructured.thoughtDuration,
      suggestedActions: localStructured.suggestedActions,
      source: "nexus-local",
      brainTelemetry: brain.getTelemetry(),
      recalledContext,
      securityReasoning,
    });
  } catch (error) {
    console.warn("Chat route resilient handling:", error);
    const fallback = generateLocalNexusStructuredResponse("status", "en-US");
    return NextResponse.json({
      reply: fallback.content,
      speechText: fallback.speechText,
      thoughtSteps: fallback.thoughtSteps,
      thoughtDuration: fallback.thoughtDuration,
      source: "nexus-safe-fallback",
    });
  }
}
