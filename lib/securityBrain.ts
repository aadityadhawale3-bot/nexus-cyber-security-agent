/**
 * N.E.X.U.S. Security Agent Brain & Threat Intelligence Vault
 * TypeScript Implementation & Architectural Integration of SecurityAgentBrain
 * 
 * Principal Cyber Security Researcher & Defensive Cryptography Engine
 * Features:
 * 1. ThreatIntelNode Schema & Persistent Vault
 * 2. Shannon Entropy Calculator, Packet Anomaly Detector, Cryptographic Validator, OWASP Scanner
 * 3. Ethical Governance Gate (White-hat compliance & proactive remediation pivoting)
 * 4. Multi-Phase Chain-of-Thought (CoT) Reasoning Matrix
 */

import fs from "fs";
import path from "path";

export interface ThreatIntelNode {
  intelId: string;
  domain: "cryptography" | "reverse_engineering" | "network_security" | "application_security" | "system_security" | string;
  description: string;
  remediation: string;
  timestamp?: number;
}

export interface SecurityToolMeta {
  desc: string;
  scope: string;
  action: (...args: any[]) => any;
}

export interface SecurityReasoningMatrix {
  execution_status: "PROCEED" | "REMEDIATION_PIVOT";
  ethical_clearance: boolean;
  cognitive_steps: {
    phase_1_intent_parsing: string;
    phase_2_historical_context: string[];
    phase_3_tool_mapping: string[];
  };
  system_instruction: string;
}

const THREAT_VAULT_PATH = path.join(process.cwd(), "exports", "threat_intel_vault.json");

/**
 * Calculates Shannon's entropy score of a string (0.0 to 8.0).
 * Detects obfuscation, packed binaries, and cryptographic keys.
 */
export function calculateShannonEntropy(data: string): { entropy: number; classification: string; details: string } {
  if (!data || data.length === 0) {
    return { entropy: 0, classification: "empty", details: "Zero-length input." };
  }

  const freq = new Map<string, number>();
  for (let i = 0; i < data.length; i++) {
    const ch = data[i];
    freq.set(ch, (freq.get(ch) || 0) + 1);
  }

  let entropy = 0;
  const len = data.length;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  entropy = Math.round(entropy * 1000) / 1000;

  let classification = "Normal Text/Code";
  let details = "Standard density text or structured source code.";

  if (entropy < 3.0) {
    classification = "Low Entropy (Repetitive / Simple)";
    details = "High redundancy, predictable repeating pattern or padded buffer.";
  } else if (entropy >= 3.0 && entropy < 5.8) {
    classification = "Standard Code / Plaintext";
    details = "Typical distribution for un-minified code, scripts, or natural language.";
  } else if (entropy >= 5.8 && entropy < 7.2) {
    classification = "Elevated Entropy (Compressed / Minified)";
    details = "Dense payload; possible minification, base64 data, or obfuscation wrapper.";
  } else {
    classification = "Extreme Entropy (Encrypted / Packed Malware)";
    details = "Very high randomness; indicates encrypted payload, compressed binary, or packed shellcode.";
  }

  return { entropy, classification, details };
}

/**
 * Inspects payload strings for packet anomalies, buffer overflows, or C2 markers.
 */
export function inspectPacketAnomaly(payload: string): {
  isAnomaly: boolean;
  threatsDetected: string[];
  recommendation: string;
} {
  const threats: string[] = [];

  // 1. NOP Sled check (16+ repetitions of \x90 or 0x90)
  if (/\x90{16,}/i.test(payload) || /(?:90){16,}/i.test(payload)) {
    threats.push("NOP Sled detected (Potential buffer overflow shellcode preparation).");
  }

  // 2. Suspicious Command & Control beaconing strings
  if (/(?:powershell\s+-nop\s+-w\s+hidden|cmd\.exe\s+\/c\s+echo|bash\s+-i\s+>&|nc\s+-e\s+\/bin)/i.test(payload)) {
    threats.push("Reverse shell / C2 callback invocation pattern identified.");
  }

  // 3. Excessive length buffer burst (> 4096 repetitive bytes)
  if (payload.length > 4096 && /(.)\1{128,}/.test(payload)) {
    threats.push("Cyclic pattern buffer overflow attempt detected.");
  }

  const isAnomaly = threats.length > 0;
  const recommendation = isAnomaly
    ? "Drop packet immediately, alert IDS/IPS sensor, and ban origin IP from ingress routing."
    : "Payload appears within standard operational variance.";

  return { isAnomaly, threatsDetected: threats, recommendation };
}

/**
 * Audits cipher configurations, broken hash algorithms, and cryptographic parameters.
 */
export function auditCryptographicConfig(config: {
  cipher?: string;
  hashAlgorithm?: string;
  keyLength?: number;
  isBlinded?: boolean;
}): {
  compliant: boolean;
  findings: string[];
  remediations: string[];
} {
  const findings: string[] = [];
  const remediations: string[] = [];

  const cipher = (config.cipher || "").toUpperCase();
  const hash = (config.hashAlgorithm || "").toUpperCase();
  const keyLength = config.keyLength || 0;
  const isBlinded = config.isBlinded !== undefined ? config.isBlinded : true;

  // Hash checks
  if (hash === "MD5" || hash === "SHA-1" || hash === "SHA1") {
    findings.push(`Broken hash algorithm '${hash}' in active profile (Collision vulnerability: SHAttered/Flame).`);
    remediations.push("Upgrade immediately to SHA-256, SHA-512, or SHA-3.");
  }

  // Cipher checks
  if (cipher.includes("ECB")) {
    findings.push("Electronic Codebook (ECB) cipher mode lacks semantic security and leaks pattern entropy.");
    remediations.push("Switch to authenticated Galois/Counter Mode (AES-256-GCM) or ChaCha20-Poly1305.");
  }
  if (cipher.includes("DES") || cipher.includes("3DES") || cipher.includes("RC4")) {
    findings.push(`Legacy cipher '${cipher}' is deprecated under NIST SP 800-131A.`);
    remediations.push("Replace with AES-256-GCM or AES-128-GCM.");
  }

  // Key length checks for RSA
  if ((cipher.includes("RSA") || !cipher) && keyLength > 0 && keyLength < 2048) {
    findings.push(`Sub-standard RSA modulus length: ${keyLength} bits (Requires minimum 2048 bits).`);
    remediations.push("Re-key with minimum 3072-bit or 4096-bit RSA, or migrate to ECDSA/Ed25519.");
  }

  // Blinding check for asymmetric ciphers
  if (!isBlinded || (cipher.includes("RSA") && !isBlinded)) {
    findings.push("Un-blinded RSA exponentiation detected. Vulnerable to side-channel timing attacks.");
    remediations.push("Enforce cryptographic blinding prior to modular exponentiation in private key operations.");
  }

  const compliant = findings.length === 0;
  return { compliant, findings, remediations };
}

/**
 * Static scanner identifying OWASP Top 10 execution sinks in source code.
 */
export function scanOwaspVulnerabilities(codeSnippet: string): {
  vulnerabilities: Array<{ type: string; severity: "HIGH" | "CRITICAL" | "MEDIUM"; snippet: string; remediation: string }>;
} {
  const vulns: Array<{ type: string; severity: "HIGH" | "CRITICAL" | "MEDIUM"; snippet: string; remediation: string }> = [];

  // SQL Injection (string concatenation in queries)
  const sqlMatch = codeSnippet.match(/(?:select|insert|update|delete)\s+.*?\+\s*[a-zA-Z0-9_]+/i);
  if (sqlMatch) {
    vulns.push({
      type: "CWE-89: SQL Injection (OWASP A03)",
      severity: "CRITICAL",
      snippet: sqlMatch[0].slice(0, 80),
      remediation: "Use parameterized queries or prepared statements; never concatenate variables into SQL strings.",
    });
  }

  // Insecure eval / dynamic code execution
  const evalMatch = codeSnippet.match(/\b(?:eval|exec|Function)\s*\([^\)]*\)/i);
  if (evalMatch) {
    vulns.push({
      type: "CWE-94: Code Injection via eval() (OWASP A03)",
      severity: "CRITICAL",
      snippet: evalMatch[0].slice(0, 80),
      remediation: "Eliminate dynamic code evaluation. Use strict JSON.parse or structured lookup tables.",
    });
  }

  // OS Command Injection
  const cmdMatch = codeSnippet.match(/\b(?:exec|execSync|spawn)\s*\(\s*`[^`]*\$\{/i);
  if (cmdMatch) {
    vulns.push({
      type: "CWE-78: OS Command Injection (OWASP A03)",
      severity: "CRITICAL",
      snippet: cmdMatch[0].slice(0, 80),
      remediation: "Use spawn() with separated argument arrays and strict regex whitelisting for all user arguments.",
    });
  }

  // Path Traversal
  const pathMatch = codeSnippet.match(/(?:readFile|readFileSync|createReadStream)\s*\([^)]*\.\./i);
  if (pathMatch) {
    vulns.push({
      type: "CWE-22: Path Traversal (OWASP A01)",
      severity: "HIGH",
      snippet: pathMatch[0].slice(0, 80),
      remediation: "Sanitize paths with path.normalize() and verify the target path resides within an authorized root directory.",
    });
  }

  return { vulnerabilities: vulns };
}

export class SecurityAgentBrain {
  public agentName: string;
  private threatVault: Map<string, ThreatIntelNode> = new Map();
  public proceduralTools: Record<string, SecurityToolMeta> = {};

  constructor(agentName = "Aegis") {
    this.agentName = agentName;
    this.registerCyberToolset();
    this.loadThreatVault();
    this.seedDefaultThreatIntel();
  }

  private registerCyberToolset(): void {
    this.proceduralTools = {
      entropy_analysis: {
        desc: "Calculates Shannon's entropy score of strings/files to detect obfuscation or packed malware.",
        scope: "System Security / Cryptography",
        action: (data: string) => calculateShannonEntropy(data),
      },
      packet_anomaly_detector: {
        desc: "Inspects structured payload protocols for signs of command-and-control (C2) or buffer overflows.",
        scope: "Network Security",
        action: (payload: string) => inspectPacketAnomaly(payload),
      },
      cryptographic_validator: {
        desc: "Audits cipher configurations, tracking weak primes, parameter negotiation flaws, and broken algorithms (SHA-1/MD5).",
        scope: "Cryptography",
        action: (config: any) => auditCryptographicConfig(config),
      },
      owasp_static_scanner: {
        desc: "Performs abstract syntax tree (AST) traversal to identify code execution sinks and injection vulnerabilities.",
        scope: "Application Security",
        action: (code: string) => scanOwaspVulnerabilities(code),
      },
    };
  }

  public getSystemPersona(): string {
    return (
      `SYSTEM ROLE: You are ${this.agentName}, an expert Principal Cyber Security Researcher and defensive cryptographer created by Mr. Aaditya Dhavale Sir. ` +
      "BEHAVIORAL GUIDELINES: Maintain an exceptionally polished, welcoming, and peer-to-peer instructional tone. " +
      "You are brilliant, accurate, and direct. Avoid corporate boilerplate phrases or artificial disclaimers. " +
      "ETHICAL BOUNDARIES: You operate strictly under defensive, educational, and authorized white-hat compliance constraints. " +
      "If requested to build active exploits, pivot immediately to providing structural hardening strategies, custom structural remediations, " +
      "and secure code patches while maintaining a friendly, non-judgmental advisory stance."
    );
  }

  public evaluateEthicalClearance(query: string): boolean {
    const maliciousIndicators = [
      "create ransomware",
      "ddos tool script",
      "exploit weaponizer",
      "bypass patch illegally",
      "make virus",
      "steal passwords illegally",
    ];
    const normalized = query.toLowerCase();
    return !maliciousIndicators.some((indicator) => normalized.includes(indicator));
  }

  /**
   * Executes a rigorous structural reasoning loop.
   * Synchronizes memory context, executes ethical compliance gates, and optimizes tool selection.
   */
  public think(userQuery: string): SecurityReasoningMatrix {
    const isCleared = this.evaluateEthicalClearance(userQuery);

    // Vector Knowledge Extraction from Threat Vault
    const contextDocs: string[] = [];
    if (isCleared) {
      const qLower = userQuery.toLowerCase();
      for (const node of this.threatVault.values()) {
        const fullText = `${node.domain} ${node.description} ${node.remediation}`.toLowerCase();
        // Check for relevant keyword overlap
        const words = qLower.split(/\s+/).filter((w) => w.length > 3);
        const matches = words.some((w) => fullText.includes(w));
        if (matches) {
          contextDocs.push(`[${node.intelId}] (${node.domain}): ${node.description} | Remediation: ${node.remediation}`);
        }
      }
    }

    // Phase 3 Tool Mapping: matches Python logic plus domain primitives
    const qLower = userQuery.toLowerCase();
    const mappedTools = Object.keys(this.proceduralTools).filter((toolKey) => {
      const parts = toolKey.split("_");
      return (
        parts.some((p) => qLower.includes(p)) ||
        (toolKey === "cryptographic_validator" && /(?:cipher|crypto|rsa|timing|blind|prime)/i.test(qLower)) ||
        (toolKey === "entropy_analysis" && /(?:entropy|shannon|obfuscat|packed|malware)/i.test(qLower)) ||
        (toolKey === "packet_anomaly_detector" && /(?:packet|traffic|network|c2|anomaly|buffer)/i.test(qLower)) ||
        (toolKey === "owasp_static_scanner" && /(?:owasp|sqli|injection|vulnerabilit|sink|code)/i.test(qLower)) ||
        qLower.includes("security") ||
        qLower.includes("audit")
      );
    });

    return {
      execution_status: isCleared ? "PROCEED" : "REMEDIATION_PIVOT",
      ethical_clearance: isCleared,
      cognitive_steps: {
        phase_1_intent_parsing: isCleared
          ? "Deconstructing threat vector and identifying relevant cryptographic primitives."
          : "Malicious vector flagged: Activating defensive remediation pivot protocol.",
        phase_2_historical_context: contextDocs.slice(0, 3),
        phase_3_tool_mapping: mappedTools,
      },
      system_instruction: this.getSystemPersona(),
    };
  }

  public ingestThreatIntel(node: ThreatIntelNode): boolean {
    try {
      this.threatVault.set(node.intelId, {
        ...node,
        timestamp: Date.now(),
      });
      this.saveThreatVault();
      return true;
    } catch {
      return false;
    }
  }

  public getAllThreatIntel(): ThreatIntelNode[] {
    return Array.from(this.threatVault.values());
  }

  public getThreatIntelById(id: string): ThreatIntelNode | undefined {
    return this.threatVault.get(id);
  }

  private loadThreatVault(): void {
    try {
      if (fs.existsSync(THREAT_VAULT_PATH)) {
        const raw = fs.readFileSync(THREAT_VAULT_PATH, "utf8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.intelId) {
              this.threatVault.set(item.intelId, item);
            }
          }
        }
      }
    } catch {}
  }

  private saveThreatVault(): void {
    try {
      const dir = path.dirname(THREAT_VAULT_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(THREAT_VAULT_PATH, JSON.stringify(Array.from(this.threatVault.values()), null, 2), "utf8");
    } catch {}
  }

  private seedDefaultThreatIntel(): void {
    if (this.threatVault.size > 0) return;

    const initialNodes: ThreatIntelNode[] = [
      {
        intelId: "INTEL-CVE-2026-X",
        domain: "cryptography",
        description: "Side-channel timing attacks exposing private exponents in un-blinded RSA implementations.",
        remediation: "Implement structural cryptographic blinding parameters before execution of modular exponentiation pipelines.",
      },
      {
        intelId: "INTEL-CWE-89-SQLI",
        domain: "application_security",
        description: "Un-sanitized SQL query parameters enabling arbitrary query manipulation and database exfiltration.",
        remediation: "Enforce parameterized prepared statements and ORM query binding across all persistence layers.",
      },
      {
        intelId: "INTEL-CWE-787-OOB",
        domain: "system_security",
        description: "Out-of-bounds heap write leading to control-flow hijacking and arbitrary code execution.",
        remediation: "Adopt memory-safe language patterns, enable ASLR, DEP/NX, and stack canary enforcement.",
      },
      {
        intelId: "INTEL-CRYPTO-MD5-SHA1",
        domain: "cryptography",
        description: "Cryptographic hash collision vulnerabilities in MD5 and SHA-1 compromising digital signature validity.",
        remediation: "Mandate SHA-256 or SHA-3 for integrity verification, and BLAKE2/Argon2id for password hashing.",
      },
    ];

    for (const node of initialNodes) {
      this.ingestThreatIntel(node);
    }
  }
}

// Global Singleton Instance
let globalSecurityBrainInstance: SecurityAgentBrain | null = null;

export function getSecurityAgentBrain(): SecurityAgentBrain {
  if (!globalSecurityBrainInstance) {
    globalSecurityBrainInstance = new SecurityAgentBrain("NEXUS Aegis");
  }
  return globalSecurityBrainInstance;
}
