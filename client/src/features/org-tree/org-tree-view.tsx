import styled from 'styled-components';
import type { OrgTree } from '@/entities/org/types';
import { OrgTreeNode } from './org-tree-node';

const Root = styled.ul`
  margin: 0;
  padding: ${({ theme }) => theme.space(2)};
  list-style: none;
  overflow-y: auto;
`;

interface OrgTreeViewProps {
  tree: OrgTree;
  expanded: ReadonlySet<string>;
  onToggle: (nodeId: string) => void;
}

export function OrgTreeView({ tree, expanded, onToggle }: OrgTreeViewProps) {
  return (
    <Root role="tree" aria-label="Орг-структура компании">
      {tree.roots.map((root) => (
        <OrgTreeNode key={root.id} node={root} expanded={expanded} onToggle={onToggle} />
      ))}
    </Root>
  );
}
