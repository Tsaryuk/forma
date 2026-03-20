"use client";
import { useState } from "react";
import { Card, Pill, Ava } from "@/components/ui";
import { DEMO_FEED } from "@/lib/data";

const REACTIONS = [
  { k: "fire",   icon: "•" },
  { k: "strong", icon: "↑" },
  { k: "brain",  icon: "○" },
  { k: "hand",   icon: "↔" },
];

const REACTION_LABELS = {
  fire: "огонь",
  strong: "сила",
  brain: "разум",
  hand: "рука",
};

function FeedItem({ item, onReact }) {
  return (
    <Card style={{ marginBottom: 10 }} pad="15px 16px">
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Ava init={item.init} col={item.col} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{item.who}</span>
            {item.broken
              ? <Pill color="var(--red)" bg="var(--red-bg)" small>нарушил</Pill>
              : <Pill color="var(--green)" bg="var(--green-bg)" small>{item.formName}</Pill>
            }
            <span style={{ fontSize: 11, color: "var(--txt3)", marginLeft: "auto" }}>{item.time}</span>
          </div>

          {item.value && (
            <p style={{ fontSize: 13, color: "var(--txt2)", margin: "3px 0" }}>
              {item.formType === "time" && (
                <span style={{ color: item.exact ? "var(--green)" : "var(--gold)", fontWeight: 400 }}>{item.value}</span>
              )}
              {item.formType === "duration" && (
                <span style={{ fontWeight: 500, color: "var(--txt)" }}>{item.value}</span>
              )}
              <span style={{ color: "var(--txt3)" }}> · {item.streak}д</span>
            </p>
          )}
          {!item.value && !item.broken && (
            <p style={{ fontSize: 13, color: "var(--txt3)", margin: "3px 0" }}>{item.streak}д стрик</p>
          )}

          {item.note && (
            <div style={{ marginTop: 8, padding: "9px 12px", borderRadius: "var(--radius-sm)", background: item.broken ? "var(--red-bg)" : "var(--surface2)", borderLeft: `2px solid ${item.broken ? "var(--red)" : "var(--border2)"}`, fontSize: 13, color: item.broken ? "var(--red)" : "var(--txt2)", lineHeight: 1.55 }}>
              «{item.note}»
            </div>
          )}

          <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
            {REACTIONS
              .filter(r => !item.broken || r.k === "hand")
              .map(r => {
                const count = item.reactions[r.k] || 0;
                return (
                  <button
                    key={r.k}
                    onClick={() => onReact(r.k)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "4px 10px", borderRadius: 6,
                      border: "1px solid var(--border2)",
                      background: "transparent",
                      fontSize: 12, cursor: "pointer",
                      color: count > 0 ? "var(--accent)" : "var(--txt3)",
                      transition: "all .15s",
                      fontWeight: count > 0 ? 600 : 400,
                    }}
                  >
                    <span style={{ fontSize: 10 }}>{r.icon}</span>
                    {count > 0 && <span>{count}</span>}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function FeedTab() {
  const [feed, setFeed] = useState(DEMO_FEED);

  function react(idx, k) {
    setFeed(f => f.map((item, i) => i === idx
      ? { ...item, reactions: { ...item.reactions, [k]: (item.reactions[k] || 0) + 1 } }
      : item
    ));
  }

  return (
    <>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
        Лента
      </p>
      {feed.map((item, i) => (
        <FeedItem key={item.id + "_" + i} item={item} onReact={k => react(i, k)} />
      ))}
      <div style={{ height: 10 }} />
    </>
  );
}
