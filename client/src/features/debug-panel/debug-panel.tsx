import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import styled from 'styled-components';
import type { DebugMode } from '@shared/types';
import { debugModeQuery, setDebugMode } from '@/shared/api/debug';
import { orgTreeKeys } from '@/shared/api/org-tree';

/** On unless a build explicitly passes VITE_DEBUG_PANEL=false. */
export const isDebugPanelEnabled = import.meta.env.VITE_DEBUG_PANEL !== 'false';

const MODE_LABELS: Record<DebugMode, string> = {
  normal: 'Обычный ответ',
  slow: 'Медленный ответ (5 с)',
  empty: 'Пустой ответ',
  error: 'Ошибка 500',
  invalid: 'Невалидная схема',
};

const MODE_ORDER: readonly DebugMode[] = ['normal', 'slow', 'empty', 'error', 'invalid'];

const Panel = styled.aside`
  position: fixed;
  right: ${({ theme }) => theme.space(4)};
  bottom: ${({ theme }) => theme.space(4)};
  z-index: 10;
  width: 214px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  box-shadow: 0 4px 16px rgba(19, 25, 32, 0.12);
  overflow: hidden;
`;

const Header = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border: none;
  background: ${({ theme }) => theme.color.surfaceMuted};
  font-size: ${({ theme }) => theme.size.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.color.textSecondary};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color.textPrimary};
  }
`;

const ActiveHint = styled.span<{ $active: boolean }>`
  font-weight: 400;
  color: ${({ theme, $active }) => ($active ? theme.color.danger : theme.color.textMuted)};
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.space(1)};
  border-top: 1px solid ${({ theme }) => theme.color.border};
`;

const ModeButton = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(1.5)} ${({ theme }) => theme.space(2)};
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $selected }) => ($selected ? theme.color.accentSoft : 'transparent')};
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme, $selected }) => ($selected ? theme.color.accent : theme.color.textSecondary)};
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme, $selected }) => ($selected ? theme.color.accentSoft : theme.color.surfaceMuted)};
  }

  &:disabled {
    cursor: progress;
    opacity: 0.6;
  }
`;

const Bullet = styled.span<{ $selected: boolean }>`
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme, $selected }) => ($selected ? theme.color.accent : theme.color.borderStrong)};
`;

const Note = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(2)};
  font-size: ${({ theme }) => theme.size.xs};
  color: ${({ theme }) => theme.color.textMuted};
`;

/**
 * A tool for exercising the non-functional requirements, not a product feature.
 *
 * Switching a mode invalidates the cache instead of reloading the page, so the
 * transition itself is observable — most importantly, that an already rendered
 * tree survives a failed background revalidation.
 */
export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const modeQuery = useQuery(debugModeQuery());

  const mutation = useMutation({
    mutationFn: (mode: DebugMode) => setDebugMode(mode, AbortSignal.timeout(10_000)),
    onSuccess: async (mode) => {
      queryClient.setQueryData(debugModeQuery().queryKey, mode);
      // Same cache key, so the failure lands on a query that already holds data.
      await queryClient.invalidateQueries({ queryKey: orgTreeKeys.all });
    },
  });

  const current = modeQuery.data ?? 'normal';
  const isChanging = mutation.isPending;

  return (
    <Panel>
      <Header type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen}>
        Отладка
        <ActiveHint $active={current !== 'normal'}>
          {current === 'normal' ? 'выкл' : MODE_LABELS[current]}
        </ActiveHint>
      </Header>

      {isOpen && (
        <>
          <Body>
            {MODE_ORDER.map((mode) => (
              <ModeButton
                key={mode}
                type="button"
                $selected={mode === current}
                disabled={isChanging}
                onClick={() => mutation.mutate(mode)}
              >
                <Bullet $selected={mode === current} />
                {MODE_LABELS[mode]}
              </ModeButton>
            ))}
          </Body>
          <Note>Режим меняется на сервере. Страница не перезагружается.</Note>
        </>
      )}
    </Panel>
  );
}
