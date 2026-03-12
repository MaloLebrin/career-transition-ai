import router from '@adonisjs/core/services/router'
const EmployeesController = () => import('#controllers/employees_controller')
const ExerciseResultsController = () => import('#controllers/exercise_results_controller')
const OrganizationsController = () => import('#controllers/organizations_controller')
const BulkJobsController = () => import('#controllers/bulk_jobs_controller')

// JSON API routes (nested groups by resource)
router
  .group(() => {
    // Employees + exercise results
    router
      .group(() => {
        router.post('/', [EmployeesController, 'store'])
        router.get('/', [EmployeesController, 'index'])
        router.get('/:id', [EmployeesController, 'show'])
        router.put('/:id', [EmployeesController, 'update'])
        router.post('/:id/exercises/result', [ExerciseResultsController, 'store'])
        router.post('/:id/exercises/draft', [ExerciseResultsController, 'saveDraft'])
        router.post('/:id/exercises/draft/fetch', [ExerciseResultsController, 'fetchDraft'])
      })
      .prefix('/employees')

    // Organizations + advisors (static /current before /:id)
    router
      .group(() => {
        router.get('/current', [OrganizationsController, 'current'])
        router.get('/:id', [OrganizationsController, 'show'])
        router.put('/:id', [OrganizationsController, 'update'])
        router.get('/:id/advisors', [OrganizationsController, 'indexAdvisors'])
        router.post('/:id/advisors', [OrganizationsController, 'storeAdvisor'])
      })
      .prefix('/organizations')

    // Bulk jobs (emails / PDFs) + tracking
    router
      .group(() => {
        router.post('/emails', [BulkJobsController, 'storeEmails'])
        router.post('/pdfs', [BulkJobsController, 'storePdfs'])
        router.get('/', [BulkJobsController, 'index'])
        router.get('/:id', [BulkJobsController, 'show'])
      })
      .prefix('/bulk-jobs')
  })
  .prefix('/api')
