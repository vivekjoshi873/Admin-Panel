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
      description={`${message}. This is an API RBAC check — a customer account from /auth/register cannot access admin modules. Use a super_admin test user if the assignment provides one.`}
    />
  );
}
