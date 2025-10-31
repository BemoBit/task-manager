/**
 * Variable Manager Component
 * Manages template variables with autocomplete and validation
 */

'use client';

import React, { useState } from 'react';
import { useTemplateStore } from '@/store/templateStore';
import { Variable, VariableType, VariableScope } from '@/types/template';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VariableManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VariableManager: React.FC<VariableManagerProps> = ({ open, onOpenChange }) => {
  // Split selectors to avoid creating new objects on every render
  const variables = useTemplateStore((state) => state.history.present.globalVariables);
  const addVariable = useTemplateStore((state) => state.addVariable);
  const updateVariable = useTemplateStore((state) => state.updateVariable);
  const deleteVariable = useTemplateStore((state) => state.deleteVariable);

  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<Partial<Variable>>({
    name: '',
    type: 'string',
    scope: 'global',
    description: '',
    required: false,
    defaultValue: '',
  });

  const handleSubmit = () => {
    if (!formData.name) return;

    if (editingVariable) {
      updateVariable(editingVariable.id, (draft) => {
        Object.assign(draft, formData);
      });
    } else {
      addVariable(formData as Omit<Variable, 'id'>);
    }

    setShowForm(false);
    setEditingVariable(null);
    setFormData({
      name: '',
      type: 'string',
      scope: 'global',
      description: '',
      required: false,
      defaultValue: '',
    });
  };

  const handleEdit = (variable: Variable) => {
    setEditingVariable(variable);
    setFormData(variable);
    setShowForm(true);
  };

  const handleDelete = (variableId: string) => {
    if (confirm('Delete this variable?')) {
      deleteVariable(variableId);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVariable(null);
    setFormData({
      name: '',
      type: 'string',
      scope: 'global',
      description: '',
      required: false,
      defaultValue: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Variable Manager</DialogTitle>
          <DialogDescription>
            Define and manage variables for your template. Use {`{{variableName}}`} syntax to
            reference them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 h-[500px]">
          {/* Variables List */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold">Variables ({variables.length})</h4>
              {!showForm && (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              )}
            </div>

            <ScrollArea className="h-[calc(100%-3rem)]">
              {variables.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No variables defined yet
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {variables.map((variable) => (
                    <Card key={variable.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-medium">{`{{${variable.name}}}`}</span>
                            <Badge variant="secondary" className="text-xs">
                              {variable.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {variable.scope}
                            </Badge>
                          </div>
                          {variable.description && (
                            <p className="text-xs text-muted-foreground">{variable.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(variable)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDelete(variable.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Variable Form */}
          {showForm && (
            <div className="flex-1 border-l pl-4">
              <h4 className="text-sm font-semibold mb-4">
                {editingVariable ? 'Edit Variable' : 'New Variable'}
              </h4>

              <ScrollArea className="h-[calc(100%-3rem)]">
                <div className="space-y-4 pr-4">
                  <div className="space-y-2">
                    <Label htmlFor="var-name">Variable Name</Label>
                    <Input
                      id="var-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., projectName"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="var-type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: VariableType) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger id="var-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="array">Array</SelectItem>
                        <SelectItem value="object">Object</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="var-scope">Scope</Label>
                    <Select
                      value={formData.scope}
                      onValueChange={(value: VariableScope) =>
                        setFormData({ ...formData, scope: value })
                      }
                    >
                      <SelectTrigger id="var-scope">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global</SelectItem>
                        <SelectItem value="section">Section</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="var-description">Description</Label>
                    <Textarea
                      id="var-description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Describe the variable purpose"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="var-default">Default Value</Label>
                    <Input
                      id="var-default"
                      value={String(formData.defaultValue || '')}
                      onChange={(e) =>
                        setFormData({ ...formData, defaultValue: e.target.value })
                      }
                      placeholder="Optional default value"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSubmit} className="flex-1">
                      {editingVariable ? 'Update' : 'Add'} Variable
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
