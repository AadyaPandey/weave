import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import {
  ArrowLeft,
  Copy,
  History,
  Play,
  Plus,
  Save,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import HistoryPanel from "../components/HistoryPanel";
import Inspector from "../components/Inspector";
import Sidebar from "../components/Sidebar";
import WorkflowNode from "../components/WorkflowNode";
import WorkflowsPanel from "../components/WorkflowsPanel";
import {
  canvasNodeFromWorkflow,
  initialEdges,
  initialNodes,
} from "../data/workflowCatalog";
import { workflowsApi } from "../api/workflows";

function configuredInputFields(nodes) {
  const fields = new Set();
  const inspect = (value) => {
    if (typeof value === "string") {
      for (const match of value.matchAll(/\{\{input\.([\w-]+)\}\}/g)) fields.add(match[1]);
    } else if (Array.isArray(value)) value.forEach(inspect);
    else if (value && typeof value === "object") Object.values(value).forEach(inspect);
  };
  nodes.forEach((node) => inspect(node.data.config));
  return [...fields];
}

function displayOutput(output) {
  if (typeof output === "string") return output;
  if (output && typeof output === "object") {
    return output.output ?? output.text ?? output.message ?? null;
  }
  return null;
}

export default function EditorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [workflowsOpen, setWorkflowsOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(true);
  const [workflowId, setWorkflowId] = useState(null);
  const [workflowName, setWorkflowName] = useState("Customer Support AI");
  const [runs, setRuns] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [notice, setNotice] = useState("");
  const [runInputOpen, setRunInputOpen] = useState(false);
  const [runInput, setRunInput] = useState({});
  const [runResult, setRunResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const importInputRef = useRef(null);
  const nodeTypes = useMemo(() => ({ workflow: WorkflowNode }), []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const selectedNode = nodes.find((node) => node.id === selectedId) || null;

  const asBackendWorkflow = () => ({
    name: workflowName.trim() || "Untitled Workflow",
    description: "Created in the Weave editor.",
    nodes: nodes.map(({ id, position, data }) => ({
      id,
      type: data.backendType,
      config: data.config || {},
      position,
    })),
    edges: edges.map(({ id, source, target, sourceHandle, targetHandle }) => ({
      id,
      source,
      target,
      source_handle: sourceHandle || null,
      target_handle: targetHandle || null,
    })),
  });

  const onConnect = useCallback(
    (params) => {
      setEdges((current) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#8b5cf6", strokeWidth: 2 },
          },
          current,
        ),
      );
      setSaved(false);
    },
    [setEdges],
  );
  const addNode = (item) => {
    const id = `${item.title.toLowerCase().replaceAll(" ", "-")}-${Date.now()}`;
    setNodes((current) => [
      ...current,
      {
        id,
        type: "workflow",
        position: {
          x: 250 + Math.random() * 350,
          y: 120 + Math.random() * 350,
        },
        data: {
          title: item.title,
          subtitle: item.subtitle,
          icon: item.icon,
          color: item.color,
          description: `Configure the ${item.title} node.`,
          backendType: item.backendType,
          config: { ...item.config },
        },
      },
    ]);
    setSelectedId(id);
    setSaved(false);
  };
  const updateNode = (id, patch) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...patch } } : node,
      ),
    );
    setSaved(false);
  };
  const deleteNode = (id) => {
    setNodes((current) => current.filter((node) => node.id !== id));
    setEdges((current) =>
      current.filter((edge) => edge.source !== id && edge.target !== id),
    );
    setSelectedId(null);
    setSaved(false);
  };
  const deleteEdge = (id = selectedEdgeId) => {
    if (!id) return;
    setEdges((current) => current.filter((edge) => edge.id !== id));
    setSelectedEdgeId(null);
    setSaved(false);
  };

  const saveWorkflow = async () => {
    try {
      const workflow = workflowId
        ? await workflowsApi.update(workflowId, asBackendWorkflow())
        : await workflowsApi.create(asBackendWorkflow());
      setWorkflowId(workflow.id);
      setSaved(true);
      setNotice(`Workflow #${workflow.id} saved.`);
      return workflow.id;
    } catch (error) {
      setNotice(`Save failed: ${error.message}`);
      return null;
    }
  };
  const loadRuns = async (id = workflowId) => {
    if (!id) return;
    try {
      setRuns(await workflowsApi.runs(id));
    } catch (error) {
      setNotice(`Could not load history: ${error.message}`);
    }
  };
  const loadWorkflows = async () => {
    try {
      setWorkflows(await workflowsApi.list());
    } catch (error) {
      setNotice(`Could not load workflows: ${error.message}`);
    }
  };
  const openWorkflows = async (open = true) => {
    setWorkflowsOpen(open);
    if (open) await loadWorkflows();
  };
  const openWorkflow = async (id) => {
    if (
      !saved &&
      !window.confirm("Discard unsaved changes and open another workflow?")
    )
      return;
    try {
      const workflow = await workflowsApi.get(id);
      setWorkflowId(workflow.id);
      setWorkflowName(workflow.name);
      setNodes(workflow.nodes.map(canvasNodeFromWorkflow));
      setEdges(
        workflow.edges.map((edge) => ({
          ...edge,
          sourceHandle: edge.source_handle || null,
          targetHandle: edge.target_handle || null,
          animated: true,
        })),
      );
      setSelectedId(null);
      setSelectedRun(null);
      setSaved(true);
      setWorkflowsOpen(false);
      setNotice(`Workflow #${workflow.id} loaded.`);
    } catch (error) {
      setNotice(`Could not open workflow: ${error.message}`);
    }
  };
  const newWorkflow = () => {
    if (
      !saved &&
      !window.confirm("Discard unsaved changes and create a new workflow?")
    )
      return;
    setWorkflowId(null);
    setWorkflowName("Untitled Workflow");
    setNodes([]);
    setEdges([]);
    setRuns([]);
    setSelectedId(null);
    setSaved(false);
    setWorkflowsOpen(false);
  };
  const deleteWorkflow = async (id) => {
    if (!window.confirm("Delete this workflow and all of its run history?"))
      return;
    try {
      await workflowsApi.remove(id);
      if (workflowId === id) newWorkflow();
      await loadWorkflows();
      setNotice(`Workflow #${id} deleted.`);
    } catch (error) {
      setNotice(`Could not delete workflow: ${error.message}`);
    }
  };
  const copyWorkflow = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(asBackendWorkflow(), null, 2),
      );
      setNotice("Workflow JSON copied to the clipboard.");
    } catch {
      setNotice("Could not access the clipboard.");
    }
  };
  const importWorkflow = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const workflow = JSON.parse(await file.text());
      if (!Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges))
        throw new Error("The file must contain nodes and edges arrays.");
      setWorkflowId(null);
      setWorkflowName(workflow.name || "Imported Workflow");
      setNodes(workflow.nodes.map(canvasNodeFromWorkflow));
      setEdges(
        workflow.edges.map((edge) => ({
          ...edge,
          sourceHandle: edge.source_handle || edge.sourceHandle || null,
          targetHandle: edge.target_handle || edge.targetHandle || null,
          animated: true,
        })),
      );
      setSaved(false);
      setNotice("Workflow imported. Click Save to store it in the backend.");
    } catch (error) {
      setNotice(`Import failed: ${error.message}`);
    }
  };
  const selectRun = async (run) => {
    try {
      setSelectedRun(await workflowsApi.runDetail(run.id));
    } catch (error) {
      setNotice(`Could not load run details: ${error.message}`);
    }
  };
  const beginRun = () => {
    const fields = configuredInputFields(nodes);
    setRunInput(Object.fromEntries(fields.map((field) => [field, ""])));
    setRunInputOpen(true);
  };
  const runWorkflow = async () => {
    setRunning(true);
    try {
      const id = saved && workflowId ? workflowId : await saveWorkflow();
      if (!id) return;
      const result = await workflowsApi.execute(id, runInput);
      setRunResult(result);
      setRunInputOpen(false);
      await loadRuns(id);
    } catch (error) {
      setNotice(`Run failed: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onAddNode={addNode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onShowWorkflows={openWorkflows}
        onShowExecutions={() => {
          setHistoryOpen(true);
          loadRuns();
        }}
      />
      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="back-button"
              onClick={() => openWorkflows(true)}
              title="All workflows"
            >
              <ArrowLeft size={17} />
            </button>
            <span className="muted">Workflows</span>
            <span className="crumb-separator">/</span>
            <input
              className="workflow-name"
              value={workflowName}
              onChange={(event) => {
                setWorkflowName(event.target.value);
                setSaved(false);
              }}
              aria-label="Workflow name"
            />
            <span className={`status-dot ${saved ? "" : "unsaved"}`} />
            <span className="muted small">
              {saved ? "Saved" : "Unsaved changes"}
            </span>
          </div>
          <div className="top-actions">
            <button
              className="secondary-button"
              onClick={() => {
                setHistoryOpen(!historyOpen);
                loadRuns();
              }}
            >
              <History size={16} /> History
            </button>
            <button className="secondary-button" onClick={saveWorkflow}>
              <Save size={16} /> Save
            </button>
            <button
              className="run-button"
              onClick={beginRun}
              disabled={running}
            >
              <Play size={15} fill="currentColor" />
              {running ? "Running..." : "Run workflow"}
            </button>
          </div>
        </header>
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        <div className="editor-layout">
          <section className="canvas">
            <div className="canvas-toolbar">
              <div className="toolbar-pill">
                <Zap size={14} />
                <span>Draft workflow</span>
              </div>
              <div className="canvas-tools">
                {(selectedId || selectedEdgeId) && <button className="tool-button delete-selection" onClick={() => selectedEdgeId ? deleteEdge() : deleteNode(selectedId)} title={selectedEdgeId ? "Delete selected connection" : "Delete selected node"}><Trash2 size={15} /></button>}
                <button
                  className="tool-button"
                  onClick={copyWorkflow}
                  title="Copy workflow JSON"
                >
                  <Copy size={15} />
                </button>
                <button
                  className="tool-button"
                  onClick={() => importInputRef.current?.click()}
                  title="Import workflow JSON"
                >
                  <Upload size={15} />
                </button>
                <button
                  className="tool-button"
                  onClick={newWorkflow}
                  title="New workflow"
                >
                  <Plus size={15} />
                </button>
                <input
                  ref={importInputRef}
                  className="visually-hidden"
                  type="file"
                  accept="application/json,.json"
                  onChange={importWorkflow}
                />
              </div>
            </div>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={(changes) => {
                onNodesChange(changes);
                if (
                  changes.some(
                    (change) => change.type === "position" && change.dragging,
                  )
                )
                  setSaved(false);
              }}
              onEdgesChange={(changes) => {
                onEdgesChange(changes);
                if (changes.some((change) => change.type === "remove"))
                  setSaved(false);
              }}
              onConnect={onConnect}
              onNodeClick={(_, node) => { setSelectedId(node.id); setSelectedEdgeId(null); }}
              onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedId(null); }}
              onPaneClick={() => { setSelectedId(null); setSelectedEdgeId(null); }}
              onKeyDown={(event) => { if ((event.key === "Backspace" || event.key === "Delete") && selectedEdgeId) { event.preventDefault(); deleteEdge(); } }}
              fitView
              colorMode="dark"
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: "#52525b", strokeWidth: 2 },
              }}
            >
              <Background color="#202024" gap={28} size={1} />
              <Controls />
              <MiniMap
                nodeColor={(node) => node.data?.color || "#52525b"}
                maskColor="rgba(0,0,0,0.75)"
              />
            </ReactFlow>
            <div className="canvas-hint">
              <span>Drag nodes to arrange</span>
              <span>•</span>
              <span>Connect handles to create a workflow</span>
            </div>
          </section>
          {selectedNode && (
            <Inspector
              node={selectedNode}
              onClose={() => setSelectedId(null)}
              onUpdate={updateNode}
              onDelete={deleteNode}
              nodes={nodes}
              edges={edges}
            />
          )}
          {historyOpen && (
            <HistoryPanel
              workflowId={workflowId}
              runs={runs}
              selectedRun={selectedRun}
              onClose={() => setHistoryOpen(false)}
              onSelectRun={selectRun}
            />
          )}
          {workflowsOpen && (
            <WorkflowsPanel
              workflows={workflows}
              onClose={() => setWorkflowsOpen(false)}
              onNew={newWorkflow}
              onOpen={openWorkflow}
              onDelete={deleteWorkflow}
            />
          )}
        </div>
        {runInputOpen && (
          <div className="run-input-overlay" role="dialog" aria-modal="true" aria-labelledby="run-workflow-title">
            <form className="run-input-dialog" onSubmit={(event) => { event.preventDefault(); runWorkflow(); }}>
              <div className="run-input-header">
                <div><div className="eyebrow">RUN WORKFLOW</div><h3 id="run-workflow-title">Provide run-time values</h3></div>
                <button type="button" className="icon-button" onClick={() => setRunInputOpen(false)}>×</button>
              </div>
              <p className="run-input-copy">Only fields marked <strong>Run input</strong> in node settings appear here. Values from connected nodes continue automatically.</p>
              {Object.keys(runInput).length ? Object.keys(runInput).map((field) => (
                <label className="friendly-field" key={field}><span className="field-label">{field}</span><textarea className="field textarea compact-textarea" value={runInput[field]} onChange={(event) => setRunInput((current) => ({ ...current, [field]: event.target.value }))} placeholder={`Enter ${field}…`} autoFocus={Object.keys(runInput)[0] === field} /></label>
              )) : <div className="no-run-input">This workflow does not need any run-time values.</div>}
              <div className="run-input-actions"><button type="button" className="secondary-button" onClick={() => setRunInputOpen(false)}>Cancel</button><button className="run-button" disabled={running}><Play size={15} fill="currentColor" /> {running ? "Running..." : "Run workflow"}</button></div>
            </form>
          </div>
        )}
        {runResult && (
          <div className="result-toast" role="status">
            <div className="result-toast-head"><div><div className="eyebrow">LATEST OUTPUT</div><strong>Run #{runResult.run_id} completed</strong></div><button className="icon-button" onClick={() => setRunResult(null)}>×</button></div>
            {displayOutput(runResult.output) !== null ? <div className="result-message">{displayOutput(runResult.output)}</div> : <pre>{JSON.stringify(runResult.output, null, 2)}</pre>}
            <button className="result-history-link" onClick={() => { setHistoryOpen(true); loadRuns(); }}>View execution details →</button>
          </div>
        )}
      </main>
    </div>
  );
}
