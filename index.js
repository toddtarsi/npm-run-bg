#!/usr/bin/env node

const { spawn } = require("node:child_process");

const silentArgs = ["--silent", "-s"];

const args = process.argv.slice();
const mainCommand = args.pop();
const bgCommands = args.slice(2).filter(arg => !silentArgs.includes(arg));
const silent = silentArgs.find(arg => args.includes(arg));

main();

async function main() {
  // Run background processes
  const bgProcesses = await Promise.all(bgCommands.map(processFromCommand));
  // Run main process
  console.debug("Running main command", mainCommand);
  const mainProcess = spawn(...commandToSpawnArgs(mainCommand), {
    shell: true,
    stdio: "inherit",
  });

  // Kill background processes
  mainProcess.on("exit", (code) => {
    bgProcesses.forEach((proc) => proc.kill());
    process.exit(code);
  });
}

// Runs a command and returns a promise that resolves with the process either
// immediately after spawning or after a text match is found in the output
function processFromCommand(command) {
  return new Promise((resolve) => {
    // Get our inputs
    const [input, testString = "", duration = 5000] = command.split("::");

    // If no test string, we can just resolve immediately
    let success = !testString;

    // Start the process
    const proc = spawn(...commandToSpawnArgs(input), { shell: true });
    proc.stdout.on("data", listenToCommand);
    proc.stderr.on("data", broadcastError);
    console.debug(`Command '${input}' successfully spawned`);

    // The easy way
    if (success) {
      return resolve(proc);
    }

    // The hard way
    console.debug(`Command '${input}' awaiting test string '${testString}'`);

    // If we crash before we get off the ground, thats a failure
    proc.on("exit", (code) => {
      if (!success && code) {
        throw new Error(`${input} exited before start with code ${code}`);
      }
    });

    // Blow up if we take too long to get a match
    setTimeout(() => {
      if (!success) {
        throw new Error(
          `Failed to find '${testString}' in '${input}' in ${duration}ms`
        );
      }
    }, duration);

    // Just pipe out the output and error so that we have it in the terminal
    // This can be tuned with flags later but idc right now
    function listenToCommand(data) {
      const msg = data.toString();
      if (!silent) {
        console.debug(`${input}:${msg}`);
      }
      // If we find the test string, resolve the promise as a success
      if (msg.includes(testString)) {
        success = true;
        console.debug(
          `Command '${input}' output success message '${testString}'`
        );
        return resolve(proc);
      }
    }
    function broadcastError(err) {
      console.error(`${input}:${err.toString()}`);
    }
  });
}

// This is primitive, but works for now
function commandToSpawnArgs(input) {
  const [cmd, ...values] = input.trim().split(" ");
  return [cmd, values];
}
