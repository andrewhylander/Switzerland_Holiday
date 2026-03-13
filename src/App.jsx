import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Wallet, Search, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Deploy-ready Switzerland Travel App
 *
 * This version is easier to move into a personal GitHub repo and deploy on Vercel because it:
 * - removes shadcn/ui dependencies
 * - uses only React + lucide-react + framer-motion
 * - adds localStorage persistence for itinerary + budget
 * - stays mobile friendly
 *
 * Suggested setup:
 * 1. Create a Vite or Next.js app locally
 * 2. Paste this component into App.jsx / page.jsx
 * 3. npm install lucide-react framer-motion
 * 4. Push to GitHub
 * 5. Import repo into Vercel
 */

const CHF = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
});

const STORAGE_KEYS = {
  itinerary: "swiss-trip-itinerary",
  budget: "swiss-trip-budget",
};

const DEFAULT_ITINERARY = [
  {
    id: "d1",
    date: "Day 1",
    base: "Interlaken",
    title: "Arrive & settle in",
    items: [
      {
        time: "AM",
        title: "Arrive in Switzerland",
        location: "Zurich → Interlaken",
        notes: "Train via Bern. Pick up essentials, check-in, short lake walk.",
        tags: ["travel", "easy"],
      },
      {
        time: "PM",
        title: "Harder Kulm (optional)",
        location: "Interlaken",
        notes: "Great sunset viewpoint if weather is clear.",
        tags: ["viewpoint"],
      },
      {
        time: "EVE",
        title: "Dinner in town",
        location: "Interlaken",
        notes: "Keep it early. Plan tomorrow’s mountain day.",
        tags: ["food"],
      },
    ],
  },
  {
    id: "d2",
    date: "Day 2",
    base: "Grindelwald",
    title: "Grindelwald First",
    items: [
      {
        time: "AM",
        title: "Grindelwald First gondola",
        location: "Firstbahn",
        notes: "Aim early to avoid queues.",
        tags: ["mountains", "cable car"],
      },
      {
        time: "MID",
        title: "First Cliff Walk + Bachalpsee hike",
        location: "First",
        notes: "Family-friendly. Pack layers + snacks.",
        tags: ["hike", "scenic"],
      },
      {
        time: "PM",
        title: "First Flyer / Glider (optional)",
        location: "First",
        notes: "Check height/age rules.",
        tags: ["adventure"],
      },
    ],
  },
  {
    id: "d3",
    date: "Day 3",
    base: "Lauterbrunnen",
    title: "Lauterbrunnen & Mürren",
    items: [
      {
        time: "AM",
        title: "Lauterbrunnen valley waterfalls",
        location: "Staubbach / Trümmelbach",
        notes: "Trümmelbach is inside the mountain (seasonal).",
        tags: ["waterfalls", "easy"],
      },
      {
        time: "PM",
        title: "Cable car to Mürren",
        location: "Stechelberg → Mürren",
        notes: "Wander around Mürren. Views of Eiger, Mönch, Jungfrau.",
        tags: ["village", "viewpoint"],
      },
    ],
  },
  {
    id: "d4",
    date: "Day 4",
    base: "Wengen",
    title: "Jungfraujoch (weather day)",
    items: [
      {
        time: "AM",
        title: "Train to Jungfraujoch",
        location: "Grindelwald / Wengen",
        notes: "Go only if forecast is clear. Otherwise swap with lake day.",
        tags: ["bucket list", "high altitude"],
      },
      {
        time: "PM",
        title: "Ice Palace + Sphinx Observatory",
        location: "Jungfraujoch",
        notes: "Warm layers; it’s cold even in summer.",
        tags: ["museum", "viewpoint"],
      },
    ],
  },
  {
    id: "d5",
    date: "Day 5",
    base: "Interlaken",
    title: "Lakes & chill",
    items: [
      {
        time: "AM",
        title: "Lake Brienz (boat or promenade)",
        location: "Brienz / Iseltwald",
        notes: "Photo stops + relaxed pace.",
        tags: ["lake", "relax"],
      },
      {
        time: "PM",
        title: "Lake Thun (optional)",
        location: "Thun / Spiez",
        notes: "Choose one lake if you prefer slower days.",
        tags: ["lake"],
      },
    ],
  },
];

const DEFAULT_BUDGET = {
  currency: "CHF",
  income: [],
  expenses: [
    { id: "e1", category: "Transport", label: "Swiss Travel Pass / tickets", amount: 0 },
    { id: "e2", category: "Accommodation", label: "Hotels / apartments", amount: 0 },
    { id: "e3", category: "Food", label: "Meals + snacks", amount: 0 },
    { id: "e4", category: "Activities", label: "Mountain lifts / attractions", amount: 0 },
    { id: "e5", category: "Misc", label: "Souvenirs / contingency", amount: 0 },
  ],
};

function sumAmounts(lines) {
  return lines.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function readLocalStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "1px solid " + (active ? "#111827" : "#d1d5db"),
        background: active ? "#111827" : "white",
        color: active ? "white" : "#111827",
        borderRadius: 999,
        padding: "8px 12px",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 24,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SmallBadge({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "1px solid #d1d5db",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        color: "#374151",
        background: "#fff",
      }}
    >
      {children}
    </span>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        border: "1px solid #d1d5db",
        borderRadius: 16,
        padding: "12px 14px",
        fontSize: 14,
        outline: "none",
        ...props.style,
      }}
    />
  );
}

export default function SwitzerlandTravelApp() {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [itinerary, setItinerary] = useState(DEFAULT_ITINERARY);
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [expandedDays, setExpandedDays] = useState(() => new Set([DEFAULT_ITINERARY[0]?.id]));

  useEffect(() => {
    setItinerary(readLocalStorage(STORAGE_KEYS.itinerary, DEFAULT_ITINERARY));
    setBudget(readLocalStorage(STORAGE_KEYS.budget, DEFAULT_BUDGET));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.itinerary, JSON.stringify(itinerary));
  }, [itinerary, ready]);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(budget));
  }, [budget, ready]);

  const allTags = useMemo(() => {
    const tags = itinerary.flatMap((d) => d.items.flatMap((i) => i.tags || []));
    return ["all", ...uniq(tags).sort((a, b) => a.localeCompare(b))];
  }, [itinerary]);

  const filteredItinerary = useMemo(() => {
    const q = query.trim().toLowerCase();
    return itinerary
      .map((day) => {
        const items = day.items.filter((item) => {
          const hay = [day.date, day.base, day.title, item.time, item.title, item.location, item.notes]
            .filter(Boolean)
            .join(" | ")
            .toLowerCase();
          const matchesQuery = !q || hay.includes(q);
          const matchesTag = tagFilter === "all" || (item.tags || []).includes(tagFilter);
          return matchesQuery && matchesTag;
        });
        return { ...day, items };
      })
      .filter((day) => day.items.length > 0);
  }, [itinerary, query, tagFilter]);

  const totals = useMemo(() => {
    const income = sumAmounts(budget.income);
    const expenses = sumAmounts(budget.expenses);
    return { income, expenses, remaining: income - expenses };
  }, [budget]);

  const toggleDay = (id) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateBudgetLine = (kind, id, patch) => {
    setBudget((b) => ({
      ...b,
      [kind]: b[kind].map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  };

  const addBudgetLine = (kind) => {
    setBudget((b) => ({
      ...b,
      [kind]: [
        ...b[kind],
        { id: `${kind}_${Math.random().toString(16).slice(2)}`, category: "Misc", label: "New item", amount: 0 },
      ],
    }));
  };

  const removeBudgetLine = (kind, id) => {
    setBudget((b) => ({ ...b, [kind]: b[kind].filter((l) => l.id !== id) }));
  };

  const resetAll = () => {
    setItinerary(DEFAULT_ITINERARY);
    setBudget(DEFAULT_BUDGET);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        color: "#111827",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 20 }}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "flex-end",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.1 }}>Switzerland Trip Planner</h1>
              <p style={{ marginTop: 8, color: "#6b7280" }}>
                Itinerary + budget in one place. This version is easier to push to GitHub and deploy on Vercel.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <SmallBadge>Europe/Zurich</SmallBadge>
              <SmallBadge>Local save enabled</SmallBadge>
              <SmallBadge>Vercel ready</SmallBadge>
            </div>
          </div>
        </motion.div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Chip active={activeTab === "itinerary"} onClick={() => setActiveTab("itinerary")}>Itinerary</Chip>
          <Chip active={activeTab === "budget"} onClick={() => setActiveTab("budget")}>Budget</Chip>
          <button
            onClick={resetAll}
            style={{
              marginLeft: "auto",
              border: "1px solid #d1d5db",
              background: "white",
              borderRadius: 999,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Reset demo data
          </button>
        </div>

        {activeTab === "itinerary" && (
          <Card style={{ padding: 20 }}>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: "#6b7280" }} />
                  <TextInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search places, activities, notes..."
                    style={{ paddingLeft: 38 }}
                  />
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allTags.map((t) => (
                    <Chip key={t} active={tagFilter === t} onClick={() => setTagFilter(t)}>
                      {t === "all" ? "All" : t}
                    </Chip>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {filteredItinerary.length === 0 ? (
                  <div style={{ color: "#6b7280", fontSize: 14 }}>No matches. Try clearing filters.</div>
                ) : (
                  filteredItinerary.map((day) => {
                    const open = expandedDays.has(day.id);
                    return (
                      <Card key={day.id} style={{ padding: 16, borderRadius: 20 }}>
                        <button
                          onClick={() => toggleDay(day.id)}
                          style={{
                            width: "100%",
                            background: "transparent",
                            border: 0,
                            padding: 0,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                            <div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                                  <CalendarDays size={16} />
                                  {day.date}: {day.title}
                                </div>
                                <SmallBadge>
                                  <MapPin size={12} /> {day.base}
                                </SmallBadge>
                              </div>
                              <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>{day.items.length} items</div>
                            </div>
                            <div style={{ color: "#6b7280" }}>{open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                          </div>
                        </button>

                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: "hidden" }}
                            >
                              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                                {day.items.map((item, idx) => (
                                  <div
                                    key={`${day.id}_${idx}`}
                                    style={{
                                      border: "1px solid #e5e7eb",
                                      borderRadius: 18,
                                      padding: 14,
                                      display: "grid",
                                      gap: 8,
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                                      <div>
                                        <div style={{ fontWeight: 600 }}>
                                          <span style={{ color: "#6b7280", marginRight: 8 }}>{item.time}</span>
                                          {item.title}
                                        </div>
                                        <div style={{ fontSize: 14, color: "#6b7280", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                          <MapPin size={14} /> {item.location}
                                        </div>
                                      </div>
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {(item.tags || []).map((t) => (
                                          <SmallBadge key={t}>{t}</SmallBadge>
                                        ))}
                                      </div>
                                    </div>
                                    {item.notes ? <div style={{ fontSize: 14 }}>{item.notes}</div> : null}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })
                )}
              </div>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Tip: replace the <code>DEFAULT_ITINERARY</code> array with your real Switzerland plan before pushing to GitHub.
              </div>
            </div>
          </Card>
        )}

        {activeTab === "budget" && (
          <Card style={{ padding: 20 }}>
            <div style={{ display: "grid", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Wallet size={18} />
                    <h2 style={{ margin: 0, fontSize: 22 }}>Budget</h2>
                  </div>
                  <p style={{ marginTop: 8, color: "#6b7280" }}>Track your trip costs and see what’s left.</p>
                </div>

                <div
                  style={{
                    minWidth: 240,
                    border: "1px solid #e5e7eb",
                    borderRadius: 20,
                    padding: 14,
                    background: "#fafafa",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Totals</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10, fontSize: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Income</span><span>{CHF.format(totals.income)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Expenses</span><span>{CHF.format(totals.expenses)}</span></div>
                    <div style={{ height: 1, background: "#e5e7eb", margin: "2px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>Remaining</span><span>{CHF.format(totals.remaining)}</span></div>
                  </div>
                </div>
              </div>

              <BudgetEditor
                title="Income"
                lines={budget.income}
                onAdd={() => addBudgetLine("income")}
                onRemove={(id) => removeBudgetLine("income", id)}
                onChange={(id, patch) => updateBudgetLine("income", id, patch)}
              />

              <BudgetEditor
                title="Expenses"
                lines={budget.expenses}
                onAdd={() => addBudgetLine("expenses")}
                onRemove={(id) => removeBudgetLine("expenses", id)}
                onChange={(id, patch) => updateBudgetLine("expenses", id, patch)}
              />

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Budget edits save automatically in local storage, so they survive refreshes on your phone or laptop.
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function BudgetEditor({ title, lines, onAdd, onRemove, onChange }) {
  const subtotal = useMemo(() => sumAmounts(lines), [lines]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <SmallBadge>Subtotal: {CHF.format(subtotal)}</SmallBadge>
          <button
            onClick={onAdd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid #d1d5db",
              background: "white",
              borderRadius: 999,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Add line
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {lines.length === 0 ? (
          <Card style={{ padding: 16, color: "#6b7280" }}>No lines yet. Add one.</Card>
        ) : (
          lines.map((line) => (
            <Card key={line.id} style={{ padding: 14, borderRadius: 18 }}>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <TextInput
                    value={line.category}
                    onChange={(e) => onChange(line.id, { category: e.target.value })}
                    placeholder="Category"
                  />
                  <TextInput
                    value={line.label}
                    onChange={(e) => onChange(line.id, { label: e.target.value })}
                    placeholder="Item"
                  />
                  <TextInput
                    value={String(line.amount ?? "")}
                    onChange={(e) => onChange(line.id, { amount: e.target.value })}
                    inputMode="decimal"
                    placeholder="Amount"
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{line.category || "Uncategorised"}</div>
                  <button
                    onClick={() => onRemove(line.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      border: "1px solid #fecaca",
                      background: "#fff1f2",
                      color: "#991b1b",
                      borderRadius: 999,
                      padding: "8px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
