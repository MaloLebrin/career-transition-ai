import PurgeExpiredContactBlocksJob from '#jobs/purge_expired_contact_blocks_job'
import PurgeExpiredPdfExportsJob from '#jobs/purge_expired_pdf_exports_job'
import logger from '@adonisjs/core/services/logger'

/**
 * Tâches planifiées (preload `web`, cf. docs/QUEUES.md).
 *
 * Chaque planification porte un id fixe : l'enregistrement est un upsert dans
 * `queue_schedules`, rejoué sans doublon à chaque démarrage. Le worker les
 * exécute. Une erreur ici ne doit pas empêcher le serveur de démarrer.
 */
export const SCHEDULES = {
  purgeExpiredPdfExports: 'purge-expired-pdf-exports',
  purgeExpiredContactBlocks: 'purge-expired-contact-blocks',
} as const

try {
  // Chaque nuit à 3 h (heure de Paris).
  await PurgeExpiredPdfExportsJob.schedule({})
    .id(SCHEDULES.purgeExpiredPdfExports)
    .cron('0 3 * * *')
    .timezone('Europe/Paris')
    .run()
  // Chaque nuit à 3 h 30 (heure de Paris).
  await PurgeExpiredContactBlocksJob.schedule({})
    .id(SCHEDULES.purgeExpiredContactBlocks)
    .cron('30 3 * * *')
    .timezone('Europe/Paris')
    .run()
} catch (error) {
  logger.error({ err: error }, 'Scheduling failed')
}
