import { DebugPanel, isDebugPanelEnabled } from '@/features/debug-panel/debug-panel';
import { OrgPlaceholder, type OrgStructure } from '@/features/org-structure';
import { Card, CardScroll } from '@/shared/ui/card';
import { Header, Page, Title } from './layout';

export function PlaceholderScreen({ structure }: { structure: OrgStructure }) {
  return (
    <Page>
      <Header>
        <Title>Орг-структура компании</Title>
      </Header>
      <Card>
        <CardScroll>
          <OrgPlaceholder structure={structure} />
        </CardScroll>
      </Card>
      {isDebugPanelEnabled && <DebugPanel />}
    </Page>
  );
}
