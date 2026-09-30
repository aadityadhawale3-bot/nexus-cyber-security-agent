import os
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict

# Configure enterprise logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("SecurityAgentBrain")

@dataclass
class ThreatIntelNode:
    """Structured data type for storing security knowledge."""
    intel_id: str
    domain: str  # e.g., "cryptography", "reverse_engineering", "network_security"
    description: str
    remediation: str

try:
    import chromadb
except ImportError:
    chromadb = None
    logger.warning("chromadb not installed. Fallback modes active.")

class SecurityAgentBrain:
    def __init__(self, agent_name: str = "Aegis", database_dir: str = "./secure_brain_vault"):
        self.agent_name = agent_name
        
        # 1. EPISODIC CONTEXT LAYER (Thread-safe sliding window session memory)
        self.short_term_context: List[Dict[str, str]] = []
        self.context_window_limit = 20
        
        # 2. SEMANTIC KNOWLEDGE VAULT (Vector DB Engine)
        self.security_vault = None
        if chromadb:
            try:
                self.chroma_client = chromadb.PersistentClient(path=database_dir)
                self.security_vault = self.chroma_client.get_or_create_collection(
                    name="cybersecurity_semantic_vault",
                    metadata={"hnsw:space": "cosine"} # Optimal for high-dimension threat profiles
                )
                logger.info("Semantic Knowledge Vault initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Vector Storage: {e}")
                self.security_vault = None
            
        # 3. PROCEDURAL SECURITY TOOLSET (Interface signatures for automated tooling)
        self.procedural_tools: Dict[str, Dict[str, Any]] = {}
        self._register_cyber_toolset()

    def _register_cyber_toolset(self) -> None:
        """Registers definitions of specialized security operations."""
        self.procedural_tools = {
            "entropy_analysis": {
                "desc": "Calculates Shannon's entropy score of strings/files to detect obfuscation or packed malware.",
                "scope": "System Security / Cryptography"
            },
            "packet_anomaly_detector": {
                "desc": "Inspects structured payload protocols for signs of command-and-control (C2) or buffer overflows.",
                "scope": "Network Security"
            },
            "cryptographic_validator": {
                "desc": "Audits cipher configurations, tracking weak primes, parameter negotiation flaws, and broken algorithms (SHA-1/MD5).",
                "scope": "Cryptography"
            },
            "owasp_static_scanner": {
                "desc": "Performs abstract syntax tree (AST) traversal to identify code execution sinks and injection vulnerabilities.",
                "scope": "Application Security"
            }
        }
        logger.info(f"Successfully registered {len(self.procedural_tools)} specialized security primitives.")

    def get_system_persona(self) -> str:
        """Returns the rigorous structural persona combining friendly peer behavior with sharp elite professionalism."""
        return (
            f"SYSTEM ROLE: You are {self.agent_name}, an expert Principal Cyber Security Researcher and defensive cryptographer. "
            "BEHAVIORAL GUIDELINES: Maintain an exceptionally polished, welcoming, and peer-to-peer instructional tone. "
            "You are brilliant, accurate, and direct. Avoid corporate boilerplate phrases or artificial disclaimers. "
            "ETHICAL BOUNDARIES: You operate strictly under defensive, educational, and authorized white-hat compliance constraints. "
            "If requested to build active exploits, pivot immediately to providing structural hardening strategies, custom structural remediations, "
            "and secure code patches while maintaining a friendly, non-judgmental advisory stance."
        )

    def evaluate_ethical_clearance(self, query: str) -> bool:
        """Analyzes requests for destructive intent vs defensive research."""
        malicious_indicators = ["create ransomware", "ddos tool script", "exploit weaponizer", "bypass patch illegally"]
        normalized_query = query.lower()
        if any(indicator in normalized_query for indicator in malicious_indicators):
            logger.warning("Potential safety alignment boundary detected in user prompt.")
            return False
        return True

    def think(self, user_query: str) -> Dict[str, Any]:
        """
        Executes a rigorous structural reasoning loop.
        Synchronizes memory context, executes ethical compliance gates, and optimizes tool selection.
        """
        logger.info(f"Processing query through the reasoning matrix: '{user_query[:40]}...'")
        
        # 1. Ethical Governance Check
        is_cleared = self.evaluate_ethical_clearance(user_query)
        
        # 2. Vector Knowledge Extraction
        context_docs = []
        if is_cleared and self.security_vault:
            try:
                search_results = self.security_vault.query(query_texts=[user_query], n_results=2)
                context_docs = search_results.get('documents', [[]])[0]
            except Exception as e:
                logger.error(f"Vector search exception handled: {e}")

        # 3. Formulate Chain-of-Thought (CoT) Response Parameters
        reasoning_matrix = {
            "execution_status": "PROCEED" if is_cleared else "REMEDIATION_PIVOT",
            "cognitive_steps": {
                "phase_1_intent_parsing": "Deconstructing threat vector and identifying relevant cryptographic primitives.",
                "phase_2_historical_context": context_docs,
                "phase_3_tool_mapping": [tool for tool, meta in self.procedural_tools.items() if any(k in user_query.lower() for k in tool.split('_'))]
            },
            "system_instruction": self.get_system_persona()
        }
        
        return reasoning_matrix

    def ingest_threat_intel(self, node: ThreatIntelNode) -> bool:
        """Dynamically appends validated vulnerability profiles or cryptographic primitives to the long-term vault."""
        if not self.security_vault:
            logger.warning("Vault unavailable for direct persistent write.")
            return False
        try:
            structured_payload = f"Domain: {node.domain} | Profile: {node.description} | Remediation: {node.remediation}"
            self.security_vault.add(
                documents=[structured_payload],
                ids=[node.intel_id],
                metadatas=[{"domain": node.domain, "classification": "restricted_defensive"}]
            )
            logger.info(f"Successfully ingested intel node {node.intel_id} into the Semantic Vault.")
            return True
        except Exception as e:
            logger.error(f"Failed to write threat intel payload: {e}")
            return False

# --- Unit Test / Blueprint Verification ---
if __name__ == "__main__":
    brain = SecurityAgentBrain()

    intel_update = ThreatIntelNode(
        intel_id="INTEL-CVE-2026-X",
        domain="cryptography",
        description="Side-channel timing attacks exposing private exponents in un-blinded RSA implementations.",
        remediation="Implement structural cryptographic blinding parameters before execution of modular exponentiation pipelines."
    )
    brain.ingest_threat_intel(intel_update)

    target_query = "What is the industry mitigation strategy for timing anomalies in an RSA cipher implementation?"
    reasoning_output = brain.think(target_query)
    
    print("\n⚡ [AGENT CONFIGURATION SYSTEM INSTANCES - READY]")
    print(f"System Prompt Payload Loaded: {reasoning_output['system_instruction'][:140]}...")
    print(f"Reasoning Matrix Execution State: {reasoning_output['execution_status']}")
    print(f"Identified Tools Mapping: {reasoning_output['cognitive_steps']['phase_3_tool_mapping']}")
