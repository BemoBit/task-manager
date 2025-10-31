'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProviderPerformance, TemplateUsage, CostAnalysis, ROIMetric } from '@/types/dashboard';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  providerPerformance: ProviderPerformance[];
  templateUsage: TemplateUsage[];
  costAnalysis: CostAnalysis[];
  roiMetrics: ROIMetric[];
  className?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AnalyticsDashboard({
  providerPerformance,
  templateUsage,
  costAnalysis,
  roiMetrics,
  className,
}: AnalyticsDashboardProps) {
  // Provider Performance Chart Data
  const providerChartData = providerPerformance.map(p => ({
    name: p.providerName,
    'Success Rate': p.successRate * 100,
    'Avg Response Time': p.averageResponseTime,
    'Total Requests': p.totalRequests,
    cost: p.totalCost,
  }));

  // Template Usage Pie Chart Data
  const templatePieData = templateUsage.map(t => ({
    name: t.templateName,
    value: t.usageCount,
  }));

  // Cost Analysis Data
  const costChartData = costAnalysis.map(c => ({
    period: c.period,
    totalCost: c.totalCost,
    ...c.breakdown.reduce((acc, b) => ({
      ...acc,
      [b.providerName]: b.cost,
    }), {}),
  }));

  // ROI Metrics Data
  const roiChartData = roiMetrics.map(r => ({
    period: r.period,
    'Time Saved (hrs)': r.timeSaved,
    'Cost ($)': r.costIncurred,
    'ROI (%)': r.roi,
    'Tasks Completed': r.tasksCompleted,
  }));

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Detailed insights and performance metrics
        </p>
      </div>

      {/* Provider Performance */}
      <Card>
        <CardHeader>
          <CardTitle>AI Provider Performance</CardTitle>
          <CardDescription>
            Compare performance metrics across different AI providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="success-rate">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="success-rate">Success Rate</TabsTrigger>
              <TabsTrigger value="response-time">Response Time</TabsTrigger>
              <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="success-rate" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={providerChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Success Rate" fill="#10b981" name="Success Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="response-time" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={providerChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Avg Response Time" fill="#3b82f6" name="Avg Response Time (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="cost" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={providerChartData}
                      dataKey="cost"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {providerChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-4">
                  <h4 className="font-semibold">Cost Breakdown</h4>
                  {providerChartData.map((provider, index) => (
                    <div key={provider.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          {provider.name}
                        </span>
                        <span className="font-medium">${provider.cost.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${(provider.cost / providerChartData.reduce((sum, p) => sum + p.cost, 0)) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Template Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Template Usage Statistics</CardTitle>
          <CardDescription>
            Most frequently used templates and their success rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={templatePieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {templatePieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-4">
              <h4 className="font-semibold">Template Details</h4>
              {templateUsage.map((template, index) => (
                <div key={template.templateId} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      {template.templateName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {template.usageCount} uses
                    </span>
                  </div>
                  <div className="text-sm space-y-1 ml-5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="font-medium">{(template.successRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Execution:</span>
                      <span className="font-medium">{template.averageExecutionTime.toFixed(0)}s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis Over Time</CardTitle>
          <CardDescription>
            Track your AI usage costs across different providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={costChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="totalCost" stroke="#8b5cf6" strokeWidth={2} name="Total Cost" />
              {costAnalysis.length > 0 && costAnalysis[0].breakdown.map((_, index) => (
                <Line
                  key={`line-${index}`}
                  type="monotone"
                  dataKey={costAnalysis[0].breakdown[index].providerName}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ROI Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Return on Investment (ROI)</CardTitle>
          <CardDescription>
            Measure the value and efficiency of AI automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={roiChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="period" />
                <PolarRadiusAxis />
                <Radar name="ROI (%)" dataKey="ROI (%)" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>

            <div className="space-y-4">
              <h4 className="font-semibold">ROI Summary</h4>
              {roiMetrics.map((metric) => (
                <div key={metric.period} className="space-y-2 p-4 border rounded-lg">
                  <div className="font-medium">{metric.period}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Time Saved</div>
                      <div className="font-medium">{metric.timeSaved}hrs</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Cost</div>
                      <div className="font-medium">${metric.costIncurred.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Tasks</div>
                      <div className="font-medium">{metric.tasksCompleted}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">ROI</div>
                      <div className="font-medium text-green-600">{metric.roi}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
