import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { roleSchema, type RoleFormValues } from '../schemas';

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
  initial?: Partial<RoleFormValues> & { level?: number | string } | null;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => void | Promise<void>;
  isPending?: boolean;
}) {
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
      level: 1,
    },
  });

  useEffect(() => {
    if (!open) return;
    const levelRaw = initial?.level;
    const level =
      levelRaw != null && levelRaw !== '' && Number.isFinite(Number(levelRaw))
        ? Number(levelRaw)
        : 1;
    reset({
      name: initial?.name ?? '',
      slug: initial?.slug ?? '',
      description: initial?.description ?? '',
      level: level >= 1 ? level : 1,
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
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit((values) => onSubmit(values))}>
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <Input label="Slug" error={errors.slug?.message} hint="Used in permission checks" {...register('slug')} />
        <Input
          label="Level"
          type="number"
          min={1}
          step={1}
          error={errors.level?.message}
          hint="Hierarchy rank (integer ≥ 1). Lower roles usually use 1."
          {...register('level')}
        />
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
