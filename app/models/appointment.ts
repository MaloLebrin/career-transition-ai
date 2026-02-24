export const APPOINTMENTS_STATUSES = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const

export type AppointmentStatus = (typeof APPOINTMENTS_STATUSES)[keyof typeof APPOINTMENTS_STATUSES]

export const appointmentStatusValues = Object.values(APPOINTMENTS_STATUSES)
