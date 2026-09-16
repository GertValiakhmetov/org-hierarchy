import { memo } from 'react';
import styled from 'styled-components';
import type { Highlight } from '@/features/org-structure';
import { CardScroll } from '@/shared/ui/card';
import { COLUMNS, type ColumnId, type Row } from './columns';
import { OrgTableHead } from './org-table-head';
import { OrgTableRow } from './org-table-row';
import type { Sort } from './select-rows';
import { useRowFocus } from './use-row-focus';

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
  highlight: Highlight | null;
  onToggleSort: (column: ColumnId) => void;
  onSelect: (nodeId: string) => void;
}

export const OrgTable = memo(function OrgTable({
  rows,
  sort,
  selectedId,
  highlight,
  onToggleSort,
  onSelect,
}: OrgTableProps) {
  const focus = useRowFocus({
    rowCount: rows.length,
    onActivate: (index) => {
      const row = rows[index];
      if (row) onSelect(row.node.id);
    },
  });

  return (
    <CardScroll>
      <Table>
        <OrgTableHead sort={sort} onToggleSort={onToggleSort} />

        <tbody ref={focus.bodyRef} onClick={focus.onBodyClick} onKeyDown={focus.onKeyDown}>
          {rows.length === 0 && (
            <tr>
              <EmptyCell colSpan={COLUMNS.length}>Ничего не найдено</EmptyCell>
            </tr>
          )}

          {rows.map((row, index) => {
            // Only touched rows receive changing props, so memo holds for the rest.
            const touched = highlight?.nodeIds.has(row.node.id) === true;

            return (
              <OrgTableRow
                key={row.node.id}
                row={row}
                selected={row.node.id === selectedId}
                focusable={index === focus.index}
                flashAt={touched ? highlight?.at : undefined}
                flashFields={touched ? highlight?.fields : undefined}
                onSelect={onSelect}
              />
            );
          })}
        </tbody>
      </Table>
    </CardScroll>
  );
});
