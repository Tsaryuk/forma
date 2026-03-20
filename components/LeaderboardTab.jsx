"use client";
import { useState } from "react";
import { Card, Pill, Ava } from "@/components/ui";
import { DEMO_LEADERBOARD } from "@/lib/data";

const MEDALS = ["Ⅰ", "Ⅱ", "Ⅲ"];

export default function LeaderboardTab({ myScore = 0 }) {
  const [season, setSeason] = useState("week");

  const board = DEMO_LEADERBOARD
    .map(f => f.me ? { ...f, pts: f.pts + myScore } : f)
    .sort((a, b) => b.pts - a.pts);

  const myRank = board.findIndex(f => f.me) + 1;
  const myEntry = board.find(f => f.me);
  const above = board[myRank - 2];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: 1, textTransform: "uppercase" }}>Рейтинг</p>
        <div style={{ display: "flex", gap: 4 }}>
          {[["week", "Неделя"], ["month", "Месяц"]].map(([id, l]) => (
            <button key={id} onClick={() => setSeason(id)} style={{ padding: "6px 14px", borderRadius: "var(--radius-sm)", border: `1px solid ${season === id ? "var(--accent)" : "var(--border2)"}`, background: season === id ? "var(--accent-bg)" : "transparent", color: season === id ? "var(--accent)" : "var(--txt2)", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all .15s" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* My rank callout */}
      <Card style={{ background: "var(--gold-bg)", border: "1px solid var(--gold)", marginBottom: 14 }} pad="14px 16px">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 26, fontWeight: 300, color: "var(--gold)" }}>{myRank}</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--gold)", margin: 0 }}>Ты на {myRank}-м месте</p>
            {above && <p style={{ fontSize: 12, color: "var(--txt2)", margin: 0 }}>До {above.name} — {(above.pts - (myEntry?.pts ?? 0)).toLocaleString()}</p>}
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <p style={{ fontSize: 24, fontWeight: 300, color: "var(--txt)", margin: 0 }}>{myEntry?.pts.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {board.map((f, i) => (
        <div key={f.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 16px", borderRadius: "var(--radius)", background: "var(--surface)", border: f.me ? "1.5px solid var(--gold)" : "1px solid var(--border)", marginBottom: 8, transition: "all .2s" }}>
          <div style={{ width: 28, textAlign: "center", fontSize: i < 3 ? 18 : 14, fontWeight: 300, color: i < 3 ? "var(--gold)" : "var(--txt3)", flexShrink: 0 }}>
            {i < 3 ? MEDALS[i] : i + 1}
          </div>
          <Ava init={f.init} col={f.col} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</span>
              {f.me && <Pill color="var(--gold)" bg="var(--gold-bg)" small>ты</Pill>}
              {f.delta !== 0 && (
                <span style={{ fontSize: 11, color: f.delta > 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                  {f.delta > 0 ? "↑" : "↓"}{Math.abs(f.delta)}
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: "var(--txt3)", margin: 0 }}>{f.streak}д · {f.forms} форм</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 19, fontWeight: 300, color: "var(--txt)", margin: 0 }}>{f.pts.toLocaleString()}</p>
          </div>
        </div>
      ))}

      <div style={{ margin: "8px 0 0", padding: "13px 16px", background: "var(--surface2)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--txt2)", margin: 0 }}>
          Пригласить → <span style={{ color: "var(--txt)", fontWeight: 600 }}>forma.app/denis</span>
        </p>
      </div>
      <div style={{ height: 10 }} />
    </>
  );
}
