import { throttleOnboarding } from '#start/limiter'
import router from '@adonisjs/core/services/router'
const OnboardingController = () => import('#controllers/onboarding_controller')

// Onboarding (guest): set password via email link. GET et POST partagent le
// quota `throttleOnboarding` : tous deux permettent de tester un jeton (#65).
router
  .group(() => {
    router.get('/:token', [OnboardingController, 'show'])
    router.post('/:token', [OnboardingController, 'submit'])
  })
  .prefix('/onboarding')
  .use(throttleOnboarding)
