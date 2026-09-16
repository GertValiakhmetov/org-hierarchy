import { useState } from 'react';
import { EMPLOYEE_FORMS, ORG_UNIT_FORMS } from '@/entities/org/labels';
import { DebugPanel, isDebugPanelEnabled } from '@/features/debug-panel/debug-panel';
import { useOrgStructure } from '@/features/org-structure';
import { OrgTable, TableToolbar, useTableRows } from '@/features/org-table';
import { OrgTree, useTreeNavigation } from '@/features/org-tree';
import { formatQuantity } from '@/shared/lib/format';
import { CardScroll, CardToolbar, CardToolbarButton } from '@/shared/ui/card';
import { ConnectionDot } from '@/shared/ui/connection-dot';
import { SegmentedControl, type SegmentedOption } from '@/shared/ui/segmented-control';
import { StaleDataNotice } from '@/shared/ui/state-views';
import {
  Header,
  Page,
  Pane,
  Panes,
  Refreshing,
  Subtitle,
  Title,
  ViewSwitchSlot,
} from './layout';
import { PlaceholderScreen } from './placeholder-screen';

type View = 'tree' | 'table';

const VIEW_OPTIONS: readonly SegmentedOption<View>[] = [
  { value: 'tree', label: 'Дерево' },
  { value: 'table', label: 'Таблица' },
];

export function App() {
  const org = useOrgStructure();
  const navigation = useTreeNavigation(org.tree);
  const table = useTableRows(org.tree, org.aggregates);
  const [view, setView] = useState<View>('tree');

  if (org.status !== 'ready') {
    return <PlaceholderScreen structure={org} />;
  }

  const unitCount = formatQuantity(org.tree.size, ORG_UNIT_FORMS);
  const staffCount = formatQuantity(org.totalHeadcount, EMPLOYEE_FORMS);

  return (
    <Page>
      <Header>
        <Title>Орг-структура компании</Title>
        <Subtitle>
          {unitCount} · {staffCount}
        </Subtitle>
        {org.isBackgroundRefetch && <Refreshing>обновление…</Refreshing>}
        <ConnectionDot status={org.live.status} />

        <ViewSwitchSlot>
          <SegmentedControl
            options={VIEW_OPTIONS}
            value={view}
            onChange={setView}
            label="Представление"
          />
        </ViewSwitchSlot>
      </Header>

      {org.isStale && (
        <StaleDataNotice error={org.error} onRetry={org.retry} isRetrying={org.isRetrying} />
      )}

      <Panes>
        <Pane $hiddenBelowSplit={view !== 'tree'}>
          <CardToolbar>
            <CardToolbarButton type="button" onClick={navigation.expandAll}>
              Развернуть всё
            </CardToolbarButton>
            <CardToolbarButton type="button" onClick={navigation.collapseAll}>
              Свернуть всё
            </CardToolbarButton>
          </CardToolbar>
          <CardScroll>
            <OrgTree
              tree={org.tree}
              aggregates={org.aggregates}
              expanded={navigation.expanded}
              selectedId={navigation.selectedId}
              highlight={org.highlight}
              onToggle={navigation.toggle}
              onSelect={navigation.select}
            />
          </CardScroll>
        </Pane>

        <Pane $hiddenBelowSplit={view !== 'table'}>
          <TableToolbar
            filter={table.filter}
            onFilterChange={table.setFilter}
            shownCount={table.rows.length}
            totalCount={table.totalCount}
          />
          <OrgTable
            rows={table.rows}
            sort={table.sort}
            selectedId={navigation.selectedId}
            highlight={org.highlight}
            onToggleSort={table.toggleSort}
            onSelect={navigation.select}
          />
        </Pane>
      </Panes>

      {isDebugPanelEnabled && <DebugPanel />}
    </Page>
  );
}
