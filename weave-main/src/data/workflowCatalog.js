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
   ========================================================= */

export const conditionLLMEdges = [
  {
    id: "message-to-analysis",
    source: "message",
    target: "analysis",
    animated: true,
  },

  {
    id: "analysis-to-condition",
    source: "analysis",
    target: "condition",
    animated: true,
  },

  {
    id: "condition-true",
    source: "condition",
    sourceHandle: "true",
    target: "urgent-email",
    animated: true,
  },

  {
    id: "condition-false",
    source: "condition",
    sourceHandle: "false",
    target: "normal-response",
    animated: true,
  },
];

/* =========================================================
   FLOW 3
   HTTP GET → LLM → RESPONSE
   NO EMAIL
   ========================================================= */

export const countryAnalysisNodes = [
  {
    id: "http",
    type: "workflow",
    position: { x: 80, y: 180 },
    data: {
      title: "HTTP Request",
      subtitle: "GET Country Info",
      icon: Globe,
      color: "#38bdf8",
      description: "Gets country information from the API.",
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
    position: { x: 390, y: 180 },
    data: {
      title: "Run LLM",
      subtitle: "Analyze Country",
      icon: Sparkles,
      color: "#a78bfa",
      description: "Analyzes the country information.",
      backendType: "llm",
      config: {
        model: "llama-3.3-70b-versatile",
        prompt:
          "Analyze the country information returned by the HTTP request.\n\n" +
          "Return:\n" +
          "- Country name\n" +
          "- Capital\n" +
          "- Currency\n" +
          "- Population\n" +
          "- Region\n\n" +
          "Keep the answer concise.\n\n" +
          "Country information:\n" +
          "{{nodes.http.output.data}}",
        temperature: 0.2,
        source_node: "http",
      },
    },
  },

  {
    id: "response",
    type: "workflow",
    position: { x: 700, y: 180 },
    data: {
      title: "HTTP Response",
      subtitle: "Country Analysis",
      icon: Activity,
      color: "#34d399",
      description: "Returns the country analysis.",
      backendType: "response",
      config: {
        value: "{{nodes.llm.output.output}}",
        source_node: "llm",
      },
    },
  },
];

export const countryAnalysisEdges = [
  {
    id: "http-to-llm",
    source: "http",
    target: "llm",
    animated: true,
  },

  {
    id: "llm-to-response",
    source: "llm",
    target: "response",
    animated: true,
  },
];

/* =========================================================
   FLOW 4
   TEXT → LLM → CONDITION → RESPONSE / RESPONSE
   NO EMAIL
   ========================================================= */

/* =========================================================
   FLOW 4
   TEXT → LLM → CONDITION
                 ↓ TRUE  → LLM FIX SUGGESTION → RESPONSE
                 ↓ FALSE → RESPONSE
   NO EMAIL
   ========================================================= */

export const supportDecisionNodes = [
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

  {
    id: "analysis",
    type: "workflow",
    position: { x: 360, y: 220 },
    data: {
      title: "Run LLM",
      subtitle: "Analyze Message",
      icon: Sparkles,
      color: "#a78bfa",
      description: "Determines whether the customer issue is urgent.",
      backendType: "llm",
      config: {
        model: "llama-3.3-70b-versatile",
        prompt:
          "Analyze this customer support message.\n\n" +
          "Determine whether the issue is urgent.\n\n" +
          "If urgent, include the exact word 'urgent' in your response.\n" +
          "If not urgent, do not use the word 'urgent'.\n\n" +
          "Then give a short explanation.\n\n" +
          "Customer message:\n" +
          "{{nodes.message.output.text}}",
        temperature: 0.2,
        source_node: "message",
      },
    },
  },

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
     TRUE → SECOND LLM
     ------------------------------------------------------- */

  {
    id: "fix-suggestion",
    type: "workflow",
    position: { x: 950, y: 100 },
    data: {
      title: "Run LLM",
      subtitle: "Suggest Fixes",
      icon: Sparkles,
      color: "#a78bfa",
      description: "Suggests possible fixes for the urgent issue.",
      backendType: "llm",
      config: {
        model: "llama-3.3-70b-versatile",
        prompt:
          "You are a customer support assistant.\n\n" +
          "The following customer issue has been identified as urgent.\n\n" +
          "Analyze the issue and suggest practical possible fixes.\n\n" +
          "Provide:\n" +
          "1. The likely cause\n" +
          "2. Immediate steps the customer can try\n" +
          "3. What the customer should do if the issue continues\n\n" +
          "Keep the suggestions concise and actionable.\n\n" +
          "Original customer message:\n" +
          "{{nodes.message.output.text}}\n\n" +
          "Urgency analysis:\n" +
          "{{nodes.analysis.output.output}}",
        temperature: 0.2,
        source_node: "analysis",
      },
    },
  },

  /* -------------------------------------------------------
     TRUE → RESPONSE
     ------------------------------------------------------- */

  {
    id: "urgent-response",
    type: "workflow",
    position: { x: 1240, y: 100 },
    data: {
      title: "HTTP Response",
      subtitle: "Suggested Fixes",
      icon: Activity,
      color: "#34d399",
      description: "Returns the suggested fixes for the urgent issue.",
      backendType: "response",
      config: {
        value: "{{nodes.fix-suggestion.output.output}}",
        source_node: "fix-suggestion",
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
      subtitle: "Normal Result",
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

export const supportDecisionEdges = [
  /* Text → Analysis */

  {
    id: "message-to-analysis",
    source: "message",
    target: "analysis",
    animated: true,
  },

  /* Analysis → Condition */

  {
    id: "analysis-to-condition",
    source: "analysis",
    target: "condition",
    animated: true,
  },

  /* TRUE → Fix Suggestion LLM */

  {
    id: "condition-true",
    source: "condition",
    sourceHandle: "true",
    target: "fix-suggestion",
    animated: true,
  },

  /* Fix Suggestion → Response */

  {
    id: "fix-suggestion-to-response",
    source: "fix-suggestion",
    target: "urgent-response",
    animated: true,
  },

  /* FALSE → Normal Response */

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

  countryAnalysis: {
    name: "Country Analysis AI",
    nodes: countryAnalysisNodes,
    edges: countryAnalysisEdges,
  },

  supportDecision: {
    name: "Support Decision AI",
    nodes: supportDecisionNodes,
    edges: supportDecisionEdges,
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
