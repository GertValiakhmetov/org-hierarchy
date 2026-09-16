import { memo } from 'react';
import styled from 'styled-components';
import type { OrgAggregates } from '@/entities/org/aggregate';
import type { OrgNode } from '@/entities/org/types';
import { PERSON_FORMS } from '@/entities/org/labels';
import { LEVEL_LABEL } from '@/entities/org/types';
import { formatCount, formatQuantity } from '@/shared/lib/format';
import { PerformanceDot } from '@/shared/ui/performance-dot';

const Row = styled.div<{ $depth: number; $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  width: 100%;
  padding: ${({ theme }) => theme.space(1.5)} ${({ theme }) => theme.space(3)};
  padding-left: ${({ theme, $depth }) => theme.space(3 + $depth * 5)};
  border-radius: ${({ theme }) => theme.radius.sm};
  cursor: pointer;
  background: ${({ theme, $selected }) => ($selected ? theme.color.accentSoft : 'transparent')};

  &:hover {
    background: ${({ theme, $selected }) =>
      $selected ? theme.color.accentSoft : theme.color.surfaceMuted};
  }
`;

const Toggle = styled.button<{ $expanded: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme }) => theme.color.textMuted};
  cursor: pointer;

  svg {
    transition: transform 140ms ease;
    transform: rotate(${({ $expanded }) => ($expanded ? 90 : 0)}deg);
  }

  &:hover {
    background: ${({ theme }) => theme.color.border};
    color: ${({ theme }) => theme.color.textPrimary};
  }
`;

const TogglePlaceholder = styled.span`
  flex: none;
  width: 18px;
`;

const Name = styled.span<{ $emphasized: boolean }>`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${({ $emphasized }) => ($emphasized ? 600 : 400)};
`;

const Meta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(4)};
  flex: none;
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.textSecondary};
`;

const Headcount = styled.span`
  font-variant-numeric: tabular-nums;
`;

const Group = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Item = styled.li`
  margin: 0;
`;

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M3 1.5 6.5 5 3 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface OrgTreeNodeProps {
  node: OrgNode;
  aggregates: OrgAggregates;
  expanded: ReadonlySet<string>;
  selectedId: string | null;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
}

export const OrgTreeNode = memo(function OrgTreeNode({
  node,
  aggregates,
  expanded,
  selectedId,
  onToggle,
  onSelect,
}: OrgTreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = hasChildren && expanded.has(node.id);
  const isSelected = node.id === selectedId;

  const total = aggregates.get(node.id);
  const headcount = total?.headcount ?? node.headcount;
  const performance = total?.performance ?? node.performance;
  const headcountTitle = hasChildren
    ? `Собственных ${formatCount(node.headcount)}, в подразделениях ${formatCount(headcount - node.headcount)}`
    : 'Численность команды';

  return (
    <Item role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined} aria-selected={isSelected}>
      <Row $depth={node.depth} $selected={isSelected} onClick={() => onSelect(node.id)}>
        {hasChildren ? (
          <Toggle
            type="button"
            $expanded={isExpanded}
            onClick={(event) => {
              // The row itself selects; the chevron must not do both.
              event.stopPropagation();
              onToggle(node.id);
            }}
            aria-label={`${isExpanded ? 'Свернуть' : 'Развернуть'} «${node.name}»`}
          >
            <Chevron />
          </Toggle>
        ) : (
          <TogglePlaceholder />
        )}

        <Name $emphasized={node.depth === 0} title={`${LEVEL_LABEL[node.level]}: ${node.name}`}>
          {node.name}
        </Name>

        <Meta>
          <Headcount title={headcountTitle}>{formatQuantity(headcount, PERSON_FORMS)}</Headcount>
          <PerformanceDot value={performance} />
        </Meta>
      </Row>

      {hasChildren && isExpanded && (
        <Group role="group">
          {node.children.map((child) => (
            <OrgTreeNode
              key={child.id}
              node={child}
              aggregates={aggregates}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </Group>
      )}
    </Item>
  );
});
