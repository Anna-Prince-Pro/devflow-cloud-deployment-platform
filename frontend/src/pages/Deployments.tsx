import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket,
  Plus,
  RefreshCw,
  GitCommit,
  Search,
  Filter,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { deploymentsApi } from '../api/deployments';
import { projectsApi } from '../api/projects';
import { Project } from '../types/project';
import { Deployment, DeploymentCreate, DeploymentStatus, ALLOWED_TRANSITIONS } from '../types/deployment';
import { formatDateTime } from '../utils/date';

export const Deployments: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [envFilter, setEnvFilter] = useState<string>('all');

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // State update tracking
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [deps, projs] = await Promise.all([
        deploymentsApi.getDeployments(),
        projectsApi.getProjects(),
      ]);
      setDeployments(deps);
      setProjects(projs);
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load deployments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const projectMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p]));
  }, [projects]);

  // Filtered Deployments
  const filteredDeployments = useMemo(() => {
    return deployments.filter((d) => {
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesEnv = envFilter === 'all' || d.environment === envFilter;

      const proj = projectMap.get(d.project_id);
      const projName = proj ? proj.name.toLowerCase() : '';
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        d.id.toLowerCase().includes(q) ||
        (d.commit_sha && d.commit_sha.toLowerCase().includes(q)) ||
        projName.includes(q);

      return matchesStatus && matchesEnv && matchesSearch;
    });
  }, [deployments, statusFilter, envFilter, searchQuery, projectMap]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setModalError('Please select a project to deploy.');
      return;
    }
    setIsSubmitting(true);
    setModalError(null);
    try {
      const payload: DeploymentCreate = {
        project_id: selectedProjectId,
        commit_sha: commitSha.trim() || undefined,
        environment,
      };
      await deploymentsApi.createDeployment(payload);
      setCommitSha('');
      setIsCreateOpen(false);
      await fetchData();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to trigger deployment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransition = async (deploymentId: string, nextStatus: DeploymentStatus) => {
    setUpdatingId(deploymentId);
    try {
      await deploymentsApi.updateStatus(deploymentId, nextStatus);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to transition deployment to ${nextStatus}.`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <Header
        title="Deployments"
        subtitle="Manage cloud deployment pipelines, trigger rollouts, and inspect status transitions"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              disabled={projects.length === 0}
              leftIcon={<Rocket className="w-4 h-4" />}
            >
              New Deployment
            </Button>
          </div>
        }
      />

      <div className="px-8 space-y-6">
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, commit, project..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="succeeded">Succeeded</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Environment Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={envFilter}
                onChange={(e) => setEnvFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Environments</option>
                <option value="production">production</option>
                <option value="staging">staging</option>
                <option value="development">development</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono self-end md:self-center">
            Showing <span className="text-white font-bold">{filteredDeployments.length}</span> of {deployments.length} deployments
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchData}>
              Retry
            </Button>
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner label="Loading deployments list..." />
        ) : filteredDeployments.length === 0 ? (
          searchQuery || statusFilter !== 'all' || envFilter !== 'all' ? (
            <EmptyState
              icon={<Search className="w-6 h-6 text-slate-400" />}
              title="No deployments match your filters"
              description="Try adjusting your status, environment, or search keyword."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setEnvFilter('all');
              }}
            />
          ) : (
            <EmptyState
              icon={<Rocket className="w-6 h-6 text-slate-400" />}
              title="No deployments found"
              description="Launch your first cloud deployment to track builds and rollouts."
              actionLabel="Launch Deployment"
              onAction={() => setIsCreateOpen(true)}
              actionIcon={<Plus className="w-4 h-4" />}
            />
          )
        ) : (
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 pl-4">Deployment ID</th>
                    <th className="py-3.5">Project</th>
                    <th className="py-3.5">Environment</th>
                    <th className="py-3.5">Commit SHA</th>
                    <th className="py-3.5">Status</th>
                    <th className="py-3.5">Allowed Actions</th>
                    <th className="py-3.5">Updated</th>
                    <th className="py-3.5 pr-4 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredDeployments.map((dep) => {
                    const proj = projectMap.get(dep.project_id);
                    const allowedNext = ALLOWED_TRANSITIONS[dep.status] || [];
                    const isUpdating = updatingId === dep.id;

                    return (
                      <tr key={dep.id} className="hover:bg-slate-800/30 transition-colors">
                        {/* ID */}
                        <td className="py-3 pl-4 font-mono text-slate-300">
                          <span className="text-cyan-400 font-semibold">{dep.id.slice(0, 8)}</span>
                          <span className="text-slate-400">{dep.id.slice(8, 13)}...</span>
                        </td>

                        {/* Project */}
                        <td className="py-3 text-slate-200">
                          {proj ? (
                            <Link
                              to={`/projects/${proj.id}`}
                              className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors font-medium"
                            >
                              <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{proj.name}</span>
                            </Link>
                          ) : (
                            <span className="font-mono text-slate-400">{dep.project_id.slice(0, 8)}</span>
                          )}
                        </td>

                        {/* Environment */}
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700/60">
                            {dep.environment || 'production'}
                          </span>
                        </td>

                        {/* Commit */}
                        <td className="py-3 font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <GitCommit className="w-3.5 h-3.5 text-slate-400" />
                            {dep.commit_sha ? dep.commit_sha.slice(0, 7) : 'HEAD'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3">
                          <StatusBadge status={dep.status} />
                        </td>

                        {/* Allowed Actions */}
                        <td className="py-3">
                          {allowedNext.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {allowedNext.map((next) => (
                                <button
                                  key={next}
                                  onClick={() => handleTransition(dep.id, next)}
                                  disabled={isUpdating}
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors border ${
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
                            <span className="text-[11px] text-slate-400 italic">Terminal</span>
                          )}
                        </td>

                        {/* Updated */}
                        <td className="py-3 text-slate-400 text-[11px]">
                          <span title={formatDateTime(dep.updated_at)}>
                            {formatDateTime(dep.updated_at)}
                          </span>
                        </td>

                        {/* Created */}
                        <td className="py-3 pr-4 text-right text-slate-400 text-[11px]">
                          <span title={formatDateTime(dep.created_at)}>
                            {formatDateTime(dep.created_at)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Launch Deployment Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Launch Cloud Deployment"
        description="Select a target project and specify execution parameters."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {modalError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Target Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Environment *
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
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
              value={commitSha}
              onChange={(e) => setCommitSha(e.target.value)}
              placeholder="e.g. 7b8e5c2d3f1a..."
              maxLength={40}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Rocket className="w-4 h-4" />}
            >
              Trigger Deployment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
