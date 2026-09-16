import styled from 'styled-components';
import { Card } from '@/shared/ui/card';

export const SPLIT_VIEW_MIN_WIDTH = 1280;

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
  height: 100%;
  max-width: 1720px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space(6)};
`;

export const Header = styled.header`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(3)};
  flex-wrap: wrap;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.size.xl};
  font-weight: 600;
  letter-spacing: -0.01em;
`;

export const Subtitle = styled.span`
  color: ${({ theme }) => theme.color.textSecondary};
`;

export const Refreshing = styled.span`
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.textMuted};
`;

export const ViewSwitchSlot = styled.div`
  margin-left: auto;

  @media (min-width: ${SPLIT_VIEW_MIN_WIDTH}px) {
    display: none;
  }
`;

export const Panes = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
  flex: 1 1 auto;
  min-height: 0;
  grid-template-columns: 1fr;

  @media (min-width: ${SPLIT_VIEW_MIN_WIDTH}px) {
    grid-template-columns: minmax(360px, 2fr) 3fr;
  }
`;

export const Pane = styled(Card)<{ $hiddenBelowSplit: boolean }>`
  @media (max-width: ${SPLIT_VIEW_MIN_WIDTH - 1}px) {
    display: ${({ $hiddenBelowSplit }) => ($hiddenBelowSplit ? 'none' : 'flex')};
  }
`;
