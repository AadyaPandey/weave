import {
  Activity,
  CloudSun,
  Code2,
  FileText,
  Globe,
  Mail,
  Sparkles,
  Webhook,
  Zap,
} from "lucide-react";

export const initialNodes = [
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
        model: "llama-3.3-70b-versatile",
        prompt: "Answer this customer message: {{nodes.text.output.text}}",
        temperature: 0.2,
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

export const initialEdges = [
  { id: "e1", source: "trigger", target: "text", animated: true },
  { id: "e2", source: "text", target: "llm", animated: true },
  { id: "e3", source: "llm", target: "output", animated: true },
];

export const palette = [
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
    config: { model: "llama-3.3-70b-versatile", prompt: "{{input.message}}", temperature: 0.2 },
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
      body: "",
      body_source_node: "",
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

export function canvasNodeFromWorkflow(node, index) {
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
