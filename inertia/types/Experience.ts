
import { JobType } from './JobType';

export interface Experience {
  id: string;
  title: string;
  company: string;
  type?: JobType;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
}
