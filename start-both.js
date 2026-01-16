const { spawn } = require('child_process');

function start(name, cmd) {
  const p = spawn(cmd, { stdio: ['ignore', 'pipe', 'pipe'], shell: true });
  p.stdout.on('data', (d) => process.stdout.write(`[${name}] ${d}`));
  p.stderr.on('data', (d) => process.stderr.write(`[${name}] ${d}`));
  p.on('exit', (code) => {
    console.error(`${name} exited with ${code}`);
    process.exit(code);
  });
}

start('api', 'npm run start:prod');
start('worker', 'npm run start:worker');
