import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, accessToken, setSession, setAccessToken, updateUser, clearSession } = useAuthStore();

  return {
    user,
    accessToken,
    isAuthenticated,
    login: setSession,
    setAccessToken,
    updateUser,
    logout: clearSession
  };
};
