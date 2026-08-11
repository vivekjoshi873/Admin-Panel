import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { setPasswordSchema, type SetPasswordFormValues } from '../schemas';
import { useSetPassword } from '../hooks';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';

export function SetPasswordPage() {
  const [params] = useSearchParams();
  const tokenFromUrl = params.get('token') ?? '';
  const mutation = useSetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
      password: '',
      confirmPassword: '',
    },
  });

  return (
    <AuthLayout
      title="Set your password"
      subtitle="Finish inviting yourself — pick a password to activate the account."
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          mutation.mutate({ token: values.token, password: values.password }),
        )}
        noValidate
      >
        {!tokenFromUrl ? (
          <Input label="Invite token" error={errors.token?.message} {...register('token')} />
        ) : (
          <input type="hidden" {...register('token')} />
        )}
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
          Activate account
        </Button>
        <p className="text-center text-sm text-[var(--muted)]">
          <Link to="/login" className="text-[var(--accent)] hover:underline">
            Already have an account?
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
