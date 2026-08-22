import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  Handle,
  Position,
} from "@xyflow/react";
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  Clock3,
  CloudSun,
  Code2,
  Copy,
  Database,
  FileText,
  Folder,
  Globe,
  History,
  Image,
  LayoutDashboard,
  Mail,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  Save,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  User,
  Webhook,
  Zap,
} from "lucide-react";
import { workflowsApi } from "./api/workflows";
import weaveBrand from "./assets/weave-brand.png";
import LandingPage from "./LandingPage";
const initialNodes = [
  {
    id: "trigger",
    type: "workflow",
    position: { x: 80, y: 180 },
    data: {
      title: "Webhook Trigger",
      subtitle: "Start workflow",
      icon: Webhook,
      color: "#f59e0b",
      description: "Receives an HTTP request and starts the workflow.",
      backendType: "manual_trigger",
      config: {},
    },
  },
  {
    id: "text",
    type: "workflow",
    position: { x: 370, y: 180 },
    data: {
      title: "Text Input",
      subtitle: "Input",
      icon: FileText,
      color: "#60a5fa",
      description: "Provides text that can be passed to the next node.",
      backendType: "text",
      config: { text: "{{input.message}}" },
    },
  },
  {
    id: "llm",
    type: "workflow",
    position: { x: 670, y: 180 },
    data: {
      title: "Run LLM",
      subtitle: "AI",
      icon: Sparkles,
      color: "#a78bfa",
      description: "Send the incoming text to an LLM and return the response.",
      backendType: "llm",
      config: {
        prompt: "Answer this customer message: {{nodes.text.output.text}}",
      },
    },
  },
  {
    id: "output",
    type: "workflow",
    position: { x: 970, y: 180 },
    data: {
      title: "HTTP Response",
      subtitle: "Output",
      icon: Globe,
      color: "#34d399",
      description: "Returns the final workflow output.",
      backendType: "response",
      config: { value: "{{nodes.llm.output.output}}" },
    },
  },
];

const initialEdges = [
  { id: "e1", source: "trigger", target: "text", animated: true },
  { id: "e2", source: "text", target: "llm", animated: true },
  { id: "e3", source: "llm", target: "output", animated: true },
];

const palette = [
  {
    title: "Manual trigger",
    subtitle: "Trigger",
    icon: Webhook,
    color: "#f59e0b",
    backendType: "manual_trigger",
    config: {},
  },
  {
    title: "Text",
    subtitle: "Input",
    icon: FileText,
    color: "#60a5fa",
    backendType: "text",
    config: { text: "{{input.message}}" },
  },
  {
    title: "Run LLM",
    subtitle: "AI",
    icon: Sparkles,
    color: "#a78bfa",
    backendType: "llm",
    config: { prompt: "{{input.message}}" },
  },
  {
    title: "Condition",
    subtitle: "Logic",
    icon: Code2,
    color: "#fb7185",
    backendType: "condition",
    config: { left: "{{input.message}}", operator: "contains", right: "" },
  },
  {
    title: "HTTP Request",
    subtitle: "API",
    icon: Globe,
    color: "#38bdf8",
    backendType: "http_request",
    config: { method: "GET", url: "https://httpbin.org/get" },
  },
  {
    title: "Weather Lookup",
    subtitle: "Tool",
    icon: CloudSun,
    color: "#fbbf24",
    backendType: "weather",
    config: { city: "{{input.city}}" },
  },
  {
    title: "Send Email",
    subtitle: "Tool",
    icon: Mail,
    color: "#60a5fa",
    backendType: "email",
    config: {
      sender_email: "",
      app_password: "",
      to: "",
      body: "{{current.output}}",
    },
  },
  {
    title: "Transform",
    subtitle: "Logic",
    icon: Zap,
    color: "#22d3ee",
    backendType: "transform",
    config: { operation: "identity" },
  },
  {
    title: "Response",
    subtitle: "Output",
    icon: Activity,
    color: "#34d399",
    backendType: "response",
    config: {},
  },
];

const nodeByType = Object.fromEntries(
  palette.map((item) => [item.backendType, item]),
);

function canvasNodeFromWorkflow(node, index) {
  const item = nodeByType[node.type] || palette[0];
  return {
    id: node.id,
    type: "workflow",
    position: node.position || {
      x: 100 + (index % 3) * 290,
      y: 120 + Math.floor(index / 3) * 190,
    },
    data: {
      title: item.title,
      subtitle: item.subtitle,
      icon: item.icon,
      color: item.color,
      description: `Configure the ${item.title} node.`,
      backendType: node.type,
      config: node.config || {},
    },
  };
}

function WorkflowNode({ data, selected }) {
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

function Sidebar({
  collapsed,
  setCollapsed,
  onAddNode,
  searchTerm,
  setSearchTerm,
  onShowWorkflows,
  onShowExecutions,
}) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="brand-row">
        {!collapsed && (
          <div className="brand">
            <img className="brand-lockup" src={weaveBrand} alt="weave" />
          </div>
        )}
        <button
          className="icon-button"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>

      <nav className="main-nav">
        <button
          className="nav-item active"
          onClick={() => onShowWorkflows(false)}
        >
          <LayoutDashboard size={18} />
          {!collapsed && <span>Editor</span>}
        </button>
        <button className="nav-item" onClick={() => onShowWorkflows(true)}>
          <Folder size={18} />
          {!collapsed && <span>Workflows</span>}
        </button>
        <button className="nav-item" onClick={onShowExecutions}>
          <Activity size={18} />
          {!collapsed && <span>Executions</span>}
        </button>
      </nav>

      {!collapsed && (
        <>
          <div className="section-label">BUILD</div>
          <div className="search-box">
            <Search size={15} />
            <input
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="node-palette">
            {palette
              .filter((item) =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase()),
              )
              .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    className="palette-item"
                    onClick={() => onAddNode(item)}
                  >
                    <div className="palette-icon" style={{ color: item.color }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="palette-title">{item.title}</div>
                      <div className="palette-subtitle">{item.subtitle}</div>
                    </div>
                    <Plus size={14} className="palette-plus" />
                  </button>
                );
              })}
          </div>
        </>
      )}

      {/* <div className="sidebar-bottom">
        <div className="nav-item">
          <Settings2 size={18} />
          {!collapsed && <span>Settings</span>}
        </div>
        <div className="profile">
          <div className="avatar">S</div>
          {!collapsed && (
            <div>
              <div className="profile-name">Swapnil</div>
              <div className="profile-plan">Free plan</div>
            </div>
          )}
        </div>
      </div> */}
    </aside>
  );
}

function Inspector({ node, onClose, onUpdate, onDelete }) {
  if (!node) {
    return (
      <aside className="inspector empty-inspector">
        <div className="empty-state">
          <Settings2 size={24} />
          <strong>Select a node</strong>
          <span>Node settings will appear here.</span>
        </div>
      </aside>
    );
  }

  const Icon = node.data.icon;

  return (
    <aside className="inspector">
      <div className="inspector-header">
        <div>
          <div className="eyebrow">NODE SETTINGS</div>
          <h3>{node.data.title}</h3>
        </div>
        <button className="icon-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="inspector-icon-row">
        <div className="large-node-icon" style={{ color: node.data.color }}>
          <Icon size={22} />
        </div>
        <div>
          <div className="inspector-node-title">{node.data.title}</div>
          <div className="muted">{node.data.subtitle}</div>
        </div>
      </div>

      <label className="field-label">Node name</label>
      <input
        className="field"
        value={node.data.title}
        onChange={(e) => onUpdate(node.id, { title: e.target.value })}
      />

      <label className="field-label">Description</label>
      <textarea
        className="field textarea"
        value={node.data.description}
        onChange={(e) => onUpdate(node.id, { description: e.target.value })}
      />

      <div className="inspector-divider" />

      <div className="field-label">Configuration</div>
      <textarea
        className="field textarea config-editor"
        key={node.id}
        defaultValue={JSON.stringify(node.data.config || {}, null, 2)}
        onBlur={(e) => {
          try {
            onUpdate(node.id, { config: JSON.parse(e.target.value) });
          } catch {
            e.currentTarget.setCustomValidity(
              "Configuration must be valid JSON.",
            );
            e.currentTarget.reportValidity();
          }
        }}
        onInput={(e) => e.currentTarget.setCustomValidity("")}
        spellCheck="false"
      />
      <p className="config-help">
        Backend type: <code>{node.data.backendType}</code>. Use{" "}
        <code>{"{{input.message}}"}</code> and{" "}
        <code>{"{{nodes.nodeId.output}}"}</code> in values.
      </p>

      <button className="danger-button" onClick={() => onDelete(node.id)}>
        <Trash2 size={15} /> Delete node
      </button>
    </aside>
  );
}

function App() {
  const [showLanding, setShowLanding] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(true);
  const [workflowId, setWorkflowId] = useState(null);
  const [workflowName, setWorkflowName] = useState("Customer Support AI");
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [workflowsOpen, setWorkflowsOpen] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const importInputRef = useRef(null);

  const nodeTypes = useMemo(() => ({ workflow: WorkflowNode }), []);

  const selectedNode = nodes.find((node) => node.id === selectedId) || null;
  const onConnect = useCallback(
    (params) => {
      setEdges((current) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#b58cff", strokeWidth: 2 },
          },
          current,
        ),
      );
      setSaved(false);
    },
    [setEdges],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLanding(false);
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  const addNode = (item) => {
    const id = `${item.title.toLowerCase().replaceAll(" ", "-")}-${Date.now()}`;
    const newNode = {
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
        config: item.config,
      },
    };
    setNodes((current) => [...current, newNode]);
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

  const selectRun = async (run) => {
    try {
      setSelectedRun(await workflowsApi.runDetail(run.id));
    } catch (error) {
      setNotice(`Could not load run details: ${error.message}`);
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

  const runWorkflow = async () => {
    setRunning(true);

    try {
      const id = saved && workflowId ? workflowId : await saveWorkflow();
      if (!id) return;

      const result = await workflowsApi.execute(id, {});
      setNotice(
        `Run #${result.run_id} completed: ${JSON.stringify(result.output)}`,
      );
      await loadRuns(id);
    } catch (error) {
      setNotice(`Run failed: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  if (showLanding) {
    return (
      <div className="landing-screen">
        <div className="landing-glow" />

        <img src={weaveBrand} alt="Weave" className="landing-logo" />
      </div>
    );
  }

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
              onChange={(e) => {
                setWorkflowName(e.target.value);
                setSaved(false);
              }}
              aria-label="Workflow name"
            />
            <span className="status-dot" />
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
              onClick={runWorkflow}
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
                if (changes.some((c) => c.type === "position" && c.dragging))
                  setSaved(false);
              }}
              onEdgesChange={(changes) => {
                onEdgesChange(changes);
                if (changes.some((change) => change.type === "remove"))
                  setSaved(false);
              }}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedId(node.id)}
              onPaneClick={() => setSelectedId(null)}
              deleteKeyCode={["Backspace", "Delete"]}
              fitView
              colorMode="dark"
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: "#675488", strokeWidth: 2 },
              }}
            >
              <Background color="#3a2e51" gap={28} size={1} />
              <Controls />
              <MiniMap
                nodeColor={(node) => node.data?.color || "#675488"}
                maskColor="rgba(12,9,20,0.82)"
              />
            </ReactFlow>

            <div className="canvas-hint">
              <span>Drag nodes to arrange</span>
              <span>•</span>
              <span>Connect handles to create a workflow</span>
              <span>•</span>
              <span>Select a connection and press Delete to remove it</span>
            </div>
          </section>

          {selectedNode && (
            <Inspector
              node={selectedNode}
              onClose={() => setSelectedId(null)}
              onUpdate={updateNode}
              onDelete={deleteNode}
            />
          )}

          {historyOpen && (
            <aside className="history-panel">
              <div className="inspector-header">
                <div>
                  <div className="eyebrow">EXECUTIONS</div>
                  <h3>Run history</h3>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setHistoryOpen(false)}
                >
                  ×
                </button>
              </div>

              {!workflowId && (
                <p className="muted small">
                  Save the workflow to see its run history.
                </p>
              )}
              {runs.map((run) => (
                <button
                  className={`history-item ${selectedRun?.id === run.id ? "selected" : ""}`}
                  key={run.id}
                  onClick={() => selectRun(run)}
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
                  <div className="field-label">RUN OUTPUT</div>
                  <pre>
                    {JSON.stringify(
                      selectedRun.output ||
                        selectedRun.error ||
                        "No output was recorded.",
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}
              {false &&
                [
                  ["Successful", "12.4s", "2 minutes ago", "success"],
                  ["Successful", "8.1s", "Yesterday", "success"],
                  ["Failed", "3.7s", "Yesterday", "failed"],
                  ["Successful", "11.2s", "Aug 13", "success"],
                ].map(([name, duration, time, status], index) => (
                  <div className="history-item" key={index}>
                    <div className={`run-status ${status}`} />
                    <div className="history-main">
                      <strong>
                        Run #{String(104 - index).padStart(3, "0")}
                      </strong>
                      <span>
                        {name} · {duration}
                      </span>
                    </div>
                    <span className="history-time">{time}</span>
                  </div>
                ))}
            </aside>
          )}

          {workflowsOpen && (
            <aside className="history-panel workflows-panel">
              <div className="inspector-header">
                <div>
                  <div className="eyebrow">WORKFLOWS</div>
                  <h3>Saved workflows</h3>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setWorkflowsOpen(false)}
                >
                  ×
                </button>
              </div>
              <button
                className="secondary-button full-width"
                onClick={newWorkflow}
              >
                <Plus size={15} /> New workflow
              </button>
              {workflows.length === 0 && (
                <p className="muted small">No saved workflows yet.</p>
              )}
              {workflows.map((workflow) => (
                <div className="workflow-list-item" key={workflow.id}>
                  <button onClick={() => openWorkflow(workflow.id)}>
                    <strong>{workflow.name}</strong>
                    <span>{workflow.description || "No description"}</span>
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => deleteWorkflow(workflow.id)}
                    title="Delete workflow"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
