import React from "react";
import {
  Activity,
  Folder,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
} from "lucide-react";
import { palette } from "../data/workflowCatalog";
import weaveLogo from "../assets/weave-logo-custom.png";

export default function Sidebar({
  collapsed,
  setCollapsed,
  onAddNode,
  searchTerm,
  setSearchTerm,
  onShowWorkflows,
  onShowExecutions,
}) {
  const matchingNodes = palette.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="brand-row">
        {!collapsed && (
          <div className="brand">
            <img className="brand-custom-logo" src={weaveLogo} alt="Weave" />
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
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="node-palette">
            {matchingNodes.map((item) => {
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
    </aside>
  );
}
