import { request } from './request';

export const userApi = {
  me: () => request.get('/users/me'),
  profile: (id: string) => request.get(`/users/${id}`),
  updateProfile: (payload: Record<string, unknown>) => request.put('/users/profile', payload),
  updateSettings: (payload: Record<string, unknown>) => request.put('/users/settings', payload),
  posts: (id: string) => request.get(`/users/${id}/posts`),
  blogs: (id: string) => request.get(`/users/${id}/blogs`),
  projects: (id: string) => request.get(`/users/${id}/projects`),
  snippets: (id: string) => request.get(`/users/${id}/snippets`),
  followers: (id: string) => request.get(`/users/${id}/followers`),
  following: (id: string) => request.get(`/users/${id}/following`),
  follow: (id: string) => request.post(`/users/${id}/follow`),
  unfollow: (id: string) => request.delete(`/users/${id}/follow`),
  favorites: (id: string) => request.get(`/users/${id}/favorites`),
  contributions: (id: string) => request.get(`/users/${id}/contributions`),
  achievements: (id: string) => request.get(`/users/${id}/achievements`),
  answers: (id: string) => request.get(`/users/${id}/answers`),
  uploadAvatar: (payload: FormData) =>
    request.post('/users/avatar', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCover: (payload: FormData) =>
    request.post('/users/cover', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  createFavoriteFolder: (payload: Record<string, unknown>) => request.post('/users/favorites/folders', payload),
  updateFavoriteFolder: (id: string, payload: Record<string, unknown>) =>
    request.put(`/users/favorites/folders/${id}`, payload),
  deleteFavoriteFolder: (id: string) => request.delete(`/users/favorites/folders/${id}`),
  points: (id: string) => request.get(`/users/${id}/points`),
  level: (id: string) => request.get(`/users/${id}/level`),
};
