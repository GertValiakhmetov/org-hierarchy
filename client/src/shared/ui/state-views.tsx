import styled, { keyframes } from 'styled-components';
import { ApiError } from '@/shared/transport/errors';

const Centered = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(12)} ${({ theme }) => theme.space(6)};
  text-align: center;
  color: ${({ theme }) => theme.color.textSecondary};
`;

const Title = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.size.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.color.textPrimary};
`;

const Hint = styled.p`
  margin: 0;
  max-width: 420px;
`;

const shimmer = keyframes`
  from { background-position: -320px 0; }
  to { background-position: 320px 0; }
`;

const SkeletonRow = styled.div<{ $indent: number; $width: number }>`
  height: 14px;
  border-radius: ${({ theme }) => theme.radius.sm};
  margin-left: ${({ theme, $indent }) => theme.space($indent * 5)};
  width: ${({ $width }) => $width}%;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.color.border} 0%,
    ${({ theme }) => theme.color.surfaceMuted} 50%,
    ${({ theme }) => theme.color.border} 100%
  );
  background-size: 640px 100%;
  animation: ${shimmer} 1.2s linear infinite;
`;

const SkeletonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(5)};
`;

const SKELETON_SHAPE: { indent: number; width: number }[] = [
  { indent: 0, width: 46 },
  { indent: 1, width: 62 },
  { indent: 1, width: 54 },
  { indent: 0, width: 40 },
  { indent: 1, width: 58 },
  { indent: 1, width: 50 },
  { indent: 0, width: 44 },
];

export function LoadingState() {
  return (
    <SkeletonList role="status" aria-label="Загрузка орг-структуры">
      {SKELETON_SHAPE.map((row) => (
        <SkeletonRow key={`${row.indent}-${row.width}`} $indent={row.indent} $width={row.width} />
      ))}
    </SkeletonList>
  );
}

export function EmptyState() {
  return (
    <Centered>
      <Title>Данных нет</Title>
      <Hint>
        Сервер вернул пустую структуру. Как только появятся подразделения, они отобразятся здесь.
      </Hint>
    </Centered>
  );
}

const RetryButton = styled.button`
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(4)};
  border: 1px solid ${({ theme }) => theme.color.borderStrong};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  font-weight: 500;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.color.accent};
    background: ${({ theme }) => theme.color.accentSoft};
  }
`;

const IssueList = styled.ul`
  margin: 0;
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  list-style: none;
  text-align: left;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.size.sm};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.dangerSoft};
  color: ${({ theme }) => theme.color.danger};
  max-width: 520px;
  overflow-x: auto;
`;

const MAX_VISIBLE_ISSUES = 5;

function describe(error: unknown): { title: string; hint: string } {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'network':
        return {
          title: 'Сервер недоступен',
          hint: 'Проверьте, что API запущен, и повторите запрос.',
        };
      case 'http':
        return {
          title: `Ошибка ${error.status ?? ''}`.trim(),
          hint: 'Запрос дошёл до сервера, но тот не смог вернуть данные.',
        };
      case 'malformed':
        return {
          title: 'Нечитаемый ответ API',
          hint: 'Сервер ответил, но тело ответа не является JSON и не было разобрано.',
        };
      case 'schema':
        return {
          title: 'Некорректный ответ API',
          hint: 'Ответ не соответствует ожидаемой схеме, поэтому данные не показаны.',
        };
    }
  }
  return { title: 'Не удалось загрузить данные', hint: 'Произошла непредвиденная ошибка.' };
}

interface ErrorStateProps {
  error: unknown;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ErrorState({ error, onRetry, isRetrying }: ErrorStateProps) {
  const { title, hint } = describe(error);
  const issues = error instanceof ApiError ? error.issues : [];

  return (
    <Centered role="alert">
      <Title>{title}</Title>
      <Hint>{hint}</Hint>

      {issues.length > 0 && (
        <IssueList>
          {issues.slice(0, MAX_VISIBLE_ISSUES).map((issue) => (
            <li key={issue.path}>
              {issue.path}: {issue.message}
            </li>
          ))}
          {issues.length > MAX_VISIBLE_ISSUES && (
            <li>…и ещё {issues.length - MAX_VISIBLE_ISSUES}</li>
          )}
        </IssueList>
      )}

      <RetryButton type="button" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? 'Повтор…' : 'Повторить запрос'}
      </RetryButton>
    </Centered>
  );
}

const Notice = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.dangerSoft};
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.danger};
`;

const NoticeText = styled.span`
  flex: 1 1 auto;
`;

const NoticeButton = styled.button`
  flex: none;
  padding: ${({ theme }) => theme.space(0.5)} ${({ theme }) => theme.space(2)};
  border: 1px solid currentColor;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  font-size: ${({ theme }) => theme.size.sm};
  cursor: pointer;

  &:disabled {
    cursor: progress;
    opacity: 0.6;
  }
`;

/**
 * Shown above data that is already on screen: the refresh failed, but discarding
 * a working view over a failed update would lose the user's context.
 */
export function StaleDataNotice({ error, onRetry, isRetrying }: ErrorStateProps) {
  const { title } = describe(error);

  return (
    <Notice role="status">
      <NoticeText>{title}. Показаны последние загруженные данные.</NoticeText>
      <NoticeButton type="button" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? 'Повтор…' : 'Повторить'}
      </NoticeButton>
    </Notice>
  );
}
