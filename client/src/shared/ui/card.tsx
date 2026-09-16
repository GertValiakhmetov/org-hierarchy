import styled from 'styled-components';

export const Card = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.color.surface};
  box-shadow: ${({ theme }) => theme.shadow.card};
  overflow: hidden;
`;

export const CardScroll = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
`;

export const CardToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
`;

export const CardToolbarButton = styled.button`
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(2.5)};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  font-size: ${({ theme }) => theme.size.sm};
  color: ${({ theme }) => theme.color.textSecondary};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.color.border};
    color: ${({ theme }) => theme.color.textPrimary};
  }
`;
