// Runs the backend and frontend together: `npm run dev` (watch) or `npm start` (built apps).
// Ctrl+C stops both; if one exits, the other is stopped too.
import { spawn, spawnSync } from 'node:child_process'

const script = process.argv[2] ?? 'dev'

// child.kill() only ends the npm shell wrapper; the servers it started keep their ports.
// Kill the whole process tree instead.
function stop(child) {
  if (child.exitCode !== null) return
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  else {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      // ESRCH: the group already exited (both servers can die at once).
    }
  }
}

const children = ['backend', 'frontend'].map((name) => {
  const child = spawn('npm', ['run', script, '-w', name], {
    stdio: 'inherit',
    shell: true,
    detached: process.platform !== 'win32', // own process group, so -pid reaches the servers
  })
  child.on('exit', (code) => {
    children.forEach(stop)
    process.exitCode ||= code ?? 0
  })
  return child
})

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => children.forEach(stop))
