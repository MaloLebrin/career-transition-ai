/**
 * Génère un slug à partir d'une chaîne (minuscules, espaces → tirets, caractères non autorisés supprimés).
 * Réduit les tirets multiples et supprime les tirets en début/fin.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

type SluggableInstance = {
  [key: string]: any
  $dirty: Record<string, unknown>
}

type AssignUniqueSlugOptions = {
  /**
   * Nom de la propriété source (par exemple "name").
   */
  sourceField: string
  /**
   * Nom de la propriété cible (par exemple "slug").
   */
  targetField: string
  /**
   * Si true, on met la cible à null lorsque le slug généré est vide.
   * Sinon, on met une chaîne vide.
   */
  allowNull?: boolean
}

/**
 * Helper générique pour générer un slug unique pour un modèle Lucid donné.
 * Utilisé par les hooks de `Organization` et `Skill`.
 */
export async function assignUniqueSlugForModel<TModel>(
  modelClass: {
    query: () => {
      where(field: string, value: unknown): any
      orWhereLike(field: string, value: string): any
      select(fields: string[]): Promise<Array<Record<string, unknown>>>
    }
  } & TModel,
  instance: SluggableInstance,
  options: AssignUniqueSlugOptions
): Promise<void> {
  const { sourceField, targetField, allowNull } = options

  // Si le champ source n'a pas changé, on ne touche pas au slug.
  if (!instance.$dirty[sourceField]) {
    return
  }

  // Si un slug explicite a été fourni, on le respecte.
  if (instance.$dirty[targetField] && instance[targetField]) {
    return
  }

  const rawName = instance[sourceField]
  const base = generateSlug(typeof rawName === 'string' ? rawName : String(rawName ?? ''))

  if (!base) {
    instance[targetField] = allowNull ? null : ''
    return
  }

  // On récupère tous les slugs qui commencent par base ou base-<num>.
  const existing = await modelClass
    .query()
    .where(targetField, base)
    .orWhereLike(targetField, `${base}-%`)
    .select([targetField])

  if (existing.length === 0) {
    instance[targetField] = base
    return
  }

  const existingSlugs = existing
    .map((row: any) => row[targetField])
    .filter((s: unknown): s is string => typeof s === 'string' && s.length > 0)

  let suffix = 2
  while (existingSlugs.includes(`${base}-${suffix}`)) {
    suffix++
  }

  instance[targetField] = `${base}-${suffix}`
}
