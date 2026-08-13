import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { permissionSchema, type PermissionFormValues } from '../schemas';

export function PermissionFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Partial<PermissionFormValues> | null;
  onClose: () => void;
  onSubmit: (values: PermissionFormValues) => void | Promise<void>;
  isPending?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: '',
      slug: '',
      module: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: initial?.name ?? '',
      slug: initial?.slug ?? '',
      module: initial?.module ?? '',
      description: initial?.description ?? '',
    });
  }, [open, initial, reset]);

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Create permission' : 'Edit permission'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" className='cursor-pointer' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit((values) => onSubmit(values))()}
            loading={isPending}
            className='cursor-pointer'
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
          label="Module"
          error={errors.module?.message}
          hint="Groups permissions for the matrix"
          {...register('module')}
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
