import type { OrgNodeDto } from '../../../shared/types.ts';

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface DivisionBlueprint {
  name: string;
  departments: { name: string; teams: string[] }[];
}

const BLUEPRINT: DivisionBlueprint[] = [
  {
    name: 'Инженерия',
    departments: [
      { name: 'Платформа', teams: ['Ядро платформы', 'Инфраструктура', 'Надёжность', 'Данные'] },
      { name: 'Продуктовая разработка', teams: ['Веб-клиент', 'Мобильные приложения', 'API'] },
      { name: 'Качество', teams: ['Автоматизация тестирования', 'Ручное тестирование'] },
      { name: 'Информационная безопасность', teams: ['Защита приложений', 'Реагирование'] },
    ],
  },
  {
    name: 'Продукт',
    departments: [
      { name: 'Продуктовый менеджмент', teams: ['Рост', 'Монетизация', 'Удержание'] },
      { name: 'Дизайн', teams: ['Продуктовый дизайн', 'Исследования', 'Дизайн-система'] },
      { name: 'Аналитика', teams: ['Продуктовая аналитика', 'Хранилище данных'] },
    ],
  },
  {
    name: 'Коммерция',
    departments: [
      { name: 'Прямые продажи', teams: ['Крупные клиенты', 'Средний бизнес', 'Малый бизнес'] },
      { name: 'Маркетинг', teams: ['Перформанс', 'Бренд', 'Контент'] },
      { name: 'Партнёрская сеть', teams: ['Интеграторы', 'Реселлеры'] },
    ],
  },
  {
    name: 'Операции',
    departments: [
      { name: 'Поддержка клиентов', teams: ['Первая линия', 'Вторая линия', 'Техподдержка'] },
      { name: 'Финансы', teams: ['Бухгалтерия', 'Финансовое планирование'] },
      { name: 'Персонал', teams: ['Подбор', 'Развитие'] },
    ],
  },
];

function intBetween(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

/**
 * Builds the flat node list from a fixed seed, so restarting the server does not
 * reshuffle the tree and cached data, screenshots and tests stay reproducible.
 *
 * Metrics are per-node and exclude descendants: rolling them up is the client's
 * job and the part of the task under review, so the server deliberately does not
 * pre-aggregate.
 */
export function generateOrgTree(seed = 20240517): OrgNodeDto[] {
  const random = createRandom(seed);
  const nodes: OrgNodeDto[] = [];
  const now = Date.now();

  const updatedAt = (): string =>
    new Date(now - intBetween(random, 0, 30 * 24 * 60) * 60_000).toISOString();

  BLUEPRINT.forEach((division, divisionIndex) => {
    const divisionId = `div-${divisionIndex + 1}`;
    nodes.push({
      id: divisionId,
      name: division.name,
      parentId: null,
      // Leadership headcount sitting above the departments, not their total.
      headcount: intBetween(random, 2, 5),
      budget: intBetween(random, 8, 20) * 1_000_000,
      performance: intBetween(random, 55, 95),
      updatedAt: updatedAt(),
    });

    division.departments.forEach((department, departmentIndex) => {
      const departmentId = `${divisionId}-dep-${departmentIndex + 1}`;
      nodes.push({
        id: departmentId,
        name: department.name,
        parentId: divisionId,
        headcount: intBetween(random, 1, 4),
        budget: intBetween(random, 3, 9) * 1_000_000,
        performance: intBetween(random, 45, 97),
        updatedAt: updatedAt(),
      });

      department.teams.forEach((team, teamIndex) => {
        nodes.push({
          id: `${departmentId}-team-${teamIndex + 1}`,
          name: team,
          parentId: departmentId,
          headcount: intBetween(random, 3, 18),
          budget: intBetween(random, 1, 7) * 1_000_000 + intBetween(random, 0, 999) * 1_000,
          performance: intBetween(random, 35, 99),
          updatedAt: updatedAt(),
        });
      });
    });
  });

  return nodes;
}
