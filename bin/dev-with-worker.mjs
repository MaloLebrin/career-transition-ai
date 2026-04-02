import { spawn } from 'node:child_process'

const parseCommaSeparatedEnv = (value) => {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export const buildQueueWorkAceArgs = ({ queueNames, concurrency } = {}) => {
  const args = ['queue:work']

  if (queueNames?.length) {
    // Adonis ace expects a comma-separated list for multiple queues.
    args.push(`--queue=${queueNames.join(',')}`)
  }

  if (concurrency != null && !Number.isNaN(concurrency)) {
    args.push(`--concurrency=${concurrency}`)
  }

  return args
}

export const buildServeAceArgs = () => ['serve', '--hmr']

const getQueueNamesFromEnv = () => {
  const raw = process.env.QUEUE_WORKER_QUEUES ?? process.env.QUEUE_NAMES
  return parseCommaSeparatedEnv(raw)
}

const getConcurrencyFromEnv = () => {
  const raw = process.env.QUEUE_WORKER_CONCURRENCY
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

export const startDevWithWorker = async () => {
  const queueNames = getQueueNamesFromEnv()
  const concurrency = getConcurrencyFromEnv()

  const workerArgs = buildQueueWorkAceArgs({ queueNames, concurrency })
  const webArgs = buildServeAceArgs()

  const env = { ...process.env }

  const worker = spawn(process.execPath, ['ace', ...workerArgs], {
    stdio: 'inherit',
    env,
  })

  const web = spawn(process.execPath, ['ace', ...webArgs], {
    stdio: 'inherit',
    env,
  })

  const stop = (signal) => {
    // Ensure we forward shutdown to both child processes.
    // `kill` is safe even if the process is already terminating.
    worker.kill(signal)
    web.kill(signal)
  }

  const onSignal = (signal) => {
    stop(signal)
  }

  process.once('SIGINT', () => onSignal('SIGINT'))
  process.once('SIGTERM', () => onSignal('SIGTERM'))

  worker.on('exit', () => {
    // If the worker stops for any reason, stop the web server too.
    web.kill('SIGTERM')
  })

  web.on('exit', () => {
    // If the web server stops, stop the worker too.
    worker.kill('SIGTERM')
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startDevWithWorker().catch((error) => {
     
    console.error(error)
    process.exitCode = 1
  })
}
