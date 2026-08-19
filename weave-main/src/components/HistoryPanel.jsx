import React from "react";

export default function HistoryPanel({
  workflowId,
  runs,
  selectedRun,
  onClose,
  onSelectRun,
}) {
  const output = selectedRun?.output;
  const friendlyOutput = typeof output === "string" ? output : output?.output ?? output?.text ?? null;
  return (
    <aside className="history-panel">
      <div className="inspector-header">
        <div>
          <div className="eyebrow">EXECUTIONS</div>
          <h3>Run history</h3>
        </div>
        <button className="icon-button" onClick={onClose}>
          ×
        </button>
      </div>
      {!workflowId && (
        <p className="muted small">Save the workflow to see its run history.</p>
      )}
      {runs.map((run) => (
        <button
          className={`history-item ${selectedRun?.id === run.id ? "selected" : ""}`}
          key={run.id}
          onClick={() => onSelectRun(run)}
        >
          <div
            className={`run-status ${run.status === "COMPLETED" ? "success" : "failed"}`}
          />
          <div className="history-main">
            <strong>Run #{run.id}</strong>
            <span>{run.status}</span>
          </div>
          <span className="history-time">
            {new Date(run.started_at).toLocaleString()}
          </span>
        </button>
      ))}
      {selectedRun && (
        <div className="run-detail">
          <div className="field-label">RESULT</div>
          {friendlyOutput ? <div className="run-output-message">{friendlyOutput}</div> : <pre>{JSON.stringify(output || selectedRun.error || "No output was recorded.", null, 2)}</pre>}
          {!!selectedRun.node_runs?.length && <>
            <div className="field-label">STEPS</div>
            <div className="run-steps">{selectedRun.node_runs.map((nodeRun) => <div className={`run-step ${nodeRun.status === "COMPLETED" ? "complete" : "failed"}`} key={nodeRun.id}><span /> <div><strong>{nodeRun.node_type.replaceAll("_", " ")}</strong><small>{nodeRun.status}</small></div></div>)}</div>
          </>}
        </div>
      )}
    </aside>
  );
}
