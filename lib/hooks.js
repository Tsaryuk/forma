"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Тема: "light" | "dark" | "auto"
 * Авто — следит за системной темой в реальном времени.
 */
export function useTheme() {
  const [pref, setPrefRaw] = useState("light");
  const [sys, setSys]      = useState("light");

  // Инициализация из localStorage
  useEffect(() => {
    const saved = localStorage.getItem("forma_theme");
    if (saved) setPrefRaw(saved);
    else setPrefRaw("light");

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

// ── Device ID (anonymous, stable per browser) ────────────
function getDeviceId() {
  let id = localStorage.getItem("forma_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("forma_device_id", id);
  }
  return id;
}

// ── Supabase sync hook ───────────────────────────────────
export function useSupaSync() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);
  const saveTimer = useRef(null);
  const onIdsUpdated = useRef(null);

  // 1. Ensure profile exists
  const ensureProfile = useCallback(async (name) => {
    if (!supabase) return null;
    const deviceId = getDeviceId();

    // Try to find existing profile
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("device_id", deviceId)
      .single();

    if (existing) {
      setProfile(existing);
      return existing;
    }

    // Create new profile
    const { data: created, error } = await supabase
      .from("profiles")
      .insert({ device_id: deviceId, name: name || "Друг" })
      .select()
      .single();

    if (error) { console.error("Profile create error:", error); return null; }
    setProfile(created);
    return created;
  }, []);

  // 2. Load forms from Supabase
  const loadForms = useCallback(async (userId) => {
    if (!supabase || !userId) return null;

    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order");

    if (error) { console.error("Load forms error:", error); return null; }
    if (!data || data.length === 0) return null;

    // Convert DB rows to app format
    return data.map(dbFormToApp);
  }, []);

  // 3. Save forms to Supabase (debounced)
  const saveForms = useCallback(async (forms, userId) => {
    if (!supabase || !userId) return;

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const existing = forms.filter(f => UUID_RE.test(f.id));
      const newForms = forms.filter(f => !UUID_RE.test(f.id));

      // Upsert existing forms
      if (existing.length > 0) {
        const rows = existing.map((f, i) => appFormToDb(f, userId, i));
        const { error } = await supabase
          .from("forms")
          .upsert(rows, { onConflict: "id" });
        if (error) console.error("Upsert forms error:", error);
      }

      // Insert new forms
      if (newForms.length > 0) {
        const rows = newForms.map((f, i) => appFormToDb(f, userId, existing.length + i));
        const { data, error } = await supabase
          .from("forms")
          .insert(rows)
          .select();
        if (error) console.error("Insert forms error:", error);
        // Update local forms with new UUIDs from Supabase
        if (data) {
          const idMap = {};
          newForms.forEach((f, i) => { if (data[i]) idMap[f.id] = data[i].id; });
          if (Object.keys(idMap).length > 0 && onIdsUpdated.current) {
            onIdsUpdated.current(idMap);
          }
        }
      }

      setSynced(true);
    }, 1000);
  }, []);

  // 4. Save checkin
  const saveCheckin = useCallback(async (formId, userId, data, score) => {
    if (!supabase || !userId) return;

    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from("checkins")
      .upsert({
        form_id: formId,
        user_id: userId,
        date: today,
        data,
        score,
      }, { onConflict: "form_id,date" });

    if (error) console.error("Save checkin error:", error);
  }, []);

  // 5. Init on mount
  useEffect(() => {
    async function init() {
      if (!supabase) { setLoading(false); return; }
      const deviceId = getDeviceId();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("device_id", deviceId)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    }
    init();
  }, []);

  return {
    profile, loading, synced,
    ensureProfile, loadForms, saveForms, saveCheckin, onIdsUpdated,
  };
}

// ── DB ↔ App format converters ───────────────────────────
function dbFormToApp(row) {
  const config = row.config || {};
  return {
    id: row.id,
    name: row.name,
    principle: row.principle || "",
    type: row.type,
    cat: row.cat || "body",
    pts: row.pts || 50,
    streak: row.streak || 0,
    visible: row.visible || "all",
    tg_remind: row.tg_remind || null,
    // Type-specific fields from config
    target: config.target,
    intervalH: config.intervalH,
    limitPerDay: config.limitPerDay,
    meals: config.meals,
    lastAt: config.lastAt,
    logged: config.logged || 0,
    note: config.note || "",
    spent: config.spent || 0,
    // Runtime state (not persisted in DB, reset daily)
    history: config.history || Array(14).fill(0),
    checkedToday: false,
    brokenToday: false,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function appFormToDb(form, userId, sortOrder) {
  const config = {};
  if (form.target !== undefined) config.target = form.target;
  if (form.intervalH !== undefined) config.intervalH = form.intervalH;
  if (form.limitPerDay !== undefined) config.limitPerDay = form.limitPerDay;
  if (form.meals) config.meals = form.meals;
  if (form.history) config.history = form.history;

  const row = {
    user_id: userId,
    name: form.name,
    principle: form.principle || "",
    type: form.type,
    cat: form.cat || "body",
    pts: form.pts || 50,
    config,
    streak: form.streak || 0,
    sort_order: sortOrder,
    visible: form.visible || "all",
    tg_remind: form.tg_remind || null,
  };

  // Only include id if it's a valid uuid (from Supabase)
  if (form.id && UUID_RE.test(form.id)) {
    row.id = form.id;
  }

  return row;
}
