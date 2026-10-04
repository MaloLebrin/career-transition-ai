import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { AdvisorHome } from '../../../inertia/components/dashboard/advisor/home/AdvisorHome'

vi.mock('@inertiajs/react', () => ({
  Link: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  useForm: () => ({
    data: { name: '', email: '', currentRole: '', targetRole: '', summary: '' },
    setData: vi.fn(),
    post: vi.fn(),
    processing: false,
    errors: {},
    reset: vi.fn(),
  }),
}))

const baseStats = {
  totalActive: 3,
  pendingOnboarding: 1,
  upcomingCount: 2,
  completedStepsThisMonth: 5,
}

const baseAccompaniments = [
  {
    employeeId: 1,
    name: 'Alice Martin',
    email: 'alice@example.com',
    status: 'active' as const,
    onboarded: true,
    targetRole: 'Lead Dev',
    completedSteps: 3,
    totalSteps: 5,
    progressPercent: 60,
    nextAppointment: {
      stepId: 10,
      title: 'Bilan intermédiaire',
      scheduledAt: '2026-05-15T10:00:00.000Z',
    },
  },
  {
    employeeId: 2,
    name: 'Bob Dupont',
    email: 'bob@example.com',
    status: 'onboarding' as const,
    onboarded: false,
    targetRole: null,
    completedSteps: 0,
    totalSteps: 3,
    progressPercent: 0,
    nextAppointment: null,
  },
]

const baseUpcoming = [
  {
    stepId: 10,
    employeeId: 1,
    employeeName: 'Alice Martin',
    title: 'Bilan intermédiaire',
    scheduledAt: '2026-05-15T10:00:00.000Z',
    locationOrLink: 'https://meet.example.com',
  },
]

describe('AdvisorHome', () => {
  test('renders 4 stat cards with correct values', () => {
    render(
      <AdvisorHome
        stats={baseStats}
        accompaniments={baseAccompaniments}
        upcomingAppointments={baseUpcoming}
      />
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Actifs')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText("En attente d'onboarding")).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Prochains RDV')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Étapes ce mois-ci')).toBeInTheDocument()
  })

  test('renders accompaniment cards for each employee', () => {
    render(
      <AdvisorHome
        stats={baseStats}
        accompaniments={baseAccompaniments}
        upcomingAppointments={baseUpcoming}
      />
    )
    expect(screen.getAllByText('Alice Martin').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Lead Dev')).toBeInTheDocument()
    expect(screen.getByText('Bob Dupont')).toBeInTheDocument()
  })

  test('shows progress text for each accompaniment', () => {
    render(
      <AdvisorHome
        stats={baseStats}
        accompaniments={baseAccompaniments}
        upcomingAppointments={baseUpcoming}
      />
    )
    expect(screen.getByText('3/5 étapes')).toBeInTheDocument()
    expect(screen.getByText('0/3 étapes')).toBeInTheDocument()
  })

  test('accompaniment cards link to employee profile page', () => {
    render(
      <AdvisorHome
        stats={baseStats}
        accompaniments={baseAccompaniments}
        upcomingAppointments={baseUpcoming}
      />
    )
    const links = screen.getAllByRole('link')
    const aliceLink = links.find(
      (l) => l.getAttribute('href') === '/dashboard/conseiller/employees/1'
    )
    expect(aliceLink).toBeTruthy()
    const bobLink = links.find(
      (l) => l.getAttribute('href') === '/dashboard/conseiller/employees/2'
    )
    expect(bobLink).toBeTruthy()
  })

  test('shows next appointment info for employee with scheduled RDV', () => {
    render(
      <AdvisorHome
        stats={baseStats}
        accompaniments={baseAccompaniments}
        upcomingAppointments={baseUpcoming}
      />
    )
    expect(screen.getAllByText(/Bilan intermédiaire/).length).toBeGreaterThanOrEqual(1)
  })

  test('shows "Aucun RDV planifié" for employee with no next appointment', () => {
    render(
      <AdvisorHome
        stats={baseStats}
        accompaniments={baseAccompaniments}
        upcomingAppointments={baseUpcoming}
      />
    )
    expect(screen.getByText('Aucun RDV planifié')).toBeInTheDocument()
  })

  test('shows "Aucun rendez-vous planifié" in upcoming panel when empty', () => {
    render(
      <AdvisorHome
        stats={baseStats}
        accompaniments={baseAccompaniments}
        upcomingAppointments={[]}
      />
    )
    expect(screen.getByText('Aucun rendez-vous planifié')).toBeInTheDocument()
  })

  test('shows "Aucun candidat suivi" when accompaniments list is empty', () => {
    render(<AdvisorHome stats={baseStats} accompaniments={[]} upcomingAppointments={[]} />)
    expect(screen.getByText('Aucun candidat suivi')).toBeInTheDocument()
  })

  test('shows "Nouveau Candidat" button', () => {
    render(
      <AdvisorHome
        stats={baseStats}
        accompaniments={baseAccompaniments}
        upcomingAppointments={baseUpcoming}
      />
    )
    expect(screen.getByRole('button', { name: /nouveau candidat/i })).toBeInTheDocument()
  })

  test('renders status badges for each accompaniment', () => {
    render(
      <AdvisorHome
        stats={baseStats}
        accompaniments={baseAccompaniments}
        upcomingAppointments={baseUpcoming}
      />
    )
    expect(screen.getByText('Actif')).toBeInTheDocument()
    expect(screen.getByText('Onboarding')).toBeInTheDocument()
  })

  test('locationOrLink is shown in upcoming appointments panel', () => {
    render(
      <AdvisorHome
        stats={baseStats}
        accompaniments={baseAccompaniments}
        upcomingAppointments={baseUpcoming}
      />
    )
    expect(screen.getByText('https://meet.example.com')).toBeInTheDocument()
  })
})
