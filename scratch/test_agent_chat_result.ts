import assert from "assert";
import { getAgentBrain } from "../lib/agentBrain";
import { extractThoughtAndSpeech, generateLocalNexusStructuredResponse } from "../lib/nexusAI";

async function testAgentTaskResult() {
  console.log("=== TESTING AGENT TASK RESULT IN CHAT BOX ===");

  const brain = getAgentBrain();

  // Test 1: executeTask returns structured chat response
  const task1 = "Give a task for agent to create a modern Next.js dashboard project";
  const res1 = await brain.executeTask(task1);

  console.log("\n[Test 1 Response Preview]:\n", res1.chatResponse);
  assert.strictEqual(res1.status, "success");
  assert(res1.chatResponse.includes("N.E.X.U.S. AGENT DIRECTIVE COMPLETED"));
  assert(res1.chatResponse.includes("Verified // 0 Errors"));
  assert(!res1.chatResponse.includes("<think>"), "Should not contain <think>");
  assert(!res1.chatResponse.includes("<thought>"), "Should not contain <thought>");
  assert(res1.speechText.includes("chat box"), "Speech must reference chat box");
  console.log("✓ Test 1 Passed: Agent task executed with professional Chat Box output.");

  // Test 2: Math calculation task
  const task2 = "Agent, calculate 45 * 18 + 120";
  const res2 = await brain.executeTask(task2);
  console.log("\n[Test 2 Math Preview]:\n", res2.chatResponse);
  assert.strictEqual(res2.status, "success");
  assert(res2.chatResponse.includes("930"), "Result of 45*18+120=930 should be in chat response");
  console.log("✓ Test 2 Passed: Math computation task formatted cleanly.");

  // Test 3: Off-topic thinking purification in nexusAI
  const sampleWithThink = `
<think>
I need to check what the user wants. Maybe they want a python script. Let me see if there are any files.
This is internal rambling that should never be shown.
</think>
<thought>
• Step 1: Analyze user directive
• Step 2: Formulate solution
</thought>
<speech>I have prepared the solution in your chat box, Sir.</speech>
# Professional Solution
Here is the production implementation.
`;

  const parsed = extractThoughtAndSpeech(sampleWithThink);
  console.log("\n[Test 3 Purified Content]:\n", parsed.content);
  assert(!parsed.content.includes("<think>"), "Content must not contain <think>");
  assert(!parsed.content.includes("internal rambling"), "Content must not contain internal think text");
  assert(!parsed.content.includes("<thought>"), "Content must not contain <thought>");
  assert(!parsed.content.includes("<speech>"), "Content must not contain <speech>");
  assert(parsed.content.includes("# Professional Solution"), "Content must retain Markdown solution");
  console.log("✓ Test 3 Passed: Off-topic think and thought tags stripped 100%.");

  // Test 4: Local structured response has no 'in the terminal' references
  const localRes = generateLocalNexusStructuredResponse("help me build code", "en-US");
  console.log("\n[Test 4 Speech Text]:", localRes.speechText);
  assert(!localRes.speechText.toLowerCase().includes("terminal"), "Speech must not say 'in the terminal'");
  assert(localRes.speechText.toLowerCase().includes("chat box"), "Speech must say 'in your chat box'");
  console.log("✓ Test 4 Passed: Speech mentions chat box instead of terminal.");

  console.log("\n=======================================================");
  console.log("ALL TESTS PASSED! CHAT BOX TASK DELIVERY FULLY VERIFIED");
  console.log("=======================================================");
}

testAgentTaskResult().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
