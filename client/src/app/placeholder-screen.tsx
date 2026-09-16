import styled from 'styled-components';
import { DebugPanel, isDebugPanelEnabled } from '@/features/debug-panel/debug-panel';
import { OrgPlaceholder, type OrgStructure } from '@/features/org-structure';
import { Card, CardScroll } from '@/shared/ui/card';
import { Header, Page, Title } from './layout';

/** Fills the viewport like the real panes do, instead of a strip under the title. */
const FullHeightCard = styled(Card)`
  flex: 1 1 auto;
`;

export function PlaceholderScreen({ structure }: { structure: OrgStructure }) {
  return (
    <Page>
      <Header>
        <Title>Орг-структура компании</Title>
      </Header>
      <FullHeightCard>
        <CardScroll>
          <OrgPlaceholder structure={structure} />
        </CardScroll>
      </FullHeightCard>
      {isDebugPanelEnabled && <DebugPanel />}
    </Page>
  );
}
