import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/state-views';
import type { OrgStructure } from './use-org-structure';

export function OrgPlaceholder({ structure }: { structure: OrgStructure }) {
  switch (structure.status) {
    case 'pending':
      return <LoadingState />;
    case 'error':
      return (
        <ErrorState
          error={structure.error}
          onRetry={structure.retry}
          isRetrying={structure.isRetrying}
        />
      );
    default:
      return <EmptyState />;
  }
}
