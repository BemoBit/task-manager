/**
 * Section Builder Component with Drag and Drop
 * Allows creating and reordering sections
 */

'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Section, DefaultSectionType } from '@/types/template';
import { useTemplateStore } from '@/store/templateStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SortableSectionProps {
  section: Section;
}

const SortableSection: React.FC<SortableSectionProps> = ({ section }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const { setSelectedSection, selectedSectionId } = useTemplateStore((state) => ({
    setSelectedSection: state.setSelectedSection,
    selectedSectionId: state.editorState.selectedSectionId,
  }));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = selectedSectionId === section.id;

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card
        className={`p-4 cursor-pointer hover:border-primary/50 transition-colors ${
          isSelected ? 'border-primary border-2' : ''
        }`}
        onClick={() => setSelectedSection(section.id)}
      >
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{section.title}</h4>
            {section.type && <p className="text-xs text-muted-foreground mt-1">{section.type}</p>}
          </div>
        </div>
      </Card>
    </div>
  );
};

const DEFAULT_SECTIONS: Array<{ type: DefaultSectionType; title: string; content: string }> = [
  {
    type: 'data-model',
    title: 'Data Model Definition',
    content: 'Define the data structures, entities, and relationships',
  },
  {
    type: 'services',
    title: 'Services Architecture',
    content: 'Outline the services, modules, and their responsibilities',
  },
  {
    type: 'http-api',
    title: 'HTTP/API Requests',
    content: 'Specify API endpoints, request/response formats',
  },
  {
    type: 'tests',
    title: 'Test Scenarios',
    content: 'Define test cases and validation scenarios',
  },
];

export const SectionBuilder: React.FC = () => {
  const { sections, addSection, reorderSections } = useTemplateStore((state) => ({
    sections: state.history.present.sections,
    addSection: state.addSection,
    reorderSections: state.reorderSections,
  }));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(sections, oldIndex, newIndex);
      reorderSections(newOrder.map((s) => s.id));
    }
  };

  const handleAddDefaultSection = (sectionType: DefaultSectionType) => {
    const template = DEFAULT_SECTIONS.find((s) => s.type === sectionType);
    if (template) {
      addSection({
        title: template.title,
        type: template.type,
        content: template.content,
        subsections: [],
      });
    }
  };

  const handleAddCustomSection = () => {
    addSection({
      title: 'New Custom Section',
      type: 'custom',
      content: '',
      subsections: [],
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Sections</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAddDefaultSection('data-model')}>
              Data Model Definition
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddDefaultSection('services')}>
              Services Architecture
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddDefaultSection('http-api')}>
              HTTP/API Requests
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddDefaultSection('tests')}>
              Test Scenarios
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddCustomSection}>Custom Section</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">No sections yet</p>
          <Button variant="outline" onClick={handleAddCustomSection}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Section
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <SortableSection key={section.id} section={section} />
              ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
