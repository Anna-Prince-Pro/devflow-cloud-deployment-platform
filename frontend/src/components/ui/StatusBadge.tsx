import React from 'react';
import { DeploymentStatus } from '../../types/deployment';
import { CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';

interface StatusBadgeProps {
  status: DeploymentStatus;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  className = '',
}) => {
  const configs: Record<
    DeploymentStatus,
    {
      label: string;
      bg: string;
      text: string;
      border: string;
      dot: string;
      icon: React.ReactNode;
    }
  > = {
    pending: {
      label: 'Pending',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      dot: 'bg-amber-400',
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
    },
    running: {
      label: 'Running',
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/20',
      dot: 'bg-sky-400 animate-ping',
      icon: <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />,
    },
    succeeded: {
      label: 'Succeeded',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      dot: 'bg-emerald-400',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    },
    failed: {
      label: 'Failed',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      dot: 'bg-rose-400',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
    },
  };

  const current = configs[status] || configs.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      {showIcon && current.icon}
      <span>{current.label}</span>
    </span>
  );
};
