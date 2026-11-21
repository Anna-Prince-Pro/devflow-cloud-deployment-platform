export type DeploymentStatus = 'pending' | 'running' | 'failed' | 'succeeded';

export interface Deployment {
  id: string;
  project_id: string;
  status: DeploymentStatus;
  commit_sha: string | null;
  environment: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeploymentCreate {
  project_id: string;
  commit_sha?: string;
  environment?: string;
}

export interface DeploymentStatusUpdate {
  status: DeploymentStatus;
}

export const ALLOWED_TRANSITIONS: Record<DeploymentStatus, DeploymentStatus[]> = {
  pending: ['running', 'failed'],
  running: ['succeeded', 'failed'],
  failed: ['pending'],
  succeeded: [], // terminal
};
