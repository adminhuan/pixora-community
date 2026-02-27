const ADMIN_USER_KEY = 'admin_user';

let accessTokenMemory = '';

export interface AdminUser {
  id: string;
  username: string;
  role: string;
  email?: string;
}

const isPrivilegedRole = (role: string | undefined): boolean => {
  return role === 'admin' || role === 'moderator';
};

export const adminAuthStorage = {
  getAccessToken: () => accessTokenMemory,
  setAccessToken: (token: string) => {
    accessTokenMemory = String(token ?? '').trim();
  },
  getUser: (): AdminUser | null => {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AdminUser;
    } catch {
      return null;
    }
  },
  setUser: (user: AdminUser) => localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user)),
  isPrivilegedUser: (user: { role?: string } | null) => {
    return Boolean(user && isPrivilegedRole(String(user.role ?? '')));
  },
  clear: () => {
    accessTokenMemory = '';
    localStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('apc_refresh_token');
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('apc_access_token');
  }
};
