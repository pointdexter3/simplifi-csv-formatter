import * as readline from "node:readline";

console.log("All-in-one script - pre-execution checks...\n");

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function promptUser(): Promise<boolean> {
  const questions = [
    "Have you saved all the OFX files? (y/n): ",
    "Does the previous archive look good? (y/n): ",
  ];

  for (const question of questions) {
    const answer = await askQuestion(question);
    
    if (answer !== "y") {
      console.log(`\nCancelled: User did not confirm all checks.`);
      return false;
    }
  }

  return true;
}

try {
  const confirmed = await promptUser();
  
  if (!confirmed) {
    process.exit(1);
  }

  console.log("\n✓ All checks confirmed. Proceeding with execution...\n");
  process.exit(0);
  
} catch (error) {
  console.error(`\nAll-in-one script failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
