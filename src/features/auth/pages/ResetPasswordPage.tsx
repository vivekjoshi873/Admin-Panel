import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas';
import { useResetPassword } from '../hooks';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const tokenFromUrl = params.get('token') ?? '';
  const mutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
      password: '',
      confirmPassword: '',
    },
  });

  return (
    <AuthLayout title="Choose a new password" subtitle="Paste the token from your email if it isn’t already filled in.">
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          mutation.mutate({ token: values.token, password: values.password }),
        )}
        noValidate
      >
        {!tokenFromUrl ? (
          <Input label="Reset token" error={errors.token?.message} {...register('token')} />
        ) : (
          <input type="hidden" {...register('token')} />
        )}
        <Input
          label="New password"
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
          Update password
        </Button>
        <p className="text-center text-sm text-[var(--muted)]">
          <Link to="/login" className="text-[var(--accent)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
