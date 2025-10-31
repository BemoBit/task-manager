'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Zap, BarChart3, TestTube } from 'lucide-react';
import { ProviderList } from './provider-list';
import { PhaseAssignmentManager } from './phase-assignment-manager';
import { UsageAnalyticsDashboard } from './usage-analytics-dashboard';
import { ProviderTestingPlayground } from './provider-testing-playground';

export function AIProviderSettings() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Provider Configuration</h1>
        <p className="text-muted-foreground">
          Manage AI providers, configure models, and monitor usage
        </p>
      </div>
      
      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers" className="gap-2">
            <Settings className="h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="phases" className="gap-2">
            <Zap className="h-4 w-4" />
            Phase Assignment
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="testing" className="gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="providers" className="space-y-6">
          <ProviderList />
        </TabsContent>
        
        <TabsContent value="phases" className="space-y-6">
          <PhaseAssignmentManager />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <UsageAnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="testing" className="space-y-6">
          <ProviderTestingPlayground />
        </TabsContent>
      </Tabs>
    </div>
  );
}
