const { spawn } = require("node:child_process");

const args = process.argv.slice();
const mainCommand = args.pop();
const bgCommands = args.slice(2);

main();

async function main() {
  // Run background processes
  const bgProcesses = await Promise.all(bgCommands.map(processFromCommand));
  // Run main process
  console.debug('Running main command', mainCommand);
  const mainProcess = spawn(...commandToSpawnArgs(mainCommand));

  // Kill background processes
  mainProcess.on("exit", (code) => {
    bgProcesses.forEach((proc) => proc.kill());
    process.exit(code);
  });
}

function processFromCommand(command) {
  return new Promise((resolve) => {
    const [input, testString = "", duration = 5000] = command.split("::");
    const proc = spawn(...commandToSpawnArgs(input));
    proc.stdout.on("data", listenToCommand);
    proc.stderr.on("data", broadcastError);
    console.debug(`Command '${input}' successfully spawned`);
    if (!testString) {
      return resolve(proc);
    }
    console.debug(`Command '${input}' awaiting test string '${testString}'`);
    let success = false;
    setTimeout(() => {
      if (!success) {
        throw new Error(
          `Failed to find '${testString}' in '${input}' in ${duration}ms`
        );
      }
    }, duration);

    function listenToCommand(data) {
      const msg = data.toString();
      console.debug(input + ":", msg);
      if (msg.includes(testString)) {
        success = true;
        console.debug(`Command '${input}' output success message '${testString}'`);
        return resolve(proc);
      }
    }
    function broadcastError(err) {
      console.error(input + ":", err);
    }
    // Handle the end of the process
    proc.on("exit", (code) => {
      if (success === false && code) {
        throw new Error(`${input} exited before start with code ${code}`);
      }
    });
  });
}

function commandToSpawnArgs(input) {
  const [cmd, ...args] = input.split(' ');
  return [cmd, args, { shell: true }];
}
