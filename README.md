# Weave

> A visual workflow automation platform for building and executing
> AI-powered workflows through a node-based interface.

Weave provides a visual canvas where users can create workflows by
connecting configurable nodes. Each node represents a specific
operation, such as receiving input, transforming data, calling an
external API, querying a service, running an LLM, or returning a
response.

The project is designed around a clear separation between the visual
workflow editor and the backend execution engine:

``` text
React Frontend
      │
      │ REST API
      ▼
FastAPI Backend
      │
      ▼
Workflow Execution Engine
      │
 ┌────┼─────────┐
 ▼    ▼         ▼
LLM  APIs      Tools
```

The frontend focuses on workflow creation and visualization, while the
backend handles persistence, validation, execution, and integrations.

------------------------------------------------------------------------

## Tech Stack

### Frontend

  Technology                     Purpose
  ------------------------------ ----------------------------------------
  React 19                       UI framework
  Vite 7                         Frontend development and build tooling
  React Flow / `@xyflow/react`   Visual node-based workflow editor
  JavaScript / JSX               Frontend application logic
  Lucide React                   Icons and UI elements
  CSS                            Styling and layout

### Backend

  Technology    Purpose
  ------------- ---------------------------------------
  Python        Backend runtime
  FastAPI       REST API and backend application
  Uvicorn       ASGI server
  Pydantic      Data validation and structured models
  HTTP client   Communication with external services
  Groq API      LLM inference

### AI / LLM

Weave uses Groq's OpenAI-compatible Chat Completions API for LLM
execution.

Current development model:

``` text
openai/gpt-oss-120b
```

API endpoint:

``` text
https://api.groq.com/openai/v1/chat/completions
```

The model is configured through the backend environment rather than
exposing the API key in the frontend.

------------------------------------------------------------------------

# Architecture

Weave follows a client-server architecture with a visual workflow layer
on top of a backend execution engine.

``` text
                         ┌───────────────────────┐
                         │       Browser         │
                         │                       │
                         │   React + Vite        │
                         │   React Flow           │
                         └───────────┬───────────┘
                                     │
                              REST / JSON
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │    FastAPI Backend    │
                         │                       │
                         │  Workflow API         │
                         │  Workflow Storage     │
                         │  Execution API        │
                         │  Run History          │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │  Workflow Engine      │
                         │                       │
                         │  Node Execution       │
                         │  Data Flow            │
                         │  Expressions          │
                         │  Error Handling       │
                         └───────────┬───────────┘
                                     │
                   ┌─────────────────┼─────────────────┐
                   │                 │                 │
                   ▼                 ▼                 ▼
              ┌─────────┐      ┌──────────┐      ┌─────────┐
              │  Groq   │      │ External │      │  Tools  │
              │   LLM   │      │   APIs   │      │         │
              └─────────┘      └──────────┘      └─────────┘
```

## Frontend Layer

The React frontend provides the visual workflow builder.

Main responsibilities:

-   Render the workflow canvas
-   Display nodes and connections
-   Add and remove nodes
-   Connect workflow nodes
-   Configure node properties
-   Save workflows
-   Load existing workflows
-   Execute workflows
-   Display execution results
-   Display run history
-   Import and export workflow definitions

The workflow canvas is built using React Flow.

Important frontend areas include:

``` text
src/
├── api/
│   └── workflows.js
├── components/
│   ├── HistoryPanel.jsx
│   ├── Inspector.jsx
│   ├── Sidebar.jsx
│   ├── WorkflowNode.jsx
│   └── WorkflowsPanel.jsx
├── data/
│   └── workflowCatalog.js
├── pages/
│   └── EditorPage.jsx
├── App.jsx
└── main.jsx
```

------------------------------------------------------------------------

## Backend Layer

The FastAPI backend provides the API consumed by the frontend.

Its responsibilities include:

-   Workflow CRUD operations
-   Workflow validation
-   Workflow execution
-   Node execution
-   External API communication
-   LLM requests
-   Execution/run history
-   Error handling

The backend acts as the execution boundary, meaning API keys and service
credentials remain on the server.

------------------------------------------------------------------------

## Workflow Engine

A workflow is represented as a graph consisting of:

``` text
Nodes + Edges
```

A simplified workflow looks like:

``` text
Trigger
   │
   ▼
Input
   │
   ▼
LLM
   │
   ▼
Response
```

Each node contains:

``` text
id
type
config
position
```

Edges describe dependencies:

``` text
source → target
```

During execution, the backend resolves the graph and executes nodes in
dependency order.

Node outputs can then be passed to downstream nodes.

For example:

``` text
Text Node
    │
    ▼
{{nodes.text.output.text}}
    │
    ▼
LLM Node
```

This keeps the workflow definition declarative while the backend
controls how execution actually happens.

------------------------------------------------------------------------

## External Integrations

The workflow engine can communicate with external services through
dedicated node executors.

Examples include:

``` text
LLM
HTTP Request
Weather
Email
Transform
```

The architecture allows additional integrations to be added without
changing the core visual editor.

------------------------------------------------------------------------

## Quick Start

For subsequent runs, once dependencies and environment variables are
configured:

### Terminal 1 --- Backend

``` powershell
cd weave-server-main
.\venv\Scripts\Activate.ps1
python run.py
```

### Terminal 2 --- Frontend

``` bash
cd weave
npm run dev
```

Then open the Vite URL shown in the terminal.
