import router from '@adonisjs/core/services/router'
const OnboardingController = () => import('#controllers/onboarding_controller')

// Onboarding (guest): set password via email link
router
  .group(() => {
    router.get('/:token', [OnboardingController, 'show'])
    router.post('/:token', [OnboardingController, 'submit'])
  })
  .prefix('/onboarding')
