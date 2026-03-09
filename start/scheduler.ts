/**
 * Queue scheduler preload.
 *
 * This file is imported from `adonisrc.ts` and is the place where
 * you define recurring jobs (cron or interval based) using
 * the `schedule` API on your Job classes.
 *
 * Initial version: no schedules configured yet. They will be
 * added as part of the queue integration.
 */
export default async function scheduler() {
  /**
   * Example (to be enabled/adjusted later):
   *
   * import CleanupExpiredSessions from '#jobs/cleanup_expired_sessions'
   *
   * await CleanupExpiredSessions.schedule({ retentionDays: 30 })
   *   .cron('0 0 * * *')
   *   .timezone('Europe/Paris')
   */
}

/*
|--------------------------------------------------------------------------
| Scheduler
|--------------------------------------------------------------------------
|
| This file is used to define scheduled jobs. You can schedule jobs to run
| at specific intervals using cron expressions or duration strings.
|
| Example:
|
|   import SendWeeklyReport from '#jobs/send_weekly_report'
|
|   SendWeeklyReport.schedule({ userId: 1 })
|     .cron('0 9 * * MON')
|     .run()
|
*/
