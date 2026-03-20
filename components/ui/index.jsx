"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ── Card ──────────────────────────────────────────────────
export function Card({ children, style = {}, onClick, pad = "16px 18px", ...rest }) {
  return (
    <div
      onClick={onClick}
      {...rest}
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        padding: pad,
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        cursor: onClick ? "pointer" : "default",
        transition: "transform .15s ease, box-shadow .15s ease",
        ...style,
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "var(--shadow)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.transform = "";
      }}
    >
      {children}
    </div>
  );
}

// ── Sheet (bottom drawer with swipe-to-close) ───────────────
export function Sheet({ open, onClose, title, children, maxH = "92vh" }) {
  const sheetRef = useRef(null);
  const dragRef = useRef({ startY: 0, currentY: 0, dragging: false });
  const [dragOffset, setDragOffset] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (open) { setClosing(false); setDragOffset(0); }
  }, [open]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  function onTouchStart(e) {
    const el = sheetRef.current;
    if (!el) return;
    // Only allow drag from top area or when scrolled to top
    const scrollable = el.querySelector('[data-sheet-content]');
    if (scrollable && scrollable.scrollTop > 0) return;
    dragRef.current = { startY: e.touches[0].clientY, currentY: e.touches[0].clientY, dragging: true };
  }

  function onTouchMove(e) {
    if (!dragRef.current.dragging) return;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    if (dy < 0) { setDragOffset(0); return; }
    setDragOffset(dy);
  }

  function onTouchEnd() {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (dragOffset > 100) {
      handleClose();
    } else {
      setDragOffset(0);
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(12,12,11,.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 200,
          animation: closing ? "none" : "bgFadeIn .2s ease",
          opacity: closing ? 0 : 1,
          transition: closing ? "opacity .25s" : "none",
        }}
      />
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "fixed", bottom: 0, left: "50%",
          width: "100%", maxWidth: 430,
          background: "var(--surface)",
          borderRadius: "24px 24px 0 0",
          zIndex: 201, maxHeight: maxH,
          display: "flex", flexDirection: "column",
          animation: closing ? "none" : "slideUp .32s cubic-bezier(.32,.72,0,1)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          transform: `translateX(-50%) translateY(${closing ? "100%" : dragOffset + "px"})`,
          transition: dragRef.current.dragging ? "none" : "transform .25s cubic-bezier(.32,.72,0,1)",
        }}
      >
        {/* Handle bar — drag zone */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0", cursor: "grab" }}>
          <div style={{ width: 32, height: 4, borderRadius: 99, background: "var(--surface3)" }} />
        </div>
        <div style={{ padding: "10px 20px 0", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <h2 style={{ flex: 1, fontFamily: "var(--font-serif)", fontSize: 19, fontWeight: 400, color: "var(--txt)", fontStyle: "italic" }}>
            {title}
          </h2>
          <button
            onClick={handleClose}
            style={{
              width: 28, height: 28, borderRadius: 99,
              border: "1px solid var(--border2)", background: "var(--surface2)",
              color: "var(--txt3)", cursor: "pointer", fontSize: 11,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .15s",
            }}
          >✕</button>
        </div>
        <div data-sheet-content style={{ flex: 1, overflowY: "auto", padding: "14px 20px 40px" }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ── Pill ──────────────────────────────────────────────────
export function Pill({ children, color, bg, small }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: small ? "2px 7px" : "3px 10px",
      borderRadius: 6,
      fontSize: small ? 10 : 11, fontWeight: 500,
      background: bg || "var(--surface2)", color: color || "var(--txt2)",
      lineHeight: 1.6, whiteSpace: "nowrap",
      letterSpacing: 0.1,
    }}>
      {children}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────
export function Ava({ init, col, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.35,
      background: `${col}15`, border: `1px solid ${col}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 600, color: col,
      flexShrink: 0, letterSpacing: -.5,
    }}>
      {init}
    </div>
  );
}

// ── Progress ring ─────────────────────────────────────────
export function Ring({ pct = 0, size = 48, stroke = 3, color = "var(--accent)" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface3)" strokeWidth={stroke} opacity={0.5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

// ── 7-dot streak history ──────────────────────────────────
export function Dots({ history = [] }) {
  const last7 = history.slice(-7);
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {last7.map((v, i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: 2,
          background: v ? "var(--accent)" : "var(--surface3)",
          transition: "background .2s",
        }} />
      ))}
    </div>
  );
}

// ── BigBtn ────────────────────────────────────────────────
export function BigBtn({ children, onClick, color = "var(--txt)", disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "13px 16px",
        borderRadius: "var(--radius-sm)",
        border: "none", background: color,
        color: color === "var(--txt)" ? "var(--bg)" : "#fff",
        fontSize: 14, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? .35 : 1,
        transition: "opacity .15s, transform .1s",
        letterSpacing: 0.1,
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "scale(.98)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = ""; }}
    >
      {children}
    </button>
  );
}

// ── Field wrapper ─────────────────────────────────────────
export function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: "block", fontSize: 10, fontWeight: 600,
        color: "var(--txt3)", letterSpacing: 1,
        textTransform: "uppercase", marginBottom: 7,
      }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: 12, color: "var(--txt3)", marginBottom: 8, lineHeight: 1.5 }}>{hint}</p>}
      {children}
    </div>
  );
}

// ── Text input ────────────────────────────────────────────
const inputBase = {
  width: "100%", padding: "11px 14px",
  border: "1px solid var(--border2)",
  borderRadius: "var(--radius-sm)",
  background: "var(--surface2)", color: "var(--txt)",
  fontSize: 14, outline: "none",
  transition: "border-color .15s",
};

export function TextInput({ value, onChange, placeholder, multiline, rows = 3 }) {
  if (multiline) {
    return (
      <textarea
        value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        style={{ ...inputBase, resize: "none", fontFamily: "var(--font)", lineHeight: 1.55 }}
        onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = ""; }}
      />
    );
  }
  return (
    <input
      value={value} onChange={onChange} placeholder={placeholder}
      style={inputBase}
      onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = ""; }}
    />
  );
}

export function TimeInput({ value, onChange }) {
  return (
    <input
      type="time" value={value} onChange={onChange}
      style={{ ...inputBase, fontSize: 20, fontWeight: 600, textAlign: "center", fontFamily: "var(--font-serif)" }}
      onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = ""; }}
    />
  );
}

// ── Section label ─────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 600, color: "var(--txt3)",
      letterSpacing: 1, textTransform: "uppercase",
      marginBottom: 8, marginTop: 6,
    }}>
      {children}
    </p>
  );
}
