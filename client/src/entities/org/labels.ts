import type { OrgLevel } from '@shared/types';
import type { PluralForms } from '@/shared/lib/format';

export const PERSON_FORMS: PluralForms = ['человек', 'человека', 'человек'];

export const EMPLOYEE_FORMS: PluralForms = ['сотрудник', 'сотрудника', 'сотрудников'];

export const ORG_UNIT_FORMS: PluralForms = ['подразделение', 'подразделения', 'подразделений'];

export const LEVEL_PLURAL: Record<OrgLevel, string> = {
  division: 'дивизионы',
  department: 'отделы',
  team: 'команды',
};
