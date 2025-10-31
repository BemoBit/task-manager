'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Phase } from '@/types/pipeline';
import { motion } from 'framer-motion';
import {
  FaPlay,
  FaCheck,
  FaTimes,
  FaClock,
  FaForward,
  FaCog,
  FaRedo,
} from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { usePipelineStore } from '@/store/pipelineStore';

interface PhaseNodeProps {
  data: {
    phase: Phase;
    onEdit: (id: string) => void;
  };
}

export default function PhaseNode({ data }: PhaseNodeProps) {
  const { phase, onEdit } = data;
  const { deletePhase, retryPhase, skipPhase } = usePipelineStore();

  const getStatusIcon = () => {
    switch (phase.status) {
      case 'running':
        return <FaPlay className="text-blue-500 animate-pulse" />;
      case 'completed':
        return <FaCheck className="text-green-500" />;
      case 'failed':
        return <FaTimes className="text-red-500" />;
      case 'skipped':
        return <FaForward className="text-gray-500" />;
      default:
        return <FaClock className="text-amber-500" />;
    }
  };

  const getStatusColor = () => {
    switch (phase.status) {
      case 'running':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'failed':
        return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'skipped':
        return 'border-gray-500 bg-gray-50 dark:bg-gray-950';
      default:
        return 'border-amber-500 bg-amber-50 dark:bg-amber-950';
    }
  };

  const getTypeIcon = () => {
    switch (phase.type) {
      case 'conditional':
        return '🔀';
      case 'loop':
        return '🔁';
      case 'custom':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.div
          className={`rounded-lg border-2 p-4 shadow-lg min-w-[200px] ${getStatusColor()}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Handle type="target" position={Position.Top} className="!bg-gray-400" />

          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getTypeIcon()}</span>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onEdit(phase.id)}
            >
              <FaCog className="h-3 w-3" />
            </Button>
          </div>

          <h3 className="font-semibold text-sm mb-1 truncate">{phase.name}</h3>
          {phase.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {phase.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <Badge variant="outline" className="text-xs">
              {phase.status}
            </Badge>
            <span>{formatDuration(phase.duration)}</span>
          </div>

          {phase.status === 'running' && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${phase.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-center mt-1">{phase.progress}%</p>
            </div>
          )}

          {phase.type === 'loop' && phase.currentIteration !== undefined && (
            <div className="mt-2 text-xs text-center">
              Iteration {phase.currentIteration} / {phase.iterations}
            </div>
          )}

          {phase.errorMessage && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400 line-clamp-2">
              {phase.errorMessage}
            </div>
          )}

          <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
        </motion.div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEdit(phase.id)}>
          <FaCog className="mr-2 h-4 w-4" />
          Configure
        </ContextMenuItem>
        {phase.status === 'failed' && (
          <ContextMenuItem onClick={() => retryPhase(phase.id)}>
            <FaRedo className="mr-2 h-4 w-4" />
            Retry
          </ContextMenuItem>
        )}
        {['pending', 'running'].includes(phase.status) && (
          <ContextMenuItem onClick={() => skipPhase(phase.id)}>
            <FaForward className="mr-2 h-4 w-4" />
            Skip
          </ContextMenuItem>
        )}
        <ContextMenuItem
          onClick={() => deletePhase(phase.id)}
          className="text-red-600 dark:text-red-400"
        >
          <FaTimes className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
