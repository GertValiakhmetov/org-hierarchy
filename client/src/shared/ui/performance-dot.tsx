import styled from 'styled-components';
import { PERFORMANCE_LABEL, performanceBand } from '@/entities/org/performance';
import { formatPerformance } from '@/shared/lib/format';

const Wrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1.5)};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.color.textSecondary};
`;

const Dot = styled.span<{ $band: ReturnType<typeof performanceBand> }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
  background: ${({ theme, $band }) => theme.performance[$band]};
`;

interface PerformanceDotProps {
  value: number;
  withoutValue?: boolean;
  className?: string;
}

export function PerformanceDot({ value, withoutValue, className }: PerformanceDotProps) {
  const band = performanceBand(value);

  return (
    <Wrapper
      className={className}
      title={`${formatPerformance(value)} — ${PERFORMANCE_LABEL[band]}`}
    >
      <Dot $band={band} aria-hidden />
      {withoutValue ? (
        <span className="visually-hidden">{PERFORMANCE_LABEL[band]}</span>
      ) : (
        formatPerformance(value)
      )}
    </Wrapper>
  );
}
