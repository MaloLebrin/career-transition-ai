
import { ExerciseType } from './ExerciseType';

export interface SupportPlanStep {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  notes?: string;
  associatedExercise?: ExerciseType;
  lastUpdated?: string;
}
