import React from 'react';
import {Button, Flex, Space} from "antd";

export const Sidebar = () => {
    const onDragStart = (event: any, nodeType: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <Space style={{ margin: "15px" }}>
            <Flex vertical gap={2}>
                <Button className="dndnode input" onDragStart={(event) => onDragStart(event, 'input')} draggable>
                    Input Node
                </Button>
                <Button className="dndnode" onDragStart={(event) => onDragStart(event, 'default')} draggable>
                    Default Node
                </Button>
                <Button className="dndnode output" onDragStart={(event) => onDragStart(event, 'output')} draggable>
                    Output Node
                </Button>
            </Flex>
        </Space>

    );
};
