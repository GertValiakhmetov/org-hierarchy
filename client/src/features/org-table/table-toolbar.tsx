import type { SearchFallbackReason, SearchSource } from '@shared/types';
import styled from 'styled-components';
import { formatCount } from '@/shared/lib/format';

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

const Note = styled.span`
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.textMuted};
  white-space: nowrap;
`;

const Count = styled.span`
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.textMuted};
  white-space: nowrap;
`;

const FALLBACK_NOTE: Record<SearchFallbackReason, string> = {
  'not-configured': 'AI-поиск не настроен — ищу по названию',
  failed: 'AI-поиск недоступен — ищу по названию',
  invalid: 'не удалось разобрать запрос — ищу по названию',
};

interface TableToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  isSearching: boolean;
  source: SearchSource | null;
  reason: SearchFallbackReason | null;
  shownCount: number;
  totalCount: number;
}

export function TableToolbar({
  query,
  onQueryChange,
  onSubmit,
  isSearching,
  source,
  reason,
  shownCount,
  totalCount,
}: TableToolbarProps) {
  const isFiltered = shownCount !== totalCount;
  const note = isSearching ? 'ищу…' : source === 'text' && reason ? FALLBACK_NOTE[reason] : null;

  return (
    <Bar>
      <Field
        type="search"
        value={query}
        placeholder="Название, или запрос словами + Enter"
        aria-label="Поиск: название подразделения или запрос словами, Enter разбирает запрос"
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      {note && <Note>{note}</Note>}
      {isFiltered && (
        <Count>
          {formatCount(shownCount)} из {formatCount(totalCount)}
        </Count>
      )}
    </Bar>
  );
}
