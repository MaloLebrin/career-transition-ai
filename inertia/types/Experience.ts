
import { JobType } from './JobType';

export interface Experience {
  id: number;
  title: string;
  company: string;
  type?: JobType;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
}
