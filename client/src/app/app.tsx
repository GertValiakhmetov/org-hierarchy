import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { buildTree } from '@/entities/org/build-tree';
import { DebugPanel, isDebugPanelEnabled } from '@/features/debug-panel/debug-panel';
import { OrgTreeView } from '@/features/org-tree/org-tree-view';
import { useExpanded } from '@/features/org-tree/use-expanded';
import { orgTreeQuery, retryOrgTreeOnce } from '@/shared/api/org-tree';
import { formatCount, plural } from '@/shared/lib/format';
import { EmptyState, ErrorState, LoadingState, StaleDataNotice } from '@/shared/ui/state-views';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
  height: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space(6)};
`;

const Header = styled.header`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(3)};
  flex-wrap: wrap;
`;

const Title = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.size.xl};
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const Subtitle = styled.span`
  color: ${({ theme }) => theme.color.textSecondary};
`;

const Refreshing = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.textMuted};
`;

const Card = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.color.surface};
  box-shadow: ${({ theme }) => theme.shadow.card};
  overflow: hidden;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.surfaceMuted};
`;

const ToolbarButton = styled.button`
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(2.5)};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.textSecondary};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.color.border};
    background: ${({ theme }) => theme.color.surface};
    color: ${({ theme }) => theme.color.textPrimary};
  }
`;

const Scroll = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
`;

export function App() {
  const queryClient = useQueryClient();
  const query = useQuery(orgTreeQuery());

  const retry = useCallback(() => void retryOrgTreeOnce(queryClient), [queryClient]);

  const tree = useMemo(() => (query.data ? buildTree(query.data) : undefined), [query.data]);
  const expansion = useExpanded(tree);

  const hasData = tree !== undefined;
  const isFatalError = query.isError && !hasData;
  const isStale = query.isError && hasData;
  const isBackgroundRefetch = query.isFetching && !query.isPending;

  return (
    <Page>
      <Header>
        <Title>Орг-структура компании</Title>
        {hasData && tree.size > 0 && (
          <Subtitle>
            {formatCount(tree.size)} {plural(tree.size, ['подразделение', 'подразделения', 'подразделений'])}
          </Subtitle>
        )}
        {isBackgroundRefetch && <Refreshing>обновление…</Refreshing>}
      </Header>

      <Card>
        {hasData && tree.size > 0 && (
          <Toolbar>
            <ToolbarButton type="button" onClick={expansion.expandAll}>
              Развернуть всё
            </ToolbarButton>
            <ToolbarButton type="button" onClick={expansion.collapseAll}>
              Свернуть всё
            </ToolbarButton>
          </Toolbar>
        )}

        {isStale && (
          <StaleDataNotice
            error={query.error}
            onRetry={retry}
            isRetrying={query.isFetching}
          />
        )}

        <Scroll>
          {query.isPending && <LoadingState />}

          {isFatalError && (
            <ErrorState
              error={query.error}
              onRetry={retry}
              isRetrying={query.isFetching}
            />
          )}

          {hasData && tree.size === 0 && <EmptyState />}

          {hasData && tree.size > 0 && (
            <OrgTreeView tree={tree} expanded={expansion.expanded} onToggle={expansion.toggle} />
          )}
        </Scroll>
      </Card>

      {isDebugPanelEnabled && <DebugPanel />}
    </Page>
  );
}
