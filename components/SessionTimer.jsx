"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Ring } from "@/components/ui";

function pad(n) { return String(Math.floor(n)).padStart(2, "0"); }

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export default function SessionTimer({ form, targetMins, onFinish, onClose }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef(null);
  const startRef = useRef(Date.now());
  const pausedAtRef = useRef(0);

  const tick = useCallback(() => {
    setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, tick]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function togglePause() {
    if (running) {
      pausedAtRef.current = elapsed;
      setRunning(false);
    } else {
      startRef.current = Date.now() - pausedAtRef.current * 1000;
      setRunning(true);
    }
  }

  function finish() {
    setRunning(false);
    clearInterval(intervalRef.current);
    const mins = Math.max(1, Math.round(elapsed / 60));
    onFinish(mins);
  }

  const elapsedMins = elapsed / 60;
  const pct = targetMins ? Math.min(100, Math.round(elapsedMins / targetMins * 100)) : 0;
  const done = targetMins && elapsedMins >= targetMins;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "var(--txt)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      animation: "bgFadeIn .3s ease",
    }}>
      {/* Noise texture overlay */}
      <div className="hero-texture" style={{
        position: "absolute", inset: 0,
        pointerEvents: "none",
      }} />

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "16px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        zIndex: 1,
      }}>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.1)",
            color: "rgba(255,255,255,.4)",
            borderRadius: 10, padding: "6px 14px",
            fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}
        >
          Свернуть
        </button>
        <span style={{
          fontSize: 11, color: "rgba(255,255,255,.25)",
          letterSpacing: 1, textTransform: "uppercase",
        }}>
          Сессия
        </span>
      </div>

      {/* Center content */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Form name */}
        <p style={{
          fontSize: 18,
          fontWeight: 300,
          color: "rgba(255,255,255,.35)",
          marginBottom: 32, letterSpacing: 0.5,
        }}>
          {form.name}
        </p>

        {/* Ring + time */}
        <div style={{ position: "relative", display: "inline-flex", marginBottom: 20 }}>
          <Ring
            pct={pct}
            size={200}
            stroke={3}
            color={done ? "var(--green)" : "var(--accent)"}
          />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
             
              fontSize: 56, fontWeight: 300,
              color: "#fff", lineHeight: 1,
              letterSpacing: -2,
            }}>
              {formatTime(elapsed)}
            </span>
            <span style={{
              fontSize: 11, color: "rgba(255,255,255,.25)",
              marginTop: 8, letterSpacing: 1,
            }}>
              {targetMins ? `из ${targetMins} мин` : ""}
            </span>
          </div>
        </div>

        {/* Status */}
        {!running && elapsed > 0 && (
          <p style={{
            fontSize: 12, color: "rgba(255,255,255,.3)",
            letterSpacing: 1, textTransform: "uppercase",
            marginBottom: 8,
          }}>
            Пауза
          </p>
        )}
        {done && (
          <p style={{
            fontSize: 12, color: "var(--green)",
            letterSpacing: 1, textTransform: "uppercase",
            marginBottom: 8,
          }}>
            Цель достигнута
          </p>
        )}
      </div>

      {/* Controls */}
      <div style={{
        position: "absolute", bottom: 60, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 16,
        padding: "0 40px", zIndex: 1,
      }}>
        <button
          onClick={togglePause}
          style={{
            width: 60, height: 60, borderRadius: 20,
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.1)",
            color: "rgba(255,255,255,.6)",
            fontSize: 20, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background .15s",
          }}
        >
          {running ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>

        <button
          onClick={finish}
          disabled={elapsed < 10}
          style={{
            flex: 1, maxWidth: 200, height: 60,
            borderRadius: 20, border: "none",
            background: done ? "var(--green)" : "var(--accent)",
            color: "#fff",
            fontSize: 15, fontWeight: 600,
            cursor: elapsed < 10 ? "not-allowed" : "pointer",
            opacity: elapsed < 10 ? 0.3 : 1,
            transition: "all .2s",
            letterSpacing: 0.2,
          }}
        >
          Завершить
        </button>
      </div>

      {/* Elapsed minutes hint */}
      <div style={{
        position: "absolute", bottom: 28,
        fontSize: 11, color: "rgba(255,255,255,.15)",
        letterSpacing: 0.5, zIndex: 1,
      }}>
        {Math.floor(elapsedMins)} мин записано
      </div>
    </div>
  );
}
