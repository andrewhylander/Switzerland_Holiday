import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
  Package,
  CheckSquare,
  Square,
  Timer,
  Cloud,
  Utensils,
  Star,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const CHF = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
});

const STORAGE_KEYS = {
  budget: "swiss-trip-budget-v2",
  packing: "swiss-trip-packing-v1",
  venues: "swiss-trip-venues-v1",
  quest: "swiss-trip-quest-v1",
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
        notes: "Land at Zurich Airport at 16:15.\n• Zurich Airport → Bern: ~1h 10min\n• Bern → Interlaken Ost: ~50 min\n• Alternative: direct IC from Zurich HB → Interlaken Ost ~2h (simpler, one change)\n• Total from airport: ~2h 30min",
        tags: ["travel", "flight"],
      },
      {
        time: "EVE",
        title: "Travel to Grindelwald & check in",
        location: "Interlaken Ost → Grindelwald",
        notes: "• Interlaken Ost → Grindelwald: BOB train, ~35 min, no changes\n• Runs every 30 min — scenic rack railway through the valley\n• Arrive Grindelwald Bahnhof, then walk to the apartment",
        tags: ["train", "check-in"],
      },
      {
        time: "Late Evening",
        title: "Grocery stop / short village walk",
        location: "Grindelwald",
        notes: "Migros Grindelwald (Dorfstrasse, open daily ~8am–8pm, closed Sun evenings) is the nearest supermarket — about 8 min walk from the apartment. Alternatively, Coop is also in the village centre. Stock up on breakfast items, snacks, and drinks for the first few days to save money on the mountains. Short stroll if energy allows, then early night.",
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
        title: "First Cliff Walk + optional Bachalpsee",
        location: "First",
        notes: "Do the First Cliff Walk suspension walkway with dramatic drop views. If energy and kids allow, the Bachalpsee alpine lake is a further 3km return — beautiful but not essential. Pack layers and snacks.",
        tags: ["hike", "scenic", "optional"],
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
    title: "Männlichen & Cow Playground",
    location: "Männlichen",
    tags: ["mountains", "viewpoint", "family", "fun", "scenic"],
    mapLocation: "Männlichen, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Jungfrau_panorama_from_Mannlichen_(10955538175).jpg",
    items: [
      {
        time: "AM",
        title: "Grindelwald Terminal gondola",
        location: "Grindelwald Terminal → Männlichen",
        notes: "• Walk from apartment → Grindelwald Terminal: ~10 min\n• Grindelwald Terminal → Männlichen gondola: ~19 min\n• Runs regularly — one of the world's longest gondolas\n• Book in advance at jungfrau.ch\n• Go early for the clearest mountain views",
        tags: ["cable car", "mountains"],
      },
      {
        time: "MID",
        title: "Cow Playground 🐄",
        location: "Männlichen summit",
        notes: "The famous Cow Playground is right beside the cable car station at the top. The kids will love the cow slide! Plenty of space to run around with incredible mountain views.",
        tags: ["family", "fun"],
      },
      {
        time: "PM",
        title: "Royal Walk to the crown viewpoint",
        location: "Männlichen → Royal Walk crown",
        notes: "Easy flat 20-minute walk along the ridge to the iconic crown viewpoint. Panoramic views of Eiger, Mönch, and Jungfrau all at once. One of the best viewpoints in the Bernese Oberland.",
        tags: ["hike", "viewpoint", "scenic"],
      },
      {
        time: "EVE",
        title: "Return to Grindelwald",
        location: "Männlichen → Grindelwald",
        notes: "Gondola back down. Relaxed dinner in Grindelwald.",
        tags: ["return", "food"],
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
        notes: "• Grindelwald Terminal → Eigergletscher: Eiger Express gondola, ~28 min\n• Eigergletscher → Jungfraujoch: Jungfraubahn rack railway, ~35 min\n• Total each way: ~65 min\n• First departure from Grindelwald Terminal: ~7:30am\n• Book well in advance at jungfrau.ch — sells out fast",
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
    title: "Wengen & Kleine Scheidegg",
    location: "Wengen → Kleine Scheidegg",
    tags: ["village", "easy", "scenic", "relax", "hike"],
    mapLocation: "Wengen, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/70/Wengen,_3823,_Switzerland_-_panoramio_-_Michal_Gorski.jpg",
    items: [
      {
        time: "AM",
        title: "Train to Wengen",
        location: "Grindelwald → Lauterbrunnen → Wengen",
        notes: "• Grindelwald → Zweilütschinen: ~10 min\n• Change: BOB train → Lauterbrunnen: ~15 min\n• Change: Wengernalpbahn (WAB) rack railway → Wengen: ~15 min\n• Total: ~40 min | Trains every 30 min\n• Wengen is car-free — no road access",
        tags: ["train", "scenic"],
      },
      {
        time: "MID",
        title: "Explore Wengen + coffee",
        location: "Wengen",
        notes: "Enjoy the car-free village. Grab a coffee at Hotel Bellevue terrace — one of the best views in Switzerland with the Jungfrau directly behind you.",
        tags: ["village", "coffee"],
      },
      {
        time: "PM",
        title: "Walk to Kleine Scheidegg + lunch",
        location: "Wengen → Kleine Scheidegg",
        notes: "Walk the Wengernalp trail from Wengen to Kleine Scheidegg (~5km, ~90 min, mostly flat with a gentle climb at the end). Unbeatable Eiger north face views the entire way — one of the great easy alpine walks. Lunch at the Restaurant Kleine Scheidegg or grab snacks on the terrace with the Eiger directly in front of you. Kids can play in the open meadows around the station.",
        tags: ["hike", "scenic", "food", "family"],
      },
      {
        time: "EVE",
        title: "Rack railway back to Grindelwald",
        location: "Kleine Scheidegg → Grindelwald",
        notes: "• Kleine Scheidegg → Grindelwald Grund: Wengernalpbahn rack railway, ~35 min\n• No need to retrace steps — a satisfying loop\n• Relaxed evening back at the accommodation",
        tags: ["return", "train", "scenic"],
      },
    ],
  },
  {
    id: "d6",
    date: "Thu 27 Aug 2026",
    base: "Grindelwald",
    title: "Lauterbrunnen Valley by Bike",
    location: "Lauterbrunnen",
    tags: ["waterfalls", "village", "easy", "scenic", "cycling", "family"],
    mapLocation: "Lauterbrunnen, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/44/Lauterbrunnen_-_Switzerland.JPG",
    items: [
      {
        time: "AM",
        title: "Travel to Lauterbrunnen",
        location: "Grindelwald → Lauterbrunnen",
        notes: "• Grindelwald → Zweilütschinen: ~10 min\n• Change: BOB train → Lauterbrunnen: ~15 min\n• Total: ~25 min | Runs every 30 min\n• Bike hire near the station (e.g. Imboden Bike) — no booking, get there by ~9am",
        tags: ["train", "travel"],
      },
      {
        time: "MID",
        title: "Staubbach Falls",
        location: "Staubbach Falls, Lauterbrunnen",
        notes: "Walk up to the base of the 300m Staubbach Falls — free entry. Gets you soaked if you go close! One of Europe's highest free-falling waterfalls.",
        tags: ["waterfalls", "village"],
      },
      {
        time: "PM",
        title: "Hire bikes & cycle the valley",
        location: "Lauterbrunnen → Stechelberg",
        notes: "Hire bikes in Lauterbrunnen village (several hire shops near the station). The valley floor is completely flat — a perfect 9km family cycle to Stechelberg and back along the river, with 72 waterfalls in the valley walls around you. Optional stop at Trümmelbach Falls (10 glacial waterfalls inside the mountain — kids love it).",
        tags: ["cycling", "family", "scenic"],
      },
      {
        time: "EVE",
        title: "Return bikes & head back to Grindelwald",
        location: "Lauterbrunnen → Grindelwald",
        notes: "Return bikes and grab an ice cream at Airtime Café, then:\n• Lauterbrunnen → Zweilütschinen → Grindelwald: BOB train, ~25 min",
        tags: ["train", "return", "food"],
      },
    ],
  },
  {
    id: "d7",
    date: "Fri 28 Aug 2026",
    base: "Grindelwald",
    title: "Mürren & Allmendhubel — or Interlaken",
    location: "Mürren / Interlaken",
    tags: ["village", "relax", "scenic", "family", "buffer"],
    mapLocation: "Mürren, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Interlaken01.JPG",
    items: [
      {
        time: "💼 Suitcase Tip",
        title: "Store luggage at Grindelwald station",
        location: "Grindelwald Bahnhof",
        notes: "Grindelwald station has staffed left-luggage (Gepäckaufbewahrung) and coin lockers.\n• Drop bags before 9am, collect same day\n• For Option A (Mürren): store at Grindelwald, collect on your return\n• For Option B (Interlaken): store at Interlaken Ost station instead — large, easy lockers",
        tags: ["luggage", "practical", "travel"],
      },
      {
        time: "Option A",
        title: "Mürren + Allmendhubel Playground",
        location: "Lauterbrunnen → Grütschalp → Mürren",
        notes: "Getting there (~50 min total):\n• Grindelwald → Zweilütschinen → Lauterbrunnen: train, ~25 min\n• Lauterbrunnen → Grütschalp: cable car, ~5 min\n• Grütschalp → Mürren: little mountain railway, ~20 min\nMagical car-free cliff village. Visit the Allmendhubel Flower Park playground — water features and themed play with mountain views. Optional: cable car to Schilthorn (Piz Gloria, James Bond revolving restaurant).",
        tags: ["village", "family", "cable car", "scenic"],
      },
      {
        time: "Option B",
        title: "Interlaken town day",
        location: "Grindelwald → Interlaken Ost",
        notes: "• Grindelwald → Zweilütschinen → Interlaken Ost: ~55 min, every 30 min\nAare river walk, Höhematte park, ice cream, and souvenir shopping on the Höheweg. Large lockers at Interlaken Ost station if you have luggage.",
        tags: ["relax", "family", "park", "scenic"],
      },
      {
        time: "Option C",
        title: "Grindelwald Glacier Canyon + village",
        location: "Grindelwald",
        notes: "Explore the Glacier Canyon gorge walkways right near base. Then coffee, playgrounds, and souvenir shopping in the village. Great if you want a low-travel final day.",
        tags: ["adventure", "family", "easy"],
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
        notes: "• Grindelwald → Interlaken Ost: ~55 min\n• Interlaken Ost → Bern: ~50 min\n• Bern → Zurich HB: ~1h\n• Zurich HB → Zurich Airport: ~10 min\n• Total: ~2h 45min | Trains every 30 min from Grindelwald\nAllow extra time with luggage. Airport station is directly under the terminal. Hotel check-in from 3pm.",
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

const DEFAULT_PACKING_CATEGORIES = [
  { id: "cat_docs",        label: "Documents" },
  { id: "cat_clothing",    label: "Clothing & Footwear" },
  { id: "cat_kids",        label: "Kids" },
  { id: "cat_electronics", label: "Electronics" },
  { id: "cat_toiletries",  label: "Toiletries & Health" },
  { id: "cat_hiking",      label: "Hiking & Outdoors" },
  { id: "cat_misc",        label: "Misc" },
];

const DEFAULT_PACKING_ITEMS = [
  // Documents
  { id: "p_d1", categoryId: "cat_docs", text: "Passports (all family)", checked: false },
  { id: "p_d2", categoryId: "cat_docs", text: "Flight booking refs (YMKW98 / 2TLA5F)", checked: false },
  { id: "p_d3", categoryId: "cat_docs", text: "Travel insurance documents", checked: false },
  { id: "p_d4", categoryId: "cat_docs", text: "Accommodation confirmations (printed/offline)", checked: false },
  { id: "p_d5", categoryId: "cat_docs", text: "European Health Insurance Cards (EHIC)", checked: false },
  { id: "p_d6", categoryId: "cat_docs", text: "Emergency contact list", checked: false },
  // Clothing & Footwear
  { id: "p_c1",  categoryId: "cat_clothing", text: "Hiking boots (broken in)", checked: false },
  { id: "p_c2",  categoryId: "cat_clothing", text: "Rain jacket / waterproof layer", checked: false },
  { id: "p_c3",  categoryId: "cat_clothing", text: "Warm fleece / mid layer", checked: false },
  { id: "p_c4",  categoryId: "cat_clothing", text: "T-shirts (5+)", checked: false },
  { id: "p_c5",  categoryId: "cat_clothing", text: "Shorts / trousers", checked: false },
  { id: "p_c6",  categoryId: "cat_clothing", text: "Waterproof trousers", checked: false },
  { id: "p_c7",  categoryId: "cat_clothing", text: "Warm hat & gloves (for Jungfraujoch)", checked: false },
  { id: "p_c8",  categoryId: "cat_clothing", text: "Comfortable walking shoes", checked: false },
  { id: "p_c9",  categoryId: "cat_clothing", text: "Swimwear", checked: false },
  { id: "p_c10", categoryId: "cat_clothing", text: "Underwear & socks (7 days)", checked: false },
  // Kids
  { id: "p_k1", categoryId: "cat_kids", text: "Kids' hiking boots / sturdy shoes", checked: false },
  { id: "p_k2", categoryId: "cat_kids", text: "Child medication (Calpol, antihistamine)", checked: false },
  { id: "p_k3", categoryId: "cat_kids", text: "Snacks for travel / hikes", checked: false },
  { id: "p_k4", categoryId: "cat_kids", text: "Books / school activity packs", checked: false },
  { id: "p_k5", categoryId: "cat_kids", text: "Small backpack for kids", checked: false },
  { id: "p_k6", categoryId: "cat_kids", text: "Favourite comfort toy / teddy", checked: false },
  { id: "p_k7", categoryId: "cat_kids", text: "Travel sickness remedies", checked: false },
  { id: "p_k8", categoryId: "cat_kids", text: "Reusable water bottles for kids", checked: false },
  // Electronics
  { id: "p_e1", categoryId: "cat_electronics", text: "Mobile phones + cases", checked: false },
  { id: "p_e2", categoryId: "cat_electronics", text: "Phone chargers (x2)", checked: false },
  { id: "p_e3", categoryId: "cat_electronics", text: "Swiss Type J adapter plugs", checked: false },
  { id: "p_e4", categoryId: "cat_electronics", text: "Portable power bank", checked: false },
  { id: "p_e5", categoryId: "cat_electronics", text: "Camera + memory cards", checked: false },
  { id: "p_e6", categoryId: "cat_electronics", text: "Camera battery + charger", checked: false },
  { id: "p_e7", categoryId: "cat_electronics", text: "Headphones / earbuds", checked: false },
  { id: "p_e8", categoryId: "cat_electronics", text: "Tablet or e-reader", checked: false },
  // Toiletries & Health
  { id: "p_t1", categoryId: "cat_toiletries", text: "High SPF sunscreen (Swiss UV is intense)", checked: false },
  { id: "p_t2", categoryId: "cat_toiletries", text: "Lip balm with SPF", checked: false },
  { id: "p_t3", categoryId: "cat_toiletries", text: "First aid kit (plasters, antiseptic, ibuprofen)", checked: false },
  { id: "p_t4", categoryId: "cat_toiletries", text: "Insect repellent", checked: false },
  { id: "p_t5", categoryId: "cat_toiletries", text: "Toothbrushes & toothpaste", checked: false },
  { id: "p_t6", categoryId: "cat_toiletries", text: "Shampoo / conditioner", checked: false },
  { id: "p_t7", categoryId: "cat_toiletries", text: "Deodorant", checked: false },
  { id: "p_t8", categoryId: "cat_toiletries", text: "Hand sanitiser", checked: false },
  { id: "p_t9", categoryId: "cat_toiletries", text: "Altitude headache tablets", checked: false },
  // Hiking & Outdoors
  { id: "p_h1", categoryId: "cat_hiking", text: "Adult backpacks (day pack 20–30L)", checked: false },
  { id: "p_h2", categoryId: "cat_hiking", text: "Sunglasses (UV400) for all family", checked: false },
  { id: "p_h3", categoryId: "cat_hiking", text: "Reusable water bottles (adults)", checked: false },
  { id: "p_h4", categoryId: "cat_hiking", text: "Hiking poles (optional)", checked: false },
  { id: "p_h5", categoryId: "cat_hiking", text: "Lightweight picnic blanket", checked: false },
  { id: "p_h6", categoryId: "cat_hiking", text: "Snacks / trail mix / energy bars", checked: false },
  { id: "p_h7", categoryId: "cat_hiking", text: "Swiss railway app downloaded offline", checked: false },
  // Misc
  { id: "p_m1", categoryId: "cat_misc", text: "Travel cash (CHF)", checked: false },
  { id: "p_m2", categoryId: "cat_misc", text: "Small padlock for bags", checked: false },
  { id: "p_m3", categoryId: "cat_misc", text: "Reusable shopping bags", checked: false },
  { id: "p_m4", categoryId: "cat_misc", text: "Travel umbrella", checked: false },
];

const WEATHER_LOCATIONS = [
  { id: "grindelwald",  label: "Grindelwald",  lat: 46.6242, lon: 8.0411, elevation: "1,034m" },
  { id: "interlaken",   label: "Interlaken",   lat: 46.6863, lon: 7.8632, elevation: "568m"   },
  { id: "jungfraujoch", label: "Jungfraujoch", lat: 46.5472, lon: 7.9851, elevation: "3,454m" },
  { id: "zurich",       label: "Zurich",        lat: 47.3769, lon: 8.5417, elevation: "408m"   },
];

function wmoDescription(code) {
  if (code === 0) return { icon: "☀️",  label: "Clear sky" };
  if (code <= 3)  return { icon: "⛅",  label: "Partly cloudy" };
  if (code <= 48) return { icon: "🌫️", label: "Foggy" };
  if (code <= 67) return { icon: "🌧️", label: "Rain" };
  if (code <= 77) return { icon: "❄️",  label: "Snow" };
  if (code <= 82) return { icon: "🌦️", label: "Showers" };
  if (code <= 86) return { icon: "🌨️", label: "Snow showers" };
  return          { icon: "⛈️",  label: "Thunderstorm" };
}

function groupHourlyByDay(hourly) {
  const days = {};
  hourly.time.forEach((timeStr, i) => {
    const [date, time] = timeStr.split("T");
    const hour = parseInt(time);
    let period = null;
    if (hour === 9)       period = "morning";
    else if (hour === 14) period = "afternoon";
    else if (hour === 20) period = "evening";
    if (!period) return;
    if (!days[date]) days[date] = {};
    days[date][period] = {
      temp:   Math.round(hourly.temperature_2m[i]),
      code:   hourly.weather_code[i],
      precip: hourly.precipitation_probability[i] ?? 0,
    };
  });
  return days;
}

const DAY_FOOD_LOCATIONS = {
  d1: "Grindelwald",
  d2: "Grindelwald",
  d3: "Lauterbrunnen",
  d4: "Grindelwald",
  d5: "Wengen",
  d6: "Interlaken",
  d7: "Grindelwald",
  d8: "Zurich",
  d9: "Zurich",
};

const FOOD_LOCATIONS = ["Grindelwald", "Lauterbrunnen", "Gimmelwald", "Wengen", "Interlaken", "Zurich"];

const FOOD_LOCATION_COORDS = {
  Grindelwald:   { lat: 46.6242, lon: 8.0411 },
  Lauterbrunnen: { lat: 46.5958, lon: 7.9082 },
  Gimmelwald:    { lat: 46.5625, lon: 7.8920 },
  Wengen:        { lat: 46.6085, lon: 7.9211 },
  Interlaken:    { lat: 46.6863, lon: 7.8632 },
  Zurich:        { lat: 47.3769, lon: 8.5417 },
};

const VENUE_TYPES = {
  restaurant: { icon: "🍽️", label: "Restaurant" },
  cafe:       { icon: "☕", label: "Café" },
  bakery:     { icon: "🥐", label: "Bakery" },
  bar:        { icon: "🍺", label: "Bar & Drinks" },
};

const MEAL_TYPES = [
  { id: "breakfast", icon: "🌅", label: "Breakfast" },
  { id: "coffee",    icon: "☕", label: "Coffee" },
  { id: "lunch",     icon: "🥗", label: "Lunch" },
  { id: "dinner",    icon: "🌙", label: "Dinner" },
  { id: "drinks",    icon: "🍺", label: "Drinks" },
];

const DEFAULT_VENUES = [
  // Grindelwald — Dinner & Evening
  { id: "v1",  name: "Barry's Restaurant, Bar & Lounge", type: "restaurant", location: "Grindelwald",    meals: ["breakfast", "lunch", "dinner", "drinks"], rating: 4.4, notes: "Landmark Hotel Eiger restaurant. Swiss fondue, tomahawk steak, own-brand gin. Legendary bar since the 1960s. Ask for the chocolate fondue dessert. Breakfast buffet from 7am." },
  { id: "v21", name: "Avocado Bar",                      type: "bar",        location: "Grindelwald",    meals: ["dinner", "drinks"],                       rating: 4.5, notes: "Grindelwald's liveliest evening spot. Craft cocktails, juicy burgers, loaded fries. Great terrace on Dorfstrasse. Popular with families and après-ski crowd alike. Busy in summer — worth arriving early." },
  { id: "v22", name: "Restaurant Hotel Spinne",          type: "restaurant", location: "Grindelwald",    meals: ["lunch", "dinner"],                        rating: 4.6, notes: "Well-loved Grindelwald classic on Dorfstrasse. Excellent cheese and chocolate fondue, raclette, and rösti. Ask for chocolate fondue with strawberries — a real treat for the kids. Good wine list." },
  { id: "v23", name: "Restaurant Schmitte",              type: "restaurant", location: "Grindelwald",    meals: ["lunch", "dinner"],                        rating: 4.2, notes: "Cosy chalet-style restaurant at Hotel Schmitte. Reliable Swiss classics — schnitzel, rösti, bratwurst. Central location, family-friendly, reasonably priced for Grindelwald." },
  { id: "v24", name: "Restaurant Grindelwaldblick",      type: "restaurant", location: "Grindelwald",    meals: ["lunch", "dinner"],                        rating: 4.4, notes: "Panoramic terrace with direct Eiger views. Traditional Swiss menu with seasonal specials. One of the best photo backdrops for a meal in the village. Book ahead for terrace tables." },
  { id: "v27", name: "Ristorante Pizzeria Da Salvi",     type: "restaurant", location: "Grindelwald",    meals: ["lunch", "dinner"],                        rating: 4.4, notes: "Friendly Italian restaurant in the heart of Grindelwald. Authentic wood-fired pizza, pasta and comfort dishes. Great family option on a tired evening — kids love the pizza. Dorfstrasse 189." },
  { id: "v28", name: "Central Hotel Wolter Restaurant",  type: "restaurant", location: "Grindelwald",    meals: ["lunch", "dinner"],                        rating: 4.3, notes: "Classic Swiss restaurant near the train station. Famous for rösti, fondue and traditional alpine dishes. Great dessert menu. Reliable, central and reasonably priced. Dorfstrasse 93." },
  // Grindelwald — Cafés & Breakfast
  { id: "v2",  name: "Café Bar 3692",                    type: "cafe",       location: "Grindelwald",    meals: ["coffee", "lunch"],                        notes: "Artistic interior made from local materials. Garden herbs and locally sourced ingredients. Glacier and mountain views." },
  { id: "v3",  name: "Bäckerei Fuchs",                   type: "bakery",     location: "Grindelwald",    meals: ["breakfast", "coffee"],                    notes: "Local bakery — perfect for fresh bread and pastries in the morning." },
  { id: "v29", name: "C & M Café Bar Restaurant",        type: "cafe",       location: "Grindelwald",    meals: ["coffee", "lunch"],                        rating: 4.6, notes: "Popular café in the centre of Grindelwald. Beautiful cakes, pastries and excellent hot chocolate. Cosy alpine atmosphere. Perfect stop after exploring the village." },
  // Grindelwald — Mountain Restaurants
  { id: "v11", name: "Restaurant Onkel Tom's Hütte",     type: "restaurant", location: "Grindelwald",    meals: ["lunch", "dinner"],                        notes: "Classic mountain hut restaurant. Traditional Swiss cuisine, popular with locals and hikers on the valley floor." },
  { id: "v12", name: "Berggasthaus First",               type: "restaurant", location: "Grindelwald",    meals: ["lunch"],                                  rating: 4.5, notes: "Right at the First gondola summit. Rösti, fondue, bratwurst with sweeping Eiger and Wetterhorn views. Huge terrace with glacier views. Next to the Cliff Walk." },
  { id: "v25", name: "Berghaus Männlichen",              type: "restaurant", location: "Grindelwald",    meals: ["lunch"],                                  rating: 4.5, notes: "Right beside the Männlichen gondola station with one of the best terraces in the Jungfrau region. Views of Eiger, Mönch and Jungfrau. Great spot for lunch before the Royal Walk. Rösti, soup, kids' plates." },
  { id: "v26", name: "Restaurant Kleine Scheidegg",      type: "restaurant", location: "Grindelwald",    meals: ["lunch"],                                  rating: 4.6, notes: "Iconic mountain lunch stop with the Eiger north face right in front of you. Rösti and soup are the locals' choice. Unmissable photo backdrop — rack railway on one side, Eiger on the other." },
  { id: "v30", name: "Bergrestaurant Pfingstegg",        type: "restaurant", location: "Grindelwald",    meals: ["lunch"],                                  rating: 4.4, notes: "Mountain restaurant above Grindelwald beside the Pfingstegg alpine coaster. Fantastic valley views from the terrace. Great snack and lunch stop — worth combining with the toboggan run." },
  // Lauterbrunnen
  { id: "v4",  name: "Airtime Café",                     type: "cafe",       location: "Lauterbrunnen", meals: ["breakfast", "coffee", "lunch"],            notes: "Terrace overlooking Staubbach Falls. Famous for cinnamon rolls — perfect refuel after hiking." },
  { id: "v5",  name: "Hotel Oberland Restaurant",        type: "restaurant", location: "Lauterbrunnen", meals: ["lunch", "dinner"],                        rating: 4.5, notes: "Well-known restaurant in Lauterbrunnen famous for Swiss fondue and its terrace overlooking the waterfall valley. Cosy chalet ambience, Oberland Rösti, and rahmschnitzel. Reservations recommended for dinner." },
  { id: "v13", name: "Restaurant Steinbock",             type: "restaurant", location: "Lauterbrunnen", meals: ["lunch", "dinner"],                        notes: "Near the train station with a summer garden. 20 pizza varieties plus Swiss classics." },
  { id: "v14", name: "Restaurant Weidstübli",            type: "restaurant", location: "Lauterbrunnen", meals: ["lunch", "dinner"],                        notes: "Inside the campground near the falls. Very affordable, generous portions, excellent fondue." },
  // Gimmelwald
  { id: "v31", name: "Mountain Hostel Restaurant",       type: "cafe",       location: "Gimmelwald",    meals: ["coffee", "lunch"],                        rating: 4.6, notes: "Relaxed mountain café in the magical car-free village of Gimmelwald with breathtaking views across the Lauterbrunnen valley. Simple pizzas, snacks and drinks. Reach via cable car from Stechelberg." },
  // Wengen
  { id: "v6",  name: "Restaurant Eiger",                 type: "restaurant", location: "Wengen",        meals: ["lunch", "dinner"],                        rating: 4.4, notes: "Right outside Wengen train station. Rösti, raclette, tomato soup with gin. Highly rated." },
  { id: "v15", name: "Hotel Bären Restaurant",           type: "restaurant", location: "Wengen",        meals: ["lunch", "dinner"],                        notes: "Family-run, 5 min downhill from station. Large terrace, great views, own vegetable garden." },
  { id: "v16", name: "Café Restaurant Waldschlucht",     type: "cafe",       location: "Wengen",        meals: ["breakfast", "coffee", "lunch"],            notes: "Warm and welcoming. Known for flavourful soups and cosy ambiance. Great after a hike." },
  // Interlaken
  { id: "v7",  name: "Grand Café Schuh",                 type: "cafe",       location: "Interlaken",    meals: ["breakfast", "coffee", "lunch"],            rating: 4.6, notes: "Iconic Interlaken patisserie & café since 1818. Famous for chocolate fondue with strawberries — arguably the best in the region. Mountain views from the terrace. A special treat for the kids." },
  { id: "v17", name: "Velo Café",                        type: "cafe",       location: "Interlaken",    meals: ["breakfast", "coffee", "lunch"],            notes: "Trendy local favourite. Italian espresso, homemade granola with local yogurt, popular vegan options." },
  { id: "v18", name: "Bäckerei Steininger",              type: "bakery",     location: "Interlaken",    meals: ["breakfast", "coffee"],                    notes: "Fresh-baked daily. Excellent quiche and pastries. Short walk from central Interlaken." },
  { id: "v8",  name: "Restaurant Taverne",               type: "restaurant", location: "Interlaken",    meals: ["lunch", "dinner"],                        notes: "Authentic Swiss fondue and traditional cuisine in a classic Bernese Oberland setting." },
  { id: "v32", name: "Bebbis Restaurant",                type: "restaurant", location: "Interlaken",    meals: ["lunch", "dinner"],                        rating: 4.3, notes: "Large lively restaurant on Interlaken's Höheweg. Huge menu — burgers, fondue, Swiss classics. Central location beside the Höhematte park. Good for groups and families." },
  // Zurich
  { id: "v9",  name: "Café Sprüngli",                    type: "cafe",       location: "Zurich",        meals: ["breakfast", "coffee", "lunch"],            notes: "On Paradeplatz since 1836. World-famous for Luxemburgerli macarons and Swiss chocolate. Essential Zurich stop." },
  { id: "v10", name: "Zeughauskeller",                   type: "restaurant", location: "Zurich",        meals: ["lunch", "dinner", "drinks"],              notes: "Historic beer hall in a 15th-century armoury on Bahnhofstrasse. Rösti, Wiener Schnitzel, giant beers." },
  { id: "v19", name: "Kronenhalle",                      type: "restaurant", location: "Zurich",        meals: ["lunch", "dinner"],                        notes: "Legendary brasserie open since 1924. Walls hung with original Miró and Chagall. Signature Zürcher Geschnetzeltes." },
  { id: "v20", name: "Boréal Coffee",                    type: "cafe",       location: "Zurich",        meals: ["breakfast", "coffee"],                    notes: "Specialty ethically-sourced coffee and pastries. Popular with locals — two Zurich locations." },
];

const MAP_PLACES = [
  // 🏠 STAY
  { id: "mp0",  cat: "stay",       emoji: "🏠", name: "Alpenglück Chalet (Airbnb)",        location: "Grindelwald",          lat: 46.6253, lng: 8.0383,  mission: "Home base for the adventure",                notes: "GrindelwaldHome Alpenglück — your base for the whole trip. Stunning Eiger views." },
  // ☕ CAFÉS
  { id: "mp1",  cat: "cafe",       emoji: "☕", name: "Barry's",                            location: "Grindelwald",          lat: 46.6249, lng: 8.0417,  rating: 4.4, mission: "Try a chocolate dessert",                    notes: "Great desserts and hot chocolate. Central location." },
  { id: "mp2",  cat: "cafe",       emoji: "☕", name: "Bergrestaurant First",               location: "Grindelwald First",    lat: 46.6589, lng: 8.0542,  rating: 4.5, mission: "Drink hot chocolate above the clouds",       notes: "Huge terrace and incredible mountain views." },
  { id: "mp3",  cat: "cafe",       emoji: "☕", name: "Bort Restaurant",                    location: "Bort",                 lat: 46.6487, lng: 8.0471,  mission: "Play at the mountain playground café",       notes: "Great stop on the way down from First. Playground for kids." },
  { id: "mp4",  cat: "cafe",       emoji: "🍦", name: "Airtime Café",                       location: "Lauterbrunnen",        lat: 46.5931, lng: 7.9093,  mission: "Eat ice cream in a waterfall village",       notes: "Perfect stop after Staubbach Falls." },
  { id: "mp5",  cat: "cafe",       emoji: "🍰", name: "Restaurant Kleine Scheidegg",        location: "Kleine Scheidegg",     lat: 46.5854, lng: 7.9603,  mission: "Eat cake beside the Eiger",                  notes: "Amazing views of the Eiger north face." },
  { id: "mp6",  cat: "cafe",       emoji: "🍰", name: "Hotel Bellevue Terrace",             location: "Wengen",               lat: 46.6066, lng: 7.9204,  mission: "Eat cake with the Jungfrau behind you",      notes: "One of the best terrace views in Switzerland." },
  { id: "mp7",  cat: "cafe",       emoji: "☕", name: "Aare Café",                          location: "Interlaken",           lat: 46.6863, lng: 7.8632,  mission: "Drink coffee beside a mountain river",       notes: "Relaxed stop near the Aare river walk." },
  { id: "mp8",  cat: "cafe",       emoji: "🥐", name: "Cafe 3692",                          location: "Grindelwald",          lat: 46.6235, lng: 8.0410,  mission: "Eat pancakes in a Swiss café",               notes: "Great brunch and pastries." },
  { id: "mp30", cat: "cafe",       emoji: "☕", name: "Eiger Bean",                         location: "Grindelwald",          lat: 46.6240, lng: 8.0412,  mission: "Best coffee with an Eiger view",             notes: "Speciality coffee shop in Grindelwald. Great stop before hitting the mountains." },
  // 💦 WATERFALLS
  { id: "mp9",  cat: "waterfall",  emoji: "💦", name: "Staubbach Falls",                   location: "Lauterbrunnen",        lat: 46.5937, lng: 7.9094,  mission: "Stand under a 300m free-falling waterfall",  notes: "One of Europe's highest free-falling waterfalls. Walk right up to it — free entry." },
  { id: "mp10", cat: "waterfall",  emoji: "🌊", name: "Trümmelbach Falls",                 location: "Lauterbrunnen Valley", lat: 46.5717, lng: 7.9114,  mission: "Go inside a waterfall inside a mountain",    notes: "10 glacier waterfalls inside the rock. Lifts inside the mountain. Kids love it." },
  { id: "mp11", cat: "waterfall",  emoji: "🚟", name: "Giessbach Falls",                   location: "Brienz",               lat: 46.7178, lng: 7.9844,  mission: "Ride the oldest funicular to a waterfall",   notes: "Stunning falls above Lake Brienz. Historic funicular up to the viewpoint." },
  { id: "mp12", cat: "waterfall",  emoji: "🔍", name: "Reichenbach Falls",                 location: "Meiringen",            lat: 46.7238, lng: 8.1811,  mission: "Find the Sherlock Holmes waterfall",         notes: "Famous Sherlock Holmes location. Cable car up, dramatic views." },
  // 🚉 TRAIN STATIONS & GONDOLAS
  { id: "mp24", cat: "station",    emoji: "🚉", name: "Grindelwald Terminal",              location: "Grindelwald",          lat: 46.6237, lng: 8.0393,  mission: "Catch the Eiger Express gondola here",       notes: "Main station in Grindelwald. Eiger Express gondola to Männlichen departs here." },
  { id: "mp25", cat: "station",    emoji: "🚞", name: "Kleine Scheidegg Station",          location: "Kleine Scheidegg",     lat: 46.5854, lng: 7.9603,  mission: "Change here for the Jungfraujoch train",     notes: "Change point for the Jungfraubahn to Jungfraujoch. Great views from the platform." },
  { id: "mp26", cat: "station",    emoji: "🚂", name: "Lauterbrunnen Station",             location: "Lauterbrunnen",        lat: 46.5937, lng: 7.9094,  mission: "Gateway to Mürren and Wengen",               notes: "Hub for Bernese Oberland. Trains to Wengen, cable car to Grütschalp for Mürren." },
  { id: "mp27", cat: "station",    emoji: "🚞", name: "Wengen Station",                    location: "Wengen",               lat: 46.6066, lng: 7.9204,  mission: "Arrive in a car-free mountain village",      notes: "Car-free village. Rack railway from Lauterbrunnen. Connect to Kleine Scheidegg." },
  { id: "mp28", cat: "station",    emoji: "🚡", name: "Männlichen Gondola (Grindelwald)",  location: "Grindelwald",          lat: 46.6242, lng: 8.0414,  mission: "Ride the world's longest gondola (~19 mins)", notes: "Grindelwald Terminal → Männlichen. Cow Playground is right at the top." },
  { id: "mp29", cat: "station",    emoji: "🚠", name: "Mürren Cable Car (Grütschalp)",    location: "Lauterbrunnen",        lat: 46.5937, lng: 7.9055,  mission: "Float up to the cliff village of Mürren",    notes: "Cable car from Lauterbrunnen to Grütschalp, then the little train to Mürren." },
  // 🧗 ADVENTURE
  { id: "mp13", cat: "adventure",  emoji: "❄️", name: "Jungfraujoch",                      location: "Jungfraujoch",         lat: 46.5473, lng: 7.9854,  mission: "Stand at the Top of Europe (3,454m)",        notes: "Highest railway station in Europe. Snow year-round. Sphinx Observatory." },
  { id: "mp14", cat: "adventure",  emoji: "👑", name: "Männlichen Royal Walk",             location: "Männlichen",           lat: 46.6231, lng: 8.0044,  mission: "Walk to the crown viewpoint (20 mins)",      notes: "Easy flat walk from the gondola station to the panoramic crown viewpoint." },
  { id: "mp15", cat: "adventure",  emoji: "🦅", name: "Grindelwald First Cliff Walk",      location: "Grindelwald First",    lat: 46.6587, lng: 8.0506,  mission: "Walk on a cliff-edge platform above the Alps", notes: "Thrilling suspended walkway with sheer drop views. Kids 6+ suitable." },
  { id: "mp16", cat: "adventure",  emoji: "🏘️", name: "Mürren Village",                   location: "Mürren",               lat: 46.5592, lng: 7.8928,  mission: "Visit a car-free Swiss mountain village",    notes: "Magical traffic-free village. Stunning Eiger views. Reach by cable car + train." },
  { id: "mp17", cat: "adventure",  emoji: "🧊", name: "Aletsch Glacier Viewpoint",         location: "Jungfraujoch",         lat: 46.5376, lng: 8.0215,  mission: "See the longest glacier in the Alps",        notes: "23km long glacier visible from Jungfraujoch. Breathtaking scale." },
  { id: "mp18", cat: "adventure",  emoji: "🎬", name: "Schilthorn (Piz Gloria)",           location: "Schilthorn",           lat: 46.5582, lng: 7.8342,  mission: "Eat in the revolving James Bond restaurant", notes: "Famous 007 filming location. Revolving restaurant with 360° views." },
  // 🍽️ RESTAURANTS & DINNER
  { id: "mp31", cat: "restaurant", emoji: "🍹", name: "Avocado Bar",                          location: "Grindelwald",          lat: 46.6238, lng: 8.0409,  rating: 4.5, mission: "Order a cocktail after a big mountain day",  notes: "Grindelwald's top evening spot. Craft cocktails, burgers, loaded fries. Great Dorfstrasse terrace. Arrive early — it fills up fast in summer." },
  { id: "mp32", cat: "restaurant", emoji: "🍫", name: "Restaurant Hotel Spinne",              location: "Grindelwald",          lat: 46.6248, lng: 8.0418,  rating: 4.6, mission: "Get chocolate fondue with strawberries 🍓",  notes: "Best chocolate fondue in Grindelwald. Ask for the fondue dessert with strawberries — kids absolutely love it. Also great cheese fondue and raclette." },
  { id: "mp33", cat: "restaurant", emoji: "🍕", name: "Restaurant Schmitte",                  location: "Grindelwald",          lat: 46.6243, lng: 8.0420,  rating: 4.2, mission: "Cosy chalet dinner in the village",          notes: "Reliable Swiss classics — schnitzel, rösti, bratwurst. Central, family-friendly, and good value for Grindelwald." },
  { id: "mp34", cat: "restaurant", emoji: "🍴", name: "Restaurant Grindelwaldblick",          location: "Grindelwald",          lat: 46.6252, lng: 8.0424,  rating: 4.4, mission: "Eat dinner with an Eiger view",              notes: "Panoramic terrace with direct Eiger views. One of the best photo backdrops for dinner in the village. Book terrace tables ahead." },
  { id: "mp35", cat: "restaurant", emoji: "🍓", name: "Grand Café Schuh",                     location: "Interlaken",           lat: 46.6863, lng: 7.8629,  rating: 4.6, mission: "Try the legendary chocolate fondue 🍫",      notes: "Iconic patisserie since 1818 on Interlaken's Höheweg. Famous for chocolate fondue with strawberries. Mountain terrace views. A must for the kids." },
  { id: "mp36", cat: "restaurant", emoji: "🍽️", name: "Berggasthaus Männlichen",              location: "Männlichen",           lat: 46.6233, lng: 8.0047,  rating: 4.5, mission: "Lunch at the top with 360° valley views",   notes: "South-facing terrace right beside the gondola station. Panoramic Grindelwald valley views. Rösti, soup, kids' plates. Perfect lunch stop." },
  { id: "mp37", cat: "restaurant", emoji: "🍽️", name: "Restaurant Kleine Scheidegg",          location: "Kleine Scheidegg",     lat: 46.5856, lng: 7.9606,  rating: 4.6, mission: "Lunch with the Eiger north face in front",   notes: "Most iconic mountain lunch backdrop in Switzerland. Eiger directly in front, rack railway behind. Order rösti and soup. Book ahead in peak season." },
  { id: "mp39", cat: "cafe",       emoji: "🍰", name: "C & M Café Bar Restaurant",           location: "Grindelwald",          lat: 46.6247, lng: 8.0414,  rating: 4.6, mission: "Eat cake with an Eiger backdrop",            notes: "Popular village café famous for beautiful cakes, pastries and hot chocolate. Cosy alpine atmosphere." },
  { id: "mp40", cat: "restaurant", emoji: "🍕", name: "Ristorante Pizzeria Da Salvi",         location: "Grindelwald",          lat: 46.6242, lng: 8.0410,  rating: 4.4, mission: "Get a proper Italian pizza in the Alps",     notes: "Friendly Italian restaurant in the heart of Grindelwald. Authentic pizza, pasta and comfort food. Perfect family dinner option." },
  { id: "mp41", cat: "restaurant", emoji: "🍳", name: "Central Hotel Wolter Restaurant",      location: "Grindelwald",          lat: 46.6240, lng: 8.0420,  rating: 4.3, mission: "Try the classic Swiss rösti here",           notes: "Traditional Swiss restaurant near the train station. Famous for rösti, fondue and alpine classics. Great dessert menu." },
  { id: "mp42", cat: "cafe",       emoji: "🏡", name: "Mountain Hostel Restaurant",           location: "Gimmelwald",           lat: 46.5625, lng: 7.8920,  rating: 4.6, mission: "Eat with a cliffside view in Gimmelwald",    notes: "Relaxed café in the magical car-free village of Gimmelwald. Breathtaking Lauterbrunnen valley views. Simple pizzas and snacks. Reach via cable car from Stechelberg." },
  { id: "mp43", cat: "restaurant", emoji: "🎢", name: "Bergrestaurant Pfingstegg",            location: "Pfingstegg",           lat: 46.6279, lng: 8.0527,  rating: 4.4, mission: "Combine lunch with the alpine coaster",      notes: "Mountain restaurant above Grindelwald beside the Pfingstegg alpine coaster. Fantastic valley views. Great snack stop — combine with the toboggan run." },
  { id: "mp44", cat: "restaurant", emoji: "🍔", name: "Bebbis Restaurant",                    location: "Interlaken",           lat: 46.6863, lng: 7.8586,  rating: 4.3, mission: "Burgers and fondue in central Interlaken",   notes: "Large lively restaurant on the Höheweg. Huge menu — burgers, fondue, Swiss classics. Great for groups. Right beside the Höhematte park." },
  { id: "mp38", cat: "restaurant", emoji: "🔫", name: "Piz Gloria Revolving Restaurant",      location: "Schilthorn",           lat: 46.5582, lng: 7.8342,  rating: 4.5, mission: "Eat in the James Bond revolving restaurant", notes: "007 filming location. Full 360° rotation every hour. Breakfast and lunch served. Book ahead — tables fill fast in August. Stunning views of 200+ peaks." },
  // 🌧️ RAINY DAY ACTIVITIES
  { id: "mp45", cat: "rainy", emoji: "🏊", name: "Sportzentrum Grindelwald",              location: "Grindelwald",          lat: 46.6242, lng: 8.0425,  rating: 4.5, mission: "Indoor swimming and slides on a rainy day",  notes: "Large indoor sports centre with swimming pools, waterslides, climbing wall and seasonal ice rink. Perfect wet weather backup." },
  { id: "mp47", cat: "rainy", emoji: "🍫", name: "Funky Chocolate Club",                  location: "Interlaken",           lat: 46.6863, lng: 7.8632,  rating: 4.8, mission: "Make your own Swiss chocolate bar 🍫",       notes: "Interactive chocolate workshop in Interlaken. Make and decorate your own Swiss chocolate bar. Kids absolutely love it — book ahead." },
  { id: "mp48", cat: "rainy", emoji: "🧗", name: "Indoor Seilpark Grindelwald",           location: "Grindelwald",          lat: 46.6245, lng: 8.0427,  rating: 4.4, mission: "Indoor rope course and climbing challenges",  notes: "Indoor adventure park with rope courses, balance bridges and climbing obstacles. Great for burning off energy on a wet day." },
  { id: "mp49", cat: "rainy", emoji: "🌊", name: "Trümmelbach Falls (rain-proof!)",       location: "Lauterbrunnen Valley", lat: 46.5717, lng: 7.9114,  rating: 4.7, mission: "Go inside a glacial waterfall — rain means MORE water!", notes: "10 glacial waterfalls entirely inside the mountain — completely rain-proof. Lift takes you up inside the rock. Even better on a rainy day as water volume surges. CHF 14/adult." },
  { id: "mp50", cat: "rainy", emoji: "🏛️", name: "Ballenberg Open Air Museum",           location: "Brienz",               lat: 46.7456, lng: 8.0286,  rating: 4.6, mission: "Explore traditional Swiss life in a huge open-air village", notes: "66 historic Swiss farm buildings across 66 hectares. Demonstrations of crafts, cheese-making and baking. Partially sheltered. Train to Brienz (~45 min from Grindelwald), then bus." },
  { id: "mp51", cat: "rainy", emoji: "🔍", name: "Sherlock Holmes Museum",               location: "Meiringen",            lat: 46.7238, lng: 8.1756,  rating: 4.3, mission: "Visit the home of the world's greatest detective",    notes: "Small but brilliant museum dedicated to Sir Arthur Conan Doyle and Sherlock Holmes. Meiringen is where Holmes 'died' at Reichenbach Falls. Train from Interlaken Ost." },
  { id: "mp52", cat: "rainy", emoji: "⛵", name: "BLS Lake Steamer (Brienz)",            location: "Interlaken Ost",       lat: 46.6875, lng: 7.8730,  rating: 4.5, mission: "Cruise Lake Brienz on a covered steam boat",         notes: "BLS paddle steamers cruise Lake Brienz from Interlaken Ost to Brienz and back (~2 hrs). Covered indoor seating with panoramic windows — gorgeous even in rain. Year-round service." },
  // 🛝 PLAYGROUNDS
  { id: "mp19", cat: "playground", emoji: "🛝", name: "Männlichen Cow Playground",         location: "Männlichen",           lat: 46.6231, lng: 8.0044,  mission: "Ride the famous cow slide!",                 notes: "Iconic alpine playground right beside the cable car station. The cow slide is legendary." },
  { id: "mp20", cat: "playground", emoji: "🛝", name: "Allmendhubel Flower Park",          location: "Mürren",               lat: 46.5631, lng: 7.8978,  mission: "Play with mountain views all around",        notes: "Water features and themed play above Mürren. Gorgeous mountain backdrop." },
  { id: "mp21", cat: "playground", emoji: "🛝", name: "Bort Alpine Playground",            location: "Grindelwald First",    lat: 46.6487, lng: 8.0471,  mission: "Play at a playground halfway up a mountain", notes: "Adventure playground on the Grindelwald First gondola line. Stop here on the way down." },
  { id: "mp22", cat: "playground", emoji: "🛝", name: "Winteregg Playground",              location: "Mürren trail",         lat: 46.5731, lng: 7.9012,  mission: "Picnic stop with a play area",               notes: "Scenic rest-stop playground on the Mürren trail. Great views." },
  { id: "mp23", cat: "playground", emoji: "🛝", name: "Grindelwald Village Playground",    location: "Grindelwald",          lat: 46.6242, lng: 8.0414,  mission: "Have a quick play in the village",           notes: "Easy local park right in Grindelwald town. Perfect for a quick break." },
];

function haversineDist(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sumAmounts(lines) {
  return lines.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function nearestFoodLocation(lat, lon) {
  return Object.entries(FOOD_LOCATION_COORDS).reduce((best, [loc, c]) => {
    const dLat = (c.lat - lat) * Math.PI / 180;
    const dLon = (c.lon - lon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(c.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const d = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return d < best.d ? { loc, d } : best;
  }, { loc: "Grindelwald", d: Infinity }).loc;
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
      border: active ? "#c0152a" : "#bfdbfe",
      background: active ? "#c0152a" : "#eff6ff",
      color: active ? "white" : "#1e3a8a",
    },
    warm: {
      border: active ? "#c2410c" : "#fdba74",
      background: active ? "#c2410c" : "#fff7ed",
      color: active ? "white" : "#9a3412",
    },
    green: {
      border: active ? "#15803d" : "#86efac",
      background: active ? "#15803d" : "#f0fdf4",
      color: active ? "white" : "#14532d",
    },
    sky: {
      border: active ? "#0284c7" : "#7dd3fc",
      background: active ? "#0284c7" : "#f0f9ff",
      color: active ? "white" : "#0c4a6e",
    },
    amber: {
      border: active ? "#b45309" : "#fcd34d",
      background: active ? "#b45309" : "#fffbeb",
      color: active ? "white" : "#78350f",
    },
    purple: {
      border: active ? "#7c3aed" : "#c4b5fd",
      background: active ? "#7c3aed" : "#f5f3ff",
      color: active ? "white" : "#4c1d95",
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

const QUEST_SECTIONS = [
  { id: "food",      label: "🍽️ Swiss Food Missions",   color: "#b45309", bg: "#fffbeb", border: "#fcd34d" },
  { id: "transport", label: "🚠 Epic Transport",          color: "#0369a1", bg: "#f0f9ff", border: "#7dd3fc" },
  { id: "mountain",  label: "🏔️ Mountain Adventures",    color: "#c0152a", bg: "#fff1f2", border: "#fca5a5" },
  { id: "nature",    label: "🌿 Nature Spotting",         color: "#15803d", bg: "#f0fdf4", border: "#86efac" },
  { id: "village",   label: "🎪 Village Fun",             color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
];

const DEFAULT_QUEST_ITEMS = [
  // 🍽️ Swiss Food Missions
  { id: "q1",  emoji: "🧀", text: "Try melted cheese fondue",                               cheer: "Käse! 🧀 Switzerland's superpower!",              checked: { k1: false, k2: false }, section: "food" },
  { id: "q2",  emoji: "🍫", text: "Dip fruit in chocolate fondue",                          cheer: "Swiss choc is the best choc! 🍫",                 checked: { k1: false, k2: false }, section: "food" },
  { id: "q7",  emoji: "☕", text: "Drink hot chocolate in a mountain café",                 cheer: "Warming up Swiss style! ☕ Wunderbar!",            checked: { k1: false, k2: false }, section: "food" },
  { id: "q10", emoji: "🍰", text: "Eat cake with a mountain view",                          cheer: "Best view AND best cake! 🍰 Fantastisch!",        checked: { k1: false, k2: false }, section: "food" },
  { id: "q13", emoji: "🍦", text: "Eat ice cream in a village",                             cheer: "Swiss village life is delicious! 🍦",             checked: { k1: false, k2: false }, section: "food" },
  { id: "q23", emoji: "🥨", text: "Try a freshly baked Swiss pretzel or Gipfeli",          cheer: "Gipfeli power! 🥨 Swiss breakfast champion!",     checked: { k1: false, k2: false }, section: "food" },
  { id: "q31", emoji: "🥔", text: "Try Swiss rösti",                                        cheer: "Rösti royalty! 🥔 The Swiss national dish!",       checked: { k1: false, k2: false }, section: "food" },
  { id: "q29", emoji: "🫐", text: "Eat fresh alpine berries on a hike",                     cheer: "Nature's Swiss snack! 🫐 Picked fresh from the Alps!", checked: { k1: false, k2: false }, section: "food" },
  { id: "q28", emoji: "💧", text: "Fill a water bottle from a mountain fountain",            cheer: "Freshest water in the world! 💧 Swiss glacier spring!", checked: { k1: false, k2: false }, section: "food" },
  // 🚠 Epic Transport
  { id: "q3",  emoji: "🚠", text: "Ride a cable car up a mountain",                         cheer: "Up, up and away! 🚠 Alpine explorer!",            checked: { k1: false, k2: false }, section: "transport" },
  { id: "q9",  emoji: "🚆", text: "Ride a mountain train",                                  cheer: "Swiss trains are never late! 🚆 All aboard!",     checked: { k1: false, k2: false }, section: "transport" },
  { id: "q12", emoji: "🚡", text: "Ride in a gondola",                                      cheer: "Flying over the Alps! 🚡 Toll!",                  checked: { k1: false, k2: false }, section: "transport" },
  { id: "q24", emoji: "🚴", text: "Cycle a bike in Switzerland",                            cheer: "Pedal power! 🚴 Swiss roads are amazing!",        checked: { k1: false, k2: false }, section: "transport" },
  { id: "q25", emoji: "🛝", text: "Ride the cow slide at Männlichen",                       cheer: "Moooo! Best slide in the Alps! 🐄🛝",              checked: { k1: false, k2: false }, section: "transport", sound: "moo" },
  // 🏔️ Mountain Adventures
  { id: "q5",  emoji: "💧", text: "Stand beside a giant waterfall",                         cheer: "You're soaking it all in! 💧",                    checked: { k1: false, k2: false }, section: "mountain" },
  { id: "q6",  emoji: "❄️", text: "Touch snow even in summer",                             cheer: "Ice to meet you! ❄️ Ancient Swiss snow!",         checked: { k1: false, k2: false }, section: "mountain" },
  { id: "q8",  emoji: "🥾", text: "Walk a mountain trail",                                  cheer: "You're a mountain goat! 🐐 Sehr gut!",            checked: { k1: false, k2: false }, section: "mountain" },
  { id: "q11", emoji: "🏔️", text: "Walk on a glacier",                                     cheer: "You walked on ancient ice! 🏔️ Legendary!",       checked: { k1: false, k2: false }, section: "mountain" },
  { id: "q15", emoji: "📸", text: "Take a selfie at the highest railway station in Europe", cheer: "Top of Europe! 📸 Höchste Eisenbahn!",            checked: { k1: false, k2: false }, section: "mountain" },
  { id: "q18", emoji: "🏊", text: "Dip your feet in a glacial river",                       cheer: "Brrrr! 🥶 Pure glacier water — you're brave!",    checked: { k1: false, k2: false }, section: "mountain" },
  // 🌿 Nature Spotting
  { id: "q4",  emoji: "🐄", text: "Spot a cow with a bell",                                 cheer: "Moooo! 🐄 That's a Swiss celebrity!",             checked: { k1: false, k2: false }, section: "nature", sound: "moo" },
  { id: "q14", emoji: "🌄", text: "Watch the mountains turn pink at sunset",                cheer: "Alpenglow — pure Swiss magic! 🌄 Wunderschön!",   checked: { k1: false, k2: false }, section: "nature" },
  { id: "q17", emoji: "🌈", text: "Spot a rainbow in a waterfall's spray",                  cheer: "Swiss rainbows hit different! 🌈",                checked: { k1: false, k2: false }, section: "nature" },
  { id: "q19", emoji: "🌸", text: "Spot an alpine flower",                                  cheer: "Edelweiss! 🌸 The flower of Switzerland!",        checked: { k1: false, k2: false }, section: "nature" },
  { id: "q20", emoji: "🔭", text: "Spot something through binoculars on a mountain",        cheer: "Eagle eyes! 🔭 Swiss explorer!",                  checked: { k1: false, k2: false }, section: "nature" },
  { id: "q22", emoji: "🌙", text: "See the stars from the Alps",                            cheer: "No light pollution up here! 🌙 Breathtaking!",    checked: { k1: false, k2: false }, section: "nature" },
  { id: "q26", emoji: "🐾", text: "Spot a marmot or mountain goat",                         cheer: "Wild Swiss wildlife! 🐾 True alpine explorer!",    checked: { k1: false, k2: false }, section: "nature" },
  // 🎪 Village Fun
  { id: "q16", emoji: "🎵", text: "Hear a real alphorn being played",                       cheer: "Yodel-ay-ee-oo! 🎵 Music of the Alps!",           checked: { k1: false, k2: false }, section: "village" },
  { id: "q21", emoji: "🇨🇭", text: "Count how many Swiss flags you see in one day",        cheer: "Switzerland is flag-tastic! 🇨🇭",                checked: { k1: false, k2: false }, section: "village" },
  { id: "q27", emoji: "🔔", text: "Ring a cowbell at a playground",                         cheer: "Ding ding! 🔔 That's the sound of Switzerland!",   checked: { k1: false, k2: false }, section: "village" },
  { id: "q30", emoji: "🐕", text: "Spot a St. Bernard rescue dog statue",                   cheer: "Guardian of the Alps! 🐕 Switzerland's hero dog!", checked: { k1: false, k2: false }, section: "village" },
];

export default function SwitzerlandTravelAppReal() {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [expandedDays, setExpandedDays] = useState(() => new Set(["d1", "d4", "d8"]));
  const [packingItems, setPackingItems] = useState(DEFAULT_PACKING_ITEMS);
  const [packingReady, setPackingReady] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(
    () => new Set(DEFAULT_PACKING_CATEGORIES.map((c) => c.id))
  );
  const [newItemText, setNewItemText] = useState({});
  const [weatherLocation, setWeatherLocation] = useState("grindelwald");
  const [weatherData, setWeatherData]         = useState(null);
  const [weatherLoading, setWeatherLoading]   = useState(false);
  const [weatherError, setWeatherError]       = useState(null);
  const [venues, setVenues]                   = useState(DEFAULT_VENUES);
  const [venuesReady, setVenuesReady]         = useState(false);
  const [venueFilter, setVenueFilter]         = useState("Grindelwald");
  const [lastViewedDayId, setLastViewedDayId] = useState("d1");
  const [showAddVenue, setShowAddVenue]       = useState(false);
  const [newVenue, setNewVenue]               = useState({ name: "", type: "restaurant", location: "Grindelwald", meals: [], notes: "" });
  const [mealFilter, setMealFilter]           = useState(null);
  const [geoLocating, setGeoLocating]         = useState(false);
  const [questItems, setQuestItems]           = useState(DEFAULT_QUEST_ITEMS);
  const [questReady, setQuestReady]           = useState(false);
  const [newQuestText, setNewQuestText]       = useState("");
  const [questPopId, setQuestPopId]           = useState(null);
  const [questPopMsg, setQuestPopMsg]         = useState("");
  const [activeKid, setActiveKid]             = useState("k1");
  const [kidNames, setKidNames]               = useState(["Alfie", "Chloe"]);
  const [editingKid, setEditingKid]           = useState(null);
  const [expandedNotes, setExpandedNotes]     = useState(new Set());
  const [mapCategory, setMapCategory]         = useState("all");
  const [mapGeoLocating, setMapGeoLocating]   = useState(false);
  const [mapUserCoords, setMapUserCoords]     = useState(null);
  const [mapViewMode, setMapViewMode]         = useState("list");
  const [mapFullscreen, setMapFullscreen]     = useState(false);
  const leafletContainerRef                   = useRef(null);
  const leafletInstanceRef                    = useRef(null);
  const leafletMarkersRef                     = useRef([]);

  useEffect(() => {
    setBudget(readLocalStorage(STORAGE_KEYS.budget, DEFAULT_BUDGET));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(budget));
  }, [budget, ready]);

  useEffect(() => {
    setPackingItems(readLocalStorage(STORAGE_KEYS.packing, DEFAULT_PACKING_ITEMS));
    setPackingReady(true);
  }, []);

  useEffect(() => {
    if (!packingReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.packing, JSON.stringify(packingItems));
  }, [packingItems, packingReady]);

  useEffect(() => {
    const stored = readLocalStorage(STORAGE_KEYS.venues, DEFAULT_VENUES);
    // Backfill meals array for any venue that's missing it (migration from old format)
    const migrated = stored.map((v) => {
      if (v.meals) return v;
      const def = DEFAULT_VENUES.find((d) => d.id === v.id);
      return { ...v, meals: def ? def.meals : [] };
    });
    setVenues(migrated);
    setVenuesReady(true);
  }, []);

  useEffect(() => {
    if (!venuesReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.venues, JSON.stringify(venues));
  }, [venues, venuesReady]);

  useEffect(() => {
    const saved = (() => { try { return JSON.parse(window.localStorage.getItem(STORAGE_KEYS.quest)); } catch { return null; } })();
    if (saved && saved.items) {
      // Backfill new fields (e.g. sound) onto existing items, and append any brand-new items
      const defaultMap = Object.fromEntries(DEFAULT_QUEST_ITEMS.map((q) => [q.id, q]));
      const merged = [
        ...saved.items.map((q) => defaultMap[q.id] ? { ...defaultMap[q.id], checked: q.checked } : q),
        ...DEFAULT_QUEST_ITEMS.filter((q) => !saved.items.find((s) => s.id === q.id)),
      ];
      setQuestItems(merged);
      if (saved.kidNames) setKidNames(saved.kidNames);
    }
    setQuestReady(true);
  }, []);

  useEffect(() => {
    if (!questReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.quest, JSON.stringify({ items: questItems, kidNames }));
  }, [questItems, kidNames, questReady]);

  useEffect(() => {
    if (activeTab !== "map" || mapViewMode !== "map") return;
    const container = leafletContainerRef.current;
    if (!container) return;

    const CAT_ACCENT = {
      stay: "#c2410c", cafe: "#b45309", adventure: "#c0152a",
      waterfall: "#0284c7", playground: "#7c3aed", station: "#475569",
      restaurant: "#16a34a", rainy: "#0891b2",
    };

    if (!leafletInstanceRef.current) {
      const map = L.map(container, { center: [46.6242, 8.0411], zoom: 11 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);
      leafletInstanceRef.current = map;
    } else {
      setTimeout(() => leafletInstanceRef.current.invalidateSize(), 50);
    }

    const map = leafletInstanceRef.current;
    leafletMarkersRef.current.forEach((m) => m.remove());
    leafletMarkersRef.current = [];

    const filtered = MAP_PLACES.filter((p) => mapCategory === "all" || p.cat === mapCategory);
    filtered.forEach((place) => {
      const accent = CAT_ACCENT[place.cat] || "#475569";
      const icon = L.divIcon({
        html: `<div style="font-size:20px;background:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border:2.5px solid ${accent};box-shadow:0 2px 8px rgba(0,0,0,0.25);">${place.emoji}</div>`,
        className: "",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -20],
      });
      const marker = L.marker([place.lat, place.lng], { icon });
      const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.location + ' Switzerland')}`;
      marker.bindPopup(`
        <div style="font-family:'Helvetica Neue',sans-serif;min-width:180px;padding:2px 0;">
          <div style="font-weight:800;font-size:14px;margin-bottom:3px;">${place.emoji} ${place.name}</div>
          <div style="color:#6b7280;font-size:12px;margin-bottom:5px;">📍 ${place.location}</div>
          <div style="color:${accent};font-weight:700;font-size:12px;margin-bottom:8px;">🎯 ${place.mission}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}" target="_blank"
              style="background:${accent};color:white;padding:5px 10px;border-radius:8px;text-decoration:none;font-weight:700;font-size:12px;display:inline-block;">
              Directions →
            </a>
            <a href="${mapsSearchUrl}" target="_blank"
              style="background:#f1f5f9;color:#374151;padding:5px 10px;border-radius:8px;text-decoration:none;font-weight:700;font-size:12px;display:inline-block;border:1px solid #e2e8f0;">
              🗺️ View on Maps
            </a>
          </div>
        </div>
      `);
      marker.addTo(map);
      leafletMarkersRef.current.push(marker);
    });
  }, [activeTab, mapViewMode, mapCategory, mapFullscreen]);

  useEffect(() => {
    if (activeTab !== "weather") return;
    const loc = WEATHER_LOCATIONS.find((l) => l.id === weatherLocation);
    setWeatherLoading(true);
    setWeatherError(null);
    setWeatherData(null);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
      `&hourly=temperature_2m,precipitation_probability,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&timezone=Europe/Zurich&forecast_days=7`
    )
      .then((r) => r.json())
      .then((data) => { setWeatherData(data); setWeatherLoading(false); })
      .catch(() => { setWeatherError("Could not load forecast. Check your connection."); setWeatherLoading(false); });
  }, [activeTab, weatherLocation]);

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

  const packingProgress = useMemo(() => {
    const total = packingItems.length;
    const packed = packingItems.filter((i) => i.checked).length;
    return { total, packed, pct: total === 0 ? 0 : Math.round((packed / total) * 100) };
  }, [packingItems]);

  const daysUntilTrip = useMemo(() => {
    const diff = Math.ceil((new Date("2026-08-22") - new Date()) / 86400000);
    return Math.max(0, diff);
  }, []);

  const toggleDay = (id) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setLastViewedDayId(id);
      }
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

  const togglePackingItem = (id) => {
    setPackingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const addPackingItem = (categoryId) => {
    const text = (newItemText[categoryId] || "").trim();
    if (!text) return;
    setPackingItems((prev) => [
      ...prev,
      {
        id: `packing_${Math.random().toString(16).slice(2)}`,
        categoryId,
        text,
        checked: false,
      },
    ]);
    setNewItemText((prev) => ({ ...prev, [categoryId]: "" }));
  };

  const removePackingItem = (id) => {
    setPackingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleCategory = (id) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const suggestedFoodLocation = DAY_FOOD_LOCATIONS[lastViewedDayId] || "Grindelwald";

  const daysUntil = Math.ceil((new Date("2026-08-22") - new Date(new Date().toDateString())) / 86400000);

  const parseGoogleMapsUrl = (url) => {
    if (!url.trim()) return;
    if (url.includes("maps.app.goo.gl")) {
      setNewVenue((v) => ({ ...v, _mapsHint: "short" }));
      return;
    }
    const match = url.match(/\/maps\/place\/([^/@?]+)/);
    if (match) {
      const name = decodeURIComponent(match[1]).replace(/\+/g, " ").split(",")[0].trim();
      setNewVenue((v) => ({ ...v, name, _mapsHint: "" }));
    }
  };

  const addVenue = () => {
    if (!newVenue.name.trim()) return;
    const { _mapsUrl, _mapsHint, ...venueData } = newVenue;
    setVenues((prev) => [...prev, { ...venueData, id: `v_${Math.random().toString(16).slice(2)}`, name: venueData.name.trim() }]);
    setNewVenue({ name: "", type: "restaurant", location: venueFilter === "all" ? "Grindelwald" : venueFilter, meals: [], notes: "" });
    setShowAddVenue(false);
  };

  const removeVenue = (id) => setVenues((prev) => prev.filter((v) => v.id !== id));

  const toggleQuestItem = (id) => {
    setQuestItems((prev) => {
      const item = prev.find((q) => q.id === id);
      const wasChecked = item.checked[activeKid];
      if (!wasChecked) {
        setQuestPopId(id);
        setQuestPopMsg(item.cheer || "⭐ Wunderbar! 🇨🇭");
        setTimeout(() => setQuestPopId(null), 3600);
        if (item.sound === "moo") {
          try {
            const audio = new Audio("/CowMoo.mp3");
            audio.play();
          } catch (_) {}
        }
      }
      return prev.map((q) =>
        q.id === id ? { ...q, checked: { ...q.checked, [activeKid]: !q.checked[activeKid] } } : q
      );
    });
  };

  const addQuestItem = () => {
    const text = newQuestText.trim();
    if (!text) return;
    setQuestItems((prev) => [...prev, {
      id: `q_${Math.random().toString(16).slice(2)}`,
      emoji: "⭐", text, cheer: "⭐ Wunderbar! 🇨🇭",
      checked: { k1: false, k2: false },
    }]);
    setNewQuestText("");
  };

  const removeQuestItem = (id) => setQuestItems((prev) => prev.filter((q) => q.id !== id));

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #dbeafe 0%, #eff6ff 18%, #f8fafc 36%, #ecfeff 68%, #fefce8 100%)",
        color: "#0f172a",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        {daysUntil > 0 ? (
          <div style={{ background: "linear-gradient(135deg, #c0152a 0%, #9b0f20 100%)", borderRadius: 22, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "white" }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Departure</div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>22 Aug · Zurich via London</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{daysUntil}</div>
              <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 600 }}>days to go</div>
            </div>
          </div>
        ) : daysUntil === 0 ? (
          <div style={{ background: "linear-gradient(135deg, #c0152a 0%, #9b0f20 100%)", borderRadius: 22, padding: "20px 24px", color: "white", textAlign: "center", fontWeight: 800, fontSize: 20 }}>
            Today's the day! Have an amazing trip!
          </div>
        ) : null}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card style={{ padding: 22, overflow: "hidden", position: "relative", borderLeft: "5px solid #c0152a" }}>
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
                  <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05 }}>✚ {TRIP_INFO.title}</h1>
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
          {/* Budget tab hidden — uncomment to restore: */}
          {/* <Chip active={activeTab === "budget"} onClick={() => setActiveTab("budget")}>Budget</Chip> */}
          <Chip active={activeTab === "packing"} onClick={() => setActiveTab("packing")} tone="green">
            <Package size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
            Packing
          </Chip>
          <Chip active={activeTab === "weather"} onClick={() => setActiveTab("weather")} tone="sky">
            <Cloud size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
            Weather
          </Chip>
          <Chip active={activeTab === "food"} onClick={() => { setVenueFilter(suggestedFoodLocation); setActiveTab("food"); }} tone="amber">
            <Utensils size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
            Food & Coffee
          </Chip>
          <Chip active={activeTab === "quest"} onClick={() => setActiveTab("quest")} tone="purple">
            🗺️ Adventure
          </Chip>
          <Chip active={activeTab === "map"} onClick={() => setActiveTab("map")} tone="sky">
            🗺️ Map
          </Chip>
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
                              <SmallBadge color="green">
                                🏠 Base: {day.base}
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
                                  {item.notes && (() => {
                                    const noteKey = `${day.id}_${idx}`;
                                    const open = expandedNotes.has(noteKey);
                                    return (
                                      <div
                                        onClick={(e) => { e.stopPropagation(); setExpandedNotes((prev) => { const s = new Set(prev); open ? s.delete(noteKey) : s.add(noteKey); return s; }); }}
                                        style={{ cursor: "pointer", userSelect: "none" }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
                                          <span style={{ fontSize: 11, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                                          {open ? "Hide notes" : "Show notes"}
                                        </div>
                                        {open && <div style={{ fontSize: 14, lineHeight: 1.6, marginTop: 6, color: "#374151", whiteSpace: "pre-line" }}>{item.notes}</div>}
                                      </div>
                                    );
                                  })()}
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
              <img
                src="/Accommodation.jpg"
                alt="GrindelwaldHome Alpenglück"
                style={{ width: "100%", borderRadius: 10, marginBottom: 14, objectFit: "cover", maxHeight: 220 }}
              />
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

        {activeTab === "packing" && (
          <div style={{ display: "grid", gap: 16 }}>

            {/* Countdown card */}
            <Card style={{ padding: 20, borderColor: "#fde68a", background: "linear-gradient(135deg, rgba(255,251,235,0.98), rgba(255,255,255,0.95))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Timer size={32} color="#d97706" />
                <div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "#92400e", lineHeight: 1.1 }}>
                    {daysUntilTrip} day{daysUntilTrip !== 1 ? "s" : ""} to go!
                  </div>
                  <div style={{ color: "#b45309", fontSize: 14, marginTop: 4 }}>
                    Switzerland family holiday · departs 22 Aug 2026
                  </div>
                </div>
              </div>
            </Card>

            {/* Progress card */}
            <Card style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Package size={18} color="#2563eb" />
                <div style={{ fontSize: 18, fontWeight: 800 }}>Packing list</div>
                <SmallBadge color={packingProgress.pct === 100 ? "green" : "blue"}>
                  {packingProgress.packed} / {packingProgress.total} packed
                </SmallBadge>
              </div>
              <div style={{ background: "#e2e8f0", borderRadius: 999, height: 10, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${packingProgress.pct}%`,
                    height: "100%",
                    background: packingProgress.pct === 100 ? "#22c55e" : "#2563eb",
                    borderRadius: 999,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "#64748b", marginTop: 6 }}>
                {packingProgress.pct}% complete
              </div>
            </Card>

            {/* Category sections */}
            {DEFAULT_PACKING_CATEGORIES.map((cat) => {
              const catItems = packingItems.filter((i) => i.categoryId === cat.id);
              const catPacked = catItems.filter((i) => i.checked).length;
              const isOpen = expandedCategories.has(cat.id);
              const inputVal = newItemText[cat.id] || "";

              return (
                <Card key={cat.id} style={{ padding: 16, borderRadius: 22 }}>
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    style={{ width: "100%", background: "transparent", border: 0, padding: 0, cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Package size={18} color="#2563eb" />
                        <span style={{ fontWeight: 800, fontSize: 16 }}>{cat.label}</span>
                        <SmallBadge color={catPacked === catItems.length && catItems.length > 0 ? "green" : "slate"}>
                          {catPacked}/{catItems.length}
                        </SmallBadge>
                      </div>
                      <div style={{ color: "#64748b" }}>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ display: "grid", gap: 6, marginTop: 14 }}>
                          {catItems.map((item) => (
                            <div
                              key={item.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 12px",
                                borderRadius: 14,
                                border: "1px solid #e2e8f0",
                                background: item.checked ? "rgba(240,253,244,0.9)" : "rgba(248,250,252,0.8)",
                                transition: "background 0.2s",
                              }}
                            >
                              <button
                                onClick={() => togglePackingItem(item.id)}
                                style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0, flexShrink: 0, display: "flex" }}
                                aria-label={item.checked ? "Unpack item" : "Pack item"}
                              >
                                {item.checked
                                  ? <CheckSquare size={20} color="#22c55e" />
                                  : <Square size={20} color="#94a3b8" />
                                }
                              </button>
                              <span
                                style={{
                                  flex: 1,
                                  fontSize: 14,
                                  color: item.checked ? "#94a3b8" : "#0f172a",
                                  textDecoration: item.checked ? "line-through" : "none",
                                  transition: "all 0.2s",
                                }}
                              >
                                {item.text}
                              </span>
                              <button
                                onClick={() => removePackingItem(item.id)}
                                style={{ background: "transparent", border: 0, cursor: "pointer", padding: 4, color: "#cbd5e1", flexShrink: 0, display: "flex" }}
                                aria-label="Remove item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}

                          {/* Add custom item row */}
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <TextInput
                              value={inputVal}
                              onChange={(e) => setNewItemText((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter") addPackingItem(cat.id); }}
                              placeholder={`Add item to ${cat.label}…`}
                              style={{ borderRadius: 14, padding: "10px 12px", fontSize: 13 }}
                            />
                            <button
                              onClick={() => addPackingItem(cat.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                border: "1px solid #bfdbfe",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                borderRadius: 14,
                                padding: "10px 14px",
                                cursor: "pointer",
                                fontWeight: 700,
                                fontSize: 13,
                                flexShrink: 0,
                              }}
                            >
                              <Plus size={14} /> Add
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === "weather" && (
          <div style={{ display: "grid", gap: 16 }}>

            {/* Location selector */}
            <Card style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Cloud size={18} color="#0284c7" />
                <span style={{ fontWeight: 800, fontSize: 16 }}>7-day forecast</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {WEATHER_LOCATIONS.map((loc) => (
                  <Chip
                    key={loc.id}
                    active={weatherLocation === loc.id}
                    onClick={() => setWeatherLocation(loc.id)}
                    tone="sky"
                  >
                    {loc.label}
                    <span style={{ fontSize: 11, opacity: 0.75, marginLeft: 5 }}>{loc.elevation}</span>
                  </Chip>
                ))}
              </div>
            </Card>

            {/* Loading */}
            {weatherLoading && (
              <Card style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🌤️</div>
                <div style={{ fontWeight: 600 }}>Loading forecast…</div>
              </Card>
            )}

            {/* Error */}
            {weatherError && (
              <Card style={{ padding: 20, borderColor: "#fca5a5", background: "rgba(254,242,242,0.9)" }}>
                <div style={{ color: "#b91c1c", fontWeight: 700 }}>⚠️ {weatherError}</div>
              </Card>
            )}

            {/* Forecast cards */}
            {weatherData && !weatherLoading && (
              <div style={{ display: "grid", gap: 10 }}>
                {(() => {
                  const hourlyByDay = groupHourlyByDay(weatherData.hourly);
                  return weatherData.daily.time.map((dateStr, i) => {
                    const date = new Date(dateStr + "T12:00:00");
                    const isToday = i === 0;
                    const dayName = isToday ? "Today" : date.toLocaleDateString("en-IE", { weekday: "short" });
                    const dateLabel = date.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
                    const tempMax = Math.round(weatherData.daily.temperature_2m_max[i]);
                    const tempMin = Math.round(weatherData.daily.temperature_2m_min[i]);
                    const periods = hourlyByDay[dateStr] || {};
                    const periodDefs = [
                      { key: "morning",   label: "Morning" },
                      { key: "afternoon", label: "Afternoon" },
                      { key: "evening",   label: "Evening" },
                    ];

                    return (
                      <Card
                        key={dateStr}
                        style={{
                          padding: "14px 18px",
                          borderRadius: 18,
                          borderColor: isToday ? "#7dd3fc" : "#dbeafe",
                          background: isToday
                            ? "linear-gradient(135deg, rgba(224,242,254,0.95), rgba(255,255,255,0.92))"
                            : "rgba(255,255,255,0.85)",
                        }}
                      >
                        {/* Header row: day + date + min/max */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: 15, color: isToday ? "#0284c7" : "#0f172a" }}>{dayName}</span>
                            <span style={{ fontSize: 13, color: "#64748b", marginLeft: 8 }}>{dateLabel}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "#475569" }}>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{tempMax}°</span>
                            <span style={{ color: "#94a3b8", marginLeft: 4 }}>{tempMin}°</span>
                          </div>
                        </div>

                        {/* Period columns */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                          {periodDefs.map(({ key, label }) => {
                            const p = periods[key];
                            if (!p) return <div key={key} />;
                            const wmo = wmoDescription(p.code);
                            return (
                              <div
                                key={key}
                                style={{
                                  background: "rgba(248,250,252,0.7)",
                                  borderRadius: 12,
                                  padding: "10px 8px",
                                  textAlign: "center",
                                  border: "1px solid rgba(226,232,240,0.8)",
                                }}
                              >
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                                <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 4 }}>{wmo.icon}</div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{p.temp}°</div>
                                <div style={{ fontSize: 12, color: p.precip > 50 ? "#2563eb" : "#94a3b8", fontWeight: p.precip > 50 ? 700 : 400, marginTop: 3 }}>💧{p.precip}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === "food" && (
          <div style={{ display: "grid", gap: 16 }}>

            {/* Smart location context banner */}
            <Card style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Utensils size={18} color="#b45309" />
                <span style={{ fontWeight: 800, fontSize: 16 }}>Food & Coffee</span>
                <span style={{ fontSize: 13, color: "#92400e", background: "#fef3c7", borderRadius: 999, padding: "2px 10px", fontWeight: 600 }}>
                  Near {venueFilter === "all" ? "all locations" : venueFilter}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                Suggested based on your last viewed day ·{" "}
                <button
                  onClick={() => setVenueFilter(suggestedFoodLocation)}
                  style={{ background: "none", border: "none", color: "#b45309", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 13 }}
                >
                  Switch to {suggestedFoodLocation}
                </button>
              </div>
              {/* Location filter chips */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Chip active={venueFilter === "all"} onClick={() => setVenueFilter("all")} tone="amber">All</Chip>
                {FOOD_LOCATIONS.map((loc) => (
                  <Chip key={loc} active={venueFilter === loc} onClick={() => setVenueFilter(loc)} tone="amber">{loc}</Chip>
                ))}
                <button
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    setGeoLocating(true);
                    navigator.geolocation.getCurrentPosition(
                      (pos) => { setVenueFilter(nearestFoodLocation(pos.coords.latitude, pos.coords.longitude)); setGeoLocating(false); },
                      () => setGeoLocating(false),
                      { timeout: 8000 }
                    );
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, background: "white", border: "1px solid #e2e8f0", borderRadius: 999, padding: "5px 12px", cursor: "pointer", fontWeight: 600, color: "#475569" }}
                >
                  <MapPin size={12} /> {geoLocating ? "Locating…" : "Near me"}
                </button>
              </div>
            </Card>

            {/* Meal type filter */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip active={mealFilter === null} onClick={() => setMealFilter(null)} tone="amber">All meals</Chip>
              {MEAL_TYPES.map((m) => (
                <Chip key={m.id} active={mealFilter === m.id} onClick={() => setMealFilter(mealFilter === m.id ? null : m.id)} tone="amber">
                  {m.icon} {m.label}
                </Chip>
              ))}
            </div>

            {/* Venue cards */}
            <div style={{ display: "grid", gap: 10 }}>
              {venues.filter((v) => (venueFilter === "all" || v.location === venueFilter) && (mealFilter === null || (v.meals || []).includes(mealFilter))).map((venue) => {
                const vt = VENUE_TYPES[venue.type] || VENUE_TYPES.restaurant;
                return (
                  <Card key={venue.id} style={{ padding: "14px 16px", borderRadius: 18 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ fontSize: 26, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{vt.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: 15 }}>{venue.name}</span>
                          <SmallBadge color="amber">{vt.label}</SmallBadge>
                          {venueFilter === "all" && <SmallBadge color="slate">{venue.location}</SmallBadge>}
                          {venue.rating && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12 }}>
                              <span style={{ color: "#f59e0b" }}>{"★".repeat(Math.floor(venue.rating))}{"☆".repeat(5 - Math.floor(venue.rating))}</span>
                              <span style={{ fontWeight: 700, color: "#374151" }}>{venue.rating}</span>
                            </span>
                          )}
                        </div>
                        {(venue.meals || []).length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
                            {(venue.meals || []).map((m) => {
                              const mt = MEAL_TYPES.find((x) => x.id === m);
                              return mt ? (
                                <span key={m} style={{ fontSize: 11, background: mealFilter === m ? "#b45309" : "#fef3c7", color: mealFilter === m ? "white" : "#78350f", borderRadius: 999, padding: "2px 8px", fontWeight: 600 }}>
                                  {mt.icon} {mt.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                        {venue.notes && (
                          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{venue.notes}</div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <a
                          href={mapHref(`${venue.name} ${venue.location} Switzerland`)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "6px 10px", textDecoration: "none" }}
                        >
                          <MapPin size={12} /> Map
                        </a>
                        <button
                          onClick={() => removeVenue(venue.id)}
                          style={{ display: "inline-flex", alignItems: "center", background: "transparent", border: "1px solid #e2e8f0", borderRadius: 10, padding: "6px 8px", cursor: "pointer", color: "#94a3b8" }}
                          aria-label="Remove venue"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {venues.filter((v) => (venueFilter === "all" || v.location === venueFilter) && (mealFilter === null || (v.meals || []).includes(mealFilter))).length === 0 && (
                <Card style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🍽️</div>
                  <div style={{ fontWeight: 600 }}>No venues yet for {venueFilter}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Add your first one below!</div>
                </Card>
              )}
            </div>

            {/* Add venue section */}
            <Card style={{ padding: 16, borderRadius: 22 }}>
              {!showAddVenue ? (
                <button
                  onClick={() => { setShowAddVenue(true); setNewVenue((v) => ({ ...v, location: venueFilter === "all" ? "Grindelwald" : venueFilter })); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fffbeb", border: "1px solid #fcd34d", color: "#78350f", borderRadius: 14, padding: "10px 16px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}
                >
                  <Plus size={15} /> Add venue
                </button>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>Add a venue</div>
                  <TextInput
                    placeholder="Paste a Google Maps URL to auto-fill name (optional)"
                    value={newVenue._mapsUrl || ""}
                    onChange={(e) => {
                      const url = e.target.value;
                      setNewVenue((v) => ({ ...v, _mapsUrl: url, _mapsHint: "" }));
                      parseGoogleMapsUrl(url);
                    }}
                  />
                  {newVenue._mapsHint === "short" && (
                    <div style={{ fontSize: 12, color: "#b45309", marginTop: -6 }}>
                      Short links can't be parsed — paste the full URL from your browser's address bar instead.
                    </div>
                  )}
                  <TextInput
                    placeholder="Venue name"
                    value={newVenue.name}
                    onChange={(e) => setNewVenue((v) => ({ ...v, name: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") addVenue(); }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <select
                      value={newVenue.type}
                      onChange={(e) => setNewVenue((v) => ({ ...v, type: e.target.value }))}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 12px", fontSize: 14, background: "white" }}
                    >
                      {Object.entries(VENUE_TYPES).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <select
                      value={newVenue.location}
                      onChange={(e) => setNewVenue((v) => ({ ...v, location: e.target.value }))}
                      style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 12px", fontSize: 14, background: "white" }}
                    >
                      {FOOD_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Good for</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {MEAL_TYPES.map((m) => {
                        const active = (newVenue.meals || []).includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setNewVenue((v) => ({ ...v, meals: active ? v.meals.filter((x) => x !== m.id) : [...(v.meals || []), m.id] }))}
                            style={{ fontSize: 12, background: active ? "#b45309" : "#fef3c7", color: active ? "white" : "#78350f", border: `1px solid ${active ? "#b45309" : "#fcd34d"}`, borderRadius: 999, padding: "4px 10px", fontWeight: 600, cursor: "pointer" }}
                          >
                            {m.icon} {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <TextInput
                    placeholder="Notes (optional)"
                    value={newVenue.notes}
                    onChange={(e) => setNewVenue((v) => ({ ...v, notes: e.target.value }))}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={addVenue}
                      style={{ flex: 1, background: "#b45309", color: "white", border: "none", borderRadius: 12, padding: "10px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddVenue(false)}
                      style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {/* Find more on maps */}
            <div style={{ textAlign: "center", paddingBottom: 8 }}>
              <a
                href={mapHref(`restaurants cafes ${venueFilter === "all" ? "Grindelwald" : venueFilter} Switzerland`)}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#b45309", textDecoration: "none" }}
              >
                <ExternalLink size={13} /> Find more venues on Google Maps
              </a>
            </div>

          </div>
        )}

        {activeTab === "quest" && (() => {
          const kidKey = activeKid;
          const kidName = kidNames[activeKid === "k1" ? 0 : 1];
          const kidDoneCount = questItems.filter((q) => q.checked[kidKey]).length;
          const kidAllDone = kidDoneCount === questItems.length && questItems.length > 0;
          const starsFilled = Math.round((kidDoneCount / questItems.length) * 10) || 0;

          return (
            <div style={{ display: "grid", gap: 16 }}>
              {/* Kid switcher + progress */}
              <Card style={{ padding: 20, background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", borderColor: "#c4b5fd" }}>
                {/* Kid toggle */}
                <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                  {["k1", "k2"].map((k, i) => (
                    <div key={k} style={{ flex: 1, position: "relative" }}>
                      {editingKid === k ? (
                        <input
                          autoFocus
                          value={kidNames[i]}
                          onChange={(e) => setKidNames((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                          onBlur={() => setEditingKid(null)}
                          onKeyDown={(e) => { if (e.key === "Enter") setEditingKid(null); }}
                          style={{ width: "100%", borderRadius: 12, border: "2px solid #7c3aed", padding: "10px 12px", fontSize: 15, fontWeight: 700, background: "white", boxSizing: "border-box" }}
                        />
                      ) : (
                        <button
                          onClick={() => setActiveKid(k)}
                          style={{
                            width: "100%", borderRadius: 12, padding: "10px 14px", fontSize: 15, fontWeight: 700, cursor: "pointer",
                            border: activeKid === k ? "2px solid #7c3aed" : "2px solid #e2e8f0",
                            background: activeKid === k ? "#7c3aed" : "white",
                            color: activeKid === k ? "white" : "#4c1d95",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                          }}
                        >
                          <span>🧒 {kidNames[i]}</span>
                          <span
                            onClick={(e) => { e.stopPropagation(); setEditingKid(k); }}
                            style={{ fontSize: 12, opacity: 0.7, cursor: "pointer", padding: "2px 6px", borderRadius: 6, background: activeKid === k ? "rgba(255,255,255,0.2)" : "#f1f5f9" }}
                          >✎</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div style={{ fontSize: 14, fontWeight: 700, color: "#4c1d95", marginBottom: 6 }}>
                  {kidName}'s adventures: {kidDoneCount} of {questItems.length} complete
                </div>
                <div style={{ background: "#ddd6fe", borderRadius: 999, height: 10, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #7c3aed, #a78bfa)", width: `${(kidDoneCount / questItems.length) * 100}%`, transition: "width 0.4s ease" }} />
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Star key={i} size={16} fill={i < starsFilled ? "#7c3aed" : "none"} color={i < starsFilled ? "#7c3aed" : "#c4b5fd"} />
                  ))}
                </div>
              </Card>

              {/* Celebration */}
              <AnimatePresence>
                {kidAllDone && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4c1d95)", borderRadius: 22, padding: "22px 24px", color: "white", textAlign: "center" }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🎉🏆🇨🇭</div>
                    <div style={{ fontSize: 20, fontWeight: 900 }}>Adventure complete, {kidName}!</div>
                    <div style={{ fontSize: 14, opacity: 0.85, marginTop: 6 }}>Every Switzerland challenge done — you're a Swiss legend!</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quest cards — grouped by section */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {QUEST_SECTIONS.map((sec) => {
                  const sectionItems = questItems.filter((q) => (q.section || "village") === sec.id);
                  if (sectionItems.length === 0) return null;
                  const doneSec = sectionItems.filter((q) => q.checked[kidKey]).length;
                  return (
                    <div key={sec.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ background: sec.bg, border: `1.5px solid ${sec.border}`, borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 800, color: sec.color }}>
                          {sec.label}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{doneSec}/{sectionItems.length}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                {sectionItems.map((q) => {
                  const done = q.checked[kidKey];
                  const isPopping = questPopId === q.id;
                  return (
                    <div key={q.id} style={{ position: "relative" }}>
                      <motion.div
                        animate={isPopping ? { scale: [1, 1.18, 0.95, 1] } : { scale: 1 }}
                        transition={{ duration: 0.4 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => toggleQuestItem(q.id)}
                        style={{
                          background: done ? "rgba(34,197,94,0.1)" : "white",
                          border: `2px solid ${done ? "#22c55e" : "#c4b5fd"}`,
                          borderRadius: 18, padding: "16px 12px 14px",
                          cursor: "pointer", textAlign: "center",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                          transition: "background 0.25s, border-color 0.25s",
                          minHeight: 130, position: "relative", userSelect: "none",
                        }}
                      >
                        {done && (
                          <span style={{ position: "absolute", top: 8, right: 10, fontSize: 16 }}>✅</span>
                        )}
                        <div style={{ fontSize: 42, lineHeight: 1 }}>{q.emoji}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: done ? "#15803d" : "#4c1d95", lineHeight: 1.3 }}>{q.text}</div>
                      </motion.div>

                      {/* Floating cheer */}
                      <AnimatePresence>
                        {isPopping && (
                          <motion.div
                            initial={{ opacity: 1, y: 0 }}
                            animate={{ opacity: 0, y: -60 }}
                            exit={{}}
                            transition={{ duration: 3.6 }}
                            style={{
                              position: "fixed", top: "30%", left: 24, right: 24,
                              whiteSpace: "normal", textAlign: "center",
                              fontSize: 16, fontWeight: 800,
                              color: "#4c1d95", background: "white", borderRadius: 20,
                              padding: "8px 16px", boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                              pointerEvents: "none", zIndex: 9999,
                            }}
                          >
                            {questPopMsg}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeQuestItem(q.id); }}
                        style={{
                          position: "absolute", top: -6, left: -6, width: 22, height: 22,
                          borderRadius: "50%", border: "1px solid #e2e8f0", background: "white",
                          color: "#94a3b8", fontSize: 11, cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center", lineHeight: 1,
                        }}
                      >✕</button>
                    </div>
                  );
                })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add custom challenge */}
              <Card style={{ padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#4c1d95", marginBottom: 10 }}>Add your own challenge</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="e.g. Find a marmot 🦦"
                    value={newQuestText}
                    onChange={(e) => setNewQuestText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addQuestItem(); }}
                    style={{ flex: 1, borderRadius: 12, border: "1px solid #c4b5fd", padding: "10px 12px", fontSize: 14, background: "#faf5ff" }}
                  />
                  <button
                    onClick={addQuestItem}
                    style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 12, padding: "10px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                  >＋ Add</button>
                </div>
              </Card>

              {/* Playgrounds */}
              <Card style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#4c1d95" }}>🛝 Playgrounds near Grindelwald</div>
                  <a
                    href="https://www.google.com/maps/search/playground+near+me"
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 999, background: "#7c3aed", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 12 }}
                  >
                    <MapPin size={12} /> Playground near me
                  </a>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { name: "Männlichen Cow Playground", desc: "Iconic alpine playground with a cow slide! 🐄 At Männlichen summit after the gondola.", map: "Männlichen Cow Playground Switzerland" },
                    { name: "Allmendhubel Flower Park", desc: "Water features and themed play above Mürren. 💧 Gorgeous mountain backdrop.", map: "Allmendhubel Flower Park Mürren Switzerland" },
                    { name: "Bort Alpine Playground", desc: "Adventure playground at Bort on the Grindelwald First gondola line. Stop here on the way down!", map: "Bort Alpine Playground Grindelwald First Switzerland" },
                    { name: "Winteregg Playground", desc: "Scenic stop playground on the Mürren trail. Great rest spot with views. 🏔️", map: "Winteregg playground Mürren Switzerland" },
                    { name: "Grindelwald Village Playground", desc: "Easy local park right in Grindelwald town. Perfect for a quick play break. 🛝", map: "Grindelwald Village Playground Switzerland" },
                  ].map((pg) => (
                    <div key={pg.name} style={{ background: "#f5f3ff", borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#4c1d95" }}>{pg.name}</div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{pg.desc}</div>
                      </div>
                      <a
                        href={mapHref(pg.map)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 999, background: "#ede9fe", color: "#7c3aed", textDecoration: "none", border: "1px solid #c4b5fd", fontWeight: 700, fontSize: 12 }}
                      >
                        <MapPin size={12} /> Map
                      </a>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          );
        })()}

        {activeTab === "map" && (() => {
          const CAT_META = {
            all:        { label: "All",        emoji: "",    accent: "#475569", bg: "#f8fafc",  border: "#e2e8f0" },
            stay:       { label: "Stay",       emoji: "🏠",  accent: "#c2410c", bg: "#fff7ed",  border: "#fdba74" },
            cafe:       { label: "Cafés",      emoji: "☕",  accent: "#b45309", bg: "#fffbeb",  border: "#fcd34d" },
            restaurant: { label: "Restaurants",emoji: "🍽️",  accent: "#16a34a", bg: "#f0fdf4",  border: "#86efac" },
            rainy:      { label: "Rainy Day",  emoji: "🌧️",  accent: "#0891b2", bg: "#ecfeff",  border: "#67e8f9" },
            adventure:  { label: "Adventure",  emoji: "🧗",  accent: "#c0152a", bg: "#fff1f2",  border: "#fca5a5" },
            waterfall:  { label: "Waterfalls", emoji: "💦",  accent: "#0284c7", bg: "#f0f9ff",  border: "#7dd3fc" },
            playground: { label: "Playgrounds",emoji: "🛝",  accent: "#7c3aed", bg: "#f5f3ff",  border: "#c4b5fd" },
            station:    { label: "Stations",   emoji: "🚉",  accent: "#475569", bg: "#f8fafc",  border: "#cbd5e1" },
          };

          const filtered = MAP_PLACES
            .filter((p) => mapCategory === "all" || p.cat === mapCategory)
            .sort((a, b) => {
              if (!mapUserCoords) return 0;
              return haversineDist(mapUserCoords.lat, mapUserCoords.lng, a.lat, a.lng)
                   - haversineDist(mapUserCoords.lat, mapUserCoords.lng, b.lat, b.lng);
            });

          return (
            <div style={{ display: "grid", gap: 16 }}>
              {/* Header */}
              <div style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", borderRadius: 18, padding: "20px 20px 16px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>🗺️ Swiss Adventure Map</div>
                  <div style={{ fontSize: 13, opacity: 0.88 }}>Find places, get directions, discover missions</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["list", "map"].map((mode) => (
                    <button key={mode} onClick={() => setMapViewMode(mode)} style={{
                      background: mapViewMode === mode ? "white" : "rgba(255,255,255,0.2)",
                      color: mapViewMode === mode ? "#0369a1" : "white",
                      border: "none", borderRadius: 10, padding: "7px 14px",
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                    }}>
                      {mode === "list" ? "☰ List" : "🗺️ Map"}
                    </button>
                  ))}
                  {mapViewMode === "map" && (
                    <button onClick={() => setMapFullscreen((f) => !f)} style={{
                      background: "rgba(255,255,255,0.2)", color: "white",
                      border: "none", borderRadius: 10, padding: "7px 12px",
                      fontWeight: 700, fontSize: 15, cursor: "pointer",
                    }}>
                      {mapFullscreen ? "✕" : "⛶"}
                    </button>
                  )}
                </div>
              </div>

              {/* Category filters + Near Me */}
              <Card style={{ padding: 14 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  {Object.entries(CAT_META).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => setMapCategory(key)}
                      style={{
                        border: `1.5px solid ${mapCategory === key ? meta.accent : "#e2e8f0"}`,
                        background: mapCategory === key ? meta.accent : "white",
                        color: mapCategory === key ? "white" : "#374151",
                        borderRadius: 999, padding: "6px 12px", fontSize: 13,
                        cursor: "pointer", fontWeight: 600,
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}
                    >
                      {meta.emoji && <span>{meta.emoji}</span>} {meta.label}
                      {key !== "all" && (
                        <span style={{ fontSize: 11, opacity: 0.75, marginLeft: 2 }}>
                          ({MAP_PLACES.filter((p) => p.cat === key).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    setMapGeoLocating(true);
                    navigator.geolocation.getCurrentPosition(
                      (pos) => { setMapUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setMapGeoLocating(false); },
                      () => setMapGeoLocating(false),
                      { timeout: 8000 }
                    );
                  }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: mapUserCoords ? "#0284c7" : "white",
                    color: mapUserCoords ? "white" : "#374151",
                    border: `1.5px solid ${mapUserCoords ? "#0284c7" : "#e2e8f0"}`,
                    borderRadius: 999, padding: "7px 14px", fontSize: 13,
                    cursor: "pointer", fontWeight: 700,
                  }}
                >
                  <MapPin size={13} />
                  {mapGeoLocating ? "Locating…" : mapUserCoords ? "Sorted by distance ✓" : "Near Me — sort by distance"}
                </button>
                {mapUserCoords && (
                  <button
                    onClick={() => setMapUserCoords(null)}
                    style={{ marginLeft: 8, background: "none", border: "none", color: "#6b7280", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                  >
                    Clear
                  </button>
                )}
              </Card>

              {/* Leaflet map */}
              {mapViewMode === "map" && (
                <div style={mapFullscreen ? {
                  position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                  zIndex: 9998, background: "white",
                } : {}}>
                  {mapFullscreen && (
                    <button onClick={() => setMapFullscreen(false)} style={{
                      position: "absolute", top: 12, right: 12, zIndex: 9999,
                      background: "white", border: "none", borderRadius: 10,
                      padding: "8px 14px", fontWeight: 800, fontSize: 15,
                      cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                    }}>✕ Close</button>
                  )}
                  <div
                    ref={leafletContainerRef}
                    style={mapFullscreen
                      ? { width: "100%", height: "100%", zIndex: 0 }
                      : { height: 420, borderRadius: 16, overflow: "hidden", border: "1.5px solid #e2e8f0", zIndex: 0 }}
                  />
                </div>
              )}

              {/* Place cards (list mode only) */}
              {mapViewMode === "list" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                {filtered.map((place) => {
                  const meta = CAT_META[place.cat] || CAT_META.all;
                  const dist = mapUserCoords
                    ? haversineDist(mapUserCoords.lat, mapUserCoords.lng, place.lat, place.lng)
                    : null;
                  return (
                    <div
                      key={place.id}
                      style={{
                        background: meta.bg, border: `1.5px solid ${meta.border}`,
                        borderRadius: 16, padding: 14,
                        display: "flex", flexDirection: "column", gap: 6,
                        position: "relative",
                      }}
                    >
                      {/* Category badge */}
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        background: meta.accent, color: "white",
                        borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: 3,
                      }}>
                        {meta.emoji} {meta.label}
                      </div>

                      {/* Main emoji */}
                      <div style={{ fontSize: 36, marginBottom: 2 }}>{place.emoji}</div>

                      {/* Name */}
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", paddingRight: 52, lineHeight: 1.3 }}>{place.name}</div>

                      {/* Location */}
                      <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}>
                        <MapPin size={11} /> {place.location}
                        {dist !== null && (
                          <span style={{ marginLeft: 4, background: "#e0f2fe", color: "#0284c7", borderRadius: 999, padding: "1px 6px", fontWeight: 700, fontSize: 11 }}>
                            {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
                          </span>
                        )}
                      </div>

                      {/* Rating */}
                      {place.rating && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                          <span style={{ color: "#f59e0b", letterSpacing: 1 }}>
                            {"★".repeat(Math.floor(place.rating))}{"☆".repeat(5 - Math.floor(place.rating))}
                          </span>
                          <span style={{ fontWeight: 700, color: "#374151" }}>{place.rating}</span>
                        </div>
                      )}

                      {/* Mission */}
                      <div style={{ fontSize: 12, color: meta.accent, fontWeight: 700 }}>🎯 {place.mission}</div>

                      {/* Notes */}
                      <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.4, flexGrow: 1 }}>{place.notes}</div>

                      {/* Buttons */}
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                            background: meta.accent, color: "white",
                            borderRadius: 10, padding: "8px 10px",
                            textDecoration: "none", fontWeight: 700, fontSize: 11,
                          }}
                        >
                          <MapPin size={11} /> Directions
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.location + ' Switzerland')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
                            background: "#f1f5f9", color: "#374151", border: "1.5px solid #e2e8f0",
                            borderRadius: 10, padding: "8px 10px",
                            textDecoration: "none", fontWeight: 700, fontSize: 11,
                          }}
                        >
                          🗺️ Maps
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>}

              {mapViewMode === "list" && filtered.length === 0 && (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: 40, fontSize: 15 }}>No places in this category yet.</div>
              )}
            </div>
          );
        })()}
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
