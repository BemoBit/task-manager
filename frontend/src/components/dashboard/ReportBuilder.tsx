'use client';

import { useState } from 'react';
import { Report } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Calendar,
  Mail,
  FileText,
  Trash2,
  Edit,
  Download,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReportBuilderProps {
  reports: Report[];
  onCreateReport?: (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateReport?: (reportId: string, updates: Partial<Report>) => void;
  onDeleteReport?: (reportId: string) => void;
  onGenerateReport?: (reportId: string) => void;
  className?: string;
}

const reportTypes = [
  { value: 'task-summary', label: 'Task Summary' },
  { value: 'ai-usage', label: 'AI Usage' },
  { value: 'cost-analysis', label: 'Cost Analysis' },
  { value: 'performance', label: 'Performance' },
  { value: 'custom', label: 'Custom' },
];

const reportFormats = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
];

const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function ReportBuilder({
  reports,
  onCreateReport,
  onUpdateReport,
  onDeleteReport,
  onGenerateReport,
  className,
}: ReportBuilderProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    type: 'task-summary' as Report['type'],
    format: 'pdf' as Report['format'],
    recipients: [] as string[],
    schedule: {
      enabled: false,
      frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
      time: '09:00',
    },
  });

  const handleCreateReport = () => {
    if (!newReport.name) {
      toast.error('Please enter a report name');
      return;
    }

    onCreateReport?.({
      ...newReport,
      filters: {},
    });

    setIsCreateDialogOpen(false);
    setNewReport({
      name: '',
      description: '',
      type: 'task-summary',
      format: 'pdf',
      recipients: [],
      schedule: {
        enabled: false,
        frequency: 'weekly',
        time: '09:00',
      },
    });
    toast.success('Report created successfully');
  };

  const handleToggleSchedule = (reportId: string, enabled: boolean) => {
    const report = reports.find(r => r.id === reportId);
    if (report?.schedule) {
      onUpdateReport?.(reportId, {
        schedule: { ...report.schedule, enabled },
      });
      toast.success(enabled ? 'Schedule enabled' : 'Schedule disabled');
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-muted-foreground">
            Generate and schedule automated reports
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>
                Configure your report settings and schedule
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  placeholder="Weekly Task Summary"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this report contains..."
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Report Type</Label>
                  <Select
                    value={newReport.type}
                    onValueChange={(value) => setNewReport({ ...newReport, type: value as Report['type'] })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={newReport.format}
                    onValueChange={(value) => setNewReport({ ...newReport, format: value as Report['format'] })}
                  >
                    <SelectTrigger id="format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="schedule-enabled">Schedule Report</Label>
                  <Switch
                    id="schedule-enabled"
                    checked={newReport.schedule.enabled}
                    onCheckedChange={(enabled: boolean) =>
                      setNewReport({
                        ...newReport,
                        schedule: { ...newReport.schedule, enabled },
                      })
                    }
                  />
                </div>

                {newReport.schedule.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select
                        value={newReport.schedule.frequency}
                        onValueChange={(value) =>
                          setNewReport({
                            ...newReport,
                            schedule: {
                              ...newReport.schedule,
                              frequency: value as 'daily' | 'weekly' | 'monthly',
                            },
                          })
                        }
                      >
                        <SelectTrigger id="frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencies.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newReport.schedule.time}
                        onChange={(e) =>
                          setNewReport({
                            ...newReport,
                            schedule: { ...newReport.schedule, time: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReport}>Create Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reports yet</p>
              <p className="text-sm text-muted-foreground">Create your first report to get started</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{report.name}</CardTitle>
                    {report.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {report.description}
                      </CardDescription>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{report.type}</Badge>
                  <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                </div>

                {report.schedule && report.schedule.enabled && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {report.schedule.frequency} at {report.schedule.time}
                    </span>
                  </div>
                )}

                {report.lastGenerated && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Last generated {formatDistanceToNow(new Date(report.lastGenerated), { addSuffix: true })}
                    </span>
                  </div>
                )}

                {report.recipients.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{report.recipients.length} recipients</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onGenerateReport?.(report.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                  
                  {report.schedule && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleSchedule(report.id, !report.schedule?.enabled)}
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this report?')) {
                        onDeleteReport?.(report.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
