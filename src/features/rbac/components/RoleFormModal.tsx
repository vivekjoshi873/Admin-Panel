import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { roleSchema, type RoleFormValues } from '../schemas';
import { useAuthStore } from '@/shared/stores/auth-store';

export function RoleFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Partial<RoleFormValues> | null;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => void | Promise<void>;
  isPending?: boolean;
}) {
  const canWrite = useAuthStore((s) => s.hasPermission(mode === 'create' ? 'roles.create' : 'roles.update'));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: initial?.name ?? '',
      slug: initial?.slug ?? '',
      description: initial?.description ?? '',
    });
  }, [open, initial, reset]);

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Create role' : 'Edit role'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit((values) => onSubmit(values))()}
            loading={isPending}
            disabled={!canWrite}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </>
      }
    >
      {!canWrite ? (
        <div className="mb-4 rounded-lg border border-[var(--danger)]/30 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
          You don?t have permission to {mode === 'create' ? 'create' : 'update'} roles.
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit((values) => onSubmit(values))}>
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <Input label="Slug" error={errors.slug?.message} hint="Used in permission checks" {...register('slug')} />
        <Input
          label="Description"
          error={errors.description?.message}
          {...register('description')}
          placeholder="Optional"
        />
      </form>
    </Modal>
  );
}
