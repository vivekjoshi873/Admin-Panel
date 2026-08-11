import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { loginSchema, type LoginFormValues } from '../schemas';
import { useLogin } from '../hooks';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useAuthStore } from '@/shared/stores/auth-store';
import { getErrorMessage } from '@/shared/lib/cn';

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

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  return (
    <AuthLayout title="Sign in" subtitle="Use your admin credentials to continue.">
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
          <p className="rounded-lg border border-[var(--danger)]/30 bg-red-50 px-3 py-2 text-sm text-[var(--danger)] dark:bg-red-950/30">
            {getErrorMessage(login.error, 'Invalid email or password')}
          </p>
        ) : null}

        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-[var(--accent)] hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={login.isPending}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
