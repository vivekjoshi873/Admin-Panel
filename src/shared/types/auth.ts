export type Permission = {
  id: string;
  name: string;
  slug: string;
  module: string;
  description?: string | null;
};

export type Role = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  permissions?: Permission[];
  createdAt?: string;
  updatedAt?: string;
};

export type UserRole = Pick<Role, 'id' | 'name' | 'slug'>;

export type AuthUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  roles: UserRole[];
  permissions: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
  expiresIn?: number;
};

export type MessageResponse = {
  message: string;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};
