import { spawn } from 'node:child_process'

const children = []

function run(label, command, args, env = {}) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`)
  })
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`)
  })
  child.on('exit', (code, signal) => {
    if (signal) return
    if (code && !shuttingDown) {
      console.error(`[${label}] exited with code ${code}`)
      shutdown(code)
    }
  })

  children.push(child)
}

let shuttingDown = false

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(code), 200)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

run('translate', process.execPath, ['scripts/translate-server.mjs'])
run('vite', process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'])
