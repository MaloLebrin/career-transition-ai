/**
 * Test de fumée du build de production (job `smoke-prod-build` de la CI).
 *
 * Les suites Japa et Vitest valident les sources en mode dev/test : aucune ne
 * construit ni ne démarre `build/`. Le bundle SSR et le manifest Vite résolus
 * sous `build/build/…` (500 sur toutes les pages) ou les jobs de queue
 * introuvables depuis `build/` (« No jobs found for locations ») sont passés au
 * travers d'une suite entièrement verte. Ce script démarre le build comme en
 * production et échoue si :
 *
 * - `GET /health` ne répond pas 200 dans le délai imparti ;
 * - `GET /` ou `GET /auth/login` ne répond pas 200, ou ne contient pas la
 *   racine Inertia rendue par le SSR (`<div id="app" data-page=…>` non vide) ;
 * - un asset référencé par la page (`/assets/…`, issu du manifest Vite) ne
 *   répond pas 200 ;
 * - le worker de queue s'arrête pendant la fenêtre d'observation ;
 * - les logs du serveur ou du worker contiennent une erreur (`level >= 50`)
 *   ou l'avertissement « No jobs found for locations ».
 *
 * Le script n'installe rien et ne migre rien : l'appelant fournit un build
 * migré et un environnement de production complet (voir le bloc `env:` du job
 * dans `.github/workflows/ci.yml`). En local, avec la base de test démarrée :
 *
 *   pnpm build
 *   (cd build && NODE_ENV=production … node ace.js migration:run --force)
 *   NODE_ENV=production … node scripts/smoke_prod_build.mjs --app-dir=build
 *
 * Options :
 *   --app-dir=<dir>     dossier du build (défaut : build)
 *   --timeout=<s>       délai max pour que /health réponde 200 (défaut : 60)
 *   --worker-window=<s> durée d'observation du worker (défaut : 5)
 */
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'

/** Pages publiques rendues par Inertia (SSR) à vérifier. */
export const SMOKE_PAGES = ['/', '/auth/login']

/** Niveau pino à partir duquel une ligne de log fait échouer le test (error). */
export const PINO_ERROR_LEVEL = 50

const MISSING_JOBS_WARNING = 'No jobs found for locations'

/** Lignes de log fautives reprises dans le rapport, par process (le reste est dans la sortie). */
const MAX_REPORTED_LOG_LINES = 10

/**
 * Lignes de log qui doivent faire échouer le test de fumée : erreurs pino
 * (`level >= 50`) et avertissement de jobs de queue introuvables, qu'il sorte
 * en JSON (logger AdonisJS) ou en texte brut (logger console du package).
 */
export function findLogProblems(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (line === '') return false
      if (line.includes(MISSING_JOBS_WARNING)) return true
      try {
        const entry = JSON.parse(line)
        return typeof entry?.level === 'number' && entry.level >= PINO_ERROR_LEVEL
      } catch {
        return false
      }
    })
}

/**
 * Vérifie qu'une page HTML porte la racine Inertia **rendue côté serveur** :
 * `<div id="app" data-page=…>` suivie de contenu. Sans SSR (bundle
 * introuvable, repli client), la div est vide. Renvoie la liste des problèmes.
 */
export function checkInertiaShell(html) {
  const match = html.match(/<div id="app" data-page="[^"]*"[^>]*>/)
  if (!match) return ['racine Inertia `<div id="app" data-page=…>` absente']
  const after = html.slice(match.index + match[0].length).trimStart()
  if (after.startsWith('</div>')) return ['racine Inertia vide : le SSR n’a rien rendu']
  return []
}

/** Assets du build (`/assets/…`) référencés par `src`/`href` dans la page. */
export function extractAssetPaths(html) {
  const paths = new Set()
  for (const [, path] of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) paths.add(path)
  return [...paths]
}

function parseArgs(argv) {
  const options = { appDir: 'build', timeout: 60, workerWindow: 5 }
  for (const arg of argv) {
    const [key, value] = arg.replace(/^--/, '').split('=')
    if (key === 'app-dir') options.appDir = value
    else if (key === 'timeout') options.timeout = Number(value)
    else if (key === 'worker-window') options.workerWindow = Number(value)
    else throw new Error(`Option inconnue : ${arg}`)
  }
  return options
}

function start(label, args, cwd) {
  const child = spawn(process.execPath, args, { cwd, env: process.env })
  const state = { label, child, output: '', exited: false, code: null }
  const collect = (chunk) => {
    const text = chunk.toString()
    state.output += text
    process.stdout.write(text.replace(/^(?=.)/gm, `[${label}] `))
  }
  child.stdout.on('data', collect)
  child.stderr.on('data', collect)
  child.on('exit', (code, signal) => {
    state.exited = true
    state.code = code ?? signal
  })
  return state
}

async function stop(state) {
  if (state.exited) return
  const exited = new Promise((done) => state.child.once('exit', done))
  state.child.kill('SIGTERM')
  const killed = await Promise.race([exited.then(() => true), sleep(10_000).then(() => false)])
  if (!killed) state.child.kill('SIGKILL')
}

async function fetchStatus(url) {
  try {
    const response = await fetch(url, { redirect: 'manual' })
    return { status: response.status, body: await response.text() }
  } catch (error) {
    return { status: 0, body: String(error) }
  }
}

async function waitForHealth(baseUrl, server, timeoutSeconds) {
  const deadline = Date.now() + timeoutSeconds * 1000
  let last = { status: 0, body: '' }
  while (Date.now() < deadline) {
    if (server.exited) return `le serveur s'est arrêté au démarrage (code ${server.code})`
    last = await fetchStatus(`${baseUrl}/health`)
    if (last.status === 200) return null
    await sleep(1000)
  }
  return `GET /health n'a pas répondu 200 en ${timeoutSeconds}s (dernier statut ${last.status}) : ${last.body.slice(0, 500)}`
}

async function checkPages(baseUrl) {
  const failures = []
  const assets = new Set()
  for (const page of SMOKE_PAGES) {
    const { status, body } = await fetchStatus(`${baseUrl}${page}`)
    if (status !== 200) {
      failures.push(`GET ${page} → ${status} (200 attendu)`)
      continue
    }
    for (const problem of checkInertiaShell(body)) failures.push(`GET ${page} : ${problem}`)
    const pageAssets = extractAssetPaths(body)
    if (pageAssets.length === 0) failures.push(`GET ${page} : aucun asset /assets/… référencé`)
    for (const asset of pageAssets) assets.add(asset)
  }
  for (const asset of assets) {
    const { status } = await fetchStatus(`${baseUrl}${asset}`)
    if (status !== 200) failures.push(`GET ${asset} → ${status} (asset du manifest introuvable)`)
  }
  return failures
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const appDir = resolve(options.appDir)
  const baseUrl = `http://127.0.0.1:${process.env.PORT ?? 3333}`
  const failures = []

  console.log(`▶ Serveur de production depuis ${appDir}`)
  const server = start('server', ['bin/server.js'], appDir)
  let worker = null
  try {
    const healthFailure = await waitForHealth(baseUrl, server, options.timeout)
    if (healthFailure) {
      failures.push(healthFailure)
    } else {
      failures.push(...(await checkPages(baseUrl)))
    }

    console.log(`▶ Worker de queue (${options.workerWindow}s d'observation)`)
    worker = start(
      'worker',
      ['bin/console.js', 'queue:work', '--queue=default,ai,pdfs,analytics'],
      appDir
    )
    await sleep(options.workerWindow * 1000)
    if (worker.exited) failures.push(`le worker s'est arrêté (code ${worker.code})`)
  } finally {
    await stop(server)
    if (worker) await stop(worker)
  }

  for (const { label, output } of [server, worker].filter(Boolean)) {
    const problems = findLogProblems(output)
    for (const line of problems.slice(0, MAX_REPORTED_LOG_LINES)) {
      failures.push(`log ${label} : ${line.slice(0, 400)}`)
    }
    if (problems.length > MAX_REPORTED_LOG_LINES) {
      failures.push(`log ${label} : … ${problems.length - MAX_REPORTED_LOG_LINES} autres lignes`)
    }
  }

  if (failures.length > 0) {
    console.error('\n✖ Test de fumée du build de production en échec :')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
  }
  console.log('\n✔ Build de production : /health, pages SSR, assets et worker OK')
}

// Exécuté seulement en ligne de commande : le test d'hygiène importe les
// helpers sans démarrer de serveur. `argv[1]` passé par pathToFileURL au
// simple import.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
