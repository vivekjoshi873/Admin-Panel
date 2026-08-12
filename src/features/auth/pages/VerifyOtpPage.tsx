import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { otpVerifySchema, type OtpVerifyFormValues } from '../schemas';
import { useResendEmailOtp, useSendEmailOtp, useVerifyEmailOtp } from '../hooks';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { getErrorMessage } from '@/shared/lib/cn';
import { readPendingEmail } from '../pending-email';

export function VerifyOtpPage() {
  const [params] = useSearchParams();
  const emailFromUrl = params.get('email') ?? readPendingEmail() ?? '';

  const verify = useVerifyEmailOtp();
  const resendEmail = useResendEmailOtp();
  const sendEmail = useSendEmailOtp();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<OtpVerifyFormValues>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { email: emailFromUrl, otp: '' },
  });

  return (
    <AuthLayout
      title="Verify email"
      subtitle="Enter the 6-digit code we sent after registration."
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => verify.mutate(values))}
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
          label="6-digit OTP"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          error={errors.otp?.message}
          {...register('otp')}
          placeholder="123456"
        />

        {verify.isError ? (
          <p className="rounded-lg border border-[var(--danger)]/30 bg-red-50 px-3 py-2 text-sm text-[var(--danger)] dark:bg-red-950/30">
            {getErrorMessage(verify.error, 'Invalid or expired code')}
          </p>
        ) : null}

        <Button type="submit" className="w-full" loading={verify.isPending}>
          Verify email
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          loading={resendEmail.isPending || sendEmail.isPending}
          onClick={() => {
            const email = getValues('email');
            if (!email) return;
            resendEmail.mutate(email, { onError: () => sendEmail.mutate(email) });
          }}
        >
          Resend code
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
