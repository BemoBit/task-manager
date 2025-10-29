/**
 * Template Tree View Component
 * Displays template structure with sections and subsections
 */

'use client';

import React from 'react';
import { ChevronRight, ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Section } from '@/types/template';
import { useTemplateStore } from '@/store/templateStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TreeNodeProps {
  section: Section;
  level?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ section, level = 0 }) => {
  const { selectedSectionId, setSelectedSection, toggleSectionCollapse, deleteSection } =
    useTemplateStore((state) => ({
      selectedSectionId: state.editorState.selectedSectionId,
      setSelectedSection: state.setSelectedSection,
      toggleSectionCollapse: state.toggleSectionCollapse,
      deleteSection: state.deleteSection,
    }));

  const isSelected = selectedSectionId === section.id;
  const hasSubsections = section.subsections && section.subsections.length > 0;

  const handleClick = () => {
    setSelectedSection(section.id);
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasSubsections) {
      toggleSectionCollapse(section.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete section "${section.title}"?`)) {
      deleteSection(section.id);
    }
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors',
          isSelected && 'bg-accent border-l-2 border-primary',
          level > 0 && 'ml-4'
        )}
        onClick={handleClick}
      >
        <button
          onClick={handleToggleCollapse}
          className="flex-shrink-0 w-4 h-4"
          disabled={!hasSubsections}
        >
          {hasSubsections ? (
            section.isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )
          ) : (
            <span className="w-4" />
          )}
        </button>

        <GripVertical className="w-4 h-4 flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{section.title}</span>
            {section.type && section.type !== 'custom' && (
              <Badge variant="secondary" className="text-xs">
                {section.type}
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {hasSubsections && !section.isCollapsed && (
        <div className="mt-1">
          {section.subsections!.map((subsection) => (
            <TreeNode key={subsection.id} section={subsection} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const TemplateTreeView: React.FC = () => {
  const { template, addSection } = useTemplateStore((state) => ({
    template: state.history.present,
    addSection: state.addSection,
  }));

  const handleAddSection = () => {
    addSection({
      title: 'New Section',
      type: 'custom',
      content: '',
      subsections: [],
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-semibold">Template Structure</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAddSection}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {template.sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-sm text-muted-foreground mb-2">No sections yet</p>
            <Button variant="outline" size="sm" onClick={handleAddSection}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {template.sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <TreeNode key={section.id} section={section} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
