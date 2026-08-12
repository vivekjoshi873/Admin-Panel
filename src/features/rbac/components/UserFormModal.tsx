import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import {
  userCreateSchema,
  userUpdateSchema,
  type UserCreateValues,
  type UserUpdateValues,
} from '../schemas';
import { useAuthStore } from '@/shared/stores/auth-store';

type RoleOption = { id: string; name: string };

export function UserFormModal({
  open,
  mode,
  initial,
  roles,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: {
    fullName?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
    roleIds?: string[];
  } | null;
  roles: RoleOption[];
  onClose: () => void;
  onSubmit: (values: UserCreateValues | UserUpdateValues) => void | Promise<void>;
  isPending?: boolean;
}) {
  const canWrite = useAuthStore((s) =>
    s.hasPermission(mode === 'create' ? 'user.create' : 'user.update'),
  );

  const createForm = useForm<UserCreateValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      roleIds: [],
    },
  });

  const editForm = useForm<UserUpdateValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'create') {
      createForm.reset({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        roleIds: [],
      });
    } else {
      editForm.reset({
        fullName: initial?.fullName ?? '',
        email: initial?.email ?? '',
        phone: initial?.phone ?? '',
        isActive: initial?.isActive ?? true,
      });
    }
  }, [open, mode, initial, createForm, editForm]);

  const selectedRoleIds = createForm.watch('roleIds') ?? [];

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Create user' : 'Edit user'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={isPending}
            disabled={!canWrite}
            onClick={() => {
              if (mode === 'create') {
                void createForm.handleSubmit((values) => onSubmit(values))();
              } else {
                void editForm.handleSubmit((values) => onSubmit(values))();
              }
            }}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </>
      }
    >
      {!canWrite ? (
        <div className="mb-4 rounded-lg border border-[var(--danger)]/30 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
          You don&apos;t have permission to {mode === 'create' ? 'create' : 'update'} users.
        </div>
      ) : null}

      {mode === 'create' ? (
        <form className="space-y-4" onSubmit={createForm.handleSubmit((values) => onSubmit(values))}>
          <Input
            label="Full name"
            error={createForm.formState.errors.fullName?.message}
            {...createForm.register('fullName')}
          />
          <Input
            label="Email"
            type="email"
            error={createForm.formState.errors.email?.message}
            {...createForm.register('email')}
          />
          <Input
            label="Password"
            type="password"
            error={createForm.formState.errors.password?.message}
            {...createForm.register('password')}
          />
          <Input
            label="Phone"
            error={createForm.formState.errors.phone?.message}
            {...createForm.register('phone')}
          />
          {roles.length ? (
            <div>
              <p className="mb-2 text-sm text-[var(--muted)]">Roles</p>
              <div className="max-h-40 space-y-2 overflow-auto">
                {roles.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2"
                  >
                    <span className="text-sm">{r.name}</span>
                    <Checkbox
                      checked={selectedRoleIds.includes(r.id)}
                      onChange={(next) => {
                        const current = createForm.getValues('roleIds') ?? [];
                        createForm.setValue(
                          'roleIds',
                          next ? [...current, r.id] : current.filter((id) => id !== r.id),
                        );
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </form>
      ) : (
        <form className="space-y-4" onSubmit={editForm.handleSubmit((values) => onSubmit(values))}>
          <Input
            label="Full name"
            error={editForm.formState.errors.fullName?.message}
            {...editForm.register('fullName')}
          />
          <Input
            label="Email"
            type="email"
            error={editForm.formState.errors.email?.message}
            {...editForm.register('email')}
          />
          <Input
            label="Phone"
            error={editForm.formState.errors.phone?.message}
            {...editForm.register('phone')}
          />
        </form>
      )}
    </Modal>
  );
}
