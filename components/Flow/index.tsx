"use client"

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {addEdge, Background, Controls, ReactFlow, useEdgesState, useNodesState} from "reactflow";
import 'reactflow/dist/style.css';
import {Button, Drawer, Flex, Modal, Select} from "antd";
import {YMaps, Map, useYMaps} from "@pbe/react-yandex-maps";
import MapComponent from "@/components/MapComponent";
import {Sidebar} from "@/components/Flow/Sidebar";

const initialNodes = [
    {
        id: '1',
        type: 'input',
        data: { label: 'input node' },
        position: { x: 250, y: 5 },
    },
];

let id = 0;
const getId = () => `dndnode_${id++}`;
const snapGrid: [number, number] = [20, 20];

const Flow = () => {
    const [open, setOpen] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any | null>(null);

    const onConnect = useCallback(
        (params: any) => setEdges((eds) => addEdge(params, eds)),
        [],
    );

    const onDragOver = useCallback((event: any) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: any) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            // reactFlowInstance.project was renamed to reactFlowInstance.screenToFlowPosition
            // and you don't need to subtract the reactFlowBounds.left/top anymore
            // details: https://reactflow.dev/whats-new/2023-11-10
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            const newNode = {
                id: getId(),
                type,
                position,
                data: { label: `${type} node` },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance],
    );

    return (
        <>
            <div>
                <Sidebar/>
                <Drawer title="Basic Drawer" placement="right" onClose={() => setOpen(false)} open={open}>
                    <Flex vertical gap={8}>
                        <Select
                            options={[
                                {value: 'jack', label: 'Jack'},
                                {value: 'lucy', label: 'Lucy'},
                                {value: 'Yiminghe', label: 'yiminghe'},
                                {value: 'disabled', label: 'Disabled', disabled: true},
                            ]}
                        />
                        <Button onClick={() => setOpenModal(true)}>Open modal</Button>
                    </Flex>
                </Drawer>
                <Modal
                    open={openModal}
                    title="Title"
                    onCancel={() => setOpenModal(false)}
                    footer={[]}
                    width={900}
                >
                    <YMaps query={{
                        load: 'package.full',
                    }}>
                        <MapComponent/>
                    </YMaps>
                </Modal>
            </div>
            <div style={{width: '100%', height: '100%'}} ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    snapGrid={snapGrid}
                    snapToGrid
                    fitView
                    onNodeClick={() => setOpen(true)}
                >
                    <Background/>
                    <Controls/>
                </ReactFlow>
            </div>

        </>
    );
};

export default Flow;