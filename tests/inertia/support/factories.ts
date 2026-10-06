import type { EmployeeData } from '../../../inertia/types/employee'
import type { Note } from '../../../inertia/types/note'
import type { ChatConversationSummary, ChatMessageView } from '#shared/types/chat/views'

/** Fabriques de données front partagées par les specs (valeurs réalistes, surchargeables). */

type Experience = EmployeeData['experiences'][number]
type Education = EmployeeData['educations'][number]

export function makeExperience(overrides: Partial<Experience> = {}): Experience {
  return {
    id: 1,
    title: 'Chef de projet',
    company: 'Acme',
    startDate: '2020-01-01',
    endDate: '2022-06-01',
    description: 'Pilotage de projets digitaux',
    type: 'cdi',
    isCurrent: false,
    sortOrder: null,
    ...overrides,
  }
}

export function makeEducation(overrides: Partial<Education> = {}): Education {
  return {
    id: 1,
    degree: 'Master Management',
    school: 'IAE Lyon',
    startDate: '2015-09-01',
    endDate: '2017-06-01',
    description: 'Spécialité RH',
    isCurrent: false,
    sortOrder: null,
    ...overrides,
  }
}

export function makeEmployee(overrides: Partial<EmployeeData> = {}): EmployeeData {
  return {
    id: 1,
    organizationId: 1,
    userId: 1,
    name: 'Camille Martin',
    email: 'camille@example.com',
    currentRole: 'Chargée de clientèle',
    targetRole: 'UX designer',
    summary: null,
    advisorNotes: null,
    status: 'active',
    onboarded: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    skills: [],
    exercises: [],
    plan: [],
    experiences: [],
    educations: [],
    ...overrides,
  }
}

export function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 1,
    content: 'Premier échange très positif',
    visibility: 'private',
    supportPlanStepId: null,
    exerciseResultId: null,
    authorId: 10,
    authorName: 'claire dupont',
    createdAt: '2024-03-10T10:00:00.000Z',
    updatedAt: '2024-03-10T10:00:00.000Z',
    canEdit: true,
    ...overrides,
  }
}

export function makeChatMessage(overrides: Partial<ChatMessageView> = {}): ChatMessageView {
  return {
    id: 1,
    authorRole: 'candidate',
    body: 'Bonjour',
    createdAt: '2026-10-05T10:00:00.000Z',
    ...overrides,
  }
}

export function makeChatSummary(
  overrides: Partial<ChatConversationSummary> = {}
): ChatConversationSummary {
  return {
    id: 1,
    channel: 'chat/conversations/1',
    employeeId: 7,
    candidateLabel: 'Candidat #7',
    accountType: 'b2c',
    assignment: 'queue',
    lastMessageAt: '2026-10-05T10:00:00.000Z',
    lastMessagePreview: 'Bonjour',
    unreadCount: 0,
    ...overrides,
  }
}
