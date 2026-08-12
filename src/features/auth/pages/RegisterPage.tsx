import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { registerSchema, type RegisterFormValues } from '../schemas';
import { useRegister } from '../hooks';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { getErrorMessage } from '@/shared/lib/cn';

export function RegisterPage() {
  const mutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      countryId: '91',
    },
  });

  return (
    <AuthLayout
      title="Create account"
      subtitle="We’ll email a 6-digit code. Verify it to activate the account and sign in."
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <Input
          label="Full name"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register('phone')}
          placeholder="+919999999999"
        />
        <Input
          label="Country ID"
          error={errors.countryId?.message}
          {...register('countryId')}
          hint="Optional — defaults to 91"
        />
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

        {mutation.isError ? (
          <p className="rounded-lg border border-[var(--danger)]/30 bg-red-50 px-3 py-2 text-sm text-[var(--danger)] dark:bg-red-950/30">
            {getErrorMessage(mutation.error)}
          </p>
        ) : null}

        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Send verification code
        </Button>

        <p className="text-center text-sm text-[var(--muted)]">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
