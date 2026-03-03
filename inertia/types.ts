
export * from './types/ExerciseType';
export * from './types/Skill';
export * from './types/PersonalityData';
export * from './types/JobType';
export * from './types/Experience';
export * from './types/Education';
export * from './types/ExerciseResult';
export * from './types/SupportPlanStep';
export * from './types/Employee';

export type AdvisorRole = 'admin' | 'expert' | 'consultant';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Advisor {
  id: number;
  organizationId: number;
  email: string;
  name: string;
  role: AdvisorRole;
}
