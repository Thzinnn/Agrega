export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  workplaceType: string;
  level: string;
  contractType: string;
  benefits: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  applicationUrl: string;
  source: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
