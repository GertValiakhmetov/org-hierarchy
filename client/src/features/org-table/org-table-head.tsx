import styled from 'styled-components';
import { COLUMNS, type ColumnId } from './columns';
import type { Sort } from './select-rows';

const HeaderCell = styled.th<{ $numeric: boolean; $active: boolean }>`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 0;
  text-align: ${({ $numeric }) => ($numeric ? 'right' : 'left')};
  font-size: ${({ theme }) => theme.size.sm};
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  color: ${({ theme, $active }) => ($active ? theme.color.textPrimary : theme.color.textSecondary)};
  background: ${({ theme }) => theme.color.surfaceMuted};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  white-space: nowrap;
`;

const HeaderButton = styled.button<{ $numeric: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $numeric }) => ($numeric ? 'flex-end' : 'flex-start')};
  gap: ${({ theme }) => theme.space(1)};
  width: 100%;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border: none;
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color.textPrimary};
  }
`;

const SortArrow = styled.span`
  display: inline-block;
  width: 8px;
  font-size: ${({ theme }) => theme.size.xs};
`;

function ariaSort(sort: Sort | null, column: ColumnId): 'ascending' | 'descending' | 'none' {
  if (sort?.column !== column) return 'none';
  return sort.direction === 'asc' ? 'ascending' : 'descending';
}

interface OrgTableHeadProps {
  sort: Sort | null;
  onToggleSort: (column: ColumnId) => void;
}

export function OrgTableHead({ sort, onToggleSort }: OrgTableHeadProps) {
  return (
    <thead>
      <tr>
        {COLUMNS.map((column) => (
          <HeaderCell
            key={column.id}
            $numeric={column.numeric}
            $active={sort?.column === column.id}
            aria-sort={ariaSort(sort, column.id)}
          >
            <HeaderButton
              type="button"
              $numeric={column.numeric}
              onClick={() => onToggleSort(column.id)}
            >
              {column.title}
              <SortArrow aria-hidden>
                {sort?.column === column.id ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
              </SortArrow>
            </HeaderButton>
          </HeaderCell>
        ))}
      </tr>
    </thead>
  );
}
