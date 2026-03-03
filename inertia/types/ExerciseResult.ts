
import { ExerciseType } from './ExerciseType';

export interface ExerciseResult {
  id: number;
  type: ExerciseType;
  date: string;
  duration: number;
  data: any;
  quantitativeScore: number;
  qualitativeAnalysis?: string;
}

export interface ExerciseDraft {
  employeeId: number;
  type: ExerciseType;
  lastUpdated: string;
  data: any;
}
