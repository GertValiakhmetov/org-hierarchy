import styled, { keyframes } from 'styled-components';
import type { ConnectionStatus } from '@/shared/transport/socket';

const LABEL: Record<ConnectionStatus, string> = {
  connecting: 'подключение…',
  open: 'обновления в реальном времени',
  reconnecting: 'переподключение…',
  closed: 'обновления отключены',
};

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`;

const Wrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1.5)};
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.textMuted};
  white-space: nowrap;
`;

const Dot = styled.span<{ $status: ConnectionStatus }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
  background: ${({ theme, $status }) =>
    $status === 'open'
      ? theme.performance.high
      : $status === 'closed'
        ? theme.color.textMuted
        : theme.performance.medium};
  animation: ${({ $status }) => ($status === 'open' || $status === 'closed' ? 'none' : pulse)} 1.2s
    ease-in-out infinite;
`;

export function ConnectionDot({ status }: { status: ConnectionStatus }) {
  return (
    <Wrapper title={LABEL[status]}>
      <Dot $status={status} aria-hidden />
      {LABEL[status]}
    </Wrapper>
  );
}
