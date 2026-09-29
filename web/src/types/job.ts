export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: number | null;
  benefits: string | null;
  postedAt: string;
  createdAt: string;
  updatedAt: string;
}
