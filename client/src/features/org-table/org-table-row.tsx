import type { PatchField } from '@shared/types';
import { memo } from 'react';
import styled from 'styled-components';
import { PERSON_FORMS } from '@/entities/org/labels';
import { LEVEL_LABEL } from '@/entities/org/types';
import { formatQuantity, formatRubles } from '@/shared/lib/format';
import { useFlash } from '@/shared/lib/use-flash';
import { FLASH_DURATION_MS, flash } from '@/shared/ui/flash';
import { PerformanceDot } from '@/shared/ui/performance-dot';
import type { Row } from './columns';

const BodyRow = styled.tr<{ $selected: boolean }>`
  cursor: pointer;
  outline-offset: -2px;
  background: ${({ theme, $selected }) => ($selected ? theme.color.accentSoft : 'transparent')};

  &:hover {
    background: ${({ theme, $selected }) =>
      $selected ? theme.color.accentSoft : theme.color.surfaceMuted};
  }
`;

const Cell = styled.td<{ $numeric?: boolean; $flash?: boolean }>`
  padding: ${({ theme }) => theme.space(1.5)} ${({ theme }) => theme.space(3)};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  text-align: ${({ $numeric }) => ($numeric ? 'right' : 'left')};
  white-space: nowrap;
  ${flash}
`;

/** Indentation repeats the hierarchy so a sorted table still shows depth. */
const NameCell = styled(Cell)<{ $depth: number }>`
  padding-left: ${({ theme, $depth }) => theme.space(3 + $depth * 4)};
  width: 40%;
  white-space: normal;
`;

const LevelBadge = styled.span`
  font-size: ${({ theme }) => theme.size.xs};
  color: ${({ theme }) => theme.color.textMuted};
`;

const PerformanceCell = styled(Cell)`
  > span {
    justify-content: flex-end;
  }
`;

interface OrgTableRowProps {
  row: Row;
  selected: boolean;
  focusable: boolean;
  /** Set only for rows a live patch touched; changing it replays the fade. */
  flashAt?: number;
  flashFields?: ReadonlySet<PatchField>;
  onSelect: (nodeId: string) => void;
}

/** Memoised so selection re-renders two rows, not all 51. */
export const OrgTableRow = memo(function OrgTableRow({
  row,
  selected,
  focusable,
  flashAt,
  flashFields,
  onSelect,
}: OrgTableRowProps) {
  const { node, aggregate } = row;
  const flashing = useFlash(flashAt, FLASH_DURATION_MS);
  const flashes = (field: PatchField): boolean => flashing && flashFields?.has(field) === true;

  return (
    <BodyRow
      data-row
      tabIndex={focusable ? 0 : -1}
      $selected={selected}
      onClick={() => onSelect(node.id)}
      aria-selected={selected}
    >
      <NameCell $depth={node.depth}>{node.name}</NameCell>
      <Cell>
        <LevelBadge>{LEVEL_LABEL[node.level]}</LevelBadge>
      </Cell>
      <Cell $numeric $flash={flashes('headcount')}>
        {formatQuantity(aggregate.headcount, PERSON_FORMS)}
      </Cell>
      <Cell $numeric $flash={flashes('budget')}>
        {formatRubles(aggregate.budget)}
      </Cell>
      <PerformanceCell $numeric $flash={flashes('performance')}>
        <PerformanceDot value={aggregate.performance} />
      </PerformanceCell>
    </BodyRow>
  );
});
