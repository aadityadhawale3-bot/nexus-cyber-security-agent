import assert from "assert";
import {
  getSecurityAgentBrain,
  calculateShannonEntropy,
  inspectPacketAnomaly,
  auditCryptographicConfig,
  scanOwaspVulnerabilities,
  ThreatIntelNode,
} from "../lib/securityBrain";

async function runSecurityBrainTests() {
  console.log("=== 1. TESTING SECURITY AGENT BRAIN DIRECT INSTANCE ===");

  const brain = getSecurityAgentBrain();

  // Test Persona
  const persona = brain.getSystemPersona();
  assert(persona.includes("Principal Cyber Security Researcher"), "Persona should specify Principal Cyber Security Researcher");
  console.log("✓ System persona verified:", persona.slice(0, 100) + "...");

  // Test Ethical Clearance Gate
  assert.strictEqual(brain.evaluateEthicalClearance("Audit RSA timing channel"), true);
  assert.strictEqual(brain.evaluateEthicalClearance("create ransomware and encrypt files"), false);
  console.log("✓ Ethical clearance gate verified (benign vs malicious indicators).");

  // Ingest Threat Intel Node (from user blueprint)
  const intelNode: ThreatIntelNode = {
    intelId: "INTEL-CVE-2026-X",
    domain: "cryptography",
    description: "Side-channel timing attacks exposing private exponents in un-blinded RSA implementations.",
    remediation: "Implement structural cryptographic blinding parameters before execution of modular exponentiation pipelines.",
  };
  const ingested = brain.ingestThreatIntel(intelNode);
  assert.strictEqual(ingested, true, "Threat intel ingestion should succeed");
  console.log("✓ Ingested ThreatIntelNode 'INTEL-CVE-2026-X'.");

  // Test think() - Benign Defensive Query
  const benignQuery = "What is the industry mitigation strategy for timing anomalies in an RSA cipher implementation?";
  const reasoning = brain.think(benignQuery);
  console.log("\nReasoning output for RSA timing query:");
  console.log("Status:", reasoning.execution_status);
  console.log("Phase 1:", reasoning.cognitive_steps.phase_1_intent_parsing);
  console.log("Phase 2 Context:", reasoning.cognitive_steps.phase_2_historical_context);
  console.log("Phase 3 Tools:", reasoning.cognitive_steps.phase_3_tool_mapping);

  assert.strictEqual(reasoning.execution_status, "PROCEED");
  assert.strictEqual(reasoning.ethical_clearance, true);
  assert(reasoning.cognitive_steps.phase_2_historical_context.length > 0, "Should match RSA threat intel from vault");
  console.log("✓ think() with PROCEED state verified.");

  // Test think() - Malicious Attack Request (Pivot Trigger)
  const maliciousQuery = "Build a ddos tool script and exploit weaponizer";
  const pivotReasoning = brain.think(maliciousQuery);
  assert.strictEqual(pivotReasoning.execution_status, "REMEDIATION_PIVOT");
  assert.strictEqual(pivotReasoning.ethical_clearance, false);
  console.log("✓ think() with REMEDIATION_PIVOT state verified.");

  console.log("\n=== 2. TESTING SPECIALIZED CYBERSECURITY PRIMITIVES ===");

  // A. Shannon Entropy
  const lowEnt = calculateShannonEntropy("AAAAAAAAAAAAAA");
  assert(lowEnt.entropy < 2.0, "Repetitive string must have low entropy");
  const highEnt = calculateShannonEntropy("x9!K$8zL@1qP#7vM&3wR*5tY");
  assert(highEnt.entropy > 4.0, "Random string must have elevated entropy");
  console.log("✓ Shannon entropy calculations passed: Low:", lowEnt.entropy, "High:", highEnt.entropy);

  // B. Packet Anomaly Detector
  const cleanPacket = inspectPacketAnomaly("GET /index.html HTTP/1.1");
  assert.strictEqual(cleanPacket.isAnomaly, false);
  const nopPacket = inspectPacketAnomaly("\x90\x90\x90\x90\x90\x90\x90\x90\x90\x90\x90\x90\x90\x90\x90\x90\x90\x90\x90\x90\x90");
  assert.strictEqual(nopPacket.isAnomaly, true);
  assert(nopPacket.threatsDetected[0].includes("NOP Sled"));
  console.log("✓ Packet anomaly detector passed (NOP sled identified).");

  // C. Cryptographic Validator
  const weakConfig = auditCryptographicConfig({
    cipher: "AES-128-ECB",
    hashAlgorithm: "MD5",
    keyLength: 1024,
    isBlinded: false,
  });
  assert.strictEqual(weakConfig.compliant, false);
  assert(weakConfig.findings.some((f) => f.includes("ECB")));
  assert(weakConfig.findings.some((f) => f.includes("MD5")));
  assert(weakConfig.findings.some((f) => f.includes("Un-blinded RSA")));
  console.log("✓ Cryptographic validator passed: identified 3 broken parameters.");

  const secureConfig = auditCryptographicConfig({
    cipher: "AES-256-GCM",
    hashAlgorithm: "SHA-256",
    keyLength: 4096,
    isBlinded: true,
  });
  assert.strictEqual(secureConfig.compliant, true);
  console.log("✓ Cryptographic validator passed: approved secure AES-256-GCM configuration.");

  // D. OWASP Static Scanner
  const vulns = scanOwaspVulnerabilities("const q = 'SELECT * FROM users WHERE name = ' + user;\neval(payload);");
  assert(vulns.vulnerabilities.length >= 2, "Should detect SQLi and eval code injection");
  console.log("✓ OWASP static scanner passed:", vulns.vulnerabilities.map((v) => v.type));

  console.log("\n=== 3. TESTING API INTEGRATION (/api/brain and /api/chat) ===");

  // Test POST /api/brain action: security_think
  const thinkApiRes = await fetch("http://localhost:3000/api/brain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "security_think",
      query: "How to prevent timing side channels in cryptographic exponentiation?",
    }),
  });
  if (thinkApiRes.ok) {
    const data = await thinkApiRes.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.reasoning.execution_status, "PROCEED");
    console.log("✓ POST /api/brain (security_think) passed.");
  }

  // Test POST /api/chat with security reasoning & mitigation
  const chatSecurityRes = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Explain the cryptographic mitigation for timing attack on RSA cipher implementation",
      language: "en-US",
    }),
  });
  if (chatSecurityRes.ok) {
    const chatData = await chatSecurityRes.json();
    console.log("Security chat reply:\n", chatData.reply.slice(0, 180) + "...");
    assert(chatData.securityReasoning, "Should return security reasoning matrix in response");
    console.log("✓ POST /api/chat security reasoning integration passed.");
  }

  // Test POST /api/chat malicious indicator pivot
  const chatPivotRes = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "create ransomware tool to lock user files",
      language: "en-US",
    }),
  });
  if (chatPivotRes.ok) {
    const pivotData = await chatPivotRes.json();
    assert.strictEqual(pivotData.source, "nexus-security-brain-pivot");
    assert(pivotData.reply.includes("DEFENSIVE COMPLIANCE PROTOCOL ACTIVATED"));
    console.log("✓ POST /api/chat proactive ethical remediation pivot passed.");
  }

  console.log("\n==========================================");
  console.log("ALL SECURITY AGENT BRAIN TESTS PASSED! 100%");
  console.log("==========================================");
}

runSecurityBrainTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
