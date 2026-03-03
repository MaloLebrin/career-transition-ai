
export interface Education {
  id: number;
  degree: string;
  school: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
}
