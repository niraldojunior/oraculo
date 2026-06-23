export interface Holiday {
  id: string;
  date: string;
  name: string;
  companyId?: string | null;
}

export type HolidayWriteData = Partial<Omit<Holiday, 'id'>>;
