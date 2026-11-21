export interface Project {
  id: string;
  name: string;
  description: string | null;
  repository_url: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  // Computed / client-side stats
  deployment_count?: number;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  repository_url?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  repository_url?: string;
}
