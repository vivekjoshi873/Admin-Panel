import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { useAuthStore } from '@/shared/stores/auth-store';

export function UserRolesModal({
  open,
  initialRoleIds,
  roles,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  roles: { id: string; name: string; slug?: string }[];
  initialRoleIds: string[];
  onClose: () => void;
  onSubmit: (roleIds: string[]) => void | Promise<void>;
  isPending?: boolean;
}) {
  const canWrite = useAuthStore((s) => s.hasPermission('user.update'));
  const [roleIds, setRoleIds] = useState<string[]>(initialRoleIds);

  useEffect(() => {
    if (!open) return;
    setRoleIds(initialRoleIds);
  }, [open, initialRoleIds]);

  const roleIdSet = useMemo(() => new Set(roleIds), [roleIds]);

  return (
    <Modal
      open={open}
      title="Assign roles"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={isPending}
            disabled={!canWrite}
            onClick={() => void onSubmit(roleIds)}
          >
            Save
          </Button>
        </>
      }
    >
      {!canWrite ? (
        <div className="mb-4 rounded-lg border border-[var(--danger)]/30 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
          You don't have permission to update users.
        </div>
      ) : null}

      <div className="space-y-2">
        {roles.map((r) => {
          const checked = roleIdSet.has(r.id);
          return (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface)]/50 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{r.name}</p>
              </div>
              <Checkbox
                checked={checked}
                disabled={!canWrite}
                onChange={(next) => {
                  setRoleIds((prev) => {
                    if (next) return Array.from(new Set([...prev, r.id]));
                    return prev.filter((id) => id !== r.id);
                  });
                }}
              />
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
