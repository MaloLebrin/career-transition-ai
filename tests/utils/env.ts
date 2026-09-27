import env from '#start/env'

type EnvKey = Parameters<typeof env.get>[0]
type EnvOverrides = Partial<Record<EnvKey, string | undefined>>

/**
 * Surcharge des variables d'env et renvoie la fonction qui restaure l'état
 * initial (à passer à `cleanup`). `undefined` retire la variable. Passe par
 * `env.set` car `env.get` lit d'abord les valeurs validées au boot : muter
 * `process.env` ne suffit pas.
 */
export function overrideEnv(overrides: EnvOverrides): () => void {
  const keys = Object.keys(overrides) as EnvKey[]
  const previous = new Map(keys.map((key) => [key, env.get(key)]))
  keys.forEach((key) => setOrUnset(key, overrides[key]))
  return () => previous.forEach((value, key) => setOrUnset(key, value))
}

/** `overrideEnv` le temps de `callback`. */
export async function withEnv<T>(
  overrides: EnvOverrides,
  callback: () => T | Promise<T>
): Promise<T> {
  const restore = overrideEnv(overrides)
  try {
    return await callback()
  } finally {
    restore()
  }
}

function setOrUnset(key: EnvKey, value: unknown) {
  if (value === undefined) {
    env.set(key, undefined as unknown as string)
    delete process.env[key]
    return
  }
  env.set(key, String(value))
}
