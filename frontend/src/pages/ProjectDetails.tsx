import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Rocket,
  Edit2,
  Trash2,
  RefreshCw,
  GitCommit,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { projectsApi } from '../api/projects';
import { deploymentsApi } from '../api/deployments';
import { Project, ProjectUpdate } from '../types/project';
import { Deployment, DeploymentCreate, DeploymentStatus, ALLOWED_TRANSITIONS } from '../types/deployment';

export const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);

  // Form states
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRepo, setEditRepo] = useState('');
  const [deployCommit, setDeployCommit] = useState('');
  const [deployEnv, setDeployEnv] = useState('production');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Status transition state
  const [updatingDepId, setUpdatingDepId] = useState<string | null>(null);

  const fetchProjectData = async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [proj, deps] = await Promise.all([
        projectsApi.getProject(projectId),
        deploymentsApi.getDeploymentsByProject(projectId),
      ]);
      setProject(proj);
      setDeployments(deps);
      setEditName(proj.name);
      setEditDesc(proj.description || '');
      setEditRepo(proj.repository_url || '');
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Project not found or you do not have permission to access it.');
      } else {
        setError(err.response?.data?.detail || 'Failed to load project details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !editName.trim()) return;
    setIsSubmitting(true);
    setModalError(null);
    try {
      const payload: ProjectUpdate = {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        repository_url: editRepo.trim() || undefined,
      };
      const updated = await projectsApi.updateProject(projectId, payload);
      setProject(updated);
      setIsEditOpen(false);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to update project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    setIsSubmitting(true);
    try {
      await projectsApi.deleteProject(projectId);
      navigate('/projects');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setIsSubmitting(true);
    setModalError(null);
    try {
      const payload: DeploymentCreate = {
        project_id: projectId,
        commit_sha: deployCommit.trim() || undefined,
        environment: deployEnv,
      };
      await deploymentsApi.createDeployment(payload);
      setDeployCommit('');
      setIsDeployOpen(false);
      await fetchProjectData();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to launch deployment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusTransition = async (deploymentId: string, nextStatus: DeploymentStatus) => {
    setUpdatingDepId(deploymentId);
    try {
      await deploymentsApi.updateStatus(deploymentId, nextStatus);
      await fetchProjectData();
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to transition deployment to ${nextStatus}.`);
    } finally {
      setUpdatingDepId(null);
    }
  };

  return (
    <div className="space-y-8">
      <Header
        title={project?.name || 'Project Details'}
        subtitle="Manage repository settings, branch deployments, and status transitions"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/projects">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Projects
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjectData}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsDeployOpen(true)}
              leftIcon={<Rocket className="w-4 h-4" />}
            >
              Trigger Deploy
            </Button>
          </div>
        }
      />

      <div className="px-8 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <Link to="/projects">
              <Button variant="secondary" size="sm">
                Back to Projects
              </Button>
            </Link>
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner label="Loading project overview..." />
        ) : project ? (
          <>
            {/* Project Header Info Card */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">{project.name}</h2>
                    <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                      {project.description || 'No description provided for this project.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-400">
                      {project.repository_url && (
                        <a
                          href={project.repository_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{project.repository_url}</span>
                        </a>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-mono text-slate-400">
                        ID: <span className="text-slate-300">{project.id.slice(0, 8)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start lg:self-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditOpen(true)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-slate-800 hover:border-rose-500/30"
                    onClick={() => setIsDeleteOpen(true)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            {/* Deployments Section */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-cyan-400" />
                    Project Deployments ({deployments.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Complete execution log and state transitions for this project
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsDeployOpen(true)}
                  leftIcon={<Rocket className="w-3.5 h-3.5" />}
                >
                  New Deployment
                </Button>
              </div>

              {deployments.length === 0 ? (
                <EmptyState
                  icon={<Rocket className="w-6 h-6 text-slate-400" />}
                  title="No deployments found"
                  description="This project has not been deployed yet. Launch a deployment to see status tracking."
                  actionLabel="Launch Deployment"
                  onAction={() => setIsDeployOpen(true)}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="pb-3 pl-2">Deployment ID</th>
                        <th className="pb-3">Environment</th>
                        <th className="pb-3">Commit SHA</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Allowed Transitions</th>
                        <th className="pb-3 pr-2 text-right">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {deployments.map((dep) => {
                        const allowedNext = ALLOWED_TRANSITIONS[dep.status] || [];
                        const isUpdating = updatingDepId === dep.id;

                        return (
                          <tr key={dep.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 pl-2 font-mono text-slate-300">
                              <span className="text-cyan-400/90 font-semibold">{dep.id.slice(0, 8)}</span>
                              <span className="text-slate-400">{dep.id.slice(8, 14)}...</span>
                            </td>
                            <td className="py-3.5">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700/60">
                                {dep.environment || 'production'}
                              </span>
                            </td>
                            <td className="py-3.5 font-mono text-slate-400 flex items-center gap-1.5">
                              <GitCommit className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dep.commit_sha ? dep.commit_sha.slice(0, 7) : 'HEAD'}</span>
                            </td>
                            <td className="py-3.5">
                              <StatusBadge status={dep.status} />
                            </td>
                            <td className="py-3.5">
                              {allowedNext.length > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  {allowedNext.map((next) => (
                                    <button
                                      key={next}
                                      onClick={() => handleStatusTransition(dep.id, next)}
                                      disabled={isUpdating}
                                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors border ${
                                        next === 'running'
                                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20'
                                          : next === 'succeeded'
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                          : next === 'failed'
                                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                      }`}
                                    >
                                      &rarr; {next}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Terminal state</span>
                              )}
                            </td>
                            <td className="py-3.5 pr-2 text-right text-slate-400">
                              {new Date(dep.created_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Project"
        description="Update project name and repository configuration."
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {modalError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Repository URL
            </label>
            <input
              type="url"
              value={editRepo}
              onChange={(e) => setEditRepo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Project"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">"{project?.name}"</span>?
          </p>
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
            This will permanently delete the project and all {deployments.length} deployment records.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleDelete}>
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* Trigger Deployment Modal */}
      <Modal
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        title={`Deploy ${project?.name}`}
        description="Launch a new deployment execution for this project."
      >
        <form onSubmit={handleCreateDeployment} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {modalError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Environment *
            </label>
            <select
              value={deployEnv}
              onChange={(e) => setDeployEnv(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="production">production</option>
              <option value="staging">staging</option>
              <option value="development">development</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Commit SHA (Optional)
            </label>
            <input
              type="text"
              value={deployCommit}
              onChange={(e) => setDeployCommit(e.target.value)}
              placeholder="e.g. 7b8e5c2d3f1a..."
              maxLength={40}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsDeployOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Rocket className="w-4 h-4" />}
            >
              Launch Deployment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
