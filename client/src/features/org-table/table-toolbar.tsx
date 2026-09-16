import styled from 'styled-components';
import { ORG_UNIT_FORMS } from '@/entities/org/labels';
import { formatCount, formatQuantity } from '@/shared/lib/format';

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
`;

const Field = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  max-width: 320px;
  padding: ${({ theme }) => theme.space(1.5)} ${({ theme }) => theme.space(2.5)};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  font: inherit;
  color: ${({ theme }) => theme.color.textPrimary};
  background: ${({ theme }) => theme.color.surface};

  &::placeholder {
    color: ${({ theme }) => theme.color.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.color.accent};
  }
`;

const Count = styled.span`
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.textMuted};
  white-space: nowrap;
`;

interface TableToolbarProps {
  filter: string;
  onFilterChange: (value: string) => void;
  shownCount: number;
  totalCount: number;
}

export function TableToolbar({ filter, onFilterChange, shownCount, totalCount }: TableToolbarProps) {
  const isFiltered = shownCount !== totalCount;

  return (
    <Bar>
      <Field
        type="search"
        value={filter}
        placeholder="Поиск по названию"
        aria-label="Фильтр по названию подразделения"
        onChange={(event) => onFilterChange(event.target.value)}
      />
      <Count>
        {isFiltered
          ? `${formatCount(shownCount)} из ${formatCount(totalCount)}`
          : formatQuantity(totalCount, ORG_UNIT_FORMS)}
      </Count>
    </Bar>
  );
}
