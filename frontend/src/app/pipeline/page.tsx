'use client';

import React, { useEffect, useState } from 'react';
import { usePipelineStore } from '@/store/pipelineStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout';
import PipelineBuilder from '@/components/pipeline/PipelineBuilder';
import ExecutionMonitor from '@/components/pipeline/ExecutionMonitor';
import TaskView from '@/components/pipeline/TaskView';
import ResultDisplay from '@/components/pipeline/ResultDisplay';
import ControlPanel from '@/components/pipeline/ControlPanel';
import {
  FaProjectDiagram,
  FaChartLine,
  FaTasks,
  FaFileAlt,
  FaPlus,
} from 'react-icons/fa';

export default function PipelinePage() {
  const { pipeline, createPipeline, addResourceUsage } = usePipelineStore();
  const [activeTab, setActiveTab] = useState('builder');

  // Simulate resource monitoring
  useEffect(() => {
    if (!pipeline || pipeline.status !== 'running') return;

    const interval = setInterval(() => {
      addResourceUsage({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        timestamp: new Date(),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [pipeline, addResourceUsage]);

  const handleCreatePipeline = () => {
    const name = prompt('Enter pipeline name:', 'New Pipeline');
    if (name) {
      createPipeline(name, 'Pipeline description');
    }
  };

  if (!pipeline) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-16">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-8">
              <FaProjectDiagram className="w-24 h-24 mx-auto text-primary mb-6" />
              <h1 className="text-4xl font-bold mb-4">Pipeline Visualization</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Create an interactive pipeline to visualize and manage your task execution
                workflow.
              </p>
            </div>

            <div className="space-y-4">
              <Button size="lg" onClick={handleCreatePipeline} className="px-8">
                <FaPlus className="mr-2 h-5 w-5" />
                Create New Pipeline
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <FeatureCard
                  icon={<FaProjectDiagram />}
                  title="Visual Builder"
                  description="Drag-and-drop interface to create and connect phases"
                />
                <FeatureCard
                  icon={<FaChartLine />}
                  title="Real-time Monitoring"
                  description="Track execution progress and resource usage"
                />
                <FeatureCard
                  icon={<FaTasks />}
                  title="Task Management"
                  description="Organize and track subtasks with detailed views"
                />
                <FeatureCard
                  icon={<FaFileAlt />}
                  title="Result Export"
                  description="Export generated prompts in multiple formats"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full bg-background">
        {/* Header */}
        <motion.div
          className="border-b bg-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{pipeline.name}</h1>
                {pipeline.description && (
                  <p className="text-sm text-muted-foreground">{pipeline.description}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Control Panel - Sidebar */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ControlPanel />
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="builder" className="flex items-center gap-2">
                  <FaProjectDiagram className="h-4 w-4" />
                  <span className="hidden sm:inline">Builder</span>
                </TabsTrigger>
                <TabsTrigger value="monitor" className="flex items-center gap-2">
                  <FaChartLine className="h-4 w-4" />
                  <span className="hidden sm:inline">Monitor</span>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <FaTasks className="h-4 w-4" />
                  <span className="hidden sm:inline">Tasks</span>
                </TabsTrigger>
                <TabsTrigger value="results" className="flex items-center gap-2">
                  <FaFileAlt className="h-4 w-4" />
                  <span className="hidden sm:inline">Results</span>
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="builder" className="mt-0">
                  <motion.div
                    key="builder"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-0 overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
                      <PipelineBuilder />
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="monitor" className="mt-0">
                  <motion.div
                    key="monitor"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ExecutionMonitor />
                  </motion.div>
                </TabsContent>

                <TabsContent value="tasks" className="mt-0">
                  <motion.div
                    key="tasks"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TaskView />
                  </motion.div>
                </TabsContent>

                <TabsContent value="results" className="mt-0">
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ResultDisplay />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 text-left">
        <div className="flex items-start gap-4">
          <div className="text-3xl text-primary">{icon}</div>
          <div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
