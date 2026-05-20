import React from "react";
import PageWrapper from './SharedUI'; // Removed the curly braces // Wait, PageWrapper is in App.jsx and not exported, let me create a simple wrapper or import AppSection
import { AppSection } from "../components/SharedUI";
import { motion } from "framer-motion";
import { Database, Activity, LayoutGrid, Eye, EyeOff, Trash2, Key } from "lucide-react";

const FM = "'JetBrains Mono','Commit Mono',monospace";
const FH = "'Plus Jakarta Sans','Bricolage Grotesque',sans-serif";
const FB = "'Inter',sans-serif";

const T = { duration: 0.32, ease: [0.4, 0, 0.2, 1] };

const activeAssets = [
  { id: "cert_v3_gold", status: "active", type: "gltf", size: "2.4MB" },
  { id: "cert_v3_neon", status: "paused", type: "spln", size: "4.1MB" },
  { id: "cert_v4_mesh", status: "active", type: "gltf", size: "1.8MB" },
];

const telemetryLogs = [
  "[21:14:02] -> HASH_VERIFY_SUCCESS -> id: 0x9f2a...",
  "[21:14:15] -> ASSET_FETCH_LATENCY -> 412ms -> IP: 106.51.x.x",
  "[21:15:00] -> BULK_GENERATE_REQUEST -> Institution: ChristUniv_Node01 -> Payload: 42 units"
];

export default function AdminDashboard() {
  return (
    <div style={{ paddingTop: "100px", minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* Header Section */}
        <div style={{
          border: "1px solid var(--border)",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: FM,
          fontSize: "13px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "32px",
          background: "var(--bg-elevated)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Database size={16} color="var(--indigo)" />
            <span>CERTIFYROI // ADMIN PORTAL</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10B981" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }} />
            <span>[STATUS: SYSTEM_ALIGNED_OK]</span>
          </div>
        </div>

        {/* Top Grid: Telemetry & Assets */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "32px",
          marginBottom: "32px",
        }}>
          
          {/* Metric Telemetry */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{
              borderBottom: "1px solid var(--border)",
              paddingBottom: "12px",
              marginBottom: "16px",
              fontFamily: FM,
              fontSize: "12px",
              color: "var(--text-3)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <Activity size={14} /> METRIC TELEMETRY
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontFamily: FB,
              fontSize: "14px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>Avg Load Time:</span>
                <span style={{ color: "var(--text)", fontWeight: "600" }}>1.2s <span style={{ color: "#10B981", fontSize: "12px", marginLeft: "4px" }}>(Optimal)</span></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>Active 3D Sessions:</span>
                <span style={{ color: "var(--text)", fontWeight: "600" }}>142</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>Verification API Success:</span>
                <span style={{ color: "var(--text)", fontWeight: "600" }}>99.8%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-2)" }}>Global Engine Rate:</span>
                <span style={{ color: "var(--text)", fontWeight: "600" }}>60 FPS</span>
              </div>
            </div>
          </div>

          {/* Active 3D Assets */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{
              borderBottom: "1px solid var(--border)",
              paddingBottom: "12px",
              marginBottom: "16px",
              fontFamily: FM,
              fontSize: "12px",
              color: "var(--text-3)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <LayoutGrid size={14} /> ACTIVE 3D ASSETS
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontFamily: FM,
              fontSize: "12px"
            }}>
              {activeAssets.map(asset => (
                <div key={asset.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1fr",
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  background: asset.status === 'active' ? "transparent" : "var(--bg-elevated)",
                  opacity: asset.status === 'active' ? 1 : 0.6,
                  alignItems: "center"
                }}>
                  <span style={{ color: "var(--text)" }}>id: {asset.id}</span>
                  <span style={{ color: asset.status === 'active' ? "#10B981" : "var(--text-4)" }}>
                    status: {asset.status}
                  </span>
                  <span style={{ color: "var(--text-3)", textAlign: "right" }}>{asset.type} | {asset.size}</span>
                </div>
              ))}
            </div>
            
            {/* Quick Action Input */}
            <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
              <input 
                type="text" 
                placeholder="LOAD_ASSET_ID..." 
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid var(--border)",
                  padding: "10px 12px",
                  color: "var(--text)",
                  fontFamily: FM,
                  fontSize: "12px",
                  outline: "none",
                  borderRadius: 0
                }}
              />
              <button style={{
                background: "var(--text)",
                color: "var(--bg)",
                border: "none",
                padding: "0 20px",
                fontFamily: FM,
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer",
                borderRadius: 0
              }}>
                DEPLOY
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Pipeline Logs */}
        <div style={{
          borderTop: "1px solid var(--border)",
          paddingTop: "24px",
          marginTop: "32px",
          fontFamily: FM
        }}>
          <div style={{
            fontSize: "12px",
            color: "var(--text-3)",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Key size={14} /> LIVE EVENT ROUTING PIPELINE
          </div>
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            fontSize: "12px",
            color: "var(--text-2)",
            height: "200px",
            overflowY: "auto"
          }}>
            {telemetryLogs.map((log, i) => (
              <div key={i} style={{ borderBottom: i !== telemetryLogs.length - 1 ? "1px dashed var(--border)" : "none", paddingBottom: i !== telemetryLogs.length - 1 ? "8px" : 0 }}>
                {log}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", color: "var(--text-4)" }}>
              <span className="animate-pulse" style={{ display: "inline-block", width: "8px", height: "12px", background: "var(--text-4)" }}></span>
              LISTENING_ON_PORT_8080...
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
