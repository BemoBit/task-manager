'use client';

import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Phase } from '@/types/pipeline';
import { usePipelineStore } from '@/store/pipelineStore';
import PhaseNode from './PhaseNode';
import PhaseConfigPanel from './PhaseConfigPanel';
import { Button } from '@/components/ui/button';
import { FaPlusCircle } from 'react-icons/fa';

interface PipelineBuilderProps {
  onPhaseClick?: (phaseId: string) => void;
}

const nodeTypes: NodeTypes = {
  phaseNode: PhaseNode,
};

export default function PipelineBuilder({ onPhaseClick }: PipelineBuilderProps) {
  const { pipeline, addPhase, updatePhase, connectPhases, disconnectPhases, setSelectedPhase } =
    usePipelineStore();
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [configPhaseId, setConfigPhaseId] = useState<string | null>(null);

  // Convert phases to React Flow nodes
  const phasesToNodes = useCallback((phases: Phase[]): Node[] => {
    return phases.map((phase) => ({
      id: phase.id,
      type: 'phaseNode',
      position: phase.position,
      data: {
        phase,
        onEdit: (id: string) => {
          setConfigPhaseId(id);
          setShowConfigPanel(true);
        },
      },
    }));
  }, []);

  const getEdgeColor = (status: Phase['status']) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'running':
        return '#3b82f6';
      case 'failed':
        return '#ef4444';
      case 'skipped':
        return '#6b7280';
      default:
        return '#94a3b8';
    }
  };

  // Convert phase connections to React Flow edges
  const phasesToEdges = useCallback((phases: Phase[]): Edge[] => {
    const edges: Edge[] = [];
    phases.forEach((phase) => {
      phase.connections.forEach((targetId) => {
        edges.push({
          id: `${phase.id}-${targetId}`,
          source: phase.id,
          target: targetId,
          type: 'smoothstep',
          animated: phase.status === 'running',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: {
            stroke: getEdgeColor(phase.status),
            strokeWidth: 2,
          },
        });
      });
    });
    return edges;
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    pipeline ? phasesToNodes(pipeline.phases) : []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    pipeline ? phasesToEdges(pipeline.phases) : []
  );

  // Update nodes and edges when pipeline changes
  React.useEffect(() => {
    if (pipeline) {
      setNodes(phasesToNodes(pipeline.phases));
      setEdges(phasesToEdges(pipeline.phases));
    }
  }, [pipeline, phasesToNodes, phasesToEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        connectPhases(connection.source, connection.target);
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: 'smoothstep',
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            },
            eds
          )
        );
      }
    },
    [connectPhases, setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedPhase(node.id);
      if (onPhaseClick) {
        onPhaseClick(node.id);
      }
    },
    [setSelectedPhase, onPhaseClick]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updatePhase(node.id, {
        position: node.position,
      });
    },
    [updatePhase]
  );

  const onAddPhase = useCallback(() => {
    const newPhase: Omit<Phase, 'id'> = {
      name: `Phase ${(pipeline?.phases.length || 0) + 1}`,
      description: 'New phase',
      type: 'standard',
      status: 'pending',
      order: pipeline?.phases.length || 0,
      config: {
        parameters: {},
      },
      progress: 0,
      position: {
        x: Math.random() * 500,
        y: Math.random() * 300,
      },
      connections: [],
    };
    addPhase(newPhase);
  }, [addPhase, pipeline]);

  const onEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      disconnectPhases(edge.source, edge.target);
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    },
    [disconnectPhases, setEdges]
  );

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button onClick={onAddPhase} size="sm" className="shadow-lg">
          <FaPlusCircle className="mr-2 h-4 w-4" />
          Add Phase
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onEdgeDoubleClick={onEdgeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const phase = pipeline?.phases.find((p) => p.id === node.id);
            if (!phase) return '#94a3b8';

            switch (phase.status) {
              case 'completed':
                return '#10b981';
              case 'running':
                return '#3b82f6';
              case 'failed':
                return '#ef4444';
              case 'pending':
                return '#f59e0b';
              case 'skipped':
                return '#6b7280';
              default:
                return '#94a3b8';
            }
          }}
        />
      </ReactFlow>

      {showConfigPanel && configPhaseId && (
        <PhaseConfigPanel
          phaseId={configPhaseId}
          onClose={() => {
            setShowConfigPanel(false);
            setConfigPhaseId(null);
          }}
        />
      )}
    </div>
  );
}
