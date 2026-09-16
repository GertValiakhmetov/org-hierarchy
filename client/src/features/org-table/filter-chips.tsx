import type { OrgFilter } from '@shared/types';
import styled from 'styled-components';
import { describeFilter, type FilterField, removeField } from './describe-filter';

const Bar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1.5)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.surfaceMuted};
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  padding: ${({ theme }) => theme.space(0.5)} ${({ theme }) => theme.space(1)}
    ${({ theme }) => theme.space(0.5)} ${({ theme }) => theme.space(2)};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: 999px;
  background: ${({ theme }) => theme.color.surface};
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.textPrimary};
`;

const Remove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  font-size: ${({ theme }) => theme.size.sm};
  line-height: 1;
  color: ${({ theme }) => theme.color.textMuted};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.border};
    color: ${({ theme }) => theme.color.textPrimary};
  }
`;

const Reset = styled.button`
  margin-left: auto;
  padding: ${({ theme }) => theme.space(0.5)} ${({ theme }) => theme.space(2)};
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.textSecondary};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color.textPrimary};
  }
`;

interface FilterChipsProps {
  filter: OrgFilter;
  onChange: (filter: OrgFilter) => void;
  onReset: () => void;
}

export function FilterChips({ filter, onChange, onReset }: FilterChipsProps) {
  const chips = describeFilter(filter);

  if (chips.length === 0) return null;

  const drop = (field: FilterField): void => {
    const next = removeField(filter, field);
    onChange(next);
  };

  return (
    <Bar aria-label="Активные условия поиска">
      {chips.map((chip) => (
        <Chip key={chip.field}>
          {chip.label}
          <Remove
            type="button"
            aria-label={`Убрать условие: ${chip.label}`}
            onClick={() => drop(chip.field)}
          >
            ×
          </Remove>
        </Chip>
      ))}
      <Reset type="button" onClick={onReset}>
        сбросить
      </Reset>
    </Bar>
  );
}
