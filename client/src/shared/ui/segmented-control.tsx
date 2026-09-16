import styled from 'styled-components';

const Group = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(0.5)};
  padding: ${({ theme }) => theme.space(0.5)};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
`;

const Segment = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(3)};
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $active }) => ($active ? theme.color.accentSoft : 'transparent')};
  font-size: ${({ theme }) => theme.size.sm};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ theme, $active }) => ($active ? theme.color.accent : theme.color.textSecondary)};
  cursor: pointer;

  &:hover {
    color: ${({ theme, $active }) => ($active ? theme.color.accent : theme.color.textPrimary)};
  }
`;

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  return (
    <Group role="tablist" aria-label={label}>
      {options.map((option) => (
        <Segment
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          $active={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Segment>
      ))}
    </Group>
  );
}
