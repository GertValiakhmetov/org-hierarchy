import { memo } from 'react';
import styled from 'styled-components';
import { CardScroll } from '@/shared/ui/card';
import { COLUMNS, type ColumnId, type Row } from './columns';
import { OrgTableHead } from './org-table-head';
import { OrgTableRow } from './org-table-row';
import type { Sort } from './select-rows';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
`;

const EmptyCell = styled.td`
  padding: ${({ theme }) => theme.space(10)};
  text-align: center;
  color: ${({ theme }) => theme.color.textSecondary};
`;

interface OrgTableProps {
  rows: readonly Row[];
  sort: Sort | null;
  selectedId: string | null;
  onToggleSort: (column: ColumnId) => void;
  onSelect: (nodeId: string) => void;
}

export const OrgTable = memo(function OrgTable({
  rows,
  sort,
  selectedId,
  onToggleSort,
  onSelect,
}: OrgTableProps) {
  return (
    <CardScroll>
      <Table>
        <OrgTableHead sort={sort} onToggleSort={onToggleSort} />

        <tbody>
          {rows.length === 0 && (
            <tr>
              <EmptyCell colSpan={COLUMNS.length}>Ничего не найдено</EmptyCell>
            </tr>
          )}

          {rows.map((row) => (
            <OrgTableRow
              key={row.node.id}
              row={row}
              selected={row.node.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </tbody>
      </Table>
    </CardScroll>
  );
});
