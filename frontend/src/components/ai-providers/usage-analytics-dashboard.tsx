'use client';

import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAIProviderStore } from '@/store/aiProviderStore';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export function UsageAnalyticsDashboard() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  
  const usageStats = useAIProviderStore((state) => state.usageStats);
  const analytics = useAIProviderStore((state) => state.analytics);
  const isLoadingAnalytics = useAIProviderStore((state) => state.isLoadingAnalytics);
  const fetchAnalytics = useAIProviderStore((state) => state.fetchAnalytics);
  
  React.useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);
  
  // Calculate totals
  const totals = usageStats.reduce(
    (acc, stat) => ({
      requests: acc.requests + stat.totalRequests,
      successful: acc.successful + stat.successfulRequests,
      failed: acc.failed + stat.failedRequests,
      tokens: acc.tokens + stat.totalTokensUsed,
      cost: acc.cost + stat.totalCost,
    }),
    { requests: 0, successful: 0, failed: 0, tokens: 0, cost: 0 }
  );
  
  const successRate = totals.requests > 0 ? (totals.successful / totals.requests) * 100 : 0;
  const avgResponseTime = usageStats.length > 0
    ? usageStats.reduce((sum, stat) => sum + stat.averageResponseTime, 0) / usageStats.length
    : 0;
  
  // Provider distribution data for pie chart
  const providerDistribution = usageStats.map((stat) => ({
    name: stat.providerName,
    value: stat.totalRequests,
  }));
  
  // Cost breakdown data
  const costBreakdown = usageStats.map((stat) => ({
    name: stat.providerName,
    cost: stat.totalCost,
    requests: stat.totalRequests,
  }));
  
  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usage Analytics</h2>
          <p className="text-muted-foreground">
            Monitor AI provider performance and costs
          </p>
        </div>
        <Select value={period} onValueChange={(value: typeof period) => setPeriod(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.requests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totals.successful} successful, {totals.failed} failed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {totals.successful} successful requests
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              Across all providers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.cost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totals.tokens.toLocaleString()} tokens used
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Distribution</CardTitle>
                <CardDescription>Requests by provider</CardDescription>
              </CardHeader>
              <CardContent>
                {providerDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={providerDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: unknown) => {
                          const e = entry as { name: string; percent: number };
                          return `${e.name} ${(e.percent * 100).toFixed(0)}%`;
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {providerDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Request Trends</CardTitle>
                <CardDescription>Requests over time</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="requestCount"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Requests"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {isLoadingAnalytics ? 'Loading...' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Success vs Failed Requests</CardTitle>
              <CardDescription>By provider</CardDescription>
            </CardHeader>
            <CardContent>
              {usageStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="providerName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="successfulRequests" fill="#10b981" name="Successful" />
                    <Bar dataKey="failedRequests" fill="#ef4444" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Response Time</CardTitle>
              <CardDescription>By provider (milliseconds)</CardDescription>
            </CardHeader>
            <CardContent>
              {usageStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="providerName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="averageResponseTime" fill="#8b5cf6" name="Avg Response Time (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Response Time Trends</CardTitle>
              <CardDescription>Over time</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics && analytics.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="averageResponseTime"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Avg Response Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {isLoadingAnalytics ? 'Loading...' : 'No data available'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>By provider</CardDescription>
            </CardHeader>
            <CardContent>
              {costBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `$${value.toFixed(4)}`}
                    />
                    <Legend />
                    <Bar dataKey="cost" fill="#f59e0b" name="Cost ($)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cost Trends</CardTitle>
                <CardDescription>Over time</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value: number) => `$${value.toFixed(4)}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Cost ($)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {isLoadingAnalytics ? 'Loading...' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
                <CardDescription>Over time</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="tokenCount"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        name="Tokens"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {isLoadingAnalytics ? 'Loading...' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
