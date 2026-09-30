const { generateLocalNexusStructuredResponse } = require("./lib/nexusAI");

console.log("=== TEST 1: ACADEMIC SOLVER ===");

const testQueries = [
  "Solve quadratic equation ax^2 + bx + c = 0 and derive the roots",
  "Explain Pythagorean theorem with proof",
  "What is Newton's second law of motion with formula?",
  "Explain photosynthesis chemical reaction",
  "What is Ohm's law?",
  "Explain Big-O complexity and binary search",
];

for (const q of testQueries) {
  const res = generateLocalNexusStructuredResponse(q, "en-US");
  console.log(`\n--- QUERY: "${q}" ---`);
  console.log(`SpeechText: ${res.speechText}`);
  if (res.speechText.includes("ready in your chat box")) {
    console.error("FAIL: Contains 'ready in your chat box' teaser!");
    process.exit(1);
  }
  console.log(`Content Snippet:\n${res.content.slice(0, 200)}...`);
}

console.log("\nALL ACADEMIC SOLVER TESTS PASSED!");
