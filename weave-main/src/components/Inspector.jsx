import { ChevronDown, Link2, Settings2, Trash2, UserRound } from "lucide-react";
import React, { useState } from "react";

const MODELS = [
  { value: "openai/gpt-oss-120b", label: "GPT OSS 120B" },
  { value: "openai/gpt-oss-20b", label: "GPT OSS 20B" },
  { value: "qwen/qwen3-32b", label: "Qwen 3 32B" },
];

function connectionOptions(node, nodes, edges) {
  const incoming = edges
    .filter((edge) => edge.target === node.id)
    .map((edge) => nodes.find((item) => item.id === edge.source))
    .filter(Boolean);
  return incoming;
}

function nodeOutputPath(node) {
  if (!node) return "";
  if (node.data.backendType === "text") return `{{nodes.${node.id}.output.text}}`;
  if (node.data.backendType === "llm") return `{{nodes.${node.id}.output.output}}`;
  return `{{nodes.${node.id}.output}}`;
}

function Field({ label, hint, children }) {
  return (
    <div className="friendly-field">
      <label className="field-label">{label}</label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

function SourceSelect({ value, options, onChange, emptyLabel = "Choose connected node" }) {
  return (
    <div className="source-select-wrap">
      <select className="field source-select" value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">{emptyLabel}</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.data.title}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="source-select-icon" />
    </div>
  );
}

function inputKey(value, fallback = "message") {
  return value?.match(/^\{\{input\.([\w-]+)\}\}$/)?.[1] || fallback;
}

function ValueSource({ value, incoming, nodes, onChange, inputFallback = "message", placeholder = "Enter a value…" }) {
  const fromInput = /^\{\{input\./.test(value || "");
  const fromNode = /^\{\{nodes\./.test(value || "");
  const selectedId = value?.match(/^\{\{nodes\.([^.]+)\./)?.[1] || "";
  const [mode, setMode] = useState(fromNode ? "node" : fromInput ? "input" : "manual");
  const switchMode = (next) => {
    setMode(next);
    if (next === "input") onChange(`{{input.${inputKey(value, inputFallback)}}}`);
    if (next === "node") onChange(incoming[0] ? nodeOutputPath(incoming[0]) : "");
  };
  return <div className="value-source">
    <div className="source-tabs">
      <button type="button" className={mode === "manual" ? "active" : ""} onClick={() => switchMode("manual")}>Type it</button>
      <button type="button" className={mode === "input" ? "active" : ""} onClick={() => switchMode("input")}><UserRound size={12} /> Run input</button>
      <button type="button" className={mode === "node" ? "active" : ""} onClick={() => switchMode("node")} disabled={!incoming.length}><Link2 size={12} /> Previous node</button>
    </div>
    {mode === "manual" && <textarea className="field textarea compact-textarea" value={fromInput || fromNode ? "" : value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />}
    {mode === "input" && <div className="input-key-row"><span>Input field</span><input className="field" value={inputKey(value, inputFallback)} onChange={(e) => onChange(`{{input.${e.target.value.replace(/\s/g, "_") || inputFallback}}}`)} /></div>}
    {mode === "node" && <SourceSelect value={selectedId} options={incoming} onChange={(id) => onChange(id ? nodeOutputPath(nodes.find((item) => item.id === id)) : "")} emptyLabel="Choose a connected node" />}
  </div>;
}

export default function Inspector({ node, nodes = [], edges = [], onClose, onUpdate, onDelete }) {
  if (!node)
    return (
      <aside className="inspector empty-inspector">
        <div className="empty-state">
          <Settings2 size={24} />
          <strong>Select a node</strong>
          <span>Node settings will appear here.</span>
        </div>
      </aside>
    );

  const Icon = node.data.icon;
  const config = node.data.config || {};
  const incoming = connectionOptions(node, nodes, edges);
  const updateConfig = (patch) => onUpdate(node.id, { config: { ...config, ...patch } });
  const sourceNode = nodes.find((item) => item.id === config.source_node) || incoming[0];

  const renderConfiguration = () => {
    switch (node.data.backendType) {
      case "text":
        return (
          <>
            <Field label="Text">
              <ValueSource value={config.text || ""} incoming={incoming} nodes={nodes} onChange={(text) => updateConfig({ text })} placeholder="Enter the text to use…" />
            </Field>
            <div className="token-hint"><span>How it works</span> Choose whether this value is typed here, collected when the workflow runs, or comes from a connected node.</div>
          </>
        );
      case "weather":
        return (
          <Field label="Location" hint="Enter a city, or connect an input node that provides the city.">
            <ValueSource value={config.city || ""} incoming={incoming} nodes={nodes} onChange={(city) => updateConfig({ city })} inputFallback="city" placeholder="e.g. Lucknow" />
          </Field>
        );
      case "llm": {
        const promptSourceId = (config.prompt || "").match(/\{\{nodes\.([^.}]+)\.output/)?.[1];
        const selected = nodes.find((item) => item.id === (config.source_node || promptSourceId));
        // The two newlines before the node token are UI-generated. Remove them
        // together so editing does not insert a blank line after every keystroke.
        const instructions = (config.prompt || "").replace(/\n{0,2}\{\{nodes\.[^}]+\}\}/g, "");
        return (
          <>
            <Field label="Model">
              <select className="field" value={config.model || "openai/gpt-oss-120b"} onChange={(e) => updateConfig({ model: e.target.value })}>
                {MODELS.map((model) => <option key={model.value} value={model.value}>{model.label}</option>)}
              </select>
            </Field>
            <Field label="Input" hint="Choose the connected result the model should use.">
              <SourceSelect value={selected?.id || ""} options={incoming} onChange={(id) => {
                const source = nodes.find((item) => item.id === id);
                updateConfig({ source_node: id || undefined, prompt: `${instructions}${id ? `${instructions ? "\n\n" : ""}${nodeOutputPath(source)}` : ""}` });
              }} />
            </Field>
            <Field label="Instructions" hint="The selected input is added automatically. Tell the model what to do with it.">
              <textarea className="field textarea" value={instructions} onChange={(e) => updateConfig({ source_node: selected?.id || undefined, prompt: `${e.target.value}${selected ? `${e.target.value ? "\n\n" : ""}${nodeOutputPath(selected)}` : ""}` })} placeholder="e.g. Write a helpful reply…" />
            </Field>
            <Field label="Temperature" hint="Lower values are more consistent; higher values are more creative.">
              <input className="field" type="number" min="0" max="2" step="0.1" value={config.temperature ?? 0.2} onChange={(e) => updateConfig({ temperature: Number(e.target.value) })} />
            </Field>
          </>
        );
      }
      case "email": {
        const selected = nodes.find((item) => item.id === config.body_source_node);
        return (
          <>
            <Field label="From">
              <input className="field" type="email" value={config.sender_email || ""} onChange={(e) => updateConfig({ sender_email: e.target.value })} placeholder="you@gmail.com" />
            </Field>
            <Field label="App password" hint="Stored in the workflow for now. Use a Gmail App Password, not your normal password.">
              <input className="field" type="password" value={config.app_password || ""} onChange={(e) => updateConfig({ app_password: e.target.value })} placeholder="•••• •••• •••• ••••" autoComplete="new-password" />
            </Field>
            <Field label="To">
              <input className="field" type="email" value={config.to || ""} onChange={(e) => updateConfig({ to: e.target.value })} placeholder="recipient@example.com" />
            </Field>
            <Field label="Subject" hint="Use a clear fixed subject for this email.">
              <input className="field" value={config.subject || "Weave workflow update"} onChange={(e) => updateConfig({ subject: e.target.value })} placeholder="Weave workflow update" />
            </Field>
            <Field label="Message" hint="Choose the connected node that should become the email body.">
              <SourceSelect value={selected?.id || ""} options={incoming} onChange={(id) => updateConfig({ body_source_node: id || undefined, body: id ? nodeOutputPath(nodes.find((item) => item.id === id)) : "" })} />
            </Field>
            <Field label="Or write a message">
              <textarea className="field textarea" value={config.body && !config.body_source_node ? config.body : ""} onChange={(e) => updateConfig({ body: e.target.value, body_source_node: undefined })} placeholder="Type the email body…" />
            </Field>
            <div className="connection-status">{sourceNode ? <><span className="status-check">✓</span> Message connected from <strong>{sourceNode.data.title}</strong></> : <>Connect a node to use its output as the message.</>}</div>
          </>
        );
      }
      case "response": {
        const selected = nodes.find((item) => item.id === config.source_node);
        return (
          <Field label="Return" hint="Choose what this workflow should return.">
            <SourceSelect value={selected?.id || ""} options={incoming} onChange={(id) => updateConfig({ source_node: id || undefined, value: id ? nodeOutputPath(nodes.find((item) => item.id === id)) : "" })} />
          </Field>
        );
      }
      case "condition":
        return (
          <>
            <Field label="Check">
              <input className="field" value={config.left || ""} onChange={(e) => updateConfig({ left: e.target.value })} placeholder="Value to check" />
            </Field>
            <Field label="Operator">
              <select className="field" value={config.operator || "equals"} onChange={(e) => updateConfig({ operator: e.target.value })}>
                {['equals','not_equals','contains','exists','greater_than','less_than'].map((op) => <option key={op}>{op.replaceAll('_',' ')}</option>)}
              </select>
            </Field>
            <Field label="Against">
              <input className="field" value={config.right || ""} onChange={(e) => updateConfig({ right: e.target.value })} placeholder="Comparison value" />
            </Field>
          </>
        );
      case "http_request":
        return (
          <>
            <Field label="Method"><select className="field" value={config.method || "GET"} onChange={(e) => updateConfig({ method: e.target.value })}>{['GET','POST','PUT','PATCH','DELETE'].map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="URL"><input className="field" value={config.url || ""} onChange={(e) => updateConfig({ url: e.target.value })} placeholder="https://api.example.com" /></Field>
          </>
        );
      case "transform":
        return (
          <Field label="Operation"><select className="field" value={config.operation || "identity"} onChange={(e) => updateConfig({ operation: e.target.value })}>{['identity','uppercase','lowercase','stringify','parse_json','pick'].map((op) => <option key={op}>{op.replaceAll('_',' ')}</option>)}</select></Field>
        );
      default:
        return <div className="empty-config">This node has no setup required. Connect it to the next step to use its output.</div>;
    }
  };

  return (
    <aside className="inspector">
      <div className="inspector-header">
        <div><div className="eyebrow">NODE SETTINGS</div><h3>{node.data.title}</h3></div>
        <button className="icon-button" onClick={onClose}>×</button>
      </div>
      <div className="inspector-icon-row">
        <div className="large-node-icon" style={{ color: node.data.color }}><Icon size={22} /></div>
        <div><div className="inspector-node-title">{node.data.title}</div><div className="muted">{node.data.subtitle}</div></div>
      </div>
      <Field label="Node name"><input className="field" value={node.data.title} onChange={(e) => onUpdate(node.id, { title: e.target.value })} /></Field>
      <Field label="Description"><textarea className="field textarea" value={node.data.description} onChange={(e) => onUpdate(node.id, { description: e.target.value })} /></Field>
      <div className="inspector-divider" />
      <div className="field-label">Configuration</div>
      <div className="friendly-config">{renderConfiguration()}</div>
      <button className="danger-button" onClick={() => onDelete(node.id)}><Trash2 size={15} /> Delete node</button>
    </aside>
  );
}
