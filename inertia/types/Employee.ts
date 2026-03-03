
import { Skill } from './Skill';
import { Experience } from './Experience';
import { Education } from './Education';
import { ExerciseResult } from './ExerciseResult';
import { SupportPlanStep } from './SupportPlanStep';

export interface Employee {
  id: number;
  organizationId: number;
  advisorId?: number;
  name: string;
  email: string;
  currentRole: string;
  targetRole?: string;
  skills: Skill[];
  summary?: string;
  advisorNotes?: string;
  experiences: Experience[];
  educations: Education[];
  status: 'active' | 'completed' | 'on-hold';
  onboarded: boolean;
  exercises: ExerciseResult[];
  nextAppointment?: string;
  plan: SupportPlanStep[];
}
