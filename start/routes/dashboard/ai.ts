import { throttleAi } from '#start/limiter'
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const AiAssistController = () => import('#controllers/ai_assist_controller')

// Assistance IA (tous rôles connectés) : la clé fournisseur reste côté serveur.
router
  .group(() => {
    router.post('/cv', [AiAssistController, 'extractCv'])
    router.post('/skill-mapping', [AiAssistController, 'extractSkillMapping'])
    router.post('/targets', [AiAssistController, 'suggestTargets'])
  })
  .use([middleware.auth(), throttleAi])
  .prefix('/dashboard/ai')
