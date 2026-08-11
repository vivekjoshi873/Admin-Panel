export type SettingFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'email'
  | 'url'
  | 'password'
  | 'color'
  | 'json';

export type SettingFieldOption = {
  label: string;
  value: string | number | boolean;
};

export type SettingField = {
  key: string;
  label: string;
  type: SettingFieldType;
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: SettingFieldOption[];
  min?: number;
  max?: number;
  placeholder?: string;
};

export type SettingsGroup = {
  slug: string;
  name: string;
  description?: string;
  fields: SettingField[];
  values: Record<string, unknown>;
};

export type SettingsCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
};

export type SidebarItem = {
  id: string;
  label: string;
  path: string;
  icon?: string | null;
  permission?: string | null;
  children?: SidebarItem[];
};

export type SidebarSettings = {
  items: SidebarItem[];
};
