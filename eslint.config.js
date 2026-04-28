import { configApp, INCLUDE_LIST } from '@adonisjs/eslint-config'

export default configApp(
  { ignores: ['.adonisjs/**'] },
  { files: [...INCLUDE_LIST, '**/*.tsx'] }
)
