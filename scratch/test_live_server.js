async function testLiveApi() {
  console.log("=== TESTING LIVE DEV SERVER AT http://localhost:3000 ===");

  // 1. Test /api/chat with agent task
  const chatRes = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Give a task for agent to audit cybersecurity and check system status",
      language: "en-US",
    }),
  });

  const chatData = await chatRes.json();
  console.log("\n[Chat API Status]:", chatRes.status);
  console.log("[Chat Reply Snippet]:", chatData.reply?.slice(0, 200));
  console.log("[Speech Text]:", chatData.speechText);

  // 2. Test /api/brain with execute_task
  const brainRes = await fetch("http://localhost:3000/api/brain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "execute_task",
      task: "Create a modern Next.js dashboard project",
    }),
  });

  const brainData = await brainRes.json();
  console.log("\n[Brain API Status]:", brainRes.status);
  console.log("[Brain Task Status]:", brainData.status);
  console.log("[Brain Chat Response Snippet]:", brainData.chatResponse?.slice(0, 200));

  if (chatRes.ok && brainRes.ok) {
    console.log("\n✓ LIVE SERVER APIS ARE 100% OPERATIONAL!");
  }
}

testLiveApi().catch(console.error);
