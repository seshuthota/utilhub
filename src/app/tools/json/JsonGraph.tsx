'use client';

import React, { useMemo } from 'react';
import { Canvas, Node, Edge, MarkerArrow, Label } from 'reaflow';
import { useInputSize } from '@/hooks/useInputSize';

interface JsonGraphProps {
    data: any;
}

interface GraphData {
    nodes: NodeData[];
    edges: EdgeData[];
}

interface NodeData {
    id: string;
    text: string;
    parent?: string;
    width?: number;
    height?: number;
    data?: any;
    className?: string; // Add className property
}

interface EdgeData {
    id: string;
    from: string;
    to: string;
    parent?: string;
}

const MAX_NODES = 500; // Safety limit
const MAX_DEPTH = 10;

export default function JsonGraph({ data }: JsonGraphProps) {
    const { nodes, edges } = useMemo(() => {
        let nodeId = 0;
        const nodes: NodeData[] = [];
        const edges: EdgeData[] = [];

        // Simple validation to ensure data is an object or array
        if (typeof data !== 'object' || data === null) {
            return {
                nodes: [
                    {
                        id: 'root',
                        text: String(data),
                        width: 150,
                        height: 50,
                        className: 'node-primitive'
                    }
                ],
                edges: []
            };
        }

        const traverse = (obj: any, parentId: string | null = null, depth = 0, label: string = '') => {
            if (nodes.length > MAX_NODES || depth > MAX_DEPTH) return;

            const currentId = `n-${nodeId++}`;
            const isArray = Array.isArray(obj);
            const isObject = typeof obj === 'object' && obj !== null;

            let nodeText = label || (isArray ? 'Array' : 'Object');
            let nodeData = obj;
            let width = 200;
            let height = 60; // Base height
            let className = 'node-object';

            // Primitive values
            if (!isObject) {
                nodeText = `${label ? label + ': ' : ''}${String(obj)}`;
                width = Math.min(Math.max(nodeText.length * 10, 150), 400); // Dynamic width
                className = 'node-primitive';
            } else if (label) {
                nodeText = label;
            }

            // Calculate dynamic height for objects to show some content preview if desired, 
            // but for graph view clearer structure is usually better.
            // We'll keep it simple for now: Key/Type as label.


            nodes.push({
                id: currentId,
                text: nodeText,
                width,
                height,
                data: nodeData,
                className
            });

            if (parentId) {
                edges.push({
                    id: `e-${parentId}-${currentId}`,
                    from: parentId,
                    to: currentId
                });
            }

            if (isObject) {
                const keys = Object.keys(obj);
                keys.forEach(key => {
                    traverse(obj[key], currentId, depth + 1, isArray ? `[${key}]` : key);
                });
            }
        };

        // Root
        traverse(data, null, 0, 'Root');

        return { nodes, edges };
    }, [data]);

    if (nodes.length === 0) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No data to display</div>
    }

    if (nodes.length >= MAX_NODES) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--warning-color)' }}>JSON too large to visualize graph (Max {MAX_NODES} nodes). showing partial or filtered view.</div>
    }


    return (
        <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)' }}>
            <Canvas
                nodes={nodes}
                edges={edges}
                maxWidth={99999}
                maxHeight={99999}
                direction="RIGHT"
                zoomable={true}
                pannable={true}
                layoutOptions={{
                    "elk.algorithm": "org.eclipse.elk.layered",
                    "elk.direction": "RIGHT",
                    "elk.spacing.nodeNode": "30",
                    "elk.layered.spacing.nodeNodeBetweenLayers": "50"
                }}
                node={(nodeProps) => (
                    <Node
                        {...nodeProps}
                        style={{
                            fill: 'var(--bg-primary)',
                            stroke: 'var(--border-color)',
                            strokeWidth: 1,
                            rx: 6,
                            ry: 6
                        }}
                        label={<Label style={{ fill: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-mono)' }} />}
                    />
                )}
                edge={(edgeProps) => (
                    <Edge
                        {...edgeProps}
                        markerEnd={<MarkerArrow style={{ fill: 'var(--border-color)' }} />}
                        style={{ stroke: 'var(--border-color)' }}
                    />
                )}
            />
        </div>
    );
}
