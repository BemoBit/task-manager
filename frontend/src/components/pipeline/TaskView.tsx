'use client';

import React, { useState } from 'react';
import { Subtask } from '@/types/pipeline';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FaChevronDown,
  FaChevronRight,
  FaDatabase,
  FaCog,
  FaNetworkWired,
  FaFlask,
  FaCode,
} from 'react-icons/fa';
import { usePipelineStore } from '@/store/pipelineStore';

export default function TaskView() {
  const { pipeline } = usePipelineStore();
  const task = pipeline?.task;

  if (!task) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No task loaded. Start a pipeline execution to see task details.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Task Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{task.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </div>
            <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
              {task.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span className="font-semibold">{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Subtasks</p>
                <p className="text-2xl font-bold">{task.subtasks.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {task.subtasks.filter((s) => s.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subtasks Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Subtasks</CardTitle>
        </CardHeader>
        <CardContent>
          <SubtaskTree subtasks={task.subtasks} />
        </CardContent>
      </Card>
    </div>
  );
}

interface SubtaskTreeProps {
  subtasks: Subtask[];
  level?: number;
}

function SubtaskTree({ subtasks, level = 0 }: SubtaskTreeProps) {
  // Group subtasks by type
  const groupedSubtasks = subtasks.reduce((acc, subtask) => {
    if (!acc[subtask.type]) {
      acc[subtask.type] = [];
    }
    acc[subtask.type].push(subtask);
    return acc;
  }, {} as Record<string, Subtask[]>);

  return (
    <div className={level > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}>
      {Object.entries(groupedSubtasks).map(([type, items]) => (
        <div key={type} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            {getSubtaskTypeIcon(type as Subtask['type'])}
            <h4 className="font-semibold text-sm capitalize">
              {type.replace(/-/g, ' ')} ({items.length})
            </h4>
          </div>
          <div className="space-y-2">
            {items.map((subtask) => (
              <SubtaskItem key={subtask.id} subtask={subtask} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface SubtaskItemProps {
  subtask: Subtask;
}

function SubtaskItem({ subtask }: SubtaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = () => {
    switch (subtask.status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      case 'running':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
      case 'failed':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'pending':
        return 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <motion.div
      className={`border rounded-lg p-3 ${getStatusColor()}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="mt-0.5 flex-shrink-0">
          {isExpanded ? (
            <FaChevronDown className="text-sm" />
          ) : (
            <FaChevronRight className="text-sm" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h5 className="font-medium text-sm">{subtask.title}</h5>
            <Badge variant="outline" className="flex-shrink-0">
              {subtask.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {subtask.description}
          </p>

          {subtask.status === 'running' && (
            <div className="mt-2">
              <Progress value={subtask.progress} className="h-1.5" />
              <p className="text-xs text-center mt-1">{subtask.progress}%</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Type</p>
                <div className="flex items-center gap-2">
                  {getSubtaskTypeIcon(subtask.type)}
                  <span className="capitalize">{subtask.type.replace(/-/g, ' ')}</span>
                </div>
              </div>

              {subtask.description && (
                <div>
                  <p className="text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{subtask.description}</p>
                </div>
              )}

              {subtask.prompt && (
                <div>
                  <p className="text-muted-foreground mb-1">Generated Prompt</p>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-xs font-mono max-h-40 overflow-y-auto">
                    {subtask.prompt}
                  </div>
                </div>
              )}

              {Object.keys(subtask.content).length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Content</p>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-xs font-mono max-h-40 overflow-y-auto">
                    <pre>{JSON.stringify(subtask.content, null, 2)}</pre>
                  </div>
                </div>
              )}

              <div className="flex gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold">Created:</span>{' '}
                  {new Date(subtask.createdAt).toLocaleString()}
                </div>
                {subtask.updatedAt && (
                  <div>
                    <span className="font-semibold">Updated:</span>{' '}
                    {new Date(subtask.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {subtask.children && subtask.children.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-semibold mb-2">Nested Subtasks:</p>
                <SubtaskTree subtasks={subtask.children} level={1} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function getSubtaskTypeIcon(type: Subtask['type']) {
  switch (type) {
    case 'data-model':
      return <FaDatabase className="text-purple-500" />;
    case 'service':
      return <FaCog className="text-blue-500" />;
    case 'http-api':
      return <FaNetworkWired className="text-green-500" />;
    case 'test':
      return <FaFlask className="text-orange-500" />;
    case 'custom':
      return <FaCode className="text-gray-500" />;
    default:
      return <FaCode className="text-gray-500" />;
  }
}
