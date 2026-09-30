const { tryExecuteSystemCommand } = require("../lib/systemBridge");

async function runTests() {
  console.log("=== RUNNING N.E.X.U.S. VERIFICATION TESTS ===");
  
  const testCases = [
    { input: "Nexus open this app", expectedAction: "launch_app", checkDetail: (d) => d.app === "notepad" },
    { input: "Nexus open open this app", expectedAction: "launch_app", checkDetail: (d) => d.app === "notepad" },
    { input: "open this app", expectedAction: "launch_app", checkDetail: (d) => d.app === "notepad" },
    { input: "open the app", expectedAction: "launch_app", checkDetail: (d) => d.app === "notepad" },
    { input: "open an app", expectedAction: "launch_app", checkDetail: (d) => d.app === "notepad" },
    { input: "open app", expectedAction: "launch_app", checkDetail: (d) => d.app === "notepad" },
    { input: "Nexus open website", expectedAction: "google_search", checkFeedback: (f) => f.includes("browsing") || f.includes("browser") },
    { input: "open website", expectedAction: "google_search", checkFeedback: (f) => f.includes("browsing") || f.includes("browser") },
    { input: "who made you", expectedAction: "introduce", checkDetail: (d) => d.creator.includes("Mr. Aaditya Dhavale Sir") && d.github.includes("aadityadhawale3-bot") },
    { input: "Nexus who made you", expectedAction: "introduce", checkDetail: (d) => d.creator.includes("Mr. Aaditya Dhavale Sir") },
    { input: "who was made you", expectedAction: "introduce", checkDetail: (d) => d.creator.includes("Mr. Aaditya Dhavale Sir") },
    { input: "Nexus open calculator", expectedAction: "launch_app", checkDetail: (d) => d.app === "calc" },
    { input: "open calculator and add 50 + 20", expectedAction: "calculator_math", checkDetail: (d) => d.result === 70 },
    { input: "Nexus close app", expectedAction: "close_and_return" },
    { input: "band karo", expectedAction: "close_and_return" },
    { input: "open youtube play trending songs", expectedAction: "youtube" },
    { input: "start navigation to Mumbai", expectedAction: "maps_navigation" },
  ];

  let passed = 0;
  for (const tc of testCases) {
    try {
      const res = await tryExecuteSystemCommand(tc.input, "en-US");
      let ok = res.handled && res.action === tc.expectedAction;
      if (ok && tc.checkDetail) {
        ok = tc.checkDetail(res.details || {});
      }
      if (ok && tc.checkFeedback) {
        ok = tc.checkFeedback(res.feedback || "");
      }
      if (ok) {
        console.log(`[PASS] "${tc.input}" -> action: ${res.action}, feedback: "${res.feedback.slice(0, 60)}..."`);
        passed++;
      } else {
        console.error(`[FAIL] "${tc.input}" -> got action: ${res.action}, handled: ${res.handled}`);
        console.error("Details:", res);
      }
    } catch (err) {
      console.error(`[ERROR] "${tc.input}" ->`, err.message);
    }
  }

  console.log(`\nResults: ${passed} / ${testCases.length} tests passed.`);
}

runTests();
