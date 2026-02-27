import { useAuthStore } from '../store/authStore';

export const usePermission = (requiredRole: string) => {
  const role = useAuthStore((state) => state.user?.role ?? 'guest');
  const isAllowed = role === requiredRole || role === 'admin';

  return { isAllowed, role };
};
