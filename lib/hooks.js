"use client";
import { useState, useEffect } from "react";

/**
 * Тема: "light" | "dark" | "auto"
 * Авто — следит за системной темой в реальном времени.
 */
export function useTheme() {
  const [pref, setPrefRaw] = useState("auto");
  const [sys, setSys]      = useState("light");

  // Инициализация из localStorage
  useEffect(() => {
    const saved = localStorage.getItem("forma_theme");
    if (saved) setPrefRaw(saved);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSys(mq.matches ? "dark" : "light");
    const handler = (e) => setSys(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const effective = pref === "auto" ? sys : pref;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effective);
    localStorage.setItem("forma_theme", pref);
  }, [effective, pref]);

  function setPref(val) {
    setPrefRaw(val);
    localStorage.setItem("forma_theme", val);
  }

  return { pref, setPref, effective };
}

/**
 * Хранит state в localStorage. Автоматически синхронизируется.
 */
export function useLocalState(key, initial) {
  const [state, setStateRaw] = useState(() => {
    if (typeof window === "undefined") return initial;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  });

  function setState(val) {
    const next = typeof val === "function" ? val(state) : val;
    setStateRaw(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }

  return [state, setState];
}
