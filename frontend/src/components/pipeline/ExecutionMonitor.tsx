'use client';

import React from 'react';
import { usePipelineStore } from '@/store/pipelineStore';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  FaPlay,
  FaCheck,
  FaTimes,
  FaClock,
  FaForward,
  FaChartLine,
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function ExecutionMonitor() {
  const { pipeline, resourceUsage, phaseStats } = usePipelineStore();

  if (!pipeline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaChartLine />
            Execution Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No pipeline loaded. Create or load a pipeline to start monitoring.
          </p>
        </CardContent>
      </Card>
    );
  }

  const completedPhases = pipeline.phases.filter((p) => p.status === 'completed').length;
  const totalPhases = pipeline.phases.length;
  const overallProgress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

  const getStatusCount = (status: string) => {
    return pipeline.phases.filter((p) => p.status === status).length;
  };

  const formatTime = (date?: Date) => {
    if (!date) return '--';
    return new Date(date).toLocaleTimeString();
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const calculateElapsedTime = () => {
    if (!pipeline.startTime) return 0;
    const endTime = pipeline.endTime || new Date();
    return endTime.getTime() - new Date(pipeline.startTime).getTime();
  };

  const chartData = resourceUsage.map((usage, index) => ({
    time: index,
    cpu: usage.cpu,
    memory: usage.memory,
  }));

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FaChartLine />
              Pipeline Status
            </span>
            <Badge variant={pipeline.status === 'running' ? 'default' : 'secondary'}>
              {pipeline.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span className="font-semibold">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Phases</p>
              <p className="text-2xl font-bold">{totalPhases}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {completedPhases}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Elapsed Time</p>
              <p className="text-2xl font-bold">
                {formatDuration(calculateElapsedTime())}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Start Time</p>
              <p className="text-lg font-semibold">
                {formatTime(pipeline.startTime)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatusCard
              icon={<FaClock className="text-amber-500" />}
              label="Pending"
              count={getStatusCount('pending')}
              color="amber"
            />
            <StatusCard
              icon={<FaPlay className="text-blue-500 animate-pulse" />}
              label="Running"
              count={getStatusCount('running')}
              color="blue"
            />
            <StatusCard
              icon={<FaCheck className="text-green-500" />}
              label="Completed"
              count={getStatusCount('completed')}
              color="green"
            />
            <StatusCard
              icon={<FaTimes className="text-red-500" />}
              label="Failed"
              count={getStatusCount('failed')}
              color="red"
            />
            <StatusCard
              icon={<FaForward className="text-gray-500" />}
              label="Skipped"
              count={getStatusCount('skipped')}
              color="gray"
            />
          </div>
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pipeline.phases.map((phase, index) => (
              <motion.div
                key={phase.id}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-accent transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex-shrink-0">
                  {phase.status === 'running' && (
                    <FaPlay className="text-blue-500 animate-pulse" />
                  )}
                  {phase.status === 'completed' && (
                    <FaCheck className="text-green-500" />
                  )}
                  {phase.status === 'failed' && (
                    <FaTimes className="text-red-500" />
                  )}
                  {phase.status === 'pending' && (
                    <FaClock className="text-amber-500" />
                  )}
                  {phase.status === 'skipped' && (
                    <FaForward className="text-gray-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium truncate">{phase.name}</p>
                    <Badge variant="outline" className="ml-2">
                      {phase.status}
                    </Badge>
                  </div>
                  {phase.status === 'running' && (
                    <Progress value={phase.progress} className="h-2" />
                  )}
                </div>

                <div className="flex-shrink-0 text-sm text-muted-foreground min-w-[80px] text-right">
                  {formatDuration(phase.duration)}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: 'Time', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="CPU %"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Memory %"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Phase Statistics */}
      {phaseStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Phase Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Phase</th>
                    <th className="text-right py-2 px-4">Duration</th>
                    <th className="text-right py-2 px-4">Tokens</th>
                    <th className="text-right py-2 px-4">Cost</th>
                    <th className="text-center py-2 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {phaseStats.map((stat) => (
                    <tr key={stat.phaseId} className="border-b hover:bg-accent">
                      <td className="py-2 px-4">{stat.phaseName}</td>
                      <td className="text-right py-2 px-4">
                        {formatDuration(stat.duration)}
                      </td>
                      <td className="text-right py-2 px-4">
                        {stat.tokensUsed.toLocaleString()}
                      </td>
                      <td className="text-right py-2 px-4">
                        ${stat.cost.toFixed(4)}
                      </td>
                      <td className="text-center py-2 px-4">
                        <Badge variant="outline">{stat.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}

function StatusCard({ icon, label, count, color }: StatusCardProps) {
  return (
    <motion.div
      className={`p-4 border rounded-lg bg-${color}-50 dark:bg-${color}-950 border-${color}-200 dark:border-${color}-800`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl">{icon}</div>
        <p className="text-3xl font-bold">{count}</p>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}
