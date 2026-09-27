import { configApp, INCLUDE_LIST } from '@adonisjs/eslint-config'

/**
 * Navigation interne = `<Link>` d'Inertia : une ancre `<a href="/…">` brute
 * recharge toute la page (bundle re-téléchargé, état client perdu).
 *
 * Exceptions légitimes, à marquer par un `eslint-disable-next-line` motivé :
 * téléchargement ou export (une visite Inertia afficherait le binaire comme une
 * page) et ouverture en nouvel onglet (`<Link>` ignore `target`).
 */
const INTERNAL_ANCHOR_MESSAGE =
  'Navigation interne : utiliser AppLink (~/components/ui/AppLink) ou <Link> (@inertiajs/react) — une ancre brute recharge toute la page. <a> reste correct pour un lien externe, mailto:/tel:, un téléchargement ou un target="_blank" (ajouter alors un eslint-disable-next-line motivé).'

/**
 * Le bundle navigateur n'importe du backend que `#shared/*` : un modèle, un
 * service ou un contrôleur tirerait Lucid, des secrets d'env ou du code serveur
 * dans le front. Les imports de type seuls (effacés à la compilation) restent
 * permis.
 */
const BACKEND_ALIASES = [
  'models',
  'services',
  'controllers',
  'validators',
  'middleware',
  'jobs',
  'database',
  'commands',
  'start',
  'config',
]

export default configApp(
  { ignores: ['.adonisjs/**'] },
  { files: [...INCLUDE_LIST, '**/*.tsx'] },
  {
    files: ['inertia/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXOpeningElement[name.name='a'] > JSXAttribute[name.name='href'] > Literal[value=/^\\//]",
          message: INTERNAL_ANCHOR_MESSAGE,
        },
        {
          selector:
            "JSXOpeningElement[name.name='a'] > JSXAttribute[name.name='href'] > JSXExpressionContainer > TemplateLiteral > TemplateElement:first-child[value.raw=/^\\//]",
          message: INTERNAL_ANCHOR_MESSAGE,
        },
      ],
    },
  },
  {
    files: ['inertia/**/*.ts', 'inertia/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // `regex` et non `group` : en syntaxe gitignore, un motif `#…` est un commentaire
              regex: `^#(${BACKEND_ALIASES.join('|')})/`,
              allowTypeImports: true,
              message:
                'Code serveur interdit dans inertia/ : passer par #shared/* (types, helpers, constantes).',
            },
          ],
        },
      ],
    },
  },
  {
    // Au-delà, extraire des sous-composants (un fichier par composant métier).
    files: ['inertia/components/**/*.tsx'],
    rules: {
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  }
)
