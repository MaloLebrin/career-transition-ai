
import { ExerciseType } from './ExerciseType';

export interface ExerciseResult {
  id: string;
  type: ExerciseType;
  date: string;
  duration: number;
  data: any;
  quantitativeScore: number;
  qualitativeAnalysis?: string;
}

export interface ExerciseDraft {
  employeeId: string;
  type: ExerciseType;
  lastUpdated: string;
  data: any;
}
