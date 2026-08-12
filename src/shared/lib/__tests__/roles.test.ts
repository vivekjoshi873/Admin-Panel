import { describe, expect, it } from 'vitest';
import { extractPermissionIds, extractRoleIds, flattenRoles, toApiIds } from '../roles';

describe('flattenRoles', () => {
  it('reads slug from a join row without using the assignment id', () => {
    expect(
      flattenRoles([
        {
          id: '123',
          roleId: '11',
          role: { id: '11', name: 'CUSTOMER', slug: 'customer' },
        },
      ]),
    ).toEqual([{ id: '11', name: 'CUSTOMER', slug: 'customer' }]);
  });
});

describe('extractRoleIds', () => {
  it('prefers role.id over the join-row id', () => {
    expect(
      extractRoleIds({
        data: [{ id: '123', roleId: '11', role: { id: '11', slug: 'customer' } }],
      }),
    ).toEqual(['11']);
  });

  it('keeps plain role object ids', () => {
    expect(extractRoleIds([{ id: '2', name: 'Admin', slug: 'super_admin' }])).toEqual(['2']);
  });
});

describe('extractPermissionIds', () => {
  it('prefers permission.id over the join-row id', () => {
    expect(
      extractPermissionIds([{ id: '99', permissionId: '7', permission: { id: '7', slug: 'analytics.view' } }]),
    ).toEqual(['7']);
  });
});

describe('toApiIds', () => {
  it('sends numeric ids the way CreateUserDto examples do', () => {
    expect(toApiIds(['11', '2'])).toEqual([11, 2]);
  });
});
