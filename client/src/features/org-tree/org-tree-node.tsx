import type { PatchField } from '@shared/types';
import { memo, useEffect, useState } from 'react';
import styled from 'styled-components';
import type { OrgAggregates } from '@/entities/org/aggregate';
import { PERSON_FORMS } from '@/entities/org/labels';
import type { OrgNode } from '@/entities/org/types';
import { LEVEL_LABEL } from '@/entities/org/types';
import type { Highlight } from '@/features/org-structure';
import { formatCount, formatQuantity } from '@/shared/lib/format';
import { useFlash } from '@/shared/lib/use-flash';
import { FLASH_DURATION_MS, flash } from '@/shared/ui/flash';
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

const Headcount = styled.span<{ $flash?: boolean }>`
  font-variant-numeric: tabular-nums;
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 0 ${({ theme }) => theme.space(1)};
  ${flash}
`;

const PerformanceSlot = styled.span<{ $flash?: boolean }>`
  display: inline-flex;
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 0 ${({ theme }) => theme.space(1)};
  ${flash}
`;

/**
 * Animating to a content height that is not known in advance: a grid row of
 * `0fr → 1fr` is the one way to do it in CSS alone, without measuring in JS and
 * without hard-coding a max-height that clips long branches.
 */
const Collapsible = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
  transition: grid-template-rows 200ms ease;
`;

const Group = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  min-height: 0;
  overflow: hidden;
`;

const Item = styled.li`
  margin: 0;
`;

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M3 1.5 6.5 5 3 8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface OrgTreeNodeProps {
  node: OrgNode;
  aggregates: OrgAggregates;
  expanded: ReadonlySet<string>;
  selectedId: string | null;
  highlight: Highlight | null;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
}

export const OrgTreeNode = memo(function OrgTreeNode({
  node,
  aggregates,
  expanded,
  selectedId,
  highlight,
  onToggle,
  onSelect,
}: OrgTreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = hasChildren && expanded.has(node.id);
  const isSelected = node.id === selectedId;

  const total = aggregates.get(node.id);
  const headcount = total?.headcount ?? node.headcount;
  const performance = total?.performance ?? node.performance;
  // Kept mounted after the first open so collapsing animates too; branches the
  // user never opened stay out of the DOM.
  const [isMounted, setIsMounted] = useState(isExpanded);
  useEffect(() => {
    if (isExpanded) setIsMounted(true);
  }, [isExpanded]);

  const touched = highlight?.nodeIds.has(node.id) === true;
  const flashing = useFlash(touched ? highlight?.at : undefined, FLASH_DURATION_MS);
  const flashes = (field: PatchField): boolean => flashing && highlight?.fields.has(field) === true;

  const headcountTitle = hasChildren
    ? `Собственных ${formatCount(node.headcount)}, в подразделениях ${formatCount(headcount - node.headcount)}`
    : 'Численность команды';

  return (
    <Item
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
    >
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
          <Headcount title={headcountTitle} $flash={flashes('headcount') || flashes('budget')}>
            {formatQuantity(headcount, PERSON_FORMS)}
          </Headcount>
          <PerformanceSlot $flash={flashes('performance')}>
            <PerformanceDot value={performance} />
          </PerformanceSlot>
        </Meta>
      </Row>

      {hasChildren && isMounted && (
        <Collapsible $open={isExpanded} aria-hidden={!isExpanded}>
          <Group role="group">
            {node.children.map((child) => (
              <OrgTreeNode
                key={child.id}
                node={child}
                aggregates={aggregates}
                expanded={expanded}
                selectedId={selectedId}
                highlight={highlight}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </Group>
        </Collapsible>
      )}
    </Item>
  );
});
