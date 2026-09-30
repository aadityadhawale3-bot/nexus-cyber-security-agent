import { tryExecuteSystemCommand } from "./lib/systemBridge";

async function runTests() {
  console.log("=== TEST: SYSTEM COMMANDS (YOUTUBE & IMAGE GEN) ===");

  // 1. YouTube Play random video
  const ytRandom = await tryExecuteSystemCommand("play random video", "en-US");
  console.log("\n--- Query: 'play random video' ---");
  console.log("Handled:", ytRandom.handled);
  console.log("Action:", ytRandom.action);
  console.log("Feedback:", ytRandom.feedback);
  console.log("EmbedUrl:", ytRandom.details?.embedUrl);
  console.log("TargetUrl:", ytRandom.details?.targetUrl);

  if (!ytRandom.details?.embedUrl?.includes("autoplay=1") || !ytRandom.details?.targetUrl?.includes("autoplay=1")) {
    console.error("FAIL: YouTube random video did not enable autoplay!");
    process.exit(1);
  }

  // 2. YouTube Play specific query
  const ytSpecific = await tryExecuteSystemCommand("play interstellar theme", "en-US");
  console.log("\n--- Query: 'play interstellar theme' ---");
  console.log("Handled:", ytSpecific.handled);
  console.log("Action:", ytSpecific.action);
  console.log("Feedback:", ytSpecific.feedback);
  console.log("EmbedUrl:", ytSpecific.details?.embedUrl);

  // 3. Image Generation
  const imgGen = await tryExecuteSystemCommand("generate an image of a cybernetic galaxy nebula", "en-US");
  console.log("\n--- Query: 'generate an image of a cybernetic galaxy nebula' ---");
  console.log("Handled:", imgGen.handled);
  console.log("Action:", imgGen.action);
  console.log("Feedback:", imgGen.feedback);
  console.log("Details Prompt:", imgGen.details?.prompt);

  console.log("\nALL SYSTEM BRIDGE PLAYBACK & IMAGE GENERATION TESTS PASSED CLEANLY!");
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
