import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Wallet,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Plane,
  Home,
  ExternalLink,
  Train,
  Coffee,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const CHF = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
});

const STORAGE_KEYS = {
  budget: "swiss-trip-budget-v2",
};

const TRIP_INFO = {
  title: "Switzerland Family Holiday",
  dates: "22 Aug 2026 – 30 Aug 2026",
  base: "Grindelwald",
  accommodation: "GrindelwaldHome Alpenglück",
  address: "Spillstattstrasse 28, 3818 Grindelwald, Switzerland",
  host: "Myriam",
  notes: [
    "Day 4 is the main bucket list day.",
    "Day 7 is a flex / weather buffer day.",
    "Final night is booked near Zurich Airport at Holiday Inn Express Zurich Airport.",
  ],
};

const FLIGHTS = {
  outbound: {
    route: "Dublin → Zurich",
    date: "Sat 22 Aug 2026",
    flight: "LX401",
    operator: "SWISS",
    aircraft: "Airbus A320neo",
    departure: "13:00 from Dublin Terminal 1",
    arrival: "16:15 in Zurich",
    duration: "2h 15m",
    bookingReference: "YMKW98",
  },
  inbound: {
    route: "Zurich → Dublin",
    date: "Sun 30 Aug 2026",
    flight: "EI0343",
    operator: "Aer Lingus",
    fareType: "Z / Economy Class",
    departure: "11:00 from Zurich",
    arrival: "12:30 in Dublin",
    duration: "2h 30m",
    bookingReference: "2TLA5F",
  },
};

const ACCOMMODATION = {
  name: "GrindelwaldHome Alpenglück",
  type: "Entire home/apartment",
  host: "Myriam",
  checkIn: "Sat 22 Aug 2026 after 4:00 PM",
  checkOut: "Sat 29 Aug 2026 by 9:00 AM",
  address: "Spillstattstrasse 28, 3818 Grindelwald, Switzerland",
};

const FINAL_HOTEL = {
  name: "Holiday Inn Express Zurich Airport by IHG",
  type: "Hotel",
  host: "IHG",
  checkIn: "Sat 29 Aug 2026 from 3:00 PM",
  checkOut: "Sun 30 Aug 2026 by 11:00 AM",
  address: "Hofwisenstrasse 30, 8153 Rümlang, ZH, Switzerland",
};

const DEFAULT_ITINERARY = [
  {
    id: "d1",
    date: "Sat 22 Aug 2026",
    base: "Grindelwald",
    title: "Arrive in Switzerland & travel to Grindelwald",
    location: "Zurich → Interlaken Ost → Grindelwald",
    tags: ["travel", "scenic", "easy"],
    mapLocation: "Zurich Airport, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4f/5003_-_Grindelwald_-_View_from_Oberer_Moosgaden.JPG",
    items: [
      {
        time: "PM",
        title: "Arrive in Switzerland",
        location: "Zurich Airport",
        notes: "Land at Zurich Airport at 16:15, then travel by train to Interlaken Ost via Bern.",
        tags: ["travel", "flight"],
      },
      {
        time: "EVE",
        title: "Travel to Grindelwald & check in",
        location: "Interlaken Ost → Grindelwald",
        notes: "Train onward to Grindelwald, then head to the apartment and check in.",
        tags: ["train", "check-in"],
      },
      {
        time: "Late Evening",
        title: "Grocery stop / short village walk",
        location: "Grindelwald",
        notes: "Quick groceries, short stroll if energy allows, then early night.",
        tags: ["easy", "family"],
      },
    ],
  },
  {
    id: "d2",
    date: "Sun 23 Aug 2026",
    base: "Grindelwald",
    title: "Grindelwald First",
    location: "Grindelwald / First / Bort",
    tags: ["adventure", "mountains", "cable car", "scenic", "hike"],
    mapLocation: "Firstbahn, Grindelwald, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/00_3403_Grindelwald-First_(Schweiz).jpg",
    items: [
      {
        time: "AM",
        title: "Grindelwald First gondola",
        location: "Firstbahn → First",
        notes: "Aim early to avoid queues.",
        tags: ["mountains", "cable car"],
      },
      {
        time: "MID",
        title: "First Cliff Walk + Bachalpsee hike",
        location: "First / Bachalpsee",
        notes: "Family-friendly hike. Pack layers and snacks.",
        tags: ["hike", "scenic"],
      },
      {
        time: "PM",
        title: "Bort playground / optional Trottibike",
        location: "Bort",
        notes: "Stop at Bort on the way down. Playground time and optional Trottibike if suitable for the kids.",
        tags: ["family", "fun"],
      },
      {
        time: "EVE",
        title: "Dinner in Grindelwald",
        location: "Grindelwald",
        notes: "Relaxed dinner in town. Suggested spots: Avocado Bar, Café 3692, Barry’s.",
        tags: ["food", "coffee"],
      },
    ],
  },
  {
    id: "d3",
    date: "Mon 24 Aug 2026",
    base: "Grindelwald",
    title: "Lauterbrunnen Valley",
    location: "Lauterbrunnen",
    tags: ["waterfalls", "village", "easy", "scenic", "relax"],
    mapLocation: "Lauterbrunnen, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/44/Lauterbrunnen_-_Switzerland.JPG",
    items: [
      {
        time: "AM",
        title: "Travel to Lauterbrunnen",
        location: "Grindelwald → Lauterbrunnen",
        notes: "Train from Grindelwald to Lauterbrunnen.",
        tags: ["train", "travel"],
      },
      {
        time: "MID",
        title: "Staubbach Falls & village",
        location: "Staubbach Falls, Lauterbrunnen",
        notes: "Visit Staubbach Falls and explore the village.",
        tags: ["waterfalls", "village"],
      },
      {
        time: "PM",
        title: "Valley walk + playground",
        location: "Lauterbrunnen Valley",
        notes: "Flat family-friendly walk with river views, open space, and a playground stop.",
        tags: ["easy", "family", "relax"],
      },
      {
        time: "EVE",
        title: "Return to Grindelwald",
        location: "Lauterbrunnen → Grindelwald",
        notes: "Relaxed evening back at base.",
        tags: ["train", "return"],
      },
    ],
  },
  {
    id: "d4",
    date: "Tue 25 Aug 2026",
    base: "Grindelwald",
    title: "Jungfraujoch (Top of Europe)",
    location: "Grindelwald Terminal / Jungfraujoch",
    tags: ["bucket list", "high altitude", "mountains", "viewpoint"],
    highlight: true,
    mapLocation: "Jungfraujoch, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Jungfraubahn_-_Top_of_Europe_-_3.454m_Jungfraujoch.JPG",
    items: [
      {
        time: "AM",
        title: "Eiger Express",
        location: "Grindelwald Terminal",
        notes: "Travel from Grindelwald Terminal on the Eiger Express.",
        tags: ["bucket list", "cable car"],
      },
      {
        time: "MID",
        title: "Jungfraujoch summit",
        location: "Jungfraujoch",
        notes: "Visit the Ice Palace, Glacier Plateau, Sphinx Observation Deck, and snow play area.",
        tags: ["bucket list", "snow", "viewpoint"],
      },
      {
        time: "PM",
        title: "Optional Kleine Scheidegg stop",
        location: "Kleine Scheidegg",
        notes: "Optional stop on the return for views.",
        tags: ["optional", "viewpoint"],
      },
      {
        time: "EVE",
        title: "Return & quiet dinner",
        location: "Grindelwald",
        notes: "Return early for a quiet dinner and recovery evening.",
        tags: ["recovery", "food"],
      },
    ],
  },
  {
    id: "d5",
    date: "Wed 26 Aug 2026",
    base: "Grindelwald",
    title: "Wengen",
    location: "Wengen",
    tags: ["village", "easy", "scenic", "relax"],
    mapLocation: "Wengen, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/70/Wengen,_3823,_Switzerland_-_panoramio_-_Michal_Gorski.jpg",
    items: [
      {
        time: "AM",
        title: "Train to Wengen",
        location: "Grindelwald → Lauterbrunnen → Wengen",
        notes: "Travel via Lauterbrunnen to Wengen.",
        tags: ["train", "scenic"],
      },
      {
        time: "MID",
        title: "Explore Wengen",
        location: "Wengen",
        notes: "Enjoy the car-free village and terrace coffee with views.",
        tags: ["village", "coffee"],
      },
      {
        time: "PM",
        title: "Playground + optional short walk",
        location: "Wengen / Wengernalp direction",
        notes: "Playground stop and optional easy walk toward Wengernalp.",
        tags: ["family", "optional", "easy"],
      },
      {
        time: "EVE",
        title: "Return to Grindelwald",
        location: "Wengen → Grindelwald",
        notes: "Relaxed evening back at the accommodation.",
        tags: ["return", "train"],
      },
    ],
  },
  {
    id: "d6",
    date: "Thu 27 Aug 2026",
    base: "Grindelwald",
    title: "Interlaken + optional Mürren / Schilthorn",
    location: "Interlaken Ost",
    tags: ["lake", "relax", "scenic", "village"],
    mapLocation: "Interlaken Ost, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Interlaken01.JPG",
    items: [
      {
        time: "AM",
        title: "Train to Interlaken Ost",
        location: "Grindelwald → Interlaken Ost",
        notes: "Travel from Grindelwald to Interlaken Ost.",
        tags: ["train", "travel"],
      },
      {
        time: "MID",
        title: "Aare river walk",
        location: "Interlaken",
        notes: "Easy sightseeing, photos, and a relaxed riverside walk.",
        tags: ["relax", "scenic"],
      },
      {
        time: "PM",
        title: "Höhematte Park",
        location: "Interlaken",
        notes: "Open park space for the kids with an ice cream or coffee stop.",
        tags: ["family", "park", "coffee"],
      },
      {
        time: "Optional",
        title: "Lake Brienz boat / Mürren / Schilthorn",
        location: "Lake Brienz or Mürren / Schilthorn",
        notes: "Optional add-on depending on weather and energy. Schilthorn includes Piz Gloria / James Bond restaurant.",
        tags: ["optional", "bucket list", "lake"],
      },
      {
        time: "EVE",
        title: "Return to Grindelwald",
        location: "Interlaken → Grindelwald",
        notes: "Relaxed final full evening.",
        tags: ["return"],
      },
    ],
  },
  {
    id: "d7",
    date: "Fri 28 Aug 2026",
    base: "Grindelwald",
    title: "Flexible Adventure / Buffer Day",
    location: "Flexible",
    tags: ["relax", "adventure", "buffer"],
    mapLocation: "Grindelwald, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Jungfrau_panorama_from_Mannlichen_(10955538175).jpg",
    items: [
      {
        time: "Option 1",
        title: "Cycling in Lauterbrunnen Valley",
        location: "Lauterbrunnen → Stechelberg",
        notes: "Scenic family cycle route.",
        tags: ["buffer", "cycling", "scenic"],
      },
      {
        time: "Option 2",
        title: "Männlichen",
        location: "Männlichen",
        notes: "Cable car and easy family-friendly walks with panoramic views.",
        tags: ["buffer", "mountains", "viewpoint"],
      },
      {
        time: "Option 3",
        title: "Grindelwald Glacier Canyon",
        location: "Grindelwald Glacier Canyon",
        notes: "Explore the gorge and walkways.",
        tags: ["buffer", "adventure"],
      },
      {
        time: "Option 4",
        title: "Easy village day",
        location: "Grindelwald",
        notes: "Coffee, playgrounds, short walks, and souvenir shopping.",
        tags: ["buffer", "family", "relax"],
      },
    ],
  },
  {
    id: "d8",
    date: "Sat 29 Aug 2026",
    base: "Zurich Airport",
    title: "Travel to Zurich Airport Hotel",
    location: "Grindelwald → Zurich Airport / Rümlang",
    tags: ["travel", "hotel"],
    mapLocation: "Holiday Inn Express Zurich Airport, Hofwisenstrasse 30, 8153 Rümlang, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Zurich_Hauptbahnhof_by_night.JPG",
    items: [
      {
        time: "Morning",
        title: "Check out of Grindelwald stay",
        location: "GrindelwaldHome Alpenglück",
        notes: "Check out of the apartment by 09:00.",
        tags: ["checkout", "travel"],
      },
      {
        time: "PM",
        title: "Travel to airport hotel",
        location: "Grindelwald → Rümlang / Zurich Airport",
        notes: "Travel toward Zurich and check in to the Holiday Inn Express Zurich Airport.",
        tags: ["train", "hotel", "airport"],
      },
      {
        time: "Check-in",
        title: "Holiday Inn Express Zurich Airport",
        location: "Hofwisenstrasse 30, 8153 Rümlang, ZH, Switzerland",
        notes: "Final night stay. Check-in starts at 3:00 PM and check-out is by 11:00 AM the next day.",
        tags: ["hotel", "airport"],
      },
    ],
  },
  {
    id: "d9",
    date: "Sun 30 Aug 2026",
    base: "Zurich Airport",
    title: "Return to Dublin",
    location: "Zurich → Dublin",
    tags: ["travel"],
    mapLocation: "Zurich Airport, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/83/Aerial_View_of_Zurich_Airport_18.02.2009_12-32-36.JPG",
    items: [
      {
        time: "Morning",
        title: "Check out and head to airport",
        location: "Holiday Inn Express Zurich Airport → Zurich Airport",
        notes: "Check out by 11:00 AM, though you will likely leave earlier for the flight.",
        tags: ["hotel", "airport", "travel"],
      },
      {
        time: "Flight",
        title: "Fly home",
        location: "Zurich → Dublin",
        notes: "Depart Zurich at 11:00 and arrive in Dublin at 12:30.",
        tags: ["flight", "travel"],
      },
    ],
  },
];

const DEFAULT_BUDGET = {
  currency: "CHF",
  income: [],
  expenses: [
    { id: "e1", category: "Flights", label: "Dublin ↔ Zurich", amount: 0 },
    { id: "e2", category: "Accommodation", label: "GrindelwaldHome Alpenglück", amount: 0 },
    { id: "e3", category: "Accommodation", label: "Holiday Inn Express Zurich Airport", amount: 0 },
    { id: "e4", category: "Transport", label: "Swiss trains / lifts / gondolas", amount: 0 },
    { id: "e5", category: "Food", label: "Meals / coffee / snacks", amount: 0 },
    { id: "e6", category: "Activities", label: "Jungfraujoch / extras", amount: 0 },
    { id: "e7", category: "Misc", label: "Souvenirs / buffer", amount: 0 },
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

function Chip({ active, children, onClick, tone = "default" }) {
  const tones = {
    default: {
      border: active ? "#1d4ed8" : "#bfdbfe",
      background: active ? "#1d4ed8" : "#eff6ff",
      color: active ? "white" : "#1e3a8a",
    },
    warm: {
      border: active ? "#c2410c" : "#fdba74",
      background: active ? "#c2410c" : "#fff7ed",
      color: active ? "white" : "#9a3412",
    },
  };

  const style = tones[tone] || tones.default;

  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${style.border}`,
        background: style.background,
        color: style.color,
        borderRadius: 999,
        padding: "8px 12px",
        fontSize: 13,
        cursor: "pointer",
        fontWeight: 600,
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
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(8px)",
        border: "1px solid #dbeafe",
        borderRadius: 24,
        boxShadow: "0 14px 34px rgba(30, 41, 59, 0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SmallBadge({ children, color = "blue" }) {
  const styles = {
    blue: { background: "#eff6ff", border: "#bfdbfe", color: "#1e3a8a" },
    green: { background: "#ecfdf5", border: "#a7f3d0", color: "#065f46" },
    amber: { background: "#fffbeb", border: "#fde68a", color: "#92400e" },
    rose: { background: "#fff1f2", border: "#fecdd3", color: "#9f1239" },
    slate: { background: "#f8fafc", border: "#cbd5e1", color: "#334155" },
  };
  const s = styles[color] || styles.blue;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: `1px solid ${s.border}`,
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        color: s.color,
        background: s.background,
        fontWeight: 600,
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
        border: "1px solid #cbd5e1",
        borderRadius: 16,
        padding: "12px 14px",
        fontSize: 14,
        outline: "none",
        background: "white",
        ...props.style,
      }}
    />
  );
}

function getTagColor(tag) {
  const value = String(tag || "").toLowerCase();
  if (["bucket list", "warning", "review", "checkout", "hotel", "airport"].includes(value)) return "rose";
  if (["mountains", "hike", "scenic", "viewpoint", "waterfalls", "lake"].includes(value)) return "green";
  if (["food", "coffee", "family", "relax", "easy"].includes(value)) return "amber";
  return "blue";
}

function mapHref(location) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export default function SwitzerlandTravelAppReal() {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [expandedDays, setExpandedDays] = useState(() => new Set(["d1", "d4", "d8"]));

  useEffect(() => {
    setBudget(readLocalStorage(STORAGE_KEYS.budget, DEFAULT_BUDGET));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(budget));
  }, [budget, ready]);

  const allTags = useMemo(() => {
    const dayTags = DEFAULT_ITINERARY.flatMap((d) => d.tags || []);
    const itemTags = DEFAULT_ITINERARY.flatMap((d) => d.items.flatMap((i) => i.tags || []));
    return ["all", ...uniq([...dayTags, ...itemTags]).sort((a, b) => a.localeCompare(b))];
  }, []);

  const filteredItinerary = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEFAULT_ITINERARY.filter((day) => {
      const hay = [
        day.date,
        day.base,
        day.title,
        day.location,
        ...(day.tags || []),
        ...day.items.flatMap((item) => [item.time, item.title, item.location, item.notes, ...(item.tags || [])]),
      ]
        .filter(Boolean)
        .join(" | ")
        .toLowerCase();
      const matchesQuery = !q || hay.includes(q);
      const matchesTag =
        tagFilter === "all" ||
        (day.tags || []).includes(tagFilter) ||
        day.items.some((item) => (item.tags || []).includes(tagFilter));
      return matchesQuery && matchesTag;
    });
  }, [query, tagFilter]);

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

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #dbeafe 0%, #eff6ff 18%, #f8fafc 36%, #ecfeff 68%, #fefce8 100%)",
        color: "#0f172a",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card style={{ padding: 22, overflow: "hidden", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at top right, rgba(34,197,94,0.18), transparent 30%), radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 32%), radial-gradient(circle at bottom, rgba(251,191,36,0.14), transparent 26%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", display: "grid", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05 }}>{TRIP_INFO.title}</h1>
                  <p style={{ marginTop: 8, color: "#475569", fontSize: 15 }}>
                    {TRIP_INFO.dates} · Base in {TRIP_INFO.base}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <SmallBadge color="green">Family trip</SmallBadge>
                  <SmallBadge color="blue">Base: Grindelwald</SmallBadge>
                  <SmallBadge color="amber">Bucket list: Jungfraujoch</SmallBadge>
                </div>
              </div>

              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                <InfoPanel
                  icon={<Home size={18} />}
                  title="Main stay"
                  body={TRIP_INFO.accommodation}
                  lines={[TRIP_INFO.address, `Host: ${TRIP_INFO.host}`]}
                  href={mapHref(TRIP_INFO.address)}
                  linkLabel="Open Grindelwald stay map"
                />
                <InfoPanel
                  icon={<Plane size={18} />}
                  title="Outbound"
                  body={`${FLIGHTS.outbound.flight} · ${FLIGHTS.outbound.route}`}
                  lines={[FLIGHTS.outbound.date, `Booking ref: ${FLIGHTS.outbound.bookingReference}`]}
                />
                <InfoPanel
                  icon={<Plane size={18} />}
                  title="Return"
                  body={`${FLIGHTS.inbound.flight} · ${FLIGHTS.inbound.route}`}
                  lines={[FLIGHTS.inbound.date, `Booking ref: ${FLIGHTS.inbound.bookingReference}`]}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <Card style={{ padding: 16, borderColor: "#86efac", background: "rgba(240,253,244,0.96)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Home size={20} color="#15803d" style={{ marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 800, color: "#166534" }}>Stay plan confirmed</div>
              <div style={{ color: "#166534", marginTop: 4, fontSize: 14 }}>
                You stay in <strong>GrindelwaldHome Alpenglück</strong> until the morning of <strong>29 Aug</strong>, then move to <strong>Holiday Inn Express Zurich Airport</strong> for the final night before the flight home on <strong>30 Aug</strong>.
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Chip active={activeTab === "itinerary"} onClick={() => setActiveTab("itinerary")}>Itinerary</Chip>
          <Chip active={activeTab === "travel"} onClick={() => setActiveTab("travel")} tone="warm">Flights & stay</Chip>
          <Chip active={activeTab === "budget"} onClick={() => setActiveTab("budget")}>Budget</Chip>
        </div>

        {activeTab === "itinerary" && (
          <Card style={{ padding: 20 }}>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: "#64748b" }} />
                  <TextInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search day, place, activity, notes..."
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
                {filteredItinerary.map((day) => {
                  const open = expandedDays.has(day.id);
                  return (
                    <Card
                      key={day.id}
                      style={{
                        padding: 16,
                        borderRadius: 22,
                        borderColor: day.highlight ? "#fbbf24" : "#dbeafe",
                        background: day.highlight
                          ? "linear-gradient(180deg, rgba(255,251,235,0.98), rgba(255,255,255,0.95))"
                          : "rgba(255,255,255,0.95)",
                      }}
                    >
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
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                          <div style={{ display: "grid", gap: 8 }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                              <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
                                <CalendarDays size={18} />
                                {day.date}
                              </div>
                              <SmallBadge color={day.highlight ? "amber" : "blue"}>{day.title}</SmallBadge>
                              <SmallBadge color="slate">
                                <MapPin size={12} /> {day.base}
                              </SmallBadge>
                            </div>
                            <div style={{ color: "#475569", fontSize: 14 }}>{day.location}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {(day.tags || []).map((t) => (
                                <SmallBadge key={t} color={getTagColor(t)}>{t}</SmallBadge>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <a
                              href={mapHref(day.mapLocation || day.location || day.base)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 12px",
                                borderRadius: 999,
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                textDecoration: "none",
                                border: "1px solid #bfdbfe",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              <MapPin size={14} /> Map
                            </a>
                            <div style={{ color: "#64748b" }}>{open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                          </div>
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
                              {day.image && (
                                <div style={{ borderRadius: 14, overflow: "hidden", background: "#e2e8f0", maxHeight: 320 }}>
                                  <img
                                    src={day.image}
                                    alt={day.title}
                                    style={{ width: "100%", height: "auto", display: "block" }}
                                    onError={(e) => { e.target.style.display = "none"; }}
                                  />
                                </div>
                              )}
                              {day.items.map((item, idx) => (
                                <div
                                  key={`${day.id}_${idx}`}
                                  style={{
                                    border: "1px solid #dbeafe",
                                    borderRadius: 18,
                                    padding: 14,
                                    display: "grid",
                                    gap: 8,
                                    background: "rgba(248,250,252,0.78)",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                                        <span style={{ color: "#64748b", marginRight: 8 }}>{item.time}</span>
                                        {item.title}
                                      </div>
                                      <div style={{ fontSize: 14, color: "#475569", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                        <MapPin size={14} /> {item.location}
                                      </div>
                                    </div>
                                    <a
                                      href={mapHref(item.location)}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "7px 10px",
                                        borderRadius: 999,
                                        background: "white",
                                        color: "#1d4ed8",
                                        textDecoration: "none",
                                        border: "1px solid #bfdbfe",
                                        fontSize: 12,
                                        fontWeight: 700,
                                      }}
                                    >
                                      <ExternalLink size={13} /> Open map
                                    </a>
                                  </div>
                                  <div style={{ fontSize: 14, lineHeight: 1.5 }}>{item.notes}</div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {(item.tags || []).map((t) => (
                                      <SmallBadge key={t} color={getTagColor(t)}>{t}</SmallBadge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {activeTab === "travel" && (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <Card style={{ padding: 18 }}>
              <SectionTitle icon={<Plane size={18} />} title="Outbound flight" />
              <DetailLine label="Route" value={FLIGHTS.outbound.route} />
              <DetailLine label="Date" value={FLIGHTS.outbound.date} />
              <DetailLine label="Flight" value={`${FLIGHTS.outbound.flight} (${FLIGHTS.outbound.operator})`} />
              <DetailLine label="Aircraft" value={FLIGHTS.outbound.aircraft} />
              <DetailLine label="Departure" value={FLIGHTS.outbound.departure} />
              <DetailLine label="Arrival" value={FLIGHTS.outbound.arrival} />
              <DetailLine label="Duration" value={FLIGHTS.outbound.duration} />
              <DetailLine label="Booking ref" value={FLIGHTS.outbound.bookingReference} />
            </Card>

            <Card style={{ padding: 18 }}>
              <SectionTitle icon={<Plane size={18} />} title="Return flight" />
              <DetailLine label="Route" value={FLIGHTS.inbound.route} />
              <DetailLine label="Date" value={FLIGHTS.inbound.date} />
              <DetailLine label="Flight" value={`${FLIGHTS.inbound.flight} (${FLIGHTS.inbound.operator})`} />
              <DetailLine label="Fare" value={FLIGHTS.inbound.fareType} />
              <DetailLine label="Departure" value={FLIGHTS.inbound.departure} />
              <DetailLine label="Arrival" value={FLIGHTS.inbound.arrival} />
              <DetailLine label="Duration" value={FLIGHTS.inbound.duration} />
              <DetailLine label="Booking ref" value={FLIGHTS.inbound.bookingReference} />
            </Card>

            <Card style={{ padding: 18 }}>
              <SectionTitle icon={<Home size={18} />} title="Main stay in Grindelwald" />
              <DetailLine label="Name" value={ACCOMMODATION.name} />
              <DetailLine label="Type" value={ACCOMMODATION.type} />
              <DetailLine label="Host" value={ACCOMMODATION.host} />
              <DetailLine label="Check-in" value={ACCOMMODATION.checkIn} />
              <DetailLine label="Check-out" value={ACCOMMODATION.checkOut} />
              <DetailLine label="Address" value={ACCOMMODATION.address} />
              <div style={{ marginTop: 14 }}>
                <a
                  href={mapHref(ACCOMMODATION.address)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 12px",
                    borderRadius: 999,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    textDecoration: "none",
                    border: "1px solid #bfdbfe",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  <MapPin size={14} /> Open Grindelwald stay map
                </a>
              </div>
            </Card>

            <Card style={{ padding: 18 }}>
              <SectionTitle icon={<Home size={18} />} title="Final night near Zurich Airport" />
              <DetailLine label="Name" value={FINAL_HOTEL.name} />
              <DetailLine label="Type" value={FINAL_HOTEL.type} />
              <DetailLine label="Host" value={FINAL_HOTEL.host} />
              <DetailLine label="Check-in" value={FINAL_HOTEL.checkIn} />
              <DetailLine label="Check-out" value={FINAL_HOTEL.checkOut} />
              <DetailLine label="Address" value={FINAL_HOTEL.address} />
              <div style={{ marginTop: 14 }}>
                <a
                  href={mapHref(FINAL_HOTEL.address)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 12px",
                    borderRadius: 999,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    textDecoration: "none",
                    border: "1px solid #bfdbfe",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  <MapPin size={14} /> Open airport hotel map
                </a>
              </div>
            </Card>

            <Card style={{ padding: 18, gridColumn: "1 / -1" }}>
              <SectionTitle icon={<Train size={18} />} title="Trip notes" />
              <div style={{ display: "grid", gap: 10 }}>
                {TRIP_INFO.notes.map((note) => (
                  <div key={note} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Coffee size={16} color="#2563eb" style={{ marginTop: 2 }} />
                    <div style={{ fontSize: 14, color: "#334155" }}>{note}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
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
                  <p style={{ marginTop: 8, color: "#64748b" }}>Track flights, accommodation, transport, food, and trip extras.</p>
                </div>

                <div
                  style={{
                    minWidth: 240,
                    border: "1px solid #bfdbfe",
                    borderRadius: 20,
                    padding: 14,
                    background: "linear-gradient(180deg, #eff6ff, #ffffff)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#64748b" }}>Totals</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10, fontSize: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Income</span><span>{CHF.format(totals.income)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Expenses</span><span>{CHF.format(totals.expenses)}</span></div>
                    <div style={{ height: 1, background: "#dbeafe", margin: "2px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span>Remaining</span><span>{CHF.format(totals.remaining)}</span></div>
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
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoPanel({ icon, title, body, lines = [], href, linkLabel }) {
  return (
    <div
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 20,
        padding: 14,
        background: "rgba(255,255,255,0.72)",
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>{icon} {title}</div>
      <div style={{ color: "#0f172a", fontWeight: 600 }}>{body}</div>
      {lines.map((line) => (
        <div key={line} style={{ color: "#475569", fontSize: 14 }}>{line}</div>
      ))}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#1d4ed8",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 13,
            marginTop: 2,
          }}
        >
          <ExternalLink size={13} /> {linkLabel}
        </a>
      ) : null}
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      {icon}
      <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
    </div>
  );
}

function DetailLine({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, padding: "7px 0", borderBottom: "1px solid #eef2ff" }}>
      <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ color: "#0f172a", fontSize: 14 }}>{value}</div>
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
          <SmallBadge color="blue">Subtotal: {CHF.format(subtotal)}</SmallBadge>
          <button
            onClick={onAdd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              color: "#1d4ed8",
              borderRadius: 999,
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <Plus size={14} /> Add line
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {lines.length === 0 ? (
          <Card style={{ padding: 16, color: "#64748b" }}>No lines yet. Add one.</Card>
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
                  <div style={{ fontSize: 13, color: "#64748b" }}>{line.category || "Uncategorised"}</div>
                  <button
                    onClick={() => onRemove(line.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      border: "1px solid #fecaca",
                      background: "#fff1f2",
                      color: "#be123c",
                      borderRadius: 999,
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontWeight: 700,
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
