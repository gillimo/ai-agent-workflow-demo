'use strict';

// Example project-wide gate: retain npm test, then run the local GRF check.
// If your existing project_verify differs, update the first command, not drop it.
const { spawnSync } = require('node:child_process');

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  if (result.error) {
    console.error(`${command}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.signal || result.status !== 0) process.exit(result.status || 1);
}

run('npm', ['test']);
run(process.env.GRF_PYTHON || (process.platform === 'win32' ? 'python' : 'python3'),
  ['grf-acceptance/grf.py', '--project', 'grf-acceptance', 'check']);
