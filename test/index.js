const { exec } = require("node:child_process");
const { join } = require("node:path");

const mainFilepath = join(__dirname, "..", "index.js");
exec(
  `node ${mainFilepath} -s 'echo hello world::hello world::1000' 'echo howdy folks'`,
  (err, stdout, stderr) => {
    if (err) {
      throw new Error("Command should have run successfully");
    }
    if (stderr) {
      console.error(stderr);
      throw new Error("Command should not have any stderr");
    }
  }
);

exec(
  `node ${mainFilepath} -s 'echo hello world::goodbye world::1000' 'echo howdy folks'`,
  (err, stdout, stderr) => {
    if (!err) {
      throw new Error("Command should not have run successfully");
    }
    if (
      !err.message.includes(
      "Failed to find 'goodbye world' in 'echo hello world' in 1000ms")
    ) {
      throw new Error(
        "Command should have failed with the correct error message"
      );
    }
  }
);

process.on('exit', (code) => {
  console.log('Exiting with code', code);
})