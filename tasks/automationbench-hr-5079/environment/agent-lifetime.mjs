// Task environment keepalive, not an agent/CLI wrapper. Docker exec still
// launches the native Harbor agent. Never run this outside a private container.
import { readFileSync } from 'node:fs';

if (process.pid !== 1)
  throw new Error(
    'Task lifetime control requires PID 1 in a private PID namespace',
  );
const signalPath = '/run/task-control/abort.json';
let stopped = false;
setInterval(() => {
  if (stopped) return;
  let signal;
  try {
    signal = JSON.parse(readFileSync(signalPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  if (signal.action !== 'abort' || !Number.isInteger(signal.call_seq))
    throw new Error('Invalid task abort signal');
  // Linux kill(-1) targets processes in this container's PID namespace,
  // excluding PID 1 and the caller. The separate backend stays alive.
  // Do this once: Harbor must subsequently collect logs and verify normally.
  try {
    process.kill(-1, 'SIGKILL');
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
  stopped = true;
  process.stdout.write(
    `Environment abort at call ${signal.call_seq}: agent processes stopped\n`,
  );
}, 25);
process.on('SIGTERM', () => process.exit(0));
