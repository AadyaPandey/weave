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

/* =========================================================
   FLOW 1
   HTTP GET → LLM → EMAIL → RESPONSE
   ========================================================= */

export const weatherEmailNodes = [
  {
    id: "http",
    type: "workflow",
    position: { x: 80, y: 180 },
    data: {
      title: "HTTP Request",
      subtitle: "GET Weather",
      icon: Globe,
      color: "#38bdf8",
      description: "Gets weather data for the entered city.",
      backendType: "http_request",

      config: {
        method: "GET",
        url: "https://countries.dev/alpha/IN",
        timeout: 20,
      },
    },
  },

  {
    id: "llm",
    type: "workflow",
    position: { x: 370, y: 180 },
    data: {
      title: "Run LLM",
      subtitle: "Analyze Weather",
      icon: Sparkles,
      color: "#a78bfa",
      description: "Analyzes the info returned by the HTTP request.",
      backendType: "llm",

      config: {
        model: "llama-3.3-70b-versatile",

        prompt:
          "Analyze the country information from the HTTP response. Tell me the country name, capital, currency, population, and region in a concise format.{nodes.analysis.output.output}",

        temperature: 0.2,
        source_node: "http",
      },
    },
  },

  {
    id: "email",
    type: "workflow",
    position: { x: 670, y: 180 },
    data: {
      title: "Send Email",
      subtitle: "Email",
      icon: Mail,
      color: "#60a5fa",
      description: "Sends the LLM analysis to Aadya.",
      backendType: "email",

      config: {
        sender_email: "",
        app_password: "",

        to: "aadyapandey2004@gmail.com",

        subject: " Analysis",

        body: "{{nodes.llm.output.output}}",

        body_source_node: "llm",
      },
    },
  },

  {
    id: "response",
    type: "workflow",
    position: { x: 970, y: 180 },
    data: {
      title: "HTTP Response",
      subtitle: "Final Output",
      icon: Activity,
      color: "#34d399",
      description: "Returns the email result.",
      backendType: "response",

      config: {
        value: "{{nodes.email.output}}",
        source_node: "email",
      },
    },
  },
];

/* =========================================================
   FLOW 1 EDGES
   ========================================================= */

export const weatherEmailEdges = [
  {
    id: "http-to-llm",
    source: "http",
    target: "llm",
    animated: true,
  },

  {
    id: "llm-to-email",
    source: "llm",
    target: "email",
    animated: true,
  },

  {
    id: "email-to-response",
    source: "email",
    target: "response",
    animated: true,
  },
];

/* =========================================================
   FLOW 2
   TEXT → LLM → CONDITION → EMAIL / RESPONSE
   ========================================================= */

export const conditionLLMNodes = [
  /* -------------------------------------------------------
     TEXT INPUT
     ------------------------------------------------------- */

  {
    id: "message",
    type: "workflow",
    position: { x: 80, y: 220 },

    data: {
      title: "Text Input",
      subtitle: "Customer Message",
      icon: FileText,
      color: "#60a5fa",

      description: "Provides the customer message to the LLM.",

      backendType: "text",

      config: {
        text: "My payment failed and I need urgent help with my account.",
      },
    },
  },

  /* -------------------------------------------------------
     LLM
     ------------------------------------------------------- */

  {
    id: "analysis",
    type: "workflow",
    position: { x: 360, y: 220 },

    data: {
      title: "Run LLM",
      subtitle: "Analyze Message",
      icon: Sparkles,
      color: "#a78bfa",

      description: "Analyzes the customer support message.",

      backendType: "llm",

      config: {
        model: "llama-3.3-70b-versatile",

        prompt:
          "Analyze this customer support message.\n\n" +
          "Determine whether the issue is urgent.\n\n" +
          "If the issue is urgent, you MUST include " +
          "the exact word 'urgent' in your response.\n\n" +
          "If the issue is not urgent, do NOT use " +
          "the word 'urgent'.\n\n" +
          "Then provide a short explanation.\n\n" +
          "Customer message:\n" +
          "{{nodes.message.output.text}}",

        temperature: 0.2,

        source_node: "message",
      },
    },
  },

  /* -------------------------------------------------------
     CONDITION
     ------------------------------------------------------- */

  {
    id: "condition",
    type: "workflow",
    position: { x: 650, y: 220 },

    data: {
      title: "Condition",
      subtitle: "Is Urgent?",
      icon: Code2,
      color: "#fb7185",

      description: "Checks whether the LLM marked the issue as urgent.",

      backendType: "condition",

      config: {
        left: "{{nodes.analysis.output.output}}",

        operator: "contains",

        right: "urgent",
      },
    },
  },

  /* -------------------------------------------------------
     TRUE → EMAIL
     ------------------------------------------------------- */

  {
    id: "urgent-email",
    type: "workflow",
    position: { x: 950, y: 100 },

    data: {
      title: "Send Email",
      subtitle: "Urgent Request",
      icon: Mail,
      color: "#60a5fa",

      description: "Emails the urgent customer request.",

      backendType: "email",

      config: {
        sender_email: "",
        app_password: "",

        to: "aadyapandey2004@gmail.com",

        subject: "URGENT Customer Support Request",

        body: "{{nodes.analysis.output.output}}",

        body_source_node: "analysis",
      },
    },
  },

  /* -------------------------------------------------------
     FALSE → RESPONSE
     ------------------------------------------------------- */

  {
    id: "normal-response",
    type: "workflow",
    position: { x: 950, y: 350 },

    data: {
      title: "HTTP Response",
      subtitle: "Normal Request",
      icon: Activity,
      color: "#34d399",

      description: "Returns the normal customer response.",

      backendType: "response",

      config: {
        value: "{{nodes.analysis.output.output}}",

        source_node: "analysis",
      },
    },
  },
];

/* =========================================================
   FLOW 2 EDGES

   message
      ↓
   analysis
      ↓
   condition
      ├── TRUE  → urgent-email
      └── FALSE → normal-response
   ========================================================= */

export const conditionLLMEdges = [
  /* Text → LLM */

  {
    id: "message-to-analysis",

    source: "message",

    target: "analysis",

    animated: true,
  },

  /* LLM → Condition */

  {
    id: "analysis-to-condition",

    source: "analysis",

    target: "condition",

    animated: true,
  },

  /* Condition TRUE → Email */

  {
    id: "condition-true",

    source: "condition",

    sourceHandle: "true",

    target: "urgent-email",

    animated: true,
  },

  /* Condition FALSE → Response */

  {
    id: "condition-false",

    source: "condition",

    sourceHandle: "false",

    target: "normal-response",

    animated: true,
  },
];

/* =========================================================
   WORKFLOW PRESETS
   ========================================================= */

export const workflowPresets = {
  weatherEmail: {
    name: "City Weather Email AI",

    nodes: weatherEmailNodes,

    edges: weatherEmailEdges,
  },

  conditionLLM: {
    name: "AI Customer Support",

    nodes: conditionLLMNodes,

    edges: conditionLLMEdges,
  },
};

/* =========================================================
   DEFAULT FLOW
   ========================================================= */

export const initialNodes = weatherEmailNodes;

export const initialEdges = weatherEmailEdges;

/* =========================================================
   SIDEBAR NODE PALETTE
   ========================================================= */

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

    config: {
      text: "{{input.message}}",
    },
  },

  {
    title: "Run LLM",
    subtitle: "AI",
    icon: Sparkles,
    color: "#a78bfa",
    backendType: "llm",

    config: {
      model: "llama-3.3-70b-versatile",

      prompt: "{{input.message}}",

      temperature: 0.2,
    },
  },

  {
    title: "Condition",
    subtitle: "Logic",
    icon: Code2,
    color: "#fb7185",
    backendType: "condition",

    config: {
      left: "{{input.message}}",

      operator: "contains",

      right: "",
    },
  },

  {
    title: "HTTP Request",
    subtitle: "API",
    icon: Globe,
    color: "#38bdf8",
    backendType: "http_request",

    config: {
      method: "GET",

      url: "https://httpbin.org/get",

      timeout: 20,
    },
  },

  {
    title: "Weather Lookup",
    subtitle: "Tool",
    icon: CloudSun,
    color: "#fbbf24",
    backendType: "weather",

    config: {
      city: "{{input.city}}",
    },
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

      subject: "",

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

    config: {
      operation: "identity",
    },
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

/* =========================================================
   NODE LOOKUP
   ========================================================= */

const nodeByType = Object.fromEntries(
  palette.map((item) => [item.backendType, item]),
);

/* =========================================================
   CONVERT BACKEND NODE → CANVAS NODE
   ========================================================= */

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
