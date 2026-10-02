export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  workplaceType: string;
  education: string;
  requirements: string[];
  contractType: string;
  benefits: string | null;
  hasVA: boolean;
  hasVR: boolean;
  hasVT: boolean;
  hasLifeInsurance: boolean;
  hasMedicalInsurance: boolean;
  hasDentalInsurance: boolean;
  salary: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  applicationUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  source: string;
  isActive: boolean;
  clicksCount: number;
  createdAt: string;
  updatedAt: string;
}
