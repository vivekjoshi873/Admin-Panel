import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas';
import { useForgotPassword } from '../hooks';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';

export function ForgotPasswordPage() {
  const mutation = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`If an account exists for ${sentTo}, we sent a reset link and a 6-digit code.`}
      >
        <div className="space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
            <li>Open the email and copy the reset link</li>
            <li>Continue below and paste that link</li>
            <li>Enter the 6-digit OTP, then choose a new password</li>
          </ol>
          <Link
            to={`/reset-password?email=${encodeURIComponent(sentTo)}`}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white hover:opacity-90"
          >
            I have the email — continue
          </Link>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            loading={mutation.isPending}
            onClick={() => mutation.mutate(sentTo)}
          >
            Resend email
          </Button>
          <p className="text-center text-sm text-[var(--muted)]">
            <button
              type="button"
              className="text-[var(--accent)] hover:underline"
              onClick={() => setSentTo(null)}
            >
              Use a different email
            </button>
            {' · '}
            <Link to="/login" className="text-[var(--accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="We’ll email a reset link and a 6-digit code if the account exists."
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          mutation.mutate(values.email, {
            onSuccess: () => setSentTo(values.email),
          }),
        )}
        noValidate
      >
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Send reset email
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
