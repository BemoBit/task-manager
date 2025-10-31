'use client';

import React, { useState } from 'react';
import { usePipelineStore } from '@/store/pipelineStore';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FaPlay,
  FaPause,
  FaStop,
  FaRedo,
  FaCog,
  FaSave,
  FaTrash,
} from 'react-icons/fa';

export default function ControlPanel() {
  const {
    pipeline,
    isExecuting,
    startPipeline,
    pausePipeline,
    resumePipeline,
    stopPipeline,
    clearPipeline,
  } = usePipelineStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmStop, setShowConfirmStop] = useState(false);

  if (!pipeline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Control Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No pipeline loaded. Create a pipeline to access controls.
          </p>
        </CardContent>
      </Card>
    );
  }

  const canStart = pipeline.status === 'idle' && !isExecuting;
  const canPause = pipeline.status === 'running' && isExecuting;
  const canResume = pipeline.status === 'paused' && !isExecuting;
  const canStop = ['running', 'paused'].includes(pipeline.status);

  const handleStart = () => {
    startPipeline();
  };

  const handlePause = () => {
    pausePipeline();
  };

  const handleResume = () => {
    resumePipeline();
  };

  const handleStop = () => {
    setShowConfirmStop(true);
  };

  const confirmStop = () => {
    stopPipeline();
    setShowConfirmStop(false);
  };

  const handleClearPipeline = () => {
    if (confirm('Are you sure you want to clear this pipeline? This action cannot be undone.')) {
      clearPipeline();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Control Panel</CardTitle>
          <Badge variant={isExecuting ? 'default' : 'secondary'}>
            {pipeline.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Controls */}
        <div className="grid grid-cols-2 gap-2">
          {canStart && (
            <Button onClick={handleStart} className="w-full" size="lg">
              <FaPlay className="mr-2 h-5 w-5" />
              Start Pipeline
            </Button>
          )}

          {canPause && (
            <Button onClick={handlePause} variant="outline" className="w-full" size="lg">
              <FaPause className="mr-2 h-5 w-5" />
              Pause
            </Button>
          )}

          {canResume && (
            <Button onClick={handleResume} className="w-full" size="lg">
              <FaPlay className="mr-2 h-5 w-5" />
              Resume
            </Button>
          )}

          {canStop && (
            <Dialog open={showConfirmStop} onOpenChange={setShowConfirmStop}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full" size="lg">
                  <FaStop className="mr-2 h-5 w-5" />
                  Stop
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Stop Pipeline Execution?</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to stop the pipeline? This will halt all running
                    phases and you may lose progress.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowConfirmStop(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={confirmStop}>
                    Stop Pipeline
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Current Phase Info */}
        {pipeline.currentPhaseId && (
          <motion.div
            className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm font-semibold mb-1">Current Phase:</p>
            <p className="text-lg">
              {pipeline.phases.find((p) => p.id === pipeline.currentPhaseId)?.name ||
                'Unknown'}
            </p>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <FaCog className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <PipelineSettings onClose={() => setShowSettings(false)} />
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              <FaRedo className="mr-2 h-4 w-4" />
              Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const data = JSON.stringify(pipeline, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pipeline-${pipeline.name.replace(/\s+/g, '-')}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <FaSave className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 dark:text-red-400"
              onClick={handleClearPipeline}
            >
              <FaTrash className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-sm font-semibold">Pipeline Info</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Total Phases</p>
              <p className="font-semibold">{pipeline.phases.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Completed</p>
              <p className="font-semibold text-green-600">
                {pipeline.phases.filter((p) => p.status === 'completed').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Failed</p>
              <p className="font-semibold text-red-600">
                {pipeline.phases.filter((p) => p.status === 'failed').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Remaining</p>
              <p className="font-semibold">
                {pipeline.phases.filter((p) => p.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PipelineSettingsProps {
  onClose: () => void;
}

function PipelineSettings({ onClose }: PipelineSettingsProps) {
  const { pipeline, updatePipeline } = usePipelineStore();
  const [name, setName] = useState(pipeline?.name || '');
  const [description, setDescription] = useState(pipeline?.description || '');

  const handleSave = () => {
    updatePipeline({ name, description });
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Pipeline Settings</DialogTitle>
        <DialogDescription>
          Configure your pipeline settings and preferences.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="pipeline-name">Pipeline Name</Label>
          <Input
            id="pipeline-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter pipeline name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pipeline-description">Description</Label>
          <Input
            id="pipeline-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter pipeline description"
          />
        </div>

        <div className="space-y-2">
          <Label>Pipeline ID</Label>
          <Input value={pipeline?.id || ''} disabled />
        </div>

        <div className="space-y-2">
          <Label>Created At</Label>
          <Input
            value={
              pipeline?.createdAt
                ? new Date(pipeline.createdAt).toLocaleString()
                : ''
            }
            disabled
          />
        </div>

        {pipeline?.startTime && (
          <div className="space-y-2">
            <Label>Started At</Label>
            <Input
              value={new Date(pipeline.startTime).toLocaleString()}
              disabled
            />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <FaSave className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </>
  );
}
