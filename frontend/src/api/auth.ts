import apiClient from './axios';
import { LoginRequest, RegisterRequest, TokenResponse, User } from '../types/auth';

export const authApi = {
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await apiClient.post<User>('/users/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/users/login', data);
    return response.data;
  },
};
