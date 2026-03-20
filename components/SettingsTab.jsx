"use client";
import { useState } from "react";
import { Card, Sheet, Pill, BigBtn, Field, TextInput, TimeInput } from "@/components/ui";
import { FORM_TYPES, CATS } from "@/lib/data";
import { getCat, getType } from "@/lib/helpers";

// ── Form editor sheet ─────────────────────────────────────
function FormEditorSheet({ open, onClose, initial, onSave }) {
  const isEdit = !!initial?.id;
  const [draft, setDraft] = useState(initial ?? {
    name: "", principle: "", type: "boolean", cat: "body",
    pts: 50, target: "07:00", intervalH: 4, limitPerDay: 5000,
    target_mins: 60, visible: "all", tg_remind: "",
  });

  const [lastId, setLastId] = useState(initial?.id);
  if (initial?.id !== lastId) {
    setDraft(initial ?? draft);
    setLastId(initial?.id);
  }

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const ch = FORM_TYPES.find(t => t.id === draft.type);
  const valid = draft.name.trim() && draft.principle.trim();

  function handleSave() {
    const base = {
      ...draft,
      id: draft.id ?? ("f" + Date.now()),
      streak: draft.streak ?? 0,
      history: draft.history ?? Array(14).fill(0),
      checkedToday: false,
    };
    if (draft.type === "meal" && !draft.meals) {
      base.meals = [
        { l: "Завтрак", done: false, time: null },
        { l: "Обед",    done: false, time: null },
        { l: "Ужин",    done: false, time: null },
      ];
    }
    if (draft.type === "duration") base.target = draft.target_mins ?? 60;
    onSave(base);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={isEdit ? "Редактировать" : "Новая форма"} maxH="95vh">

      <Field label="Название">
        <TextInput value={draft.name} onChange={e => set("name", e.target.value)} placeholder="напр. Подъём" />
      </Field>

      <Field label="Принцип" hint="Без принципа форма — просто привычка.">
        <TextInput value={draft.principle} onChange={e => set("principle", e.target.value)} placeholder="Почему это важно?" multiline rows={2} />
      </Field>

      <Field label="Тип">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {FORM_TYPES.map(tp => (
            <button key={tp.id} onClick={() => set("type", tp.id)} style={{
              padding: "10px 12px", borderRadius: "var(--radius-sm)", textAlign: "left", cursor: "pointer",
              border: `1px solid ${draft.type === tp.id ? "var(--accent)" : "var(--border2)"}`,
              background: draft.type === tp.id ? "var(--accent-bg)" : "var(--surface2)",
              color: draft.type === tp.id ? "var(--accent)" : "var(--txt2)",
              fontSize: 12, fontWeight: 500, display: "flex", gap: 8, alignItems: "center",
              transition: "all .12s",
            }}>
              <span style={{ fontSize: 15 }}>{tp.icon}</span>
              <span>{tp.label}</span>
            </button>
          ))}
        </div>
        {ch && <p style={{ fontSize: 11, color: "var(--txt3)", marginTop: 8, lineHeight: 1.5 }}>{ch.desc}</p>}
      </Field>

      {draft.type === "time" && (
        <Field label="Целевое время">
          <TimeInput value={draft.target || "07:00"} onChange={e => set("target", e.target.value)} />
        </Field>
      )}

      {draft.type === "duration" && (
        <Field label="Целевое время (минут)">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[15, 30, 45, 60, 90, 120].map(v => (
              <button key={v} onClick={() => set("target_mins", v)} style={{ flex: "1 1 auto", padding: "9px 4px", borderRadius: "var(--radius-sm)", border: `1px solid ${(draft.target_mins ?? 60) === v ? "var(--accent)" : "var(--border2)"}`, background: (draft.target_mins ?? 60) === v ? "var(--accent-bg)" : "var(--surface2)", color: (draft.target_mins ?? 60) === v ? "var(--accent)" : "var(--txt2)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{v}</button>
            ))}
          </div>
        </Field>
      )}

      {draft.type === "meal" && (
        <Field label="Интервал (часы)">
          <div style={{ display: "flex", gap: 6 }}>
            {[3, 4, 5, 6].map(v => (
              <button key={v} onClick={() => set("intervalH", v)} style={{ flex: 1, padding: "9px", borderRadius: "var(--radius-sm)", border: `1px solid ${draft.intervalH === v ? "var(--accent)" : "var(--border2)"}`, background: draft.intervalH === v ? "var(--accent-bg)" : "var(--surface2)", color: draft.intervalH === v ? "var(--accent)" : "var(--txt2)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{v}ч</button>
            ))}
          </div>
        </Field>
      )}

      {draft.type === "limit" && (
        <Field label="Дневной лимит, ₽">
          <input type="number" value={draft.limitPerDay} onChange={e => set("limitPerDay", Number(e.target.value))} style={{ padding: "11px 14px", border: "1px solid var(--border2)", borderRadius: "var(--radius-sm)", background: "var(--surface2)", color: "var(--txt)", fontSize: 18, fontWeight: 600, outline: "none", width: "100%" }} />
        </Field>
      )}

      <Field label="Категория">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATS.map(c => (
            <button key={c.id} onClick={() => set("cat", c.id)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${draft.cat === c.id ? c.color : "var(--border2)"}`, background: draft.cat === c.id ? `${c.color}10` : "transparent", color: draft.cat === c.id ? c.color : "var(--txt2)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .12s" }}>
              {c.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Очки">
        <div style={{ display: "flex", gap: 6 }}>
          {[30, 50, 70, 90, 100].map(v => (
            <button key={v} onClick={() => set("pts", v)} style={{ flex: 1, padding: "9px 4px", borderRadius: "var(--radius-sm)", border: `1px solid ${draft.pts === v ? "var(--accent)" : "var(--border2)"}`, background: draft.pts === v ? "var(--accent-bg)" : "var(--surface2)", color: draft.pts === v ? "var(--accent)" : "var(--txt2)", fontSize: 13, fontWeight: draft.pts === v ? 600 : 400, cursor: "pointer" }}>{v}</button>
          ))}
        </div>
      </Field>

      <Field label="Видимость">
        <div style={{ display: "flex", gap: 6 }}>
          {[["all", "Все"], ["streak", "Стрик"], ["private", "Только я"]].map(([v, l]) => (
            <button key={v} onClick={() => set("visible", v)} style={{ flex: 1, padding: "8px 6px", borderRadius: "var(--radius-sm)", border: `1px solid ${draft.visible === v ? "var(--accent)" : "var(--border2)"}`, background: draft.visible === v ? "var(--accent-bg)" : "var(--surface2)", color: draft.visible === v ? "var(--accent)" : "var(--txt2)", fontSize: 11, fontWeight: 500, cursor: "pointer", textAlign: "center" }}>{l}</button>
          ))}
        </div>
      </Field>

      <Field label="TG-напоминание" hint="Бот пришлёт в указанное время">
        <TimeInput value={draft.tg_remind || ""} onChange={e => set("tg_remind", e.target.value)} />
      </Field>

      <div style={{ marginTop: 8 }} />
      <BigBtn onClick={handleSave} disabled={!valid}>
        {isEdit ? "Сохранить" : "Добавить"}
      </BigBtn>
    </Sheet>
  );
}

// ── SETTINGS TAB ──────────────────────────────────────────
export default function SettingsTab({ forms, setForms, theme, setTheme }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing]   = useState(null);

  function handleSave(form) {
    setForms(fs => {
      const exists = fs.find(f => f.id === form.id);
      return exists ? fs.map(f => f.id === form.id ? form : f) : [...fs, form];
    });
  }

  function deleteForm(id) {
    setForms(fs => fs.filter(f => f.id !== id));
  }

  const THEMES = [
    ["halo",  "Halo"],
    ["light", "Светлая"],
    ["dark",  "Тёмная"],
    ["auto",  "Авто"],
  ];

  return (
    <>
      {/* Theme */}
      <Card style={{ marginBottom: 10 }} pad="16px 18px">
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Тема</p>
        <div style={{ display: "flex", gap: 6 }}>
          {THEMES.map(([v, l]) => (
            <button key={v} onClick={() => setTheme(v)} style={{ flex: 1, padding: "9px 6px", borderRadius: "var(--radius-sm)", border: `1px solid ${theme === v ? "var(--accent)" : "var(--border2)"}`, background: theme === v ? "var(--accent-bg)" : "var(--surface2)", color: theme === v ? "var(--accent)" : "var(--txt2)", fontSize: 12, fontWeight: theme === v ? 600 : 400, cursor: "pointer", transition: "all .12s" }}>
              {l}
            </button>
          ))}
        </div>
      </Card>

      {/* TG stub */}
      <Card style={{ marginBottom: 10 }} pad="16px 18px">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--blue-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--blue)", fontWeight: 600 }}>tg</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Telegram-бот</p>
            <p style={{ fontSize: 12, color: "var(--txt2)", margin: 0 }}>Уведомления и чек-ин</p>
          </div>
          <button style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--blue)", background: "var(--blue-bg)", color: "var(--blue)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            Подключить
          </button>
        </div>
      </Card>

      {/* Forms list */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 6 }}>
        <p style={{ fontWeight: 600, fontSize: 14, color: "var(--txt)" }}>Мои формы</p>
        <button onClick={() => setCreating(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: "var(--radius-sm)", background: "var(--txt)", color: "var(--bg)", border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          + Добавить
        </button>
      </div>

      {forms.map(f => {
        const cat = getCat(f.cat);
        const tp  = getType(f.type);
        return (
          <Card key={f.id} style={{ marginBottom: 8 }} pad="13px 16px">
            <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${cat.color}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, border: `1px solid ${cat.color}18` }}>
                {tp.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{f.name}</p>
                <p style={{ fontSize: 11, color: "var(--txt3)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.principle}</p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => setEditing(f)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border2)", background: "transparent", color: "var(--txt2)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{"✎"}</button>
                <button onClick={() => deleteForm(f.id)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--red)", background: "var(--red-bg)", color: "var(--red)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{"✕"}</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
              <Pill small color={cat.color} bg={`${cat.color}10`}>{cat.label}</Pill>
              <Pill small>{tp.label}</Pill>
              <Pill small>{f.streak}д</Pill>
              <Pill small>{f.pts}</Pill>
              {f.tg_remind && <Pill small color="var(--blue)" bg="var(--blue-bg)">TG {f.tg_remind}</Pill>}
            </div>
          </Card>
        );
      })}

      {/* Profile stub */}
      <Card style={{ marginTop: 6 }} pad="14px 16px">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--accent-bg)", border: "1px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>Д</div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Денис</p>
            <p style={{ fontSize: 12, color: "var(--txt2)", margin: 0 }}>forma.app/denis</p>
          </div>
          <button style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border2)", background: "transparent", color: "var(--txt2)", fontSize: 12, cursor: "pointer" }}>
            Изменить
          </button>
        </div>
      </Card>

      <div style={{ height: 10 }} />

      <FormEditorSheet
        open={creating}
        onClose={() => setCreating(false)}
        initial={null}
        onSave={handleSave}
      />
      <FormEditorSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        initial={editing}
        onSave={handleSave}
      />
    </>
  );
}
