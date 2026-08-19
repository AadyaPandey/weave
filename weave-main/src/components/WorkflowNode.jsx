import React from "react";
import { Handle, Position } from "@xyflow/react";
import { MoreHorizontal } from "lucide-react";

export default function WorkflowNode({ data, selected }) {
  const Icon = data.icon;
  return (
    <div className={`node-card ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} className="node-handle" />
      <div className="node-top">
        <div className="node-icon" style={{ color: data.color }}>
          <Icon size={16} />
        </div>
        <div className="node-title-wrap">
          <div className="node-title">{data.title}</div>
          <div className="node-subtitle">{data.subtitle}</div>
        </div>
        <MoreHorizontal size={16} className="node-more" />
      </div>
      <div className="node-description">{data.description}</div>
      {data.backendType === "condition" ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Right}
            className="node-handle"
            style={{ top: "36%" }}
          />
          <Handle
            type="source"
            id="false"
            position={Position.Right}
            className="node-handle"
            style={{ top: "70%" }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="node-handle"
        />
      )}
    </div>
  );
}
