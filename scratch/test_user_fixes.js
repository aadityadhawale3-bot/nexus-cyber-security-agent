const { tryExecuteSystemCommand, isCloseAppOrReturnQuery, extractAppToClose } = require('../lib/systemBridge');
const { isIntroductionOrCreatorQuery } = require('../lib/nexusAI');

// Test regex and command handling directly
async function testAll() {
  console.log("==========================================");
  console.log("  N.E.X.U.S. USER REPORT VERIFICATION");
  console.log("==========================================");

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = "") {
    total++;
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} -> ${details}`);
    }
  }

  // 1. Issue: MS Office, Excel, PowerPoint, Color, Paint, Notepad, Wordpad opening
  const testInputs = [
    { input: "open excel", expectedApp: "excel" },
    { input: "excel", expectedApp: "excel" },
    { input: "open powerpoint", expectedApp: "powerpoint" },
    { input: "powerpoint", expectedApp: "powerpoint" },
    { input: "open ppt", expectedApp: "powerpoint" },
    { input: "open color", expectedApp: "paint" },
    { input: "open color paint", expectedApp: "paint" },
    { input: "open paint", expectedApp: "paint" },
    { input: "paint", expectedApp: "paint" },
    { input: "open notepad", expectedApp: "notepad" },
    { input: "notepad", expectedApp: "notepad" },
    { input: "open wordpad", expectedApp: "wordpad" },
    { input: "wordpad", expectedApp: "wordpad" },
    { input: "open word", expectedApp: "word" },
    { input: "open ms office", expectedApp: "office" },
    { input: "open the specific app", expectedApp: "notepad" },
    { input: "open this app", expectedApp: "notepad" },
  ];

  for (const t of testInputs) {
    const res = await tryExecuteSystemCommand(t.input, "en-US");
    assert(
      res.handled && res.action === "launch_app" && res.details?.app === t.expectedApp,
      `App launch: "${t.input}" -> ${t.expectedApp}`,
      `Got handled: ${res.handled}, action: ${res.action}, app: ${res.details?.app}`
    );
  }

  // 2. Issue: Closing app ("close this app", "close the app", "close app", "band karo")
  const closeInputs = [
    "close this app",
    "close the app",
    "close specific app",
    "close app",
    "Nexus close this app",
    "band karo",
    "band kara",
    "close this",
    "close it",
    "close",
  ];

  for (const input of closeInputs) {
    const isClose = isCloseAppOrReturnQuery(input);
    assert(isClose, `Detect close query: "${input}"`);
    const res = await tryExecuteSystemCommand(input, "en-US");
    assert(
      res.handled && res.action === "close_and_return",
      `Execute close command: "${input}"`,
      `Got handled: ${res.handled}, action: ${res.action}`
    );
  }

  // 3. Issue: "who has made you", "who made you" opening maker GitHub
  const introInputs = [
    "who made you",
    "who has made you",
    "who was made you",
    "Nexus who made you",
    "who is your maker",
    "who created you",
    "kisne banaya",
    "koni banavle",
  ];

  for (const input of introInputs) {
    const isIntro = isIntroductionOrCreatorQuery(input);
    assert(isIntro, `Detect creator query: "${input}"`);
    const res = await tryExecuteSystemCommand(input, "en-US");
    assert(
      res.handled &&
      res.action === "introduce" &&
      res.details?.creator?.includes("Mr. Aaditya Dhavale Sir") &&
      res.details?.github?.includes("aadityadhawale3-bot"),
      `Introduce directive: "${input}"`,
      `Got action: ${res.action}`
    );
  }

  console.log(`\n==========================================`);
  console.log(`Final Result: ${passed} / ${total} tests passed!`);
  console.log(`==========================================`);
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testAll();
