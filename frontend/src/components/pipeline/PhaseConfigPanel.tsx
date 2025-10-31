'use client';

import React, { useState, useEffect } from 'react';
import { Phase } from '@/types/pipeline';
import { usePipelineStore } from '@/store/pipelineStore';
import { motion, AnimatePresence } from 'framer-motion';
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
import { FaTimes, FaSave } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PhaseConfigPanelProps {
  phaseId: string;
  onClose: () => void;
}

export default function PhaseConfigPanel({ phaseId, onClose }: PhaseConfigPanelProps) {
  const { pipeline, updatePhase } = usePipelineStore();
  const phase = pipeline?.phases.find((p) => p.id === phaseId);

  const [formData, setFormData] = useState<Partial<Phase>>(phase || {});

  // Suppress the ESLint warning - this is intentional for form initialization
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (phase) {
      setFormData(phase);
    }
  }, [phaseId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  if (!phase) return null;

  const handleSave = () => {
    updatePhase(phaseId, formData);
    onClose();
  };

  const handleChange = (field: keyof Phase, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-bold">Configure Phase</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <FaTimes className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Phase Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter phase name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter phase description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Phase Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange('type', value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                      <SelectItem value="loop">Loop</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="skipped">Skipped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === 'loop' && (
                <div className="space-y-2">
                  <Label htmlFor="iterations">Iterations</Label>
                  <Input
                    id="iterations"
                    type="number"
                    value={formData.iterations || 1}
                    onChange={(e) => handleChange('iterations', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
              )}

              {formData.type === 'conditional' && (
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Input
                    id="condition"
                    value={formData.condition || ''}
                    onChange={(e) => handleChange('condition', e.target.value)}
                    placeholder="e.g., task.status === 'completed'"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateId">Template ID</Label>
                  <Input
                    id="templateId"
                    value={formData.config?.templateId || ''}
                    onChange={(e) =>
                      handleChange('config', {
                        ...formData.config,
                        templateId: e.target.value,
                      })
                    }
                    placeholder="Optional template ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiProviderId">AI Provider ID</Label>
                  <Input
                    id="aiProviderId"
                    value={formData.config?.aiProviderId || ''}
                    onChange={(e) =>
                      handleChange('config', {
                        ...formData.config,
                        aiProviderId: e.target.value,
                      })
                    }
                    placeholder="Optional AI provider ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={formData.config?.timeout || 300}
                    onChange={(e) =>
                      handleChange('config', {
                        ...formData.config,
                        timeout: parseInt(e.target.value),
                      })
                    }
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retryCount">Retry Count</Label>
                  <Input
                    id="retryCount"
                    type="number"
                    value={formData.config?.retryCount || 3}
                    onChange={(e) =>
                      handleChange('config', {
                        ...formData.config,
                        retryCount: parseInt(e.target.value),
                      })
                    }
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <FaSave className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
