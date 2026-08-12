import { EmptyState } from '@/shared/components/ui/EmptyState';
import { getErrorMessage } from '@/shared/lib/cn';

export function ForbiddenState({
  error,
  fallback = 'analytics.view',
}: {
  error?: unknown;
  fallback?: string;
}) {
  const message = getErrorMessage(error, `Forbidden — requires permission: ${fallback}`);
  return (
    <EmptyState
      title="Missing permission"
      description={`${message}. Assign a role that includes this permission from Users → Roles, then sign in again.`}
    />
  );
}
