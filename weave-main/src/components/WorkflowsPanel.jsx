import React from "react";
import { Plus, Trash2 } from "lucide-react";

export default function WorkflowsPanel({
  workflows,
  onClose,
  onNew,
  onOpen,
  onDelete,
}) {
  return (
    <aside className="history-panel workflows-panel">
      <div className="inspector-header">
        <div>
          <div className="eyebrow">WORKFLOWS</div>
          <h3>Saved workflows</h3>
        </div>
        <button className="icon-button" onClick={onClose}>
          ×
        </button>
      </div>
      <button className="secondary-button full-width" onClick={onNew}>
        <Plus size={15} /> New workflow
      </button>
      {workflows.length === 0 && (
        <p className="muted small">No saved workflows yet.</p>
      )}
      {workflows.map((workflow) => (
        <div className="workflow-list-item" key={workflow.id}>
          <button onClick={() => onOpen(workflow.id)}>
            <strong>{workflow.name}</strong>
            <span>{workflow.description || "No description"}</span>
          </button>
          <button
            className="icon-button"
            onClick={() => onDelete(workflow.id)}
            title="Delete workflow"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </aside>
  );
}
