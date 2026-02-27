let accessToken: string | null = null;

export const tokenStorage = {
  getAccessToken: () => accessToken,
  setAccessToken: (token: string) => {
    accessToken = token;
  },
  removeAccessToken: () => {
    accessToken = null;
  },
  getRefreshToken: () => null,
  setRefreshToken: () => {},
  removeRefreshToken: () => {},
  clear: () => {
    accessToken = null;
  }
};
