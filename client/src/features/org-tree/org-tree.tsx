import styled from 'styled-components';
import type { OrgAggregates } from '@/entities/org/aggregate';
// Aliased because this file also exports a component called OrgTree.
import type { OrgTree as OrgTreeModel } from '@/entities/org/types';
import type { Highlight } from '@/features/org-structure';
import { OrgTreeNode } from './org-tree-node';

const Root = styled.ul`
  margin: 0;
  padding: ${({ theme }) => theme.space(2)};
  list-style: none;
`;

interface OrgTreeProps {
  tree: OrgTreeModel;
  aggregates: OrgAggregates;
  expanded: ReadonlySet<string>;
  selectedId: string | null;
  highlight: Highlight | null;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
}

export function OrgTree({
  tree,
  aggregates,
  expanded,
  selectedId,
  highlight,
  onToggle,
  onSelect,
}: OrgTreeProps) {
  return (
    <Root role="tree" aria-label="Орг-структура компании">
      {tree.roots.map((root) => (
        <OrgTreeNode
          key={root.id}
          node={root}
          aggregates={aggregates}
          expanded={expanded}
          selectedId={selectedId}
          highlight={highlight}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </Root>
  );
}
