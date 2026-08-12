import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { setPasswordSchema, type SetPasswordFormValues } from '../schemas';
import { useSetPassword } from '../hooks';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useAuthStore } from '@/shared/stores/auth-store';

/**
 * Authenticated set/change password.
 * API: POST /auth/set-password with `{ password }` + Bearer token.
 */
export function SetPasswordPage() {
  const status = useAuthStore((s) => s.status);
  const mutation = useSetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  if (status === 'idle' || status === 'hydrating') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }

  return (
    <AuthLayout
      title="Set your password"
      subtitle="Save a local password so you can sign in with email + password next time."
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => mutation.mutate({ password: values.password }))}
        noValidate
      >
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Save password
        </Button>
        <p className="text-center text-sm text-[var(--muted)]">
          <Link to="/" className="text-[var(--accent)] hover:underline">
            Skip for now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
