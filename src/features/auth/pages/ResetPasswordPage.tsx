import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { AuthLayout } from '../components/AuthLayout';
import {
  resetOtpSchema,
  resetPasswordSchema,
  type ResetOtpFormValues,
  type ResetPasswordFormValues,
} from '../schemas';
import { useResetPassword } from '../hooks';
import { authApi } from '../api';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { toast } from '@/shared/stores/toast-store';
import { getErrorMessage } from '@/shared/lib/cn';
import {
  readPendingEmail,
  readPendingResetOtp,
  readPendingResetToken,
  stashPendingEmail,
  stashPendingResetOtp,
  stashPendingResetToken,
} from '../pending-email';

type Step = 'otp' | 'password';

/** Pull `token` from a pasted reset URL, or accept a raw token string. */
function extractResetToken(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    const fromQuery = url.searchParams.get('token');
    if (fromQuery) return fromQuery;
  } catch {
    // not a full URL — treat as raw token
  }
  const match = value.match(/[?&]token=([^&\s#]+)/i);
  if (match?.[1]) return decodeURIComponent(match[1]);
  return value;
}

const linkSchema = z.object({
  resetLink: z.string().trim().min(1, 'Paste the reset link from your email'),
});

type LinkFormValues = z.infer<typeof linkSchema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const emailFromUrl = params.get('email') ?? readPendingEmail() ?? '';
  const tokenFromUrl = params.get('token') ?? '';

  const initialToken = tokenFromUrl || readPendingResetToken() || '';
  const [token, setToken] = useState(initialToken);
  const [step, setStep] = useState<Step>(() => (initialToken ? 'otp' : 'otp'));
  const [email, setEmail] = useState(emailFromUrl);
  const [needsLink, setNeedsLink] = useState(!initialToken);

  const resetMutation = useResetPassword();

  const resendMutation = useMutation({
    mutationFn: (value: string) => authApi.forgotPassword(value),
    onSuccess: (data, value) => {
      stashPendingEmail(value, 'reset-password');
      if (data.token) {
        stashPendingResetToken(data.token);
        setToken(data.token);
        setNeedsLink(false);
      }
      toast({
        title: 'Email sent',
        description: 'Open the reset link in that email, then enter the OTP here',
        tone: 'success',
      });
    },
    onError: (error) =>
      toast({
        title: 'Could not resend',
        description: getErrorMessage(error),
        tone: 'error',
      }),
  });

  useEffect(() => {
    if (tokenFromUrl) {
      stashPendingResetToken(tokenFromUrl);
      setToken(tokenFromUrl);
      setNeedsLink(false);
    }
    if (emailFromUrl) {
      stashPendingEmail(emailFromUrl, 'reset-password');
      setEmail(emailFromUrl);
    }
  }, [tokenFromUrl, emailFromUrl]);

  const linkForm = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: { resetLink: '' },
  });

  const otpForm = useForm<ResetOtpFormValues>({
    resolver: zodResolver(resetOtpSchema),
    defaultValues: { email: emailFromUrl, otp: '' },
  });

  useEffect(() => {
    if (emailFromUrl) otpForm.setValue('email', emailFromUrl);
  }, [emailFromUrl, otpForm]);

  const passwordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const subtitle = useMemo(() => {
    if (needsLink) return 'Paste the reset link from your email first (we only need the link, not a “token”).';
    if (step === 'otp') return 'Enter the 6-digit code from the same email.';
    return `Choose a new password${email ? ` for ${email}` : ''}.`;
  }, [needsLink, step, email]);

  if (needsLink) {
    return (
      <AuthLayout title="Open your reset email" subtitle={subtitle}>
        <form
          className="space-y-4"
          onSubmit={linkForm.handleSubmit((values) => {
            const parsed = extractResetToken(values.resetLink);
            if (!parsed) {
              toast({
                title: 'Could not read link',
                description: 'Paste the full reset link from your email',
                tone: 'error',
              });
              return;
            }
            stashPendingResetToken(parsed);
            setToken(parsed);
            setNeedsLink(false);
            setStep('otp');
          })}
          noValidate
        >
          <Input
            label="Paste reset link from email"
            error={linkForm.formState.errors.resetLink?.message}
            {...linkForm.register('resetLink')}
            placeholder="https://…/reset-password?token=…"
            hint="Copy the whole link from the email — you don’t need to understand it"
          />
          {email ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              loading={resendMutation.isPending}
              onClick={() => resendMutation.mutate(email)}
            >
              Resend email
            </Button>
          ) : null}
          <Button type="submit" className="w-full">
            Continue
          </Button>
          <p className="text-center text-sm text-[var(--muted)]">
            <Link to="/forgot-password" className="text-[var(--accent)] hover:underline">
              Request a new link
            </Link>
            {' · '}
            <Link to="/login" className="text-[var(--accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </AuthLayout>
    );
  }

  if (step === 'otp') {
    return (
      <AuthLayout title="Enter verification code" subtitle={subtitle}>
        <form
          className="space-y-4"
          onSubmit={otpForm.handleSubmit((values) => {
            setEmail(values.email);
            stashPendingEmail(values.email, 'reset-password');
            stashPendingResetOtp(values.otp);
            setStep('password');
          })}
          noValidate
        >
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={otpForm.formState.errors.email?.message}
            {...otpForm.register('email')}
          />
          <Input
            label="6-digit OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            error={otpForm.formState.errors.otp?.message}
            {...otpForm.register('otp')}
            placeholder="123456"
          />
          <Button type="submit" className="w-full">
            Continue
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            loading={resendMutation.isPending}
            onClick={() => {
              const value = otpForm.getValues('email') || email;
              if (value) resendMutation.mutate(value);
            }}
          >
            Resend code
          </Button>
          <p className="text-center text-sm text-[var(--muted)]">
            <button
              type="button"
              className="text-[var(--accent)] hover:underline"
              onClick={() => setNeedsLink(true)}
            >
              Use a different reset link
            </button>
            {' · '}
            <Link to="/login" className="text-[var(--accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle={subtitle}>
      <form
        className="space-y-4"
        onSubmit={passwordForm.handleSubmit((values) => {
          const otp = readPendingResetOtp() ?? '';
          const resolvedToken = (token || readPendingResetToken() || tokenFromUrl || '').trim();
          if (!resolvedToken) {
            toast({
              title: 'Reset link missing',
              description: 'Paste the reset link from your email first',
              tone: 'error',
            });
            setNeedsLink(true);
            return;
          }
          resetMutation.mutate({
            token: resolvedToken,
            otp,
            password: values.password,
            confirmPassword: values.confirmPassword,
          });
        })}
        noValidate
      >
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          error={passwordForm.formState.errors.password?.message}
          {...passwordForm.register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={passwordForm.formState.errors.confirmPassword?.message}
          {...passwordForm.register('confirmPassword')}
        />
        <Button type="submit" className="w-full" loading={resetMutation.isPending}>
          Update password
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('otp')}>
          Back to OTP
        </Button>
        <p className="text-center text-sm text-[var(--muted)]">
          <Link to="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
