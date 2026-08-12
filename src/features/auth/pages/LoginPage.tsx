import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { loginSchema, type LoginFormValues } from '../schemas';
import { useLogin } from '../hooks';
import { Input } from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { ShimmerButton } from '@/shared/components/magicui/ShimmerButton';
import { useAuthStore } from '@/shared/stores/auth-store';
import { getErrorMessage } from '@/shared/lib/cn';
import { Loader2 } from 'lucide-react';

export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (status === 'idle' || status === 'hydrating') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  return (
    <AuthLayout title="Sign in" subtitle="Use your email and password to continue to the admin workspace.">
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => login.mutate(values))}
        noValidate
      >
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {login.isError ? (
          <p className="rounded-xl border border-[var(--danger)]/30 bg-red-50 px-3 py-2 text-sm text-[var(--danger)] dark:bg-red-950/30">
            {getErrorMessage(login.error, 'Invalid email or password')}
          </p>
        ) : null}

        <div className="flex items-center justify-end text-sm">
          <Link to="/forgot-password" className="font-medium text-[var(--accent)] hover:underline">
            Forgot password?
          </Link>
        </div>

        <ShimmerButton type="submit" disabled={login.isPending}>
          {login.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Sign in
        </ShimmerButton>

        <p className="text-center text-sm text-[var(--muted)]">
          New here?{' '}
          <Link to="/register" className="font-medium text-[var(--accent)] hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
