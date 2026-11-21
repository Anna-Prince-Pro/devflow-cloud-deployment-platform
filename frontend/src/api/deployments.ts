import apiClient from './axios';
import { Deployment, DeploymentCreate, DeploymentStatus } from '../types/deployment';

export const deploymentsApi = {
  getDeployments: async (): Promise<Deployment[]> => {
    const response = await apiClient.get<Deployment[]>('/deployments/');
    return response.data;
  },

  getDeployment: async (deploymentId: string): Promise<Deployment> => {
    const response = await apiClient.get<Deployment>(`/deployments/${deploymentId}`);
    return response.data;
  },

  getDeploymentsByProject: async (projectId: string): Promise<Deployment[]> => {
    const response = await apiClient.get<Deployment[]>(`/deployments/projects/${projectId}`);
    return response.data;
  },

  createDeployment: async (data: DeploymentCreate): Promise<Deployment> => {
    const response = await apiClient.post<Deployment>('/deployments/', data);
    return response.data;
  },

  updateStatus: async (deploymentId: string, status: DeploymentStatus): Promise<Deployment> => {
    const response = await apiClient.patch<Deployment>(`/deployments/${deploymentId}/status`, {
      status,
    });
    return response.data;
  },
};
