import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  GitCommit,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { projectsApi } from '../api/projects';
import { deploymentsApi } from '../api/deployments';
import { Project, ProjectCreate } from '../types/project';
import { Deployment, DeploymentCreate } from '../types/deployment';
import { formatDate, formatDateTime, formatTime, parseUtcDate } from '../utils/date';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateDeployOpen, setIsCreateDeployOpen] = useState(false);

  // Project Form
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projRepo, setProjRepo] = useState('');
  const [isSubmittingProj, setIsSubmittingProj] = useState(false);
  const [projError, setProjError] = useState<string | null>(null);

  // Deployment Form
  const [deployProjectId, setDeployProjectId] = useState('');
  const [deployCommit, setDeployCommit] = useState('');
  const [deployEnv, setDeployEnv] = useState('production');
  const [isSubmittingDeploy, setIsSubmittingDeploy] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projectsData, deploymentsData] = await Promise.all([
        projectsApi.getProjects(),
        deploymentsApi.getDeployments(),
      ]);
      setProjects(projectsData);
      setDeployments(deploymentsData);
      if (projectsData.length > 0 && !deployProjectId) {
        setDeployProjectId(projectsData[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard metrics from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalDeployments = deployments.length;
    const successful = deployments.filter((d) => d.status === 'succeeded').length;
    const failed = deployments.filter((d) => d.status === 'failed').length;
    const running = deployments.filter((d) => d.status === 'running').length;
    const pending = deployments.filter((d) => d.status === 'pending').length;

    const successRate = totalDeployments > 0 ? Math.round((successful / totalDeployments) * 100) : 0;

    return {
      totalProjects,
      totalDeployments,
      successful,
      failed,
      running,
      pending,
      successRate,
    };
  }, [projects, deployments]);

  // Chart data
  const chartData = useMemo(() => {
    return [
      { name: 'Succeeded', value: stats.successful, color: '#34D399' },
      { name: 'Running', value: stats.running, color: '#38BDF8' },
      { name: 'Pending', value: stats.pending, color: '#FBBF24' },
      { name: 'Failed', value: stats.failed, color: '#F87171' },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Project lookup map
  const projectMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p]));
  }, [projects]);

  // Recent deployments (latest 5)
  const recentDeployments = useMemo(() => {
    return [...deployments]
      .sort((a, b) => (parseUtcDate(b.created_at)?.getTime() ?? 0) - (parseUtcDate(a.created_at)?.getTime() ?? 0))
      .slice(0, 5);
  }, [deployments]);

  // Handlers
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) {
      setProjError('Project name is required.');
      return;
    }
    setIsSubmittingProj(true);
    setProjError(null);
    try {
      const payload: ProjectCreate = {
        name: projName.trim(),
        description: projDesc.trim() || undefined,
        repository_url: projRepo.trim() || undefined,
      };
      await projectsApi.createProject(payload);
      setProjName('');
      setProjDesc('');
      setProjRepo('');
      setIsCreateProjectOpen(false);
      await fetchData();
    } catch (err: any) {
      setProjError(err.response?.data?.detail || 'Failed to create project.');
    } finally {
      setIsSubmittingProj(false);
    }
  };

  const handleCreateDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployProjectId) {
      setDeployError('Please select a project.');
      return;
    }
    setIsSubmittingDeploy(true);
    setDeployError(null);
    try {
      const payload: DeploymentCreate = {
        project_id: deployProjectId,
        commit_sha: deployCommit.trim() || undefined,
        environment: deployEnv,
      };
      await deploymentsApi.createDeployment(payload);
      setDeployCommit('');
      setIsCreateDeployOpen(false);
      await fetchData();
    } catch (err: any) {
      setDeployError(err.response?.data?.detail || 'Failed to launch deployment.');
    } finally {
      setIsSubmittingDeploy(false);
    }
  };

  return (
    <div className="space-y-8">
      <Header
        title="Deployment Overview"
        subtitle="Real-time status across projects and cloud deployment pipelines"
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
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateProjectOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Project
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateDeployOpen(true)}
              disabled={projects.length === 0}
              leftIcon={<Rocket className="w-4 h-4" />}
            >
              Deploy
            </Button>
          </div>
        }
      />

      <div className="px-8 space-y-8">
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
          <LoadingSpinner label="Fetching live deployment telemetry..." />
        ) : (
          <>
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Projects */}
              <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total Projects
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white font-mono">{stats.totalProjects}</span>
                  <span className="text-xs text-slate-400">active repos</span>
                </div>
              </div>

              {/* Total Deployments */}
              <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Deployments
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Rocket className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white font-mono">{stats.totalDeployments}</span>
                  <span className="text-xs text-slate-400">total executed</span>
                </div>
              </div>

              {/* Successful */}
              <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Successful
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-emerald-400 font-mono">{stats.successful}</span>
                  <span className="text-xs text-slate-400">
                    {stats.totalDeployments > 0 ? `${stats.successRate}% rate` : 'no runs'}
                  </span>
                </div>
              </div>

              {/* Failed */}
              <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Failed Runs
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-rose-400 font-mono">{stats.failed}</span>
                  <span className="text-xs text-slate-400">needs review</span>
                </div>
              </div>
            </div>

            {/* Visual Analytics & Projects Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status Distribution Chart */}
              <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Status Distribution
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Lifecycle breakdown of pipeline executions</p>
                </div>

                <div className="h-56 mt-4 flex items-center justify-center">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1E293B',
                            borderColor: '#334155',
                            borderRadius: '0.5rem',
                            color: '#F8FAFC',
                            fontSize: '12px',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-xs text-slate-400">
                      No deployments recorded yet.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-slate-800/40">
                    <p className="text-slate-400">Running</p>
                    <p className="font-mono font-bold text-sky-400">{stats.running}</p>
                  </div>
                  <div className="p-2 rounded bg-slate-800/40">
                    <p className="text-slate-400">Pending</p>
                    <p className="font-mono font-bold text-amber-400">{stats.pending}</p>
                  </div>
                </div>
              </div>

              {/* Projects Overview */}
              <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-indigo-400" />
                      Active Projects
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Configured repositories and target services</p>
                  </div>
                  <Link
                    to="/projects"
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                  >
                    View All <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {projects.length === 0 ? (
                  <EmptyState
                    icon={<FolderGit2 className="w-6 h-6 text-slate-400" />}
                    title="No projects configured"
                    description="Create your first deployment target to connect repositories and run cloud pipelines."
                    actionLabel="Create Project"
                    onAction={() => setIsCreateProjectOpen(true)}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {projects.slice(0, 4).map((p) => {
                      const projectDeployments = deployments.filter((d) => d.project_id === p.id);
                      return (
                        <Link
                          key={p.id}
                          to={`/projects/${p.id}`}
                          className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/70 transition-all duration-150 flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <h4 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                                {p.name}
                              </h4>
                              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {p.description || 'No description provided.'}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-mono text-cyan-400/90 font-medium">
                              {projectDeployments.length} deployments
                            </span>
                            <span>{formatDate(p.created_at)}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Deployments Table */}
            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-cyan-400" />
                    Recent Deployments
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Latest execution history across all environments</p>
                </div>
                <Link
                  to="/deployments"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                >
                  View All Deployments <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentDeployments.length === 0 ? (
                <EmptyState
                  icon={<Rocket className="w-6 h-6 text-slate-400" />}
                  title="No deployments executed yet"
                  description="Deploy your projects to track environment rollouts, status logs, and cloud workflows."
                  actionLabel="Launch Deployment"
                  onAction={() => setIsCreateDeployOpen(true)}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="pb-3 pl-2">Deployment ID</th>
                        <th className="pb-3">Project</th>
                        <th className="pb-3">Environment</th>
                        <th className="pb-3">Commit</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 pr-2 text-right">Triggered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {recentDeployments.map((dep) => {
                        const proj = projectMap.get(dep.project_id);
                        return (
                          <tr key={dep.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 pl-2 font-mono text-slate-300">
                              <span className="text-cyan-400/80">{dep.id.slice(0, 8)}</span>
                            </td>
                            <td className="py-3 text-slate-200">
                              {proj ? (
                                <Link
                                  to={`/projects/${proj.id}`}
                                  className="hover:text-cyan-300 hover:underline"
                                >
                                  {proj.name}
                                </Link>
                              ) : (
                                <span className="font-mono text-slate-400">{dep.project_id.slice(0, 8)}</span>
                              )}
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700/60">
                                {dep.environment || 'production'}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-slate-400 flex items-center gap-1">
                              <GitCommit className="w-3 h-3 text-slate-400" />
                              <span>{dep.commit_sha ? dep.commit_sha.slice(0, 7) : 'HEAD'}</span>
                            </td>
                            <td className="py-3">
                              <StatusBadge status={dep.status} />
                            </td>
                            <td className="py-3 pr-2 text-right text-slate-400">
                              <span title={formatDateTime(dep.created_at)}>
                                {formatTime(dep.created_at)}
                              </span>
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
        )}
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        title="Create New Project"
        description="Add a repository target for cloud deployment pipelines."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {projError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {projError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              placeholder="e.g. auth-service"
              required
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              placeholder="Brief description of the service and architecture"
              rows={2}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Repository URL
            </label>
            <input
              type="url"
              value={projRepo}
              onChange={(e) => setProjRepo(e.target.value)}
              placeholder="https://github.com/org/repo"
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateProjectOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingProj}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Deployment Modal */}
      <Modal
        isOpen={isCreateDeployOpen}
        onClose={() => setIsCreateDeployOpen(false)}
        title="Trigger Deployment"
        description="Select a project and launch a new deployment execution."
      >
        <form onSubmit={handleCreateDeployment} className="space-y-4">
          {deployError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {deployError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Target Project *
            </label>
            <select
              value={deployProjectId}
              onChange={(e) => setDeployProjectId(e.target.value)}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateDeployOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingDeploy}
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
