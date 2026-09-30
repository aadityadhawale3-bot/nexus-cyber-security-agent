import { NextRequest, NextResponse } from "next/server";
import { getAgentBrain, getSecurityAgentBrain } from "@/lib/agentBrain";
import {
  calculateShannonEntropy,
  inspectPacketAnomaly,
  auditCryptographicConfig,
  scanOwaspVulnerabilities,
  type ThreatIntelNode,
} from "@/lib/securityBrain";

export async function GET() {
  try {
    const brain = getAgentBrain();
    const securityBrain = getSecurityAgentBrain();

    const telemetry = brain.getTelemetry();
    const episodic = brain.getShortTermContext(25);
    const semantic = brain.getAllFacts();
    const tools = brain.getAvailableTools();
    const threatIntel = securityBrain.getAllThreatIntel();

    return NextResponse.json({
      success: true,
      telemetry,
      episodic,
      semantic,
      tools,
      threatIntel,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve brain state" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, factId, document, metadata, query, limit = 5, tool, args = [] } = body;
    const brain = getAgentBrain();
    const securityBrain = getSecurityAgentBrain();

    switch (action) {
      case "memorize": {
        if (!document) {
          return NextResponse.json({ success: false, error: "Document text is required" }, { status: 400 });
        }
        brain.memorizeFact(factId, document, metadata);
        return NextResponse.json({
          success: true,
          message: "Fact successfully memorized into long-term semantic memory.",
          telemetry: brain.getTelemetry(),
        });
      }

      case "recall": {
        if (!query) {
          return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 });
        }
        const detailed = brain.recallDetailedFacts(query, limit);
        return NextResponse.json({
          success: true,
          query,
          results: detailed,
        });
      }

      case "delete_fact": {
        if (!factId) {
          return NextResponse.json({ success: false, error: "Fact ID is required" }, { status: 400 });
        }
        const deleted = brain.deleteFact(factId);
        return NextResponse.json({
          success: deleted,
          message: deleted ? `Fact '${factId}' removed from semantic memory.` : `Fact '${factId}' not found.`,
          telemetry: brain.getTelemetry(),
        });
      }

      case "clear_episodic": {
        brain.clearShortTerm();
        return NextResponse.json({
          success: true,
          message: "Short-term episodic memory cleared.",
          telemetry: brain.getTelemetry(),
        });
      }

      case "execute_task": {
        const { task = "" } = body;
        if (!task) {
          return NextResponse.json({ success: false, error: "Task description is required" }, { status: 400 });
        }
        const outcome = await brain.executeTask(task);
        return NextResponse.json({
          success: true,
          ...outcome,
          telemetry: brain.getTelemetry(),
        });
      }

      case "execute_tool": {
        if (!tool) {
          return NextResponse.json({ success: false, error: "Tool name is required" }, { status: 400 });
        }
        const toolArgs = Array.isArray(args) ? args : [args];
        const result = await brain.executeTool(tool, ...toolArgs);
        return NextResponse.json({
          success: true,
          tool,
          result,
        });
      }

      case "add_episodic": {
        const { role = "user", content = "" } = body;
        if (!content) {
          return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
        }
        brain.addToShortTerm(role, content, metadata);
        return NextResponse.json({
          success: true,
          telemetry: brain.getTelemetry(),
        });
      }

      // Security Agent Brain Actions
      case "security_think": {
        if (!query) {
          return NextResponse.json({ success: false, error: "Query is required for security reasoning" }, { status: 400 });
        }
        const reasoning = securityBrain.think(query);
        return NextResponse.json({
          success: true,
          query,
          reasoning,
        });
      }

      case "ingest_threat_intel": {
        const { intelId, domain, description, remediation } = body;
        if (!intelId || !description || !remediation) {
          return NextResponse.json(
            { success: false, error: "intelId, description, and remediation are required" },
            { status: 400 }
          );
        }
        const node: ThreatIntelNode = {
          intelId,
          domain: domain || "general_security",
          description,
          remediation,
        };
        const ok = securityBrain.ingestThreatIntel(node);
        return NextResponse.json({
          success: ok,
          node,
          message: ok ? `Threat intel node '${intelId}' ingested into vault.` : "Failed to ingest threat intel.",
        });
      }

      case "entropy_analysis": {
        const { data = "" } = body;
        const result = calculateShannonEntropy(data);
        return NextResponse.json({ success: true, result });
      }

      case "packet_anomaly_detector": {
        const { payload = "" } = body;
        const result = inspectPacketAnomaly(payload);
        return NextResponse.json({ success: true, result });
      }

      case "cryptographic_validator": {
        const { config = {} } = body;
        const result = auditCryptographicConfig(config);
        return NextResponse.json({ success: true, result });
      }

      case "owasp_static_scanner": {
        const { code = "" } = body;
        const result = scanOwaspVulnerabilities(code);
        return NextResponse.json({ success: true, result });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown brain action: '${action}'` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Brain action failed" },
      { status: 500 }
    );
  }
}
