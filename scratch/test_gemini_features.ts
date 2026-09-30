import {
  generateLocalNexusStructuredResponse,
  extractThoughtAndSpeech,
  isIntroductionOrCreatorQuery,
} from "../lib/nexusAI";
import { tryExecuteSystemCommand } from "../lib/systemBridge";

async function runTests() {
  console.log("=================================================");
  console.log("  TESTING N.E.X.U.S. GEMINI-INSPIRED AGENT MATRIX");
  console.log("=================================================");

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, name: string, details = "") {
    total++;
    if (cond) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} -> ${details}`);
    }
  }

  // Test 1: Tag extraction from raw model outputs
  const sampleRaw = `<thought>
1. Identify optimal algorithm for quicksort.
2. Structure recursive partitioning.
3. Prepare unit tests.
</thought>
Here is the production implementation of QuickSort in TypeScript:
\`\`\`typescript
function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = arr.filter((x, i) => x <= pivot && i < arr.length - 1);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}
\`\`\`
<speech>
I have architected a clean QuickSort implementation with pivot partitioning. Let me know if you would like me to execute benchmark tests.
</speech>`;

  const extracted = extractThoughtAndSpeech(sampleRaw);
  assert(
    extracted.thoughtSteps.length === 3,
    "Thought steps extraction",
    `Expected 3 steps, got ${extracted.thoughtSteps.length}`
  );
  assert(
    extracted.thoughtSteps[0].includes("Identify optimal algorithm"),
    "First thought step content"
  );
  assert(
    extracted.speechText.includes("I have architected a clean QuickSort"),
    "Speech text extraction"
  );
  assert(
    !extracted.content.includes("<thought>") && !extracted.content.includes("<speech>"),
    "Clean content has no tags"
  );

  // Test 2: Structured Local Neural Generator for Coding
  const codeResp = generateLocalNexusStructuredResponse("write a python script to analyze log files", "en");
  assert(
    codeResp.thoughtSteps.length >= 2,
    "Structured code response thought steps",
    `Got ${codeResp.thoughtSteps.length}`
  );
  assert(
    codeResp.speechText.length > 10 && !codeResp.speechText.includes("```"),
    "Speech text is vocal-friendly (no raw code blocks)",
    codeResp.speechText
  );
  assert(
    codeResp.content.includes("```python"),
    "Code response includes markdown python code block"
  );
  assert(
    (codeResp.suggestedActions?.length ?? 0) > 0,
    "Suggested action chips provided for code",
    JSON.stringify(codeResp.suggestedActions)
  );

  // Test 3: Structured Local Neural Generator for Education / Quantum
  const eduResp = generateLocalNexusStructuredResponse("explain quantum superposition for PhD students", "en");
  assert(
    eduResp.thoughtSteps.length >= 2,
    "Education response thought steps",
    `Got ${eduResp.thoughtSteps.length}`
  );
  assert(
    eduResp.content.includes("Mathematical Formulation") || eduResp.content.includes("Wavefunction"),
    "Academic depth delivered"
  );

  // Test 4: Creator Attribution
  const creatorQuery = "who created you and what is your purpose?";
  assert(
    isIntroductionOrCreatorQuery(creatorQuery),
    "Creator query detection"
  );
  const creatorResp = generateLocalNexusStructuredResponse(creatorQuery, "en");
  assert(
    creatorResp.content.includes("Mr. Aaditya Dhavale Sir"),
    "Creator attribution to Mr. Aaditya Dhavale Sir preserved"
  );

  // Test 5: Command execution bridge ("run command <cmd>")
  const cmdRes = await tryExecuteSystemCommand("run command echo 'NEXUS_ONLINE'", "en");
  assert(
    cmdRes.handled && cmdRes.action === "run_command",
    "PowerShell command bridge trigger",
    JSON.stringify(cmdRes)
  );
  assert(
    cmdRes.details?.command?.includes("echo 'NEXUS_ONLINE'"),
    "PowerShell command payload preserved"
  );

  console.log("=================================================");
  console.log(`  SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log("=================================================");
}

void runTests();
