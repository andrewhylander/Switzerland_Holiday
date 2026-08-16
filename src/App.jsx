import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
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

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const CHF_TO_GBP = 0.82; // Approximate conversion rate

const STORAGE_KEYS = {
  budget: "swiss-trip-budget-v2",
  packing: "swiss-trip-packing-v1",
  venues: "swiss-trip-venues-v1",
  quest: "swiss-trip-quest-v1",
  pretrip: "swiss-trip-pretrip-v1",
  parking: "swiss-trip-parking-v1",
};

const DEFAULT_PRETRIP_CHECKLIST = [
  { id: "pt1", text: "✅ PURCHASED — 2× Half Fare Cards + 2× Family Cards via GetYourGuide app (£263.43 with code THETRAVELINGSWISS5). All 4 cards imported to Google Wallet. Free cancellation until 21 Aug.", done: true, link: "https://www.getyourguide.com" },
  { id: "pt1b", text: "✅ Swiss Family Cards confirmed for Alfie & Chloe — children travel FREE on all trains, buses, boats & Jungfraujoch when accompanied by a parent", done: true, link: "https://www.sbb.ch/en/tickets-offers/tickets/guests-abroad/swiss-family-card.html" },
  { id: "pt2", text: "Download SBB app — select 'Half Fare Travelcard' as discount type (no need to link card number). Show PDF/Google Wallet to conductor on train.", done: false, link: "https://www.sbb.ch/en/timetable/mobile-apps/sbb-mobile.html" },
  { id: "pt2b", text: "Buy Airalo eSIM for Switzerland — Andrew & Ashleigh (Google Pixel 10). 3GB/30 day plan ~£8-10 each. Install before flying, activate on arrival. Use dual SIM: Airalo for data, Smarty for calls/texts.", done: false, link: "https://www.airalo.com" },
  { id: "pt3", text: "Book Dublin Airport parking", done: false, link: "https://www.dublinairport.com/parking" },
  { id: "pt4", text: "Online check-in for LX401 (SWISS) — opens 23hrs before", done: false, link: "https://www.swiss.com/ie/en/fly/my-booking/check-in-online" },
  { id: "pt5", text: "Online check-in for EI0343 (Aer Lingus) — opens 30hrs before", done: false, link: "https://www.aerlingus.com/travel-information/check-in-information/online-check-in/" },
  { id: "pt6", text: "Download offline Switzerland maps (Google Maps / Maps.me)", done: false, link: null },
  { id: "pt7", text: "Check passport expiry for all 4 family members", done: false, link: null },
  { id: "pt8", text: "Notify bank/card provider of travel dates", done: false, link: null },
  { id: "pt9", text: "Pack Swiss Type J plug adapters (or universal)", done: false, link: null },
  { id: "pt10", text: "Get travel insurance docs / EHIC cards", done: false, link: null },
  { id: "pt11", text: "Ask Myriam about the Grindelwald Guest Card — unlocks free local buses, CHF 5 Sportzentrum pool entry, and discounts at some activities. Not confirmed whether it's automatic or needs requesting.", done: false, link: null },
];

const TRIP_INFO = {
  title: "Switzerland Family Holiday",
  dates: "22 Aug 2026 – 30 Aug 2026",
  base: "Grindelwald",
  accommodation: "GrindelwaldHome Alpenglück",
  address: "Spillstattstrasse 28, 3818 Grindelwald, Switzerland",
  host: "Myriam",
  notes: [
    "Day 3 (Jungfraujoch) is the main bucket list day.",
    "No dedicated flex/weather buffer day currently — every day 2-7 has a fixed activity. Worth keeping in mind if the forecast turns bad on a mountain day.",
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
    title: "Dublin → Zurich → Grindelwald",
    location: "Zurich → Interlaken Ost → Grindelwald",
    tags: ["train"],
    mapLocation: "Zurich Airport, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4f/5003_-_Grindelwald_-_View_from_Oberer_Moosgaden.JPG",
    items: [
      {
        time: "8:45 AM",
        title: "Leave Whiteabbey 🚗",
        location: "Whiteabbey → Dublin Airport",
        notes: "🚗 Depart by 8:45 AM to arrive Dublin Airport by 10:45–11:00 AM.\n\n• Route: M2 → M1 → M3 → Airport Tunnel (~1 hr 45 min on a clear run)\n• Saturday 22 Aug falls on the August Bank Holiday weekend — roads heading south can be busier than usual, allow the full 2 hours\n• Pre-book parking at dublinairport.com — Long Stay Car Park P6 is the most convenient for Terminal 1\n• Add ~15–20 min from the car park shuttle to terminal doors\n\n💡 Check in online the night before on the SWISS app and download boarding passes — means you go straight to bag drop and skip the check-in queue.",
        tags: [],
      },
      {
        time: "11:00 AM",
        title: "Arrive Dublin Airport — Terminal 1",
        location: "Dublin Airport, Terminal 1",
        notes: "✈️ LX401 departs 13:00 — aim to be at Terminal 1 by 11:00 AM (2 hours before departure).\n\n🧳 SWISS check-in desks are in Zone B/C — follow signs for SWISS or Star Alliance. If checked in online, head straight to bag drop.\n\n⏰ Bag drop closes 60 min before departure (12:00 noon) — don't cut it fine with kids!",
        tags: [],
      },
      {
        time: "11:00–11:30 AM",
        title: "SWISS check-in & bag drop",
        location: "Dublin Airport T1 — Check-in Zone B/C",
        notes: "🧳 SWISS (LX) check-in desks are in Terminal 1, Zone B/C — follow signs for SWISS or Star Alliance.\n\n📲 If checked in online, head straight to bag drop — much faster queue.\n\n⏰ Bag drop closes 60 min before departure (12:00) — don't cut it fine with kids!\n\n💡 One bag each is usually included with SWISS — check your fare type. Kids' car seats/buggies typically free.",
        tags: [],
      },
      {
        time: "11:30 AM",
        title: "Security & departure gates",
        location: "Dublin Airport T1 — Security",
        notes: "🔐 Security at Dublin T1 can be slow on summer Saturdays — allow 30–45 min.\n\n⚠️ Tips for faster security with kids:\n• Laptops and liquids out of bags before you join the queue\n• Kids' snacks in a clear bag\n• Wear easy shoes (slip-ons ideal)\n• Use the Family lane if available\n\n✅ Airside: food court, Boots, WHSmith and duty-free all accessible once through.\n\n🍕 Grab lunch airside before boarding — there's a Spar, Subway, Eddie Rockets & more past security.",
        tags: [],
      },
      {
        time: "12:20 PM",
        title: "Board LX401 — Dublin → Zurich",
        location: "Dublin Airport T1 — Gate",
        notes: "🚪 Boarding typically opens 40 min before departure. Check your boarding pass for the gate — usually Gates 100s in T1.\n\n✈️ LX401 · Dublin → Zurich (SWISS)\n🛫 Depart: 13:00\n🛬 Arrive Zurich ZRH: 16:15 (local time)\n⏱️ Flight time: 2h 15m\n\nRef: YMKW98\n\n💡 Switzerland is on Central European Time (UTC+2 in August) — 1 hour ahead of Ireland.",
        tags: [],
      },
      {
        time: "4:15 PM",
        title: "Arrive Zurich — train to Grindelwald",
        location: "Zurich Airport",
        notes: "Land at Zurich Airport at 16:15. Take the train from Zurich Airport (ZRH) to Bern (~1h 10min), then Bern → Interlaken Ost (~50 min). Alternatively direct IC to Interlaken Ost from Zurich HB (~2h). Total journey from airport ~2h 30min.\n\n🛒 STOP: Grab groceries at the Migros in Zurich Airport before boarding the train — open until midnight. Much easier than trying to shop when you arrive in Grindelwald at 8pm.",
        tags: [],
      },
      {
        time: "EVE",
        title: "Travel to Grindelwald & check in",
        location: "Interlaken Ost → Grindelwald",
        notes: "From Interlaken Ost, take the BOB train to Grindelwald (~35 min, runs every 30 min). No changes needed. Scenic rack railway through the valley. Arrive Grindelwald Bahnhof.",
        tags: ["train"],
      },
      {
        time: "Late Evening",
        title: "Arrive Grindelwald & check in",
        location: "Grindelwald — GrindelwaldHome Alpenglück",
        notes: "🏠 Arrive Grindelwald ~8:00–8:30 PM. Walk from Bahnhof to apartment (~8 min).\n\nHost: Myriam · Spillstattstrasse 28, 3818 Grindelwald\n\n💡 Short evening walk around the village if energy allows — the Eiger is right there! Early night to recover from travel.",
        tags: [],
      },
    ],
  },
  {
    id: "d2",
    date: "Sun 23 Aug 2026",
    base: "Grindelwald",
    title: "Pfingstegg Toboggan + Coop Shop + Village Day",
    location: "Grindelwald + Pfingstegg",
    tags: ["village", "playground", "adventure"],
    mapLocation: "Grindelwald, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Grindelwald_village_and_the_Eiger.jpg/800px-Grindelwald_village_and_the_Eiger.jpg",
    items: [
      {
        time: "AM",
        title: "Lazy breakfast at Airbnb",
        location: "Alpenglück",
        notes: "No alarm clock today — recovery day after travel. Breakfast at the apartment using supplies grabbed from Migros at Zurich Airport last night.\n\n💡 Use this morning to check webcams and plan the week's mountain days based on the weather forecast. Check MeteoSwiss for hourly forecasts and jungfrau.ch/webcams for live mountain views.\n\n📱 Good morning to download the SBB app and set up Half Fare Card discount if you haven't already.",
        tags: [],
      },
      {
        time: "~10:00 AM",
        title: "Walk to Pfingstegg valley station",
        location: "Alpenglück → Pfingstegg",
        notes: "🚶 15 min walk from the Airbnb through the village to Pfingstegg valley station. No bus needed — easy flat walk.\n\n💡 Grab a coffee from Eiger Bean on the way if it's open — Marco's specialty roast, baby chinos for the kids.",
        tags: [],
      },
      {
        time: "~10:30 AM",
        title: "🛷 Pfingstegg — Toboggan + Fly-Line + Playground",
        location: "Pfingstegg (cable car up, ~5 min)",
        notes: "🚠 Cable car up to Pfingstegg (~5 min).\n\n🛷 TOBOGGAN: Mountain coaster that twists and turns down the mountain with epic views. Buy tickets individually NOT the Fun Package.\n• Adults: CHF 8 per ride\n• Alfie (age 8): CHF 6 per ride\n• Chloe (age 6): CHF 2 per ride\n• Family total: ~CHF 24 for one ride each\n\n🌲 FLY-LINE: Controlled zip line that winds through the trees. Sounds lame but everyone who tries it loves it — they took 3 rides in a row! Check height/age requirements for Chloe.\n\n🛝 Playground at the top with mountain views.\n\n⏱️ Allow 1.5–2 hours for all activities.",
        tags: ["adventure", "kids"],
      },
      {
        time: "~12:30 PM",
        title: "Lunch at Bergrestaurant Pfingstegg",
        location: "Pfingstegg",
        notes: "🍽️ Mountain restaurant right at the top beside the toboggan. Fantastic valley views from the terrace.\n\n🧀 Try Rösti or Älplermagronen (Swiss Alpine mac and cheese) — classic mountain food the kids will love.\n\n💡 Or bring a picnic from last night's Migros shop.",
        tags: ["lunch"],
      },
      {
        time: "~2:00 PM",
        title: "Cable car down + Coop grocery shop",
        location: "Pfingstegg → Grindelwald Terminal → Coop",
        notes: "🚠 Cable car down from Pfingstegg (~5 min).\n🚶 Walk to Grindelwald Terminal (~15 min through village).\n\n🛒 Coop supermarket is RIGHT at Grindelwald Terminal — perfect for the big weekly shop. Open 8am–7pm daily including Sunday.\n\n🛒 SHOPPING LIST — Swiss specialties to try:\n• Zopf bread (buttered braided bread — very Swiss)\n• Landjäger sausage sticks (perfect for hiking picnics)\n• Bergkäse / Gruyère mild / Emmental (mountain cheeses — start kids on Emmental or mild Gruyère, similar to cheddar)\n• Birchermüesli (traditional Swiss breakfast cereal)\n• Rivella (Swiss soft drink — must try!)\n• Ovomaltine crunchy spread (like Nutella but Swiss)\n• Ragusa / Toblerone / Lindt chocolate (gifts + treats + taste test evening!)\n• Fruit syrups — raspberry, elderflower or Alpine herb (dilute with sparkling water — great for kids)\n• Cervelat sausages (Swiss BBQ staple)\n• Fondue/raclette cheese if Alpenglück has a fondue set\n• Wine — Lavaux or Valais whites/rosés\n• Fresh fruit cups + salads + sandwich wraps for picnic days\n\n💡 Don't buy bottled water — tap water in Switzerland is excellent and free!\n💡 Look for 'Action' signs = items on sale\n💡 🐞 Ladybug logo = Swiss product\n💡 Bring a bag or put stuff in your backpack — bags cost 5-10 cents\n\n⏱️ Allow 1–1.5 hours for first shop in an unfamiliar store with kids!",
        tags: [],
      },
      {
        time: "~3:30 PM",
        title: "Drop groceries + afternoon chill",
        location: "Grindelwald",
        notes: "🚶 Walk groceries back to Alpenglück (~10 min from Terminal).\n\nAFTERNOON OPTIONS:\n\n🍦 Village wander, ice cream, and chill — you've earned it after a travel day!\n\n🧀 Hunt for farm fridges — self-service honesty fridges hidden around Grindelwald's side streets. Local cheese, eggs, jam, sausage, handmade crafts.\n\n🏔️ Glacier Gorge — 30 min walk from village. 300m rock faces, spider web net. CHF 19/adult, CHF 10/child, under 6 free. Great option if energy levels are up.\n\n💡 SAVE FOR LATER IN THE WEEK: Grindelwald First gondola + Cliff Walk (30 min, free, stunning views) and Bort Alpine Playground (mountain stream water play, 700m² playground, trampolines, zip line). Best done on a clear weekday — get off at Bort on the way back down. The Cliff Walk is the main reason to go to the top; skip First's adventure activities as Chloe is too small for Mountain Cart and Trottibike (125cm minimum).\n\n🎬 Film buffs: Grindelwald First appears in Star Wars: Revenge of the Sith (as Alderaan!) AND in the Bond helicopter chase from On Her Majesty's Secret Service.",
        tags: [],
      },
      {
        time: "EVE",
        title: "Dinner in Grindelwald",
        location: "Grindelwald village",
        notes: "Dinner at a family-friendly spot:\n• Stallbeizli Heubode — authentic farm restaurant with views (recommended)\n• Eiger Bean — specialty roaster, try the coffee bonbon or cascara. Baby chinos for kids.\n• Barry's — popular with families\n• Café 3692 ⭐ Host pick — OPEN SUNDAYS 8:30am–6pm. Incredible terrace, Wetterhorn views, homemade cakes, kids area inside.\n\n💡 Or cook at the apartment with your fresh Coop supplies — Cervelat sausages on the grill if Alpenglück has a BBQ!",
        tags: ["dinner"],
      },
    ],
  },

  {
    id: "d3",
    date: "Mon 24 Aug 2026",
    base: "Grindelwald",
    title: "Jungfraujoch (Top of Europe)",
    location: "Grindelwald Terminal / Jungfraujoch",
    tags: ["bucket list", "mountains", "viewpoint", "snow"],
    highlight: true,
    mapLocation: "Jungfraujoch, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Jungfraubahn_-_Top_of_Europe_-_3.454m_Jungfraujoch.JPG",
    items: [
      {
        time: "08:46",
        title: "Depart Grindelwald Terminal → Jungfraujoch",
        location: "Grindelwald Terminal",
        notes: "Walk from Alpenglück to Grindelwald Terminal (~10 min). Take the Eiger Express gondola to Eigergletscher (~15 min), then the Jungfraubahn rack railway to Jungfraujoch (~35 min). Arrive ~09:41.\n\n✅ Half Fare Cards give 50% discount on Jungfraujoch tickets (CHF 119.60/adult return, kids FREE with Family Card). Book via swissrailways.com with Flex Cancellation option — free cancel up to 24hrs before if weather is bad.\n\n🎟️ Seat reservation mandatory May–Oct (CHF 10/person × 4 = CHF 40, book at jungfrau.ch). Can reschedule up to 45 mins before journey.\n\n☁️ Weather dependent — check jungfrau.ch webcam at ~7am. If Sphinx is in cloud, postpone and swap with flex day.",
        tags: ["bucket list", "cable car"],
      },
      {
        time: "09:41",
        title: "Sphinx Observatory + Aletsch Glacier viewpoint",
        location: "Jungfraujoch (3,454m)",
        notes: "Take the lift to the Sphinx Observation Deck (3,571m) — views to France and Germany on a clear day. The Aletsch Glacier stretches 23km below you — the longest glacier in the Alps.\n\n📸 Best photos from the Sphinx platform early morning before clouds build.\n\n❄️ It will be cold — 0°C to -5°C even in August. Wear warm layers, waterproof jacket & trousers, hat, gloves, sturdy waterproof shoes.\n\n🎬 Jungfraujoch is a filming location for Netflix's Crash Landing on You (their biggest-ever non-English series) and the Korean variety show Running Man — a big reason this spot is so popular with international visitors.",
        tags: ["bucket list", "viewpoint"],
      },
      {
        time: "10:15",
        title: "Ice Palace",
        location: "Jungfraujoch",
        notes: "Carved tunnels and ice sculptures deep inside the glacier. Allow ~30 min. Slippery floors — hold hands with the kids! Free entry included in your Jungfraujoch ticket.",
        tags: ["snow"],
      },
      {
        time: "10:45",
        title: "Glacier Plateau walk + photos",
        location: "Jungfraujoch",
        notes: "Walk outside on the Aletsch Glacier plateau via the Aletsch Glacier Exit. Touch the glacier, snowball fight, family photos at 3,454m.\n\n💡 Don't forget to stamp your passport at the Jungfraujoch post office — the highest post office in Europe!\n\n➡️ The Snow Fun Park is reached from this same exit — you'll walk straight into it from here once it opens at 11am.",
        tags: ["snow", "viewpoint"],
      },
      {
        time: "11:00",
        title: "⛄ Snow Fun Park — Sledging, Tubing & Snow Play",
        location: "Jungfraujoch Snow Fun Park",
        notes: "Opens 11:00am (closes 16:30). Reached directly from the Aletsch Glacier Exit — you'll already be right there after the plateau walk.\n\n🛷 Sledding & Tube: CHF 20/adult, CHF 15/child = CHF 70 for family of 4. Inflatable tubes and plastic sleds provided. Safe slope, suitable for all ages.\n\n⛷️ Ski & Snowboard (optional): CHF 35/adult, CHF 25/child. All rental equipment included (skis/board, boots, poles, helmet). Short groomed slope — more of a fun novelty than serious skiing. Beginners welcome.\n\n🪂 Zipline (optional): CHF 20/adult, CHF 15/child. Fly down the glacier on a cable at up to 84km/h!\n\n⚠️ NO clothing rental available — you MUST wear your own warm waterproof gear. Pack waterproof jacket, waterproof trousers, gloves, hat, and sturdy waterproof boots/shoes.\n\nFirst come first served, no reservations needed. Safety equipment included in price.",
        tags: ["bucket list", "snow", "kids"],
      },
      {
        time: "12:30",
        title: "Lunch at Aletsch Restaurant",
        location: "Jungfraujoch",
        notes: "Several restaurants inside the Jungfraujoch station complex. Aletsch Restaurant has glacier views. Also a Lindt Swiss Chocolate Shop for souvenirs!\n\n🍫 Let the kids pick a chocolate treat from Lindt after lunch.",
        tags: ["lunch"],
      },
      {
        time: "~14:15",
        title: "Return journey to Grindelwald",
        location: "Jungfraujoch → Grindelwald Terminal",
        notes: "Reverse the morning route — Jungfraubahn down to Eigergletscher, then Eiger Express gondola back to Grindelwald Terminal (~53 min total). Back in Grindelwald by ~15:00.\n\n💡 Optional: stop at Kleine Scheidegg on the way down for hot chocolate and views of the Eiger North Face. Watch the rack railway arrive and depart — kids love it.",
        tags: ["train"],
      },
      {
        time: "EVE",
        title: "Return & quiet dinner",
        location: "Grindelwald",
        notes: "Take it easy — it's been a big altitude day at 3,454m (about 3× higher than Ben Nevis). Kids may be tired from the altitude and all the snow play.\n\n🍕 Quiet dinner in Grindelwald village. Suggestion: order in or eat at the apartment if energy is low.",
        tags: ["dinner"],
      },
    ],
  },
  {
    id: "d4",
    date: "Tue 25 Aug 2026",
    base: "Grindelwald",
    title: "Männlichen — Lieselotte Cow Trail",
    location: "Männlichen",
    tags: ["mountains", "viewpoint", "hike", "playground"],
    mapLocation: "Männlichen, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Jungfrau_panorama_from_Mannlichen_(10955538175).jpg",
    items: [
      {
        time: "AM",
        title: "Grindelwald Terminal → Männlichen",
        location: "Grindelwald Terminal → Männlichen",
        notes: "🚶 Walk from apartment → Grindelwald Terminal: ~10 min\n🚠 Grindelwald Terminal → Männlichen gondola: ~19 min — one of the world's longest gondolas at 6km\n\n📅 Book in advance at jungfrau.ch | Go early for the clearest mountain views\n\n💡 ALTERNATIVE ROUTE via Wengen: Train to Lauterbrunnen → WAB train to Wengen → cable car to Männlichen. Slightly longer BUT you can do the Royal Ride — ride ON TOP of the Wengen cable car in the open air for just CHF 5! 5-minute ride with wind in your hair. Kids will absolutely love this.\n\n🌙 AFTER 4PM DISCOUNT: If going up from Wengen after 4pm, cable car is half price — just CHF 13 with Half Fare Card! Last lift down ~5:30pm. Perfect for a sunset visit.\n\n🎶 CHECK EVENT CALENDAR:\n• Every Tuesday July/Aug — Evening BBQ on the mountain with sunset views! Meats, veggies, potatoes, salad.\n• Late August — Jazz Brunch with hours of live music + bottomless buffet. Check dates — may fall during your trip (22-30 Aug)!\n• Check mannlichen.ch for exact dates.",
        tags: ["cable car", "mountains"],
      },
      {
        time: "MID",
        title: "Männlichen: Lieselotte Trail (priority) + Royal Walk + Cow Playground",
        location: "Männlichen (2,343m)",
        notes: "⭐ PRIORITY ACTIVITY — LIESELOTTE TRAIL (Lieselotteweg): Themed downhill family adventure trail from Männlichen to Holenstein. Named after Lieselotte, a famous cow on her first adventure in the Swiss mountains. Official info: maennlichen.ch/en/summer/experiences/lieselotte-trail.html\n\n📏 DISTANCE & TIME: 3.5km (~2.1 miles), allow a full 2–2.5 hours at family pace (kids will want to stop at every station!). Primarily downhill on gravel paths. NOT suitable for strollers/prams due to some rougher, steep sections — a child carrier backpack is recommended for toddlers. Wear sturdy shoes.\n\n🗺️ THE ADVENTURE MAP: Pick up a free activity map ('passport') at the Männlichen cable car station before you start.\n\n🎯 13 interactive stations along the way, including: blow a real alphorn, marmot tower, long jump challenge, ring cowbells, play with chickens, ride a zip line, climb a replica Eiger North Face wall, sit on a cow, hunt for mountain crystals, and more.\n\n🧩 THE PUZZLE & PRIZE: Each station has a special hole-puncher. Kids punch their map at every stop to collect letters that spell out a secret solution word.\n\n🎁 CLAIMING THE GIFT: Present the completed map at the Grindelwald Terminal ticket counter OR Vincenz Bakery in Wengen to claim a small prize.\n\n🧺 Two picnic/BBQ spots along the route — bring lunch from your Coop shop and eat partway down with the views.\n\n🏁 WHERE YOU END UP: Holenstein — the midway cable car station on the Grindelwald Terminal ↔ Männlichen gondola line.\n\n🌲 At Holenstein: Holzwurm Wood Playground + a Treetop Path with climbing structures — a nice reward for finishing the walk! Add ~20-30 min if energy allows.\n\n🚠 GETTING HOME FROM HOLENSTEIN: Hop on the gondola down to Grindelwald Terminal — ~8 min ride. Then it's a ~10 min walk back to Alpenglück. Total ~20 min door to door from Holenstein.\n\n🏔️ Before you start the trail — Royal Walk to the summit crown (~20-30 min each way, there-and-back). Starts at the 'King's Gate' with 7 themed info points along the way. At the crown: labelled viewing panels naming every peak — Eiger, Mönch & Jungfrau (the big three), Lauterbrunnen Valley, Mürren, Schilthorn, Interlaken, Lake Thun, Grindelwald First. Fill your memory card! Short enough to skip if energy is low — Lieselotte is the priority today.\n\n🐄 Cow Playground (Sennenspielplatz) — right by the top station if you want a play break before starting the trail. 8.5m high giant cow slide (slide out its rear end!), bowling alley, trampolines, climbing structures, swings, seesaw.\n\n🍽️ Männlichen Mountain Guest House — self-service and full-service restaurants at the top if you'd rather eat before heading down. Seven different spots to eat inside and out. Can be windy and chilly at 2,343m so bring layers.\n\n🏔️ ALTERNATIVE (if not doing Lieselotte): Panorama Trail — 1hr 15min gentle downhill on wide gravel to Kleine Scheidegg instead. Sweeping Eiger/Mönch/Jungfrau views the entire way. Restaurant Grindelwaldblick with fort stairs + Swiss flag photo spot, small playground. From Kleine Scheidegg: train down to Grindelwald (~35 min) OR train to Wengen.",
        tags: ["viewpoint", "hike", "playground"],
      },
      {
        time: "PM",
        title: "Chill afternoon back in Grindelwald",
        location: "Grindelwald",
        notes: "You'll likely be back in Grindelwald by mid-to-late afternoon with tired legs from the Lieselotte descent. No more activities scheduled — good day to keep it easy.\n\n🍦 Village wander, ice cream, farm fridge hunt, or just relax back at Alpenglück.\n\n💡 Good afternoon to check tomorrow's Schilthorn webcam and forecast, and rest up — it's another big day tomorrow.",
        tags: [],
      },
      {
        time: "EVE",
        title: "Dinner in Grindelwald",
        location: "Grindelwald village",
        notes: "Dinner at a family-friendly spot — see the Food & Coffee tab for options. Early-ish night after a long downhill walk with the kids.",
        tags: ["dinner"],
      },
    ],
  },
  {
    id: "d5",
    date: "Wed 26 Aug 2026",
    base: "Grindelwald",
    title: "🎬 Schilthorn → Birg → Mürren → Gimmelwald (start high, descend all day)",
    location: "Stechelberg → Schilthorn → Mürren → Gimmelwald",
    tags: ["mountains", "viewpoint", "cable car", "playground", "village", "history"],
    mapLocation: "Schilthorn, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Piz_Gloria_Bond_World_007.jpg/1280px-Piz_Gloria_Bond_World_007.jpg",
    items: [
      {
        time: "8:15 AM",
        title: "Travel to Schilthorn",
        location: "Grindelwald → Lauterbrunnen → Stechelberg",
        notes: "🏔️ TODAY'S ROUTE: Start at the top (2,970m) and work your way DOWN all day. The only uphill is the short Allmendhubel funicular which returns you to the same spot. Everything else is downhill or cable car — very family-friendly!\n\nSchilthorn (2,970m) → Birg Thrill Walk (2,677m) → Mürren village (1,650m) → Allmendhubel (1,934m, funicular up & back) → Mürren → walk down to Gimmelwald (1,380m) → cable car to Stechelberg (867m) → bus & train home.\n\n🚂 Walk to Grindelwald station (~10 min) → BOB train to Lauterbrunnen (~25 min) → PostBus to Stechelberg (~15 min) → cable car via Gimmelwald → Mürren → Birg → Schilthorn (~30 min).\n\nArrive Schilthorn (Piz Gloria) ~9:30 AM.\n\n⚠️ Book breakfast at Piz Gloria in advance at schilthorn.ch — summer slots fill up weeks ahead. Ask for a window table in the revolving restaurant.",
        tags: ["train", "cable car"],
      },
      {
        time: "9:30 AM",
        title: "🎬 Piz Gloria — revolving breakfast (Bond World)",
        location: "Schilthorn — Piz Gloria (2,970m)",
        notes: "The revolving restaurant from James Bond's 'On Her Majesty's Secret Service' (1969). Full 360° rotation every ~45 min with views across 200 Alpine peaks — including the Matterhorn on a clear day.\n\n🍳 Full Swiss breakfast in the rotating room — unique experience the kids will never forget.\n\n🎬 Bond World 007 museum is included — photos in Bond costumes, film props, interactive exhibits.\n\n🚽 Don't skip the toilets while you're up here — trust us, just go and see for yourself!\n\n🏗️ Schilthornbahn history: opened 1967 as the world's longest aerial cableway. Today the Stechelberg→Mürren section is the steepest cableway in the world. The whole system runs on hydroelectricity or solar-powered batteries that recharge as the cable car descends.\n\n☁️ If cloud is low, views are limited — check the Schilthorn webcam the night before at schilthorn.swiss/en/pizgloria/Livecam",
        tags: ["viewpoint", "history", "mountains"],
      },
      {
        time: "11:00 AM",
        title: "⚡ Birg Thrill Walk (free!)",
        location: "Birg station (2,677m) — between Schilthorn & Mürren",
        notes: "Get off at Birg on the way down from Schilthorn — don't skip this! The Thrill Walk is FREE and built into the cliff face.\n\n🌉 Cross a tightrope, walk on a glass floor looking straight down the cliff, and crawl through an open-air tunnel perched on the side of the mountain.\n\n⏱️ Takes ~20 min. Kids will love the glass floor — adults may find it terrifying!\n\n💡 Also great viewpoint of the tiny Grauseeli lake below.",
        tags: ["viewpoint", "adventure"],
      },
      {
        time: "11:45 AM",
        title: "Descend to Mürren — explore car-free village",
        location: "Birg → Mürren",
        notes: "Cable car down to Mürren (~10 min from Birg). Mürren is one of Switzerland's highest and most scenic car-free villages — no roads, no cars, only mountain trains and footpaths.\n\n🏔️ Eiger, Mönch & Jungfrau fill the entire eastern horizon — one of the most dramatic mountain views in the Alps.\n\n🇨🇭 Walk Mürren's main street — Swiss flags, wooden chalets, flower boxes on every window. Take the UPPER road for fewer crowds.\n\n📸 Best viewpoints: 'the stump' (locals know it), train station terrace, and tennis court terrace.\n\n🍽️ Food options:\n• Café Liv — must-try: cranberry toasty (Brie + cranberry jam, owner's childhood recipe), apple walnut cake with cream cheese frosting & caramel, vanilla lemonade (perfect summer drink). Handbuilt interior — counter is one oak tree split open!\n• Stager Stübli — classic Swiss dishes, outdoor dining\n• Esther's Guesthouse — excellent ice cream\n• Mountain Hostel — homemade pizza\n• Intersport Coffee Bar — Belinda's specialty coffee inside a sports shop. Must-try: mountain cappuccino. Baby chinos for kids. Also great for hiking tips — 'where coffee meets community'\n\n🎒 Optional: Rent a LUDO TRAIL game backpack from the tourist office — 16 interactive game stations throughout the village. Perfect for keeping the kids exploring!\n\n🌧️ RAINY DAY BACKUP: Mürren Sportcenter has a swimming pool open in summer — worth knowing if the weather turns.",
        tags: ["village", "viewpoint"],
      },
      {
        time: "12:30 PM",
        title: "🌸 Allmendhubel — flower playground & panorama",
        location: "Mürren → Allmendhubel (1,934m)",
        notes: "🚟 Short funicular ride above Mürren (~5 min, ~CHF 8 return, Half Fare Cards valid).\n\n🌸 Allmendhubel Flower Park — wildflower meadows with wooden boardwalks, alpine botanical features, and cowbells ringing across the hillside. Best wildflower display in the Jungfrau region in August.\n\n🛝 Playground at the top — this is one of the BEST in the region! Zip line, water maze, marmot tunnels, climbing structures, slides, and open meadows for kids to run in with Eiger views behind them.\n\n🧺 Perfect picnic spot — grab supplies from Coop Terminal the morning before. Landjäger sausages, Zopf bread, mountain cheese (try Gruyère mild or Emmental for the kids) and Rivella.",
        tags: ["playground", "viewpoint", "mountains"],
      },
      {
        time: "2:00 PM",
        title: "🥾 Hike down to Gimmelwald",
        location: "Mürren → Gimmelwald",
        notes: "45-minute walk down from Mürren through alpine meadows — cowbells, wildflowers, and jaw-dropping views of the Lauterbrunnen valley below.\n\n🌸 The path passes through flower-filled meadows — kids can spot marmots and cows up close. Easy gradient, no scrambling.\n\n🏘️ Arrive Gimmelwald — population ~130, one of Switzerland's smallest inhabited villages. Completely off the tourist trail. Wooden farmhouses, barn smells, actual farm life.",
        tags: ["hike", "mountains"],
      },
      {
        time: "3:00 PM",
        title: "🏪 Gimmelwald — honesty shop, farm & Rugenbräu Dunkel",
        location: "Gimmelwald village",
        notes: "🏪 World's first honesty shop — unlocked fridge and shelves of local produce. Pay what you think is fair, leave money in the box. Local cheese, eggs, dried meats, milk.\n\n🐄 Farm animals right in the village — cows, chickens, working Alpine farms that have operated for centuries.\n\n🛝 You'll pass a playground with a crazy fast slide on the way through — let the kids burn off energy while you take in the viewpoint benches above Gimmelwald overlooking the valley.\n\n🍺 Pension Gimmelwald — ask for a Schwarz Monk beer (local dark brew) or Rugenbräu Dunkel. The bar is open to non-guests — hikers, locals, wooden benches, cowbell on the wall.\n\n💡 Kids can have a Rivella (Swiss soft drink) while you enjoy the beer.\n\n🛍️ Souvenir shopping: Exile on Main Street and Adleggen Sport in Mürren, or the honesty shop and farm fridges in Gimmelwald.",
        tags: ["village", "history"],
      },
      {
        time: "4:30 PM",
        title: "Return to Grindelwald",
        location: "Gimmelwald → Stechelberg → Lauterbrunnen → Grindelwald",
        notes: "🚠 Cable car from Gimmelwald down to Stechelberg (~5 min)\n🚌 PostBus Stechelberg → Lauterbrunnen (~15 min)\n🚂 BOB train Lauterbrunnen → Grindelwald (~25 min)\n\nBack in Grindelwald by ~6:15 PM. Dinner in the village — it's been a full day!",
        tags: ["train"],
      },
    ],
  },
  {
    id: "d6",
    date: "Thu 27 Aug 2026",
    base: "Grindelwald",
    title: "Lauterbrunnen Valley — Bike Ride + Waterfalls",
    location: "Lauterbrunnen → Stechelberg",
    tags: ["cycling", "waterfall", "village"],
    mapLocation: "Lauterbrunnen, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/70/Wengen,_3823,_Switzerland_-_panoramio_-_Michal_Gorski.jpg",
    items: [
      {
        time: "AM",
        title: "Grindelwald → Lauterbrunnen",
        location: "Grindelwald → Lauterbrunnen",
        notes: "🚂 Grindelwald → Zweilütschinen → Lauterbrunnen: BOB train, ~25 min, runs every 30 min.\n\n🛝 Small playground in Lauterbrunnen village near the station — good for a quick play before the bike ride.",
        tags: ["train"],
      },
      {
        time: "MID",
        title: "Valley bike ride + waterfalls",
        location: "Lauterbrunnen → Stechelberg",
        notes: "🚲 Hire bikes in Lauterbrunnen village from Imboden Bike (near station, discount with Lauterbrunnen guest card). Completely flat 9km cycle to Stechelberg and back with 72 waterfalls in the cliff walls around you.\n\n⚠️ Don't stop at Staubbach Falls and turn around — the most beautiful part of the valley is further in. Cycle all the way to the back for the full experience.\n\n💧 Staubbach Falls — 300m waterfall visible from the village. Can walk behind it (May–Oct) but honestly the best view is from the bottom.\n\n🌭 Betty's Corn Dogs — unexpected gem in the village! Choose your filling (local sausage), covering (classic panko), and load up on sauces. Kids will love this.\n\n🧀 Farm fridges AND vending machines along the pedestrian path past Staubbach Falls — self-service honesty fridges with Swiss cheese, sausage, eggs, yogurt, butter, syrup, jam, and handmade crafts. Some are actual vending machines — pop in coins, enter a number. Look out for local caramel treats (taste like buttery sugar cookies) and fruit syrups (dilute with water — NOT a drink on its own!). Perfect picnic supplies!\n\n🥛 Milk vending machine — fresh from the cows in the field next to it! Pop in coins, fill a cup. Warning: it's probably unpasteurised, and it's so good you'll never want supermarket milk again.\n\n🎯 I Spy game for the kids — there's a Swiss flag hidden in a small cave high up on the cliff face on the Wengen side of the valley. Can you spot it from the village?\n\nOptional: Trümmelbach Falls (10 glacial waterfalls inside the mountain — 20,000L/sec, completely rain-proof, CHF 14/adult, CHF 7/child). Children under 4 not allowed.",
        tags: ["cycling", "waterfall"],
      },
      {
        time: "EVE",
        title: "Return bikes & head back to Grindelwald",
        location: "Lauterbrunnen → Grindelwald",
        notes: "Return bikes to Imboden. Before catching the train:\n\n☕ Airtime Café Bakery — great patio for people-watching. Famous for their brownies, plus smoothies, fresh juices, veggie pies, sandwiches. Try a Staubbach beer — hyper-local craft beer, so local you can't find info about it online!\n\n🚂 Lauterbrunnen → Zweilütschinen → Grindelwald: BOB train, ~25 min",
        tags: ["train"],
      },
    ],
  },
  {
    id: "d7",
    date: "Fri 28 Aug 2026",
    base: "Grindelwald",
    title: "Lake Brienz Steamer + Giessbach Falls + Harder Kulm Sunset",
    location: "Interlaken → Lake Brienz → Brienz → Harder Kulm",
    tags: ["lake", "boat", "waterfall", "sunset"],
    mapLocation: "Interlaken, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Brienz_and_Lake_Brienz_from_Rothorn.jpg/1280px-Brienz_and_Lake_Brienz_from_Rothorn.jpg",
    items: [
      {
        time: "AM",
        title: "Train to Interlaken Ost",
        location: "Grindelwald → Interlaken Ost",
        notes: "🚂 Grindelwald → Zweilütschinen → Interlaken Ost: ~35 min, runs every 30 min.\n\n✅ Half Fare Cards valid on all BLS trains and lake steamers — buy tickets at the desk or platform machine.\n\n💡 Grab a coffee and pastry at the station café before boarding the steamer.",
        tags: ["train"],
      },
      {
        time: "MID AM",
        title: "BLS Lake Steamer across Lake Brienz",
        location: "Interlaken Ost → Brienz (lake steamer)",
        notes: "⛵ Board the BLS paddle steamer at Interlaken Ost pier (~10 min walk from station, or short bus).\n\n🌊 Cruise across stunning turquoise-green Lake Brienz to Brienz (~1 hour). The lake is one of the clearest in Switzerland — glacier meltwater gives it its incredible colour.\n\n✅ Half Fare Cards valid. Check BLS timetable at bls.ch for departure times (roughly every 1–2 hours in summer).\n\nSit on the upper deck for the best views of the surrounding Alps.",
        tags: ["boat", "lake"],
      },
      {
        time: "MID",
        title: "Explore Brienz + Giessbach Falls",
        location: "Brienz village → Giessbach",
        notes: "Brienz is an adorable village at the end of the lake. Here's what to do:\n\n🏘️ Brunngasse — ranked the '2nd most beautiful street in the world' by Architectural Digest. Dark aged wood, white stone, flower boxes, cobblestones. Worth a 5-minute wander.\n\n⛪ Reformed Church — best view in town from the terrace. Lake, mountains, waterfalls all visible.\n\n🍕 Bino's Pizzeria — 900+ Google reviews, 4.7★. Pizzas ~CHF 20, surprise toppings. Open 11am–11pm (kitchen closed 3–5pm). Take pizza to the lakeside promenade for a picnic!\n\n🍦 Brienz Gelatti — gelato food truck on the promenade. Authentic Italian, CHF 4 for a small. Grab a blue chair and sit on the waterfront.\n\n🏊 OPTIONAL: Strandbad Brienz — swimming in the lake! CHF 5/adult, CHF 3/child 6-15. Water trampoline, paddleboards, kayak hire, 3 pools, playground, ping pong, hammocks. Perfect on a hot day.\n\n🦌 OPTIONAL: Wildpark Brienz — free mini zoo, 20 min walk above town. Opened 1896! CHF 1 to buy a box of animal food — kids will love feeding them.\n\n💦 Giessbach Falls: Take a short boat hop from Brienz pier to Giessbach landing. Ride the oldest hotel funicular in the world (built 1879). 14 cascades tumbling 400m down into the lake. Walk behind the waterfall! Lunch at Grand Hotel Giessbach terrace — stunning views, affordable set menu.\n\n🎖️ Grand Hotel Giessbach was a filming location for HBO's Band of Brothers — worth a mention while you're admiring the terrace.",
        tags: ["waterfall", "cable car", "history", "village"],
      },
      {
        time: "PM",
        title: "Return to Interlaken",
        location: "Brienz → Interlaken Ost",
        notes: "🚂 Take the train back from Brienz to Interlaken Ost (~20 min) or catch the return steamer if timing works.\n\n☕ Afternoon stop in Interlaken/Unterseen — pick one:\n• V Café — must-try carrot cake (Rob's mum's recipe!), breakfast burrito, halloumi sandwich. Bike-themed, tucked away side street.\n• Aarberg Hotel & Café — riverside terrace with mountain views in Unterseen (5 min walk). Brookie (brownie-cookie), eggs benedict, Apfelschorle. 150-year-old building.\n• Spatz — Italian-inspired, right on the river. Homemade focaccia with mortadella (baked fresh daily). Perfect for an afternoon aperitivo or save it for evening.\n• Steininger Bakery — pick up crusty fresh bread for picnics. Great with farm fridge cheese and jam.\n\nShort walk along the famous Höheweg promenade between the two lakes.",
        tags: ["train"],
      },
      {
        time: "EVE",
        title: "Harder Kulm — Two Lakes Sunset View",
        location: "Interlaken → Harder Kulm",
        notes: "🦌 BEFORE the funicular — stop at the Alpine Wildlife Park right next to the station. FREE entry! Ibex and marmots. The ibex were nearly extinct in the 1800s and were reintroduced here. Marmots are hilarious to watch. Donations welcome.\n\n🚠 Harder Kulm funicular: 10 min ride, 754m elevation gain, 64% gradient. 100+ years old. Has a GLASS CEILING so you can see all the way up during the ride!\n\n🌅 Best time to arrive: ~1 HOUR BEFORE SUNSET for the golden glow on the mountains. Late August sunset is around 8pm, so aim for ~7pm.\n\n🌉 Zwei Steg (Two Lakes Bridge) — suspended viewing platform with glass floor. Lake Thun to the west, Lake Brienz to the east, Eiger/Mönch/Jungfrau ahead. Take a selfie with the Swiss cow statue on the platform.\n\n🛝 NEW playground at the top (opened 2024) — nest swing, balancing path, slide, picnic tables. Kids can play while you watch the sunset.\n\n🍽️ Panorama Restaurant terrace — cheese fondue is the most popular order. Can't reserve unless group of 8+, so arrive early for a table. Or grab drinks from the self-service snack bar.\n\n🎫 LUNCH TICKET DEAL: CHF 39 with Half Fare Card — includes funicular return + daily lunch menu. Good if visiting during the day instead.\n\n✅ Half Fare Cards valid. Last funicular down ~9:30pm in August.\n\n💡 On the walk back from the funicular station, stop at the bistro right next to the Interlaken Ost boat dock — tucked away, locals hang out here, kids play area, affordable drinks and ice cream. Perfect wind-down spot.\n\n🚂 Return: Interlaken Ost → Grindelwald (~35 min).\n\n💼 REMINDER: Checkout is tomorrow (Sat) morning — no need to store luggage today, you're back at Alpenglück tonight as normal.",
        tags: ["cable car", "sunset", "viewpoint"],
      },
    ],
  },
  {
    id: "d8",
    date: "Sat 29 Aug 2026",
    base: "Zurich Airport",
    title: "Checkout day: Free morning → afternoon travel to Zurich",
    location: "Grindelwald → Zurich Airport / Rümlang",
    tags: ["train"],
    mapLocation: "Holiday Inn Express Zurich Airport, Hofwisenstrasse 30, 8153 Rümlang, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Zurich_Hauptbahnhof_by_night.JPG",
    items: [
      {
        time: "AM 🔓",
        title: "Checkout & free morning",
        location: "Grindelwald",
        notes: "Check out by 9:00 AM. You have the morning free in Grindelwald/Jungfrau area.\n\n💡 Ideas for the morning:\n• Relax at a café (you've earned it!)\n• Quick easy walk in Grindelwald village\n• Visit something you missed (Glacier Canyon, quick playground)\n• Just rest before travel day\n\n💼 Drop luggage at Grindelwald station left-luggage if you want to explore hands-free",
        tags: [],
      },
      {
        time: "🚂 PM",
        title: "Travel to Zurich Airport Hotel",
        location: "Grindelwald → Zurich Airport / Rümlang",
        notes: "⏰ Leave Grindelwald around 1:00–2:00 PM\n\n🚂 Route:\n• Grindelwald → Interlaken Ost: ~55 min\n• Interlaken Ost → Bern: ~50 min\n• Bern → Zurich HB: ~1 hour\n• Zurich HB → Zurich Airport: ~10 min\n• Total journey: ~2h 45min\n\n✅ Trains run every 30 min — flexible timing\n✅ Airport station is directly under the terminal — easy luggage transfer\n✅ Arrive at hotel by 5:00–6:00 PM",
        tags: ["train"],
      },
      {
        time: "🏨 Check-in",
        title: "Holiday Inn Express Zurich Airport",
        location: "Hofwisenstrasse 30, 8153 Rümlang, ZH, Switzerland",
        notes: "✅ Check-in from 3:00 PM (you'll arrive ~5–6pm)\n🍽️ Hotel restaurant or nearby for dinner\n🛏️ Final night in Switzerland — relax before your flight tomorrow morning\n✅ Check-out by 11:00 AM (but your flight is 11:00 AM, so leave by 9:00 AM)",
        tags: ["dinner"],
      },
    ],
  },
  {
    id: "d9",
    date: "Sun 30 Aug 2026",
    base: "Zurich Airport",
    title: "Fly Home — EI0343 Zurich → Dublin 11:00 AM",
    location: "Zurich → Dublin",
    tags: [],
    mapLocation: "Zurich Airport, Switzerland",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/83/Aerial_View_of_Zurich_Airport_18.02.2009_12-32-36.JPG",
    items: [
      {
        time: "6:45 AM",
        title: "Wake up & hotel breakfast",
        location: "Holiday Inn Express Zurich Airport",
        notes: "Early start! Hotel breakfast opens at 6:30 AM — eat before you leave rather than at the airport (cheaper and quicker).\n\n💡 Pack bags the night before and ask the front desk for a 7:30 AM checkout when you check in.",
        tags: [],
      },
      {
        time: "7:30 AM",
        title: "Check out & walk to terminal",
        location: "Holiday Inn Express → ZRH Terminal 1",
        notes: "Check out by 7:30 AM — pack bags the night before so there's no scrambling in the morning.\n\n🚶 Walk to Zurich Airport Terminal 1: ~5–10 min on foot — there's a covered walkway directly from the hotel area. No bus or taxi needed.\n\n✅ Zurich Airport is very straightforward — well-signed, clean and efficient.",
        tags: [],
      },
      {
        time: "7:45 AM",
        title: "Bag drop — Aer Lingus check-in",
        location: "ZRH Terminal 1 — Check-in Hall",
        notes: "Aer Lingus check-in desks are in Terminal 1. Look for the EI desks or Self-Service kiosks.\n\n⏰ Bag drop closes ~45 min before departure (10:15 AM) but aim to be done by 8:15 AM.\n\n📲 Check in online the night before to save time — just need bag drop.",
        tags: [],
      },
      {
        time: "8:15 AM",
        title: "Security & passport control",
        location: "ZRH Terminal 1",
        notes: "Allow 30–45 min for security + Swiss passport control (leaving Schengen area).\n\n⚠️ Schengen exit — have all passports ready. Kids need their own passports.\n\n🇮🇪 Irish passports: use the EU/EEA lane — much faster than the non-EU queue. Switzerland is Schengen but not EU, so the border officer may still stamp or check carefully — don't be surprised.\n\n💡 Use the Family lane for security if available — usually shorter with children.",
        tags: [],
      },
      {
        time: "9:00 AM",
        title: "Airside — gate area",
        location: "ZRH Terminal 1 — Airside",
        notes: "You're through! Plenty of time before boarding.\n\n☕ Grab a coffee and final Swiss treat at one of the airside cafés.\n🛍️ Duty-free chocolate for home — Lindt and Toblerone are cheapest here vs in the city.\n\n🚂 Gate for Aer Lingus flights is usually in Pier A or B — follow the signs.",
        tags: [],
      },
      {
        time: "10:30 AM",
        title: "Board EI0343",
        location: "ZRH → DUB",
        notes: "Boarding typically opens 40–45 min before departure.\n\n✈️ EI0343 · Zurich → Dublin\n🛫 Depart: 11:00 AM\n🛬 Arrive: 12:30 PM (Irish time — no time zone change from Switzerland in August)\n\nRef: 2TLA5F",
        tags: [],
      },
    ],
  },
];

const LEARNING_SECTIONS = [
  { id: "facts", label: "Swiss Facts", emoji: "🇨🇭", color: "#dc2626" },
  { id: "language", label: "Learn Words", emoji: "🗣️", color: "#2563eb" },
  { id: "culture", label: "Culture & Traditions", emoji: "🎭", color: "#9333ea" },
  { id: "landmarks", label: "Mountains & Landmarks", emoji: "⛰️", color: "#ea580c" },
  { id: "fun", label: "Fun Facts for Kids", emoji: "🎉", color: "#16a34a" },
];

const DEFAULT_LEARNING_ITEMS = [
  // 🇨🇭 Swiss Facts
  { id: "lf1", section: "facts", icon: "🏔️", title: "The Alps Cover 60% of Switzerland", description: "Switzerland has three mountain ranges: the Alps, the Jura, and the Mittelland. The Alps are the most famous and cover about 60% of the country!" },
  { id: "lf2", section: "facts", icon: "🚂", title: "The Jungfrau Railway is the Highest in Europe", description: "The Jungfraubahn (Jungfrau Railway) reaches 3,454 meters (11,333 feet) above sea level. It's the highest railway in Europe and takes you to 'Top of Europe'!" },
  { id: "lf3", section: "facts", icon: "🧀", title: "Switzerland Makes 450,000 Tonnes of Cheese Per Year", description: "The most famous Swiss cheese is Emmental (with big holes!), but there are over 450 varieties. Switzerland is the world's largest exporter of cheese." },
  { id: "lf4", section: "facts", icon: "🍫", title: "Swiss Chocolate is World Famous", description: "Switzerland produces about 200,000 tonnes of chocolate per year. The chocolate is so good because of high-quality cocoa, milk, and careful craftsmanship!" },
  { id: "lf5", section: "facts", icon: "🏦", title: "Switzerland has Four National Languages", description: "German (63%), French (23%), Italian (8%), and Romansh (0.5%). The language depends on which region you're visiting!" },
  { id: "lf6", section: "facts", icon: "⏰", title: "Swiss Punctuality is Famous Worldwide", description: "Trains in Switzerland arrive on time 94% of the time! Swiss people are known for being very punctual in everything they do." },
  { id: "lf7", section: "facts", icon: "💰", title: "Switzerland is NOT in the EU", description: "Switzerland is independent and uses the Swiss Franc (CHF) instead of the Euro. They are famous for banking and precision manufacturing." },
  { id: "lf8", section: "facts", icon: "🐄", title: "There are More Sheep Than People", description: "Switzerland has about 8.7 million people but over 500,000 cows and many more sheep! Many farmers use traditional methods in the Alps." },

  // 🗣️ Learn Words
  { id: "lw1", section: "language", icon: "👋", title: "Hello & Goodbye", phrases: [
    { word: "Hallo", translation: "Hello", pronunciation: "HAH-lo" },
    { word: "Auf Wiedersehen", translation: "Goodbye", pronunciation: "OWF VEE-der-zay-en" },
    { word: "Guten Morgen", translation: "Good morning", pronunciation: "GOO-ten MOR-gen" },
    { word: "Gute Nacht", translation: "Good night", pronunciation: "GOO-teh NAHKT" },
  ]},
  { id: "lw2", section: "language", icon: "🙏", title: "Please & Thank You", phrases: [
    { word: "Bitte", translation: "Please", pronunciation: "BIT-teh" },
    { word: "Danke", translation: "Thank you", pronunciation: "DAHN-keh" },
    { word: "Vielen Dank", translation: "Thank you very much", pronunciation: "FEE-len DANK" },
    { word: "Gerne", translation: "You're welcome", pronunciation: "GER-neh" },
  ]},
  { id: "lw3", section: "language", icon: "🍔", title: "Food & Dining", phrases: [
    { word: "Ich hätte gerne...", translation: "I would like...", pronunciation: "Ikh HET-teh GER-neh" },
    { word: "Wasser", translation: "Water", pronunciation: "VASS-er" },
    { word: "Käse", translation: "Cheese", pronunciation: "KAY-zeh" },
    { word: "Schokolade", translation: "Chocolate", pronunciation: "Sho-ko-LAH-deh" },
  ]},
  { id: "lw4", section: "language", icon: "🗺️", title: "Getting Around", phrases: [
    { word: "Wo ist...?", translation: "Where is...?", pronunciation: "Vo ist" },
    { word: "Bahnhof", translation: "Train station", pronunciation: "BAHN-hof" },
    { word: "Rechts", translation: "Right", pronunciation: "REKT" },
    { word: "Links", translation: "Left", pronunciation: "LINKS" },
  ]},
  { id: "lw5", section: "language", icon: "❓", title: "Helpful Phrases", phrases: [
    { word: "Sprechen Sie Englisch?", translation: "Do you speak English?", pronunciation: "SHPREK-en zee ENG-lish" },
    { word: "Ich verstehe nicht", translation: "I don't understand", pronunciation: "Ikh fer-SHTAY-eh niht" },
    { word: "Wie viel kostet das?", translation: "How much does this cost?", pronunciation: "Vee FEEL KOS-tet dahs" },
    { word: "Hilfe!", translation: "Help!", pronunciation: "HIL-feh" },
  ]},

  // 🎭 Culture & Traditions
  { id: "lc1", section: "culture", icon: "🔔", title: "Alphorn & Mountain Culture", description: "The alphorn is a traditional Swiss instrument made of wood. It's used to call cattle in the mountains and is a symbol of Swiss Alpine culture." },
  { id: "lc2", section: "culture", icon: "🏘️", title: "Alpine Villages & Chalets", description: "Traditional Swiss chalets have steep roofs to handle heavy snow, and painted flowers on wooden balconies. Many villages have stayed the same for hundreds of years!" },
  { id: "lc3", section: "culture", icon: "🎪", title: "Yodeling Tradition", description: "Yodeling is a singing style where people rapidly change between low and high notes. It started in the Swiss Alps and is still performed at festivals!" },
  { id: "lc4", section: "culture", icon: "🕯️", title: "Fondue & Raclette", description: "Fondue (melted cheese with bread) and raclette (scraped cheese) are traditional Swiss meals. They're perfect for cold mountain days and bring families together!" },
  { id: "lc5", section: "culture", icon: "🏅", title: "Swiss Watchmaking", description: "Switzerland is famous for making precise watches. Swiss watchmakers have been perfecting their craft for over 300 years!" },

  // ⛰️ Mountains & Landmarks
  { id: "ll1", section: "landmarks", icon: "⛰️", title: "The Eiger (3,970m)", description: "One of the most famous mountains in the Alps. The North Face is nearly vertical (1,800m) and historically nicknamed the 'Mordwand' (Murder Wall) — one of the most dangerous climbs in the world. You'll see it up close from Kleine Scheidegg and Grindelwald village." },
  { id: "ll1b", section: "landmarks", icon: "⛰️", title: "The Mönch (4,107m)", description: "'The Monk' — sits between the Eiger and the Jungfrau. Local legend says the Mönch shields the Jungfrau (the Maiden) from the Eiger (the Ogre). A proper 4,000m peak, less dramatic in shape than its neighbours but just as tall." },
  { id: "ll2", section: "landmarks", icon: "⛰️", title: "The Matterhorn (4,478m)", description: "The most iconic mountain in Switzerland with a distinctive pyramid shape. It's visible from many places in the Valais region and is super recognizable!" },
  { id: "ll3", section: "landmarks", icon: "🏔️", title: "The Jungfrau (4,158m)", description: "'The Maiden' — the highest of the Big Three and the one your Jungfraujoch train is named after. The summit station (3,454m) sits on the saddle between Mönch and Jungfrau, not the actual peak. You can see across 40km on clear days!" },
  { id: "ll3b", section: "landmarks", icon: "🎭", title: "The Legend of the Big Three", description: "A fun story to tell the kids: the Eiger (the Ogre) tries to reach the Jungfrau (the Maiden), but the Mönch (the Monk) stands between them, protecting her. Look for all three lined up together from the Männlichen crown viewpoint!" },
  { id: "ll3c", section: "landmarks", icon: "🏔️", title: "The Wetterhorn (3,692m)", description: "Looms right over Grindelwald village itself — this is the peak Café 3692 is named after (its exact height in metres!). You'll see it from the village every single day of your trip." },
  { id: "ll3d", section: "landmarks", icon: "🏔️", title: "The Schreckhorn (4,078m)", description: "Visible from Bachalpsee and Grindelwald First — a proper 4,000m peak, less famous than the Big Three but equally dramatic, especially reflected in the lake." },
  { id: "ll3e", section: "landmarks", icon: "🎬", title: "The Schilthorn (2,970m)", description: "Where your Piz Gloria breakfast is! 360° views of 200 peaks including the Matterhorn on a clear day. From here you look back across the valley at the Eiger/Mönch/Jungfrau trio from a completely different angle than Männlichen." },
  { id: "ll4", section: "landmarks", icon: "💧", title: "Waterfalls of Lauterbrunnen", description: "There are 72 waterfalls in Lauterbrunnen Valley! The water comes from melting snow and glaciers high in the mountains. Staubbach Falls drops 300 meters!" },
  { id: "ll5", section: "landmarks", icon: "💎", title: "Aletsch Glacier", description: "Europe's longest glacier at 23 kilometers (14 miles) long and over 900 meters (3,000 feet) thick! It's fed by the ice fields around Mönch and Jungfrau, visible from Jungfraujoch, and is slowly melting." },

  // 🎉 Fun Facts for Kids
  { id: "lf9", section: "fun", icon: "🐄", title: "Cows Wear Bells!", description: "Swiss cows in the Alps wear big brass bells called 'Kuhglocken' so farmers can find them in the mountains. You might hear them jingling on your hike!" },
  { id: "lf10", section: "fun", icon: "🎪", title: "Cowherds Have Festivals", description: "In autumn, Swiss farmers bring cows down from the mountains in a festival called 'Almabtrieb' with decorated cows and celebrations!" },
  { id: "lf11", section: "fun", icon: "🚞", title: "Rack Railways Climb Super Steep Mountains", description: "Some trains in Switzerland have a special rack (like a ladder) under the tracks that helps them climb very steep mountains. The Jungfraubahn uses this system!" },
  { id: "lf12", section: "fun", icon: "🏔️", title: "Swiss Kids Do School Hikes", description: "In Switzerland, kids at school often do hiking trips. It's normal for 5 and 8-year-olds to hike in the mountains as part of school activities!" },
  { id: "lf13", section: "fun", icon: "⚽", title: "Famous Swiss Chocolatiers Were Inventors", description: "Did you know? Melting chocolate was invented by accident! A chocolatier named Rodolphe Lindt invented the 'conche' machine that created smooth chocolate." },
  { id: "lf14", section: "fun", icon: "🧀", title: "Cheese Can Have Holes Because of Bacteria", description: "The holes in Emmental cheese are made by gas bubbles from special bacteria. Bigger holes = older, tastier cheese!" },
  { id: "lf15", section: "fun", icon: "🚂", title: "Switzerland's First Railroad (1847)", description: "The first Swiss railroad opened in 1847. Now Switzerland has 5,000km of tracks - the densest railway network in the world!" },
  { id: "lf16", section: "fun", icon: "🏠", title: "Swiss Homes Have Shutters for a Reason", description: "Most Swiss houses have shutters to keep heat in during winter and heat out during summer. They're also beautiful decorations on the houses!" },
];

const TRANSPORT_TYPES = [
  { id: "all",   label: "All Routes",  emoji: "🗺️" },
  { id: "train", label: "Train",       emoji: "🚂" },
  { id: "cable", label: "Cable Car",   emoji: "🚡" },
  { id: "boat",  label: "Boat",        emoji: "⛵" },
  { id: "bus",   label: "Bus",         emoji: "🚌" },
];

const DEFAULT_TRANSPORT_ROUTES = [
  // 🚂 TRAINS
  { id: "t1",  type: "train", emoji: "🚂", from: "Grindelwald",        to: "Interlaken Ost",       duration: "55 min",    frequency: "Every 30 min",    priceFull: "CHF 16.20", priceHalf: "CHF 8.10",  provider: "BLS",                notes: "Change at Zweilütschinen (~10 min). Half Fare Card valid.", sbbUrl: "https://www.sbb.ch/en/buying/pages/fahrplan/fahrplan.xhtml?von=Grindelwald&nach=Interlaken+Ost" },
  { id: "t2",  type: "train", emoji: "🚂", from: "Grindelwald",        to: "Lauterbrunnen",        duration: "25 min",    frequency: "Every 30 min",    priceFull: "CHF 9.80",  priceHalf: "CHF 4.90",  provider: "BLS",                notes: "Change at Zweilütschinen (~10 min). Half Fare Card valid.", sbbUrl: "https://www.sbb.ch/en/buying/pages/fahrplan/fahrplan.xhtml?von=Grindelwald&nach=Lauterbrunnen" },
  { id: "t3",  type: "train", emoji: "🚂", from: "Lauterbrunnen",      to: "Wengen",               duration: "15 min",    frequency: "Every 30 min",    priceFull: "CHF 6.80",  priceHalf: "CHF 3.40",  provider: "Jungfrau Railways",  notes: "WAB rack railway. Wengen is car-free — train only access.", sbbUrl: "https://www.sbb.ch/en/buying/pages/fahrplan/fahrplan.xhtml?von=Lauterbrunnen&nach=Wengen" },
  { id: "t4",  type: "train", emoji: "🚂", from: "Wengen",             to: "Kleine Scheidegg",     duration: "30 min",    frequency: "Every 30 min",    priceFull: "CHF 14.60", priceHalf: "CHF 7.30",  provider: "Jungfrau Railways",  notes: "WAB rack railway with stunning Eiger north face views.", sbbUrl: "https://www.sbb.ch/en/buying/pages/fahrplan/fahrplan.xhtml?von=Wengen&nach=Kleine+Scheidegg" },
  { id: "t5",  type: "train", emoji: "🚞", from: "Grindelwald",   to: "Jungfraujoch (return)",         duration: "~50 min each way",    frequency: "Every 30 min",    priceFull: "CHF 239.20", priceHalf: "CHF 119.60", provider: "Jungfrau Railways",  notes: "50% off with Half Fare Card. Kids FREE with Family Card. Book at swissrailways.com (Flex Cancellation). Seat reservation mandatory May-Oct (CHF 10/person at jungfrau.ch). Via Eiger Express gondola + Jungfraubahn cogwheel.", sbbUrl: "https://www.swissrailways.com/en/buy-jungfraujoch-ticket" },
  { id: "t6",  type: "train", emoji: "🚂", from: "Grütschalp",         to: "Mürren",               duration: "25 min",    frequency: "Every 30 min",    priceFull: "CHF 8.40",  priceHalf: "CHF 4.20",  provider: "Jungfrau Railways",  notes: "Connects from Lauterbrunnen cable car. Charming little valley train.", sbbUrl: "https://www.sbb.ch/en/buying/pages/fahrplan/fahrplan.xhtml?von=Lauterbrunnen&nach=M%C3%BCrren" },
  { id: "t7",  type: "train", emoji: "🚂", from: "Interlaken Ost",     to: "Brienz",               duration: "20 min",    frequency: "Every 60 min",    priceFull: "CHF 10.60", priceHalf: "CHF 5.30",  provider: "BLS",                notes: "Direct train along the south shore of Lake Brienz.", sbbUrl: "https://www.sbb.ch/en/buying/pages/fahrplan/fahrplan.xhtml?von=Interlaken+Ost&nach=Brienz" },
  { id: "t8",  type: "train", emoji: "🚂", from: "Grindelwald",        to: "Zurich HB",            duration: "2h 40min",  frequency: "Every 60 min",    priceFull: "CHF 68.00", priceHalf: "CHF 34.00", provider: "SBB / BLS",          notes: "Via Interlaken Ost → Bern → Zurich. Allow extra time with luggage.", sbbUrl: "https://www.sbb.ch/en/buying/pages/fahrplan/fahrplan.xhtml?von=Grindelwald&nach=Z%C3%BCrich+HB" },
  { id: "t9",  type: "train", emoji: "🚂", from: "Zurich HB",          to: "Zurich Airport",       duration: "10 min",    frequency: "Every 10 min",    priceFull: "CHF 6.90",  priceHalf: "CHF 3.45",  provider: "SBB",                notes: "Direct S-Bahn. Station is directly under Terminal 1.", sbbUrl: "https://www.sbb.ch/en/buying/pages/fahrplan/fahrplan.xhtml?von=Z%C3%BCrich+HB&nach=Flughafen+Z%C3%BCrich" },
  // 🚡 CABLE CARS & GONDOLAS
  { id: "t10", type: "cable", emoji: "🚡", from: "Grindelwald Terminal", to: "Männlichen",          duration: "19 min",    frequency: "Continuous",      priceFull: "CHF 34.00", priceHalf: "CHF 17.00", provider: "Jungfrau Railways",  notes: "World's longest 3S gondola. Book at jungfrau.ch.", sbbUrl: "https://www.jungfrau.ch/en-gb/maennlichen/" },
  { id: "t11", type: "cable", emoji: "🚠", from: "Grindelwald Terminal", to: "First",               duration: "20 min",    frequency: "Continuous",      priceFull: "CHF 32.00", priceHalf: "CHF 16.00", provider: "Jungfrau Railways",  notes: "Firstbahn gondola. Cliff Walk, playground & Bachalpsee lake at top.", sbbUrl: "https://www.jungfrau.ch/en-gb/first/" },
  { id: "t12", type: "cable", emoji: "🚠", from: "Lauterbrunnen",      to: "Grütschalp",           duration: "5 min",     frequency: "Every 30 min",    priceFull: "CHF 8.40",  priceHalf: "CHF 4.20",  provider: "Jungfrau Railways",  notes: "Cross the valley. Then take the train to Mürren. Half Fare valid.", sbbUrl: "https://www.sbb.ch/en/buying/pages/fahrplan/fahrplan.xhtml?von=Lauterbrunnen&nach=M%C3%BCrren" },
  { id: "t13", type: "cable", emoji: "🚠", from: "Mürren",             to: "Schilthorn (Piz Gloria)", duration: "20 min", frequency: "Every 30 min",    priceFull: "CHF 64.00", priceHalf: "CHF 32.00", provider: "Schilthorn AG",      notes: "James Bond revolving restaurant at top. Book lunch in advance.", sbbUrl: "https://www.schilthorn.ch/en/travel-information/timetable-fares" },
  { id: "t14", type: "cable", emoji: "🚡", from: "Interlaken West",    to: "Harder Kulm",          duration: "8 min",     frequency: "Every 30 min",    priceFull: "CHF 14.00", priceHalf: "CHF 7.00",  provider: "Jungfrau Railways",  notes: "Two Lakes Bridge viewpoint at top. Spectacular sunset spot.", sbbUrl: "https://www.jungfrau.ch/en-gb/harder-kulm/" },
  // ⛵ BOATS
  { id: "t15", type: "boat",  emoji: "⛵", from: "Interlaken Ost",     to: "Brienz (steamer)",     duration: "60 min",    frequency: "2–3× daily",      priceFull: "CHF 22.40", priceHalf: "CHF 11.20", provider: "BLS Steamer",        notes: "Historic paddle steamer on turquoise Lake Brienz. Sit on upper deck.", sbbUrl: "https://www.bls.ch/en/rail/offers/ships" },
  { id: "t16", type: "boat",  emoji: "🚟", from: "Brienz (lakeside)",  to: "Giessbach Falls",      duration: "5 min",     frequency: "On demand",       priceFull: "CHF 5.00",  priceHalf: "CHF 5.00",  provider: "Grand Hotel Giessbach", notes: "World's oldest hotel funicular (1879). Runs to Giessbach Falls.", sbbUrl: "https://www.giessbach.ch/en/funicular" },
  // 🚌 BUS
  { id: "t17", type: "bus",   emoji: "🚌", from: "Lauterbrunnen",      to: "Stechelberg",          duration: "20 min",    frequency: "Every 30 min",    priceFull: "CHF 4.60",  priceHalf: "CHF 2.30",  provider: "PostBus",            notes: "Flat valley road past all the waterfalls. Stop at Trümmelbach.", sbbUrl: "https://www.sbb.ch/en/buying/pages/fahrplan/fahrplan.xhtml?von=Lauterbrunnen&nach=Stechelberg" },
];

// ─── MAP ROUTE POLYLINES ───────────────────────────────────────────────────
// Colours: Red=train, Orange=rack railway, Blue=cable/gondola, Navy=boat, Green=funicular, Amber=bus
// Dashed lines = aerial/cable, solid = ground transport
const ROUTE_LINES = [
  // 🚂 BLS Regular Trains — solid red
  { id: "rl1",  label: "Grindelwald → Interlaken Ost",      color: "#e11d48", weight: 3.5, dashArray: null,
    coords: [[46.6243, 8.0383], [46.6179, 7.9890], [46.6909, 7.8691]] },
  { id: "rl2",  label: "Grindelwald → Lauterbrunnen",        color: "#e11d48", weight: 3.5, dashArray: null,
    coords: [[46.6243, 8.0383], [46.6179, 7.9890], [46.5937, 7.9094]] },
  { id: "rl7",  label: "Interlaken Ost → Brienz (train)",    color: "#e11d48", weight: 3.5, dashArray: null,
    coords: [[46.6909, 7.8691], [46.7050, 7.9150], [46.7480, 7.9878]] },
  // 🚞 Rack Railways — solid orange
  { id: "rl3",  label: "Lauterbrunnen → Wengen",             color: "#ea580c", weight: 3.5, dashArray: null,
    coords: [[46.5937, 7.9094], [46.6066, 7.9204]] },
  { id: "rl4",  label: "Wengen → Kleine Scheidegg",          color: "#ea580c", weight: 3.5, dashArray: null,
    coords: [[46.6066, 7.9204], [46.5854, 7.9603]] },
  { id: "rl5",  label: "Kleine Scheidegg → Jungfraujoch",    color: "#ea580c", weight: 3.5, dashArray: null,
    coords: [[46.5854, 7.9603], [46.5473, 7.9854]] },
  { id: "rl9",  label: "Grütschalp → Mürren",                color: "#ea580c", weight: 3.5, dashArray: null,
    coords: [[46.6031, 7.8850], [46.5592, 7.8928]] },
  // 🚡 Cable Cars & Gondolas — dashed blue
  { id: "rl6",  label: "Grindelwald → Männlichen (gondola)",  color: "#2563eb", weight: 3, dashArray: "8 5",
    coords: [[46.6237, 8.0393], [46.6180, 7.9483]] },
  { id: "rl11", label: "Grindelwald → First (gondola)",       color: "#2563eb", weight: 3, dashArray: "8 5",
    coords: [[46.6237, 8.0393], [46.6589, 8.0542]] },
  { id: "rl8",  label: "Lauterbrunnen → Grütschalp",          color: "#2563eb", weight: 3, dashArray: "8 5",
    coords: [[46.5937, 7.9055], [46.6031, 7.8850]] },
  { id: "rl10", label: "Mürren → Schilthorn",                 color: "#2563eb", weight: 3, dashArray: "8 5",
    coords: [[46.5592, 7.8928], [46.5582, 7.8342]] },
  { id: "rl12", label: "Interlaken → Harder Kulm",            color: "#2563eb", weight: 3, dashArray: "8 5",
    coords: [[46.6882, 7.8726], [46.6981, 7.8594]] },
  // ⛵ Boat — solid navy (follows lake surface)
  { id: "rl13", label: "Lake Brienz Steamer",                 color: "#1e3a8a", weight: 3.5, dashArray: null,
    coords: [[46.6875, 7.8730], [46.7020, 7.9000], [46.7180, 7.9300], [46.7340, 7.9580], [46.7480, 7.9878]] },
  // 🚟 Funicular — dashed green
  { id: "rl14", label: "Brienz → Giessbach Funicular",        color: "#16a34a", weight: 3, dashArray: "5 5",
    coords: [[46.7475, 7.9876], [46.7178, 7.9844]] },
  // 🚌 Bus — solid amber
  { id: "rl15", label: "Lauterbrunnen → Stechelberg (bus)",   color: "#d97706", weight: 3.5, dashArray: null,
    coords: [[46.5937, 7.9094], [46.5717, 7.9114], [46.5441, 7.8984]] },
];

const DEFAULT_BUDGET = {
  currency: "CHF",
  income: [],
  expenses: [
    { id: "e_section", category: "✅ KNOWN / FIXED COSTS", label: "→→→", amount: null, notes: "Definite expenses booked or confirmed" },
    { id: "e1", category: "Flights", label: "Dublin ↔ Zurich (2x adults + 2x kids)", amount: 0, notes: "Already paid" },
    { id: "e2", category: "Accommodation", label: "GrindelwaldHome Alpenglück (6 nights)", amount: 900, notes: "~CHF 150/night | ~£74/night | CONFIRMED" },
    { id: "e3", category: "Accommodation", label: "Holiday Inn Express Zurich (1 night)", amount: 140, notes: "~CHF 140 | ~£115 | CONFIRMED" },
    { id: "e4a", category: "Transport", label: "Half Fare Cards (2x adults) + Family Cards (kids free)", amount: 263, notes: "✅ PURCHASED £263.43 via GetYourGuide app (code THETRAVELINGSWISS5). Free cancellation until 21 Aug. All 4 cards in Google Wallet. Kids travel FREE with Family Card." },
    { id: "e_section2", category: "💭 ESTIMATED COSTS", label: "→→→", amount: null, notes: "Activity & dining estimates (flexible)" },
    { id: "e4b", category: "Transport", label: "Regional trains & buses", amount: 300, notes: "Top-ups beyond Half Fare (PostBus, transfers) | ~£246" },
    { id: "e4c", category: "Transport", label: "Gondolas & cable cars", amount: 700, notes: "First, Männlichen, Lake Brienz, Harder Kulm | ~£574" },
    { id: "e4d", category: "Transport", label: "Bike rental (few hours)", amount: 100, notes: "Lauterbrunnen valley day | ~£82" },
    { id: "e5a", category: "Activities", label: "Jungfraujoch tickets (2 adults)", amount: 224, notes: "£224 via swissrailways.com (CHF 119.60/adult × 2 with Half Fare Card) | Kids FREE with Family Card — do NOT add children to ticket | Flex Cancellation option — free cancel 24hrs before if weather bad" },
    { id: "e5a2", category: "Activities", label: "Jungfraujoch seat reservations (4 people)", amount: 40, notes: "CHF 10/person × 4 = CHF 40 (~£33) | Book separately at jungfrau.ch | Mandatory May-Oct | Can reschedule up to 45 mins before | Select 08:46 departure, 4.5h stay" },
    { id: "e5a3", category: "Activities", label: "Jungfraujoch Snow Fun Park (sledding & tubing)", amount: 70, notes: "CHF 20/adult × 2 + CHF 15/child × 2 = CHF 70 (~£57) | Opens 11:00, closes 16:30 | Equipment included, NO clothing rental | Pay on the day, first come first served" },
    { id: "e5b", category: "Activities", label: "Piz Gloria lunch + Bond museum (2 adults)", amount: 150, notes: "~CHF 30–35/adult + CHF 15–20/museum | ~£123 | Kids FREE with Family Card (confirmed on official swissrailways.com) | BOOK RESTAURANT ASAP" },
    { id: "e5c", category: "Activities", label: "Lake Brienz/Giessbach + Harder Kulm", amount: 180, notes: "Boat, funicular, sunset viewing | ~£148" },
    { id: "e5d", category: "Activities", label: "Misc activities (Pfingstegg, etc.)", amount: 100, notes: "Toboggans, playgrounds, optional attractions | ~£82" },
    { id: "e6", category: "Food & Drink", label: "Meals, coffee & snacks (9 days, 4 people)", amount: 3300, notes: "~CHF 370/day: breakfast ~CHF 60, lunch ~CHF 100, dinner ~CHF 160, snacks ~CHF 50 | ~£2,706" },
    { id: "e7", category: "Misc", label: "Souvenirs, gifts & emergency buffer", amount: 500, notes: "Wood carvings, Swiss chocolate, sweets, emergency fund | ~£410" },
  ],
  notes: "📋 PREP CHECKLIST (Do before you go):\n✅ DONE — Half Fare Cards + Family Cards purchased (£263.43) — all 4 in Google Wallet\n✅ Book Jungfraujoch tickets at swissrailways.com (Flex Cancellation option — free cancel 24hrs before if weather bad). Seat reservations separately at jungfrau.ch (CHF 10/person, mandatory May-Oct)\n✅ Download SBB app — select 'Half Fare Travelcard' discount. Show Google Wallet to conductor.\n✅ Buy Airalo eSIM for Switzerland — Andrew & Ashleigh (Pixel 10). 3GB/30 day ~£8-10 each. Install before flying, activate on arrival. Dual SIM: Airalo for data, Smarty for calls.\n✅ Book Piz Gloria lunch at schilthorn.ch (Wed 26 Aug, 10:00/10:30am) — fills up weeks ahead\n✅ Contact GrindelwaldHome Alpenglück re: luggage access & grocery pre-stock option\n✅ Arrange Dublin airport car parking (return parking QR code)\n✅ Check weather forecast 1 week before (plan D7 backup if needed)\n✅ Confirm flight booking refs: YMKW98 (outbound) / 2TLA5F (return)\n\n💰 TRAIN TICKET STRATEGY:\n• Buy ALL tickets point-to-point in SBB app with Half Fare Card (50% off)\n• Saver Day Passes NOT worth it for Aug 2026 dates (cheapest available is CHF 49-54, more than point-to-point)\n• Jungfraujoch: CHF 119.60/adult return (50% off), kids FREE. Book via swissrailways.com, weather dependent\n• Kids travel FREE everywhere with Family Card when accompanied by parent\n• Bring passport on trains — required with Half Fare Card",
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
  { id: "p_c1",  categoryId: "cat_clothing", text: "Hiking boots (broken in) — wear on travel day to save suitcase space", checked: false },
  { id: "p_c2",  categoryId: "cat_clothing", text: "Rain jacket / waterproof layer (doubles as windbreaker, extra layer, and picnic blanket)", checked: false },
  { id: "p_c3",  categoryId: "cat_clothing", text: "Warm fleece / mid layer", checked: false },
  { id: "p_c3b", categoryId: "cat_clothing", text: "Merino wool undershirts (can wear multiple times, great base layer for cold mountain days)", checked: false },
  { id: "p_c4",  categoryId: "cat_clothing", text: "T-shirts (5+)", checked: false },
  { id: "p_c5",  categoryId: "cat_clothing", text: "Shorts / trousers", checked: false },
  { id: "p_c6",  categoryId: "cat_clothing", text: "Waterproof trousers (ESSENTIAL for Jungfraujoch Snow Fun Park — no clothing rental available)", checked: false },
  { id: "p_c7",  categoryId: "cat_clothing", text: "Warm hat & gloves for all 4 (ESSENTIAL for Jungfraujoch — 0°C to -5°C even in August)", checked: false },
  { id: "p_c7b", categoryId: "cat_clothing", text: "Buff / neck gaiter for each person (scarf, headband, hat, sun shield — one item, many uses)", checked: false },
  { id: "p_c8",  categoryId: "cat_clothing", text: "Comfortable walking shoes (+ sandals optional)", checked: false },
  { id: "p_c9",  categoryId: "cat_clothing", text: "Swimwear (Sportzentrum pool, Lake Thun)", checked: false },
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
  { id: "p_m2", categoryId: "cat_misc", text: "Packing cubes (keep clothes organised, fit way more in your suitcase)", checked: false },
  { id: "p_m3", categoryId: "cat_misc", text: "Reusable shopping bags (bags cost 5-10 cents at Coop/Migros)", checked: false },
  { id: "p_m4", categoryId: "cat_misc", text: "Travel umbrella", checked: false },
  { id: "p_m5", categoryId: "cat_misc", text: "Laundry detergent sheets (lightweight, hand-wash in sink, no translation needed)", checked: false },
  { id: "p_m6", categoryId: "cat_misc", text: "Collapsible containers + chip clips (for picnic food — Landjäger, cheese, bread)", checked: false },
  { id: "p_m7", categoryId: "cat_misc", text: "Spare change of clothes for kids in day bag (for Bort stream play & rainy weather)", checked: false },
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
  d3: "Grindelwald",
  d4: "Grindelwald",
  d5: "Lauterbrunnen",
  d6: "Lauterbrunnen",
  d7: "Interlaken",
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
  { id: "v29", name: "Ischboden Hütte ⭐ Host Pick",    type: "restaurant", location: "Grindelwald",    meals: ["lunch"],                                  rating: 4.9, notes: "Myriam's recommendation! Mountain hut with farm-to-table food from their own farm. Famous for homemade fruit pies, Spätzle, milkshakes, and a drink called 'Rote Nase'. Cosy interior + epic terrace with valley views. Alpvogelpark (bird park with owls) right next door — kids will love it. CHF 10–20pp. Bus 121 to end of line, then 30 min gentle walk uphill. Open Wed–Sun 10am–5pm only. Perfect for flex day or afternoon outing." },
  { id: "v31", name: "Café 3692 ⭐ Host Pick",           type: "cafe",       location: "Grindelwald",    meals: ["breakfast", "lunch", "dinner", "coffee"], rating: 4.8, notes: "Myriam's recommendation! #7 of 74 restaurants in Grindelwald. Named after the 3,692m Wetterhorn which you look directly at from the 180° panorama terrace. 💍 Sweet history: Bruno and Myriam used to run the Glecksteinhütte mountain hut together — Bruno proposed to Myriam on the actual summit of the Wetterhorn, which is why the café is named after its exact height! Bruno is a wood artist and built the whole interior himself — the café doubles as a showroom for his handcrafted carpentry. Mining cart from the Jungfrau tunnel construction doubles as an outdoor BBQ on sunny days! Must-try: Käse Täschli (cheese toast), Rösti with salmon, incredible homemade cakes (blueberry crumble, raspberry cheesecake). Has a kids area inside. Terrassenweg 61, uphill walk from village or short bus. Open Fri–Sun ONLY (Fri/Sat 8:30am–11pm, Sun 8:30am–6pm). Book ahead!" },
  // Grindelwald — Cafés & Breakfast
  { id: "v2",  name: "Café Bar 3692",                    type: "cafe",       location: "Grindelwald",    meals: ["coffee", "lunch"],                        notes: "Artistic interior made from local materials. Garden herbs and locally sourced ingredients. Glacier and mountain views." },
  { id: "v2b", name: "Eiger Bean ☕ Specialty Roaster",   type: "cafe",       location: "Grindelwald",    meals: ["breakfast", "coffee"],                    rating: 4.5, notes: "Specialty coffee roaster in Grindelwald — Marco roasts beans in-house. Best coffee with direct Eiger views. Must-try: Mountain cappuccino, cold brew with Swiss tonic water, coffee bonbon (sweet espresso dessert with condensed milk — even non-coffee drinkers love this!). For kids: baby chinos. For non-coffee lovers: cascara (coffee cherry tea — caffeine without coffee taste). Only uses local Swiss cow's milk and oat milk. Light modern roasts, not your typical Swiss coffee." },
  { id: "v3",  name: "Bäckerei Fuchs",                   type: "bakery",     location: "Grindelwald",    meals: ["breakfast", "coffee"],                    notes: "Local bakery — perfect for fresh bread and pastries in the morning." },
  { id: "v29", name: "C & M Café Bar Restaurant",        type: "cafe",       location: "Grindelwald",    meals: ["coffee", "lunch"],                        rating: 4.6, notes: "Popular café in the centre of Grindelwald. Beautiful cakes, pastries and excellent hot chocolate. Cosy alpine atmosphere. Perfect stop after exploring the village." },
  // Grindelwald — Mountain Restaurants
  { id: "v11", name: "Restaurant Onkel Tom's Hütte",     type: "restaurant", location: "Grindelwald",    meals: ["lunch", "dinner"],                        notes: "Classic mountain hut restaurant. Traditional Swiss cuisine, popular with locals and hikers on the valley floor." },
  { id: "v12", name: "Berggasthaus First",               type: "restaurant", location: "Grindelwald First", meals: ["lunch"],                                  rating: 4.5, notes: "Right at the First gondola summit. Rösti, fondue, bratwurst with sweeping Eiger and Wetterhorn views. Huge terrace with glacier views. Next to the Cliff Walk." },
  { id: "v12b", name: "Bort Restaurant",                 type: "restaurant", location: "Bort",            meals: ["lunch"],                                  rating: 4.3, notes: "Great stop on the way down from First. Mountain views, playground for kids, family-friendly." },
  { id: "v25", name: "Berghaus Männlichen",              type: "restaurant", location: "Männlichen",     meals: ["lunch"],                                  rating: 4.5, notes: "Right beside the Männlichen gondola station with one of the best terraces in the Jungfrau region. Views of Eiger, Mönch and Jungfrau. Great spot for lunch before the Royal Walk. Rösti, soup, kids' plates." },
  { id: "v26", name: "Restaurant Kleine Scheidegg",      type: "restaurant", location: "Kleine Scheidegg", meals: ["lunch"],                                  rating: 4.6, notes: "Iconic mountain lunch stop with the Eiger north face right in front of you. Rösti and soup are the locals' choice. Unmissable photo backdrop — rack railway on one side, Eiger on the other." },
  { id: "v30", name: "Bergrestaurant Pfingstegg",        type: "restaurant", location: "Pfingstegg",      meals: ["lunch"],                                  rating: 4.4, notes: "Mountain restaurant above Grindelwald beside the Pfingstegg alpine coaster. Fantastic valley views from the terrace. Great snack and lunch stop — worth combining with the toboggan run." },
  // Lauterbrunnen
  { id: "v4",  name: "Airtime Café",                     type: "cafe",       location: "Lauterbrunnen", meals: ["breakfast", "coffee", "lunch"],            notes: "Terrace overlooking Staubbach Falls. Famous for cinnamon rolls — perfect refuel after hiking." },
  { id: "v5",  name: "Hotel Oberland Restaurant",        type: "restaurant", location: "Lauterbrunnen", meals: ["lunch", "dinner"],                        rating: 4.5, notes: "Well-known restaurant in Lauterbrunnen famous for Swiss fondue and its terrace overlooking the waterfall valley. Cosy chalet ambience, Oberland Rösti, and rahmschnitzel. Reservations recommended for dinner." },
  { id: "v13", name: "Restaurant Steinbock",             type: "restaurant", location: "Lauterbrunnen", meals: ["lunch", "dinner"],                        notes: "Near the train station with a summer garden. 20 pizza varieties plus Swiss classics." },
  { id: "v14", name: "Restaurant Weidstübli",            type: "restaurant", location: "Lauterbrunnen", meals: ["lunch", "dinner"],                        notes: "Inside the campground near the falls. Very affordable, generous portions, excellent fondue." },
  // Gimmelwald
  { id: "v31", name: "Mountain Hostel Restaurant",       type: "cafe",       location: "Gimmelwald",    meals: ["coffee", "lunch"],                        rating: 4.6, notes: "Relaxed mountain café in the magical car-free village of Gimmelwald with breathtaking views across the Lauterbrunnen valley. Simple pizzas, snacks and drinks. Reach via cable car from Stechelberg." },
  // Wengen
  { id: "v6",  name: "Restaurant Eiger",                 type: "restaurant", location: "Wengen",        meals: ["lunch", "dinner"],                        rating: 4.4, notes: "Right outside Wengen train station. Rösti, raclette, tomato soup with gin. Highly rated." },
  { id: "v6b", name: "Hotel Bellevue Terrace",           type: "cafe",       location: "Wengen",        meals: ["coffee", "lunch"],                        rating: 4.6, notes: "One of the finest terrace views in Switzerland. Direct Jungfrau views from the seating. Perfect for coffee or cake with the big peaks behind you." },
  { id: "v15", name: "Hotel Bären Restaurant",           type: "restaurant", location: "Wengen",        meals: ["lunch", "dinner"],                        notes: "Family-run, 5 min downhill from station. Large terrace, great views, own vegetable garden." },
  { id: "v16", name: "Café Restaurant Waldschlucht",     type: "cafe",       location: "Wengen",        meals: ["breakfast", "coffee", "lunch"],            notes: "Warm and welcoming. Known for flavourful soups and cosy ambiance. Great after a hike." },
  // Interlaken
  { id: "v7",  name: "Grand Café Schuh",                 type: "cafe",       location: "Interlaken",    meals: ["breakfast", "coffee", "lunch"],            rating: 4.6, notes: "Iconic Interlaken patisserie & café since 1818 — over 200 years old, older than the first ascent of the Eiger. Famous for chocolate fondue with strawberries — arguably the best in the region. Mountain views from the terrace. A special treat for the kids." },
  { id: "v7b", name: "Aare Café",                        type: "cafe",       location: "Interlaken",    meals: ["breakfast", "coffee", "lunch"],            rating: 4.4, notes: "Relaxed café beside the Aare river walk. Perfect stop for a quiet coffee or lunch away from the busy main street. Great for families." },
  { id: "v17", name: "Velo Café",                        type: "cafe",       location: "Interlaken",    meals: ["breakfast", "coffee", "lunch"],            notes: "Trendy local favourite. Italian espresso, homemade granola with local yogurt, popular vegan options." },
  { id: "v18", name: "Bäckerei Steininger",              type: "bakery",     location: "Interlaken",    meals: ["breakfast", "coffee"],                    notes: "Fresh-baked daily. Excellent quiche and pastries. Short walk from central Interlaken." },
  { id: "v8",  name: "Restaurant Taverne",               type: "restaurant", location: "Interlaken",    meals: ["lunch", "dinner"],                        notes: "Authentic Swiss fondue and traditional cuisine in a classic Bernese Oberland setting." },
  { id: "v32", name: "Bebbis Restaurant",                type: "restaurant", location: "Interlaken",    meals: ["lunch", "dinner"],                        rating: 4.3, notes: "Large lively restaurant on Interlaken's Höheweg. Huge menu — burgers, fondue, Swiss classics. Central location beside the Höhematte park. Good for groups and families." },
  { id: "v33", name: "V Café ☕",                        type: "cafe",       location: "Interlaken",    meals: ["breakfast", "lunch", "coffee"],            rating: 4.7, notes: "Italian espresso done properly — fully manual process. Bike-themed décor, tucked away on a side street. Must-try: carrot cake (owner Rob's mum's recipe — legendary!), breakfast burrito (most popular item), halloumi breakfast sandwich with spicy mayo. Cold brew available. Locals + tourists. Perfect Interlaken morning stop." },
  { id: "v34", name: "Aarberg Hotel & Café ☕",          type: "cafe",       location: "Unterseen",     meals: ["breakfast", "lunch", "coffee"],            rating: 4.6, notes: "150-year-old building with riverside terrace and mountain views in Unterseen (5 min walk from Interlaken). Everything made from scratch. Must-try: eggs benedict, French toast, the brookie (brownie-cookie hybrid). For non-coffee drinkers: Apfelschorle (carbonated apple juice — very Swiss). Perfect Sunday brunch vibes. 11 staff from 10 nationalities. Paragliders land nearby and join you for coffee!" },
  { id: "v35", name: "Spatz 🍷 Evening Aperitivo",      type: "restaurant", location: "Unterseen",     meals: ["lunch", "dinner", "coffee"],               rating: 4.7, notes: "Italian-inspired café/bar right on the river in Unterseen. Owner Yan drives to Italy to source ingredients. Must-try: homemade focaccia with mortadella (baked fresh daily — incredible), meat & cheese aperitivo platter, small-production Swiss wines you can't get elsewhere. Perfect for a special evening aperitivo — focaccia, wine, river terrace at sunset. Also does great morning cappuccinos." },
  // Zurich
  { id: "v9",  name: "Café Sprüngli",                    type: "cafe",       location: "Zurich",        meals: ["breakfast", "coffee", "lunch"],            notes: "On Paradeplatz since 1836 — nearly 200 years on the same square, one of Zurich's most historic addresses. World-famous for Luxemburgerli macarons and Swiss chocolate. Essential Zurich stop." },
  { id: "v10", name: "Zeughauskeller",                   type: "restaurant", location: "Zurich",        meals: ["lunch", "dinner", "drinks"],              notes: "Historic beer hall inside a genuine 15th-century armoury on Bahnhofstrasse — you're drinking beer in a building that once stored weapons for the city. Rösti, Wiener Schnitzel, giant beers." },
  { id: "v19", name: "Kronenhalle",                      type: "restaurant", location: "Zurich",        meals: ["lunch", "dinner"],                        notes: "Legendary brasserie open since 1924. Walls hung with ORIGINAL artworks by Miró and Chagall — not prints, the real pieces, donated over the decades by artist regulars. Signature Zürcher Geschnetzeltes." },
  { id: "v20", name: "Boréal Coffee",                    type: "cafe",       location: "Zurich",        meals: ["breakfast", "coffee"],                    notes: "Specialty ethically-sourced coffee and pastries. Popular with locals — two Zurich locations." },
  // Special Experiences
  { id: "v33", name: "Piz Gloria Revolving Restaurant",  type: "restaurant", location: "Schilthorn",    meals: ["breakfast", "lunch", "dinner"],            rating: 4.5, notes: "🔫 Built as the real filming location for James Bond's On Her Majesty's Secret Service (1969) — the revolving restaurant concept was genuinely novel for its time. Full 360° rotation every hour. Schilthorn revolving restaurant at 2,970m with views of 200+ peaks. Must book ahead in summer." },
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
  // 📸 PHOTO SPOTS
  { id: "mp64", cat: "photo", emoji: "📸", name: "Bachalpsee Reflection",          location: "Grindelwald First",    lat: 46.6724, lng: 8.0591,  refImage: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Bachalpsee_-_panoramio.jpg/800px-Bachalpsee_-_panoramio.jpg&w=400",  mission: "Capture the perfect mountain reflection",            notes: "Arrive early morning for calm water — Wetterhorn & Schreckhorn reflect perfectly. Walk ~3km from First gondola. Best light before 10am." },
  { id: "mp65", cat: "photo", emoji: "📸", name: "Männlichen Panorama Crown",      location: "Männlichen",           lat: 46.6234, lng: 8.0043,  refImage: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Jungfrau_panorama_from_Mannlichen_%2810955538175%29.jpg/800px-Jungfrau_panorama_from_Mannlichen_%2810955538175%29.jpg&w=400",  mission: "All 3 giants: Eiger, Mönch & Jungfrau in one frame", notes: "The crown viewpoint gives you the classic 3-summit panorama. Go wide angle. Best light in early morning or late afternoon golden hour." },
  { id: "mp66", cat: "photo", emoji: "📸", name: "Kleine Scheidegg Platform",      location: "Kleine Scheidegg",     lat: 46.5854, lng: 7.9601,  refImage: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Interlaken01.JPG/800px-Interlaken01.JPG&w=400",  mission: "Eiger north face with rack railway in foreground",   notes: "Stand on the platform side — the rack railway curves in front of the vertical Eiger face. One of the most iconic alpine compositions in Switzerland." },
  { id: "mp67", cat: "photo", emoji: "📸", name: "Lauterbrunnen Valley Overlook",  location: "Lauterbrunnen",        lat: 46.5937, lng: 7.9091,  refImage: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/44/Lauterbrunnen_-_Switzerland.JPG/800px-Lauterbrunnen_-_Switzerland.JPG&w=400",  mission: "Valley walls with 72 waterfalls pouring down",       notes: "Stand on the valley road and look up — sheer 300m cliffs with waterfalls cascading on both sides. Portrait orientation works best here." },
  { id: "mp68", cat: "photo", emoji: "📸", name: "Iseltwald Pier",                 location: "Lake Brienz",          lat: 46.7142, lng: 7.9943,  refImage: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/3a/5506_-_Iseltwald_-_Brienzersee.JPG/800px-5506_-_Iseltwald_-_Brienzersee.JPG&w=400",  mission: "The Netflix pier over turquoise Lake Brienz",        notes: "Famous from Squid Game. The wooden pier extends over the impossibly blue-green water. Go early to avoid queues — it's become very popular. Short walk from Iseltwald village." },
  { id: "mp69", cat: "photo", emoji: "📸", name: "Sphinx Observatory",             location: "Jungfraujoch",         lat: 46.5473, lng: 7.9854,  refImage: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Jungfraubahn_-_Top_of_Europe_-_3.454m_Jungfraujoch.JPG/800px-Jungfraubahn_-_Top_of_Europe_-_3.454m_Jungfraujoch.JPG&w=400",  mission: "Highest photo op in Europe — Aletsch Glacier below", notes: "Take the lift to the Sphinx platform at 3,571m. The Aletsch Glacier stretches 23km below you. Clear days only — check forecast the morning before." },
  { id: "mp70", cat: "photo", emoji: "📸", name: "Mürren Cliff Terrace",           location: "Mürren",               lat: 46.5592, lng: 7.8928,  refImage: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/c/c4/4869_P_M%C3%BCrren.JPG/800px-4869_P_M%C3%BCrren.JPG&w=400",  mission: "Entire Lauterbrunnen valley spread below the cliff", notes: "Find the terrace on the Mürren cliff edge — the valley drops away 800m straight below. Get the village chalets in the foreground with the valley behind." },
  { id: "mp71", cat: "photo", emoji: "📸", name: "Grindelwald Village Eiger Shot", location: "Grindelwald",          lat: 46.6237, lng: 8.0411,  refImage: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/b/b5/5344_-_Grindelwald_-_Mettenberg%2C_Eiger%2C_Unterer_Grindelwaldgletscher.JPG/800px-5344_-_Grindelwald_-_Mettenberg%2C_Eiger%2C_Unterer_Grindelwaldgletscher.JPG&w=400",  mission: "Eiger rising above the alpine village rooftops",     notes: "Walk to the church area on the main street — the Eiger north face rises directly behind the classic village rooftops and Alpine chalets. Magic at dusk." },
  { id: "mp72", cat: "photo", emoji: "📸", name: "First Cliff Walk Platform",      location: "Grindelwald First",    lat: 46.6587, lng: 8.0506,  refImage: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/5/5f/00_4498_Gondelbahn_Grindelwald_-_First.jpg/800px-00_4498_Gondelbahn_Grindelwald_-_First.jpg&w=400",  mission: "Selfie on the suspended walkway with drop below",    notes: "The glass-floored section of the cliff walk is the money shot. Look down through the glass platform for a truly vertiginous perspective. Get someone to photograph you from the side." },
  { id: "mp73", cat: "photo", emoji: "📸", name: "Giessbach Falls & Funicular",    location: "Brienz",               lat: 46.7178, lng: 7.9844,  refImage: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/2/21/Hotel_Giessbach.JPG/800px-Hotel_Giessbach.JPG&w=400",  mission: "Historic Belle Époque funicular with cascade behind", notes: "The little red funicular ascending alongside the tiered falls is a timeless shot. Take the BLS boat to Giessbach stop for the full approach experience." },
  { id: "mp74", cat: "photo", emoji: "📸", name: "Staubbach Falls Path",           location: "Lauterbrunnen",        lat: 46.5937, lng: 7.9094,  refImage: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/8/84/Lauterbrunnen_29.07.2009_12-01-01.JPG/800px-Lauterbrunnen_29.07.2009_12-01-01.JPG&w=400",  mission: "Looking straight up at the 300m free-falling wall",  notes: "Walk to the base path and tilt your camera straight up — the water appears to fall from the sky. In bright sun you'll catch a rainbow in the mist at the bottom." },
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
        boxSizing: "border-box",
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
  if (["mountains", "hike", "scenic", "viewpoint", "waterfall", "lake"].includes(value)) return "green";
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
  { id: "photo",     label: "📸 Photo Missions",          color: "#db2777", bg: "#fdf2f8", border: "#f9a8d4" },
];

const DEFAULT_QUEST_ITEMS = [
  // 🍽️ Swiss Food Missions
  { id: "q1",  emoji: "🧀", text: "Try melted cheese fondue",                               cheer: "Käse! 🧀 Switzerland's superpower!",                   checked: { k1: false, k2: false }, section: "food",      days: ["d2","d4","d7","d8"] },
  { id: "q2",  emoji: "🍫", text: "Dip fruit in chocolate fondue",                          cheer: "Swiss choc is the best choc! 🍫",                      checked: { k1: false, k2: false }, section: "food",      days: ["d2","d3","d4","d7"] },
  { id: "q7",  emoji: "☕", text: "Drink hot chocolate in a mountain café",                 cheer: "Warming up Swiss style! ☕ Wunderbar!",                 checked: { k1: false, k2: false }, section: "food",      days: ["d2","d3","d4","d5","d6"] },
  { id: "q10", emoji: "🍰", text: "Eat cake with a mountain view",                          cheer: "Best view AND best cake! 🍰 Fantastisch!",             checked: { k1: false, k2: false }, section: "food",      days: ["d2","d3","d4","d5","d6"] },
  { id: "q13", emoji: "🍦", text: "Eat ice cream in a village",                             cheer: "Swiss village life is delicious! 🍦",                  checked: { k1: false, k2: false }, section: "food",      days: ["d2","d4","d7"] },
  { id: "q23", emoji: "🥨", text: "Try a freshly baked Swiss pretzel or Gipfeli",          cheer: "Gipfeli power! 🥨 Swiss breakfast champion!",          checked: { k1: false, k2: false }, section: "food",      days: ["d1","d2","d3"] },
  { id: "q31", emoji: "🥔", text: "Try Swiss rösti",                                        cheer: "Rösti royalty! 🥔 The Swiss national dish!",           checked: { k1: false, k2: false }, section: "food",      days: ["d2","d3","d4","d7","d8"] },
  { id: "q29", emoji: "🫐", text: "Eat fresh alpine berries on a hike",                     cheer: "Nature's Swiss snack! 🫐 Picked fresh from the Alps!", checked: { k1: false, k2: false }, section: "food",      days: ["d4","d5","d7"] },
  { id: "q28", emoji: "💧", text: "Fill a water bottle from a mountain fountain",            cheer: "Freshest water in the world! 💧 Swiss glacier spring!", checked: { k1: false, k2: false }, section: "food",      days: ["d4","d5","d6","d7"] },
  { id: "q37", emoji: "🍺", text: "Try Rugenbräu Dunkel at Pension Gimmelwald",             cheer: "Prost! 🍺 The Jungfrau region's legendary dark beer since 1866!", checked: { k1: false, k2: false }, section: "food", days: ["d5"] },
  // 🚠 Epic Transport
  { id: "q3",  emoji: "🚠", text: "Ride a cable car up a mountain",                         cheer: "Up, up and away! 🚠 Alpine explorer!",                 checked: { k1: false, k2: false }, section: "transport", days: ["d2","d3","d4","d5","d6","d7"] },
  { id: "q9",  emoji: "🚆", text: "Ride a mountain train",                                  cheer: "Swiss trains are never late! 🚆 All aboard!",          checked: { k1: false, k2: false }, section: "transport", days: ["d1","d3","d4","d5","d6","d7","d8"], sound: "train" },
  { id: "q12", emoji: "🚡", text: "Ride in a gondola",                                      cheer: "Flying over the Alps! 🚡 Toll!",                       checked: { k1: false, k2: false }, section: "transport", days: ["d2","d3","d4","d5","d6"] },
  { id: "q24", emoji: "🚴", text: "Cycle a bike in Switzerland",                            cheer: "Pedal power! 🚴 Swiss roads are amazing!",             checked: { k1: false, k2: false }, section: "transport", days: ["d6"] },
  { id: "q25", emoji: "🛝", text: "Ride the cow slide at Männlichen",                       cheer: "Moooo! Best slide in the Alps! 🐄🛝",                   checked: { k1: false, k2: false }, section: "transport", days: ["d4"], sound: "moo" },
  // 🏔️ Mountain Adventures
  { id: "q5",  emoji: "💧", text: "Stand beside a giant waterfall",                         cheer: "You're soaking it all in! 💧",                         checked: { k1: false, k2: false }, section: "mountain",  days: ["d6","d7"], sound: "splash" },
  { id: "q6",  emoji: "❄️", text: "Touch snow even in summer",                             cheer: "Ice to meet you! ❄️ Ancient Swiss snow!",              checked: { k1: false, k2: false }, section: "mountain",  days: ["d3"], sound: "sparkle" },
  { id: "q8",  emoji: "🥾", text: "Walk a mountain trail",                                  cheer: "You're a mountain goat! 🐐 Sehr gut!",                 checked: { k1: false, k2: false }, section: "mountain",  days: ["d3","d4","d5","d7"] },
  { id: "q11", emoji: "🏔️", text: "Walk on a glacier",                                     cheer: "You walked on ancient ice! 🏔️ Legendary!",            checked: { k1: false, k2: false }, section: "mountain",  days: ["d3"], sound: "fanfare" },
  { id: "q15", emoji: "📸", text: "Take a selfie at the highest railway station in Europe", cheer: "Top of Europe! 📸 Höchste Eisenbahn!",                 checked: { k1: false, k2: false }, section: "mountain",  days: ["d3"], sound: "fanfare" },
  { id: "q18", emoji: "🏊", text: "Dip your feet in a glacial river",                       cheer: "Brrrr! 🥶 Pure glacier water — you're brave!",         checked: { k1: false, k2: false }, section: "mountain",  days: ["d6"], sound: "splash" },
  // 🌿 Nature Spotting
  { id: "q4",  emoji: "🐄", text: "Spot a cow with a bell",                                 cheer: "Moooo! 🐄 That's a Swiss celebrity!",                  checked: { k1: false, k2: false }, section: "nature",    days: ["d2","d4","d5"], sound: "moo" },
  { id: "q14", emoji: "🌄", text: "Watch the mountains turn pink at sunset",                cheer: "Alpenglow — pure Swiss magic! 🌄 Wunderschön!",        checked: { k1: false, k2: false }, section: "nature",    days: ["d6","d7"] },
  { id: "q17", emoji: "🌈", text: "Spot a rainbow in a waterfall's spray",                  cheer: "Swiss rainbows hit different! 🌈",                     checked: { k1: false, k2: false }, section: "nature",    days: ["d6","d7"], sound: "sparkle" },
  { id: "q19", emoji: "🌸", text: "Spot an alpine flower",                                  cheer: "Edelweiss! 🌸 The flower of Switzerland!",             checked: { k1: false, k2: false }, section: "nature",    days: ["d4","d5","d7"], sound: "sparkle" },
  { id: "q20", emoji: "🔭", text: "Spot something through binoculars on a mountain",        cheer: "Eagle eyes! 🔭 Swiss explorer!",                       checked: { k1: false, k2: false }, section: "nature",    days: ["d3","d4","d5"] },
  { id: "q22", emoji: "🌙", text: "See the stars from the Alps",                            cheer: "No light pollution up here! 🌙 Breathtaking!",         checked: { k1: false, k2: false }, section: "nature",    days: ["d6","d7"] },
  { id: "q26", emoji: "🐾", text: "Spot a marmot or mountain goat",                         cheer: "Wild Swiss wildlife! 🐾 True alpine explorer!",         checked: { k1: false, k2: false }, section: "nature",    days: ["d4","d5","d7"] },
  // 🎪 Village Fun
  { id: "q16", emoji: "🎵", text: "Hear a real alphorn being played",                       cheer: "Yodel-ay-ee-oo! 🎵 Music of the Alps!",                checked: { k1: false, k2: false }, section: "village",   days: ["d2","d7","d8"], sound: "yodel" },
  { id: "q21", emoji: "🇨🇭", text: "Count how many Swiss flags you see in one day",        cheer: "Switzerland is flag-tastic! 🇨🇭",                     checked: { k1: false, k2: false }, section: "village",   days: ["d1","d2","d3"] },
  { id: "q27", emoji: "🔔", text: "Ring a cowbell at a playground",                         cheer: "Ding ding! 🔔 That's the sound of Switzerland!",        checked: { k1: false, k2: false }, section: "village",   days: ["d2","d4","d5"], sound: "bell" },
  { id: "q30", emoji: "🐕", text: "Spot a St. Bernard rescue dog statue",                   cheer: "Guardian of the Alps! 🐕 Switzerland's hero dog!",     checked: { k1: false, k2: false }, section: "village",   days: ["d8","d9"] },
  // 📸 Photo Missions
  { id: "q32", emoji: "🪞", text: "Get a reflection shot in Bachalpsee lake",               cheer: "Mirror mirror on the Alps! 🪞 Frame of the year!",     checked: { k1: false, k2: false }, section: "photo",     days: ["d7"], sound: "camera" },
  { id: "q33", emoji: "🏔️", text: "Photograph all 3 giants in one shot",                    cheer: "Eiger, Mönch & Jungfrau — the holy trinity! 🏔️",      checked: { k1: false, k2: false }, section: "photo",     days: ["d3","d4","d5"], sound: "camera" },
  { id: "q34", emoji: "🤳", text: "Take a selfie on the First Cliff Walk",                   cheer: "Edge of the world selfie! 🤳 Absolutely fearless!",    checked: { k1: false, k2: false }, section: "photo",     days: ["d7"], sound: "camera" },
  { id: "q35", emoji: "🚞", text: "Photograph the rack railway on the mountain",             cheer: "The world's most scenic train shot! 🚞 Legendary!",    checked: { k1: false, k2: false }, section: "photo",     days: ["d3","d4","d5","d7"], sound: "train" },
  { id: "q36", emoji: "🌊", text: "Get a rainbow in a waterfall photo",                      cheer: "Rainbow catcher! 🌈 You nailed the perfect moment!",   checked: { k1: false, k2: false }, section: "photo",     days: ["d6","d7"], sound: "camera" },
];

// ─── TRIP DAY DATE MAP ────────────────────────────────────────────────────────
const TRIP_DAY_DATES = {
  "2026-08-22": "d1", "2026-08-23": "d2", "2026-08-24": "d3",
  "2026-08-25": "d4", "2026-08-26": "d5", "2026-08-27": "d6",
  "2026-08-28": "d7", "2026-08-29": "d8", "2026-08-30": "d9",
};
const TRIP_START = new Date("2026-08-22");
const TRIP_END   = new Date("2026-08-30");
function getTodayDayId() {
  const today = new Date().toISOString().split("T")[0];
  return TRIP_DAY_DATES[today] || null;
}
function getDaysUntilTrip() {
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.ceil((TRIP_START - now) / 86400000);
}

function playSound(name) {
  if (name === "moo") {
    try { new Audio("/CowMoo.mp3").play(); } catch (_) {}
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const t = ctx.currentTime;
    if (name === "bell") {
      // Cowbell — metallic two-tone square wave
      [[420, 0.4, 0.8], [560, 0.2, 0.5]].forEach(([freq, vol, dur]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "square"; o.frequency.value = freq;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur);
      });
    } else if (name === "train") {
      // Two-tone train whistle
      [880, 1174].forEach((freq) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.05);
        g.gain.setValueAtTime(0.2, t + 0.3); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.65);
      });
    } else if (name === "fanfare") {
      // 4-note ascending fanfare (C E G C)
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "square"; o.frequency.value = freq;
        const s = t + i * 0.13;
        g.gain.setValueAtTime(0.15, s); g.gain.exponentialRampToValueAtTime(0.001, s + 0.28);
        o.connect(g); g.connect(ctx.destination); o.start(s); o.stop(s + 0.3);
      });
    } else if (name === "sparkle") {
      // Twinkling high sine notes
      [1319, 1568, 1760, 2093, 2349].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = freq;
        const s = t + i * 0.07;
        g.gain.setValueAtTime(0.12, s); g.gain.exponentialRampToValueAtTime(0.001, s + 0.22);
        o.connect(g); g.connect(ctx.destination); o.start(s); o.stop(s + 0.25);
      });
    } else if (name === "splash") {
      // Filtered white noise burst (water splash)
      const len = Math.floor(ctx.sampleRate * 0.45);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.18));
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 900;
      const g = ctx.createGain(); g.gain.value = 0.5;
      src.connect(filt); filt.connect(g); g.connect(ctx.destination); src.start(t); src.stop(t + 0.45);
    } else if (name === "camera") {
      // Shutter click — high noise burst + low thunk
      const len = Math.floor(ctx.sampleRate * 0.07);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter(); filt.type = "highpass"; filt.frequency.value = 2000;
      const g = ctx.createGain(); g.gain.value = 0.6;
      src.connect(filt); filt.connect(g); g.connect(ctx.destination); src.start(t); src.stop(t + 0.07);
      const o = ctx.createOscillator(), g2 = ctx.createGain();
      o.frequency.value = 180; g2.gain.setValueAtTime(0.25, t + 0.02); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(g2); g2.connect(ctx.destination); o.start(t + 0.02); o.stop(t + 0.15);
    } else if (name === "yodel") {
      // Pitch-sweeping yodel approximation
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(620, t + 0.15);
      o.frequency.exponentialRampToValueAtTime(250, t + 0.3); o.frequency.exponentialRampToValueAtTime(540, t + 0.45);
      o.frequency.exponentialRampToValueAtTime(210, t + 0.62);
      g.gain.setValueAtTime(0.3, t); g.gain.setValueAtTime(0.3, t + 0.58); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.72);
    }
    setTimeout(() => ctx.close(), 2000);
  } catch (_) {}
}

export default function SwitzerlandTravelAppReal() {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [budgetCurrency, setBudgetCurrency] = useState("CHF");
  const [learningSection, setLearningSection] = useState("facts");
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [expandedDays, setExpandedDays] = useState(() => new Set(["d1", "d3", "d8"]));
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
  const [mapShowRoutes, setMapShowRoutes]     = useState(false);
  const [expandedPhotoId, setExpandedPhotoId] = useState(null);
  const [pretripChecklist, setPretripChecklist] = useState(DEFAULT_PRETRIP_CHECKLIST);
  const [pretripReady, setPretripReady]         = useState(false);
  const [parking, setParking]                   = useState({ ref: "", url: "" });
  const [transportFilter, setTransportFilter]   = useState("all");
  const [expandedMissions, setExpandedMissions] = useState(new Set());
  const leafletContainerRef                   = useRef(null);
  const leafletInstanceRef                    = useRef(null);
  const leafletMarkersRef                     = useRef([]);
  const leafletRoutesRef                      = useRef([]);

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
    const saved = readLocalStorage(STORAGE_KEYS.pretrip, null);
    if (saved) {
      // Merge: preserve done state from storage, but keep any new default items
      const savedMap = Object.fromEntries(saved.map((i) => [i.id, i]));
      const merged = [
        ...DEFAULT_PRETRIP_CHECKLIST.map((i) => savedMap[i.id] ? { ...i, done: savedMap[i.id].done } : i),
        ...saved.filter((i) => !DEFAULT_PRETRIP_CHECKLIST.find((d) => d.id === i.id)),
      ];
      setPretripChecklist(merged);
    }
    setParking(readLocalStorage(STORAGE_KEYS.parking, { ref: "", url: "" }));
    setPretripReady(true);
  }, []);

  useEffect(() => {
    if (!pretripReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.pretrip, JSON.stringify(pretripChecklist));
    window.localStorage.setItem(STORAGE_KEYS.parking, JSON.stringify(parking));
  }, [pretripChecklist, parking, pretripReady]);

  useEffect(() => {
    if (activeTab !== "map" || mapViewMode !== "map") return;
    const container = leafletContainerRef.current;
    if (!container) return;

    const CAT_ACCENT = {
      stay: "#c2410c", cafe: "#b45309", adventure: "#c0152a",
      waterfall: "#0284c7", playground: "#7c3aed", station: "#475569",
      restaurant: "#16a34a", rainy: "#0891b2", photo: "#db2777",
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

    // Clear & redraw route polylines
    leafletRoutesRef.current.forEach((l) => l.remove());
    leafletRoutesRef.current = [];
    if (mapShowRoutes) {
      ROUTE_LINES.forEach((route) => {
        const opts = { color: route.color, weight: route.weight, opacity: 0.85 };
        if (route.dashArray) opts.dashArray = route.dashArray;
        const line = L.polyline(route.coords, opts);
        line.bindTooltip(route.label, { sticky: true, className: "route-tooltip" });
        line.addTo(map);
        leafletRoutesRef.current.push(line);
      });
    }

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
  }, [activeTab, mapViewMode, mapCategory, mapFullscreen, mapShowRoutes]);

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

  const FILTER_TAGS = ["boat","bucket list","cable car","cycling","hike","history","lake","mountains","playground","snow","sunset","train","viewpoint","village","waterfall"];
  const allTags = useMemo(() => {
    const dayTags = DEFAULT_ITINERARY.flatMap((d) => d.tags || []);
    const itemTags = DEFAULT_ITINERARY.flatMap((d) => d.items.flatMap((i) => i.tags || []));
    const found = uniq([...dayTags, ...itemTags]);
    return ["all", ...FILTER_TAGS.filter((t) => found.includes(t))];
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

  const toggleQuestItem = (id, kidOverride) => {
    const kid = kidOverride || activeKid;
    setQuestItems((prev) => {
      const item = prev.find((q) => q.id === id);
      const wasChecked = item.checked[kid];
      if (!wasChecked) {
        setQuestPopId(id);
        setQuestPopMsg(item.cheer || "⭐ Wunderbar! 🇨🇭");
        setTimeout(() => setQuestPopId(null), 3600);
        if (item.sound) playSound(item.sound);
      }
      return prev.map((q) =>
        q.id === id ? { ...q, checked: { ...q.checked, [kid]: !q.checked[kid] } } : q
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

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

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
      {needRefresh && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          background: "#1e293b", color: "white", borderRadius: 14, padding: "12px 18px",
          display: "flex", alignItems: "center", gap: 12, zIndex: 9999,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)", fontSize: 14, fontWeight: 600,
          whiteSpace: "nowrap",
        }}>
          🔄 App updated
          <button
            onClick={() => updateServiceWorker(true)}
            style={{
              background: "#c0152a", color: "white", border: "none",
              borderRadius: 8, padding: "6px 14px", fontWeight: 700,
              fontSize: 13, cursor: "pointer",
            }}
          >
            Reload
          </button>
          <button
            onClick={() => updateServiceWorker(false)}
            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18, padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 20 }}>
        {daysUntil > 0 ? (
          <div style={{ background: "linear-gradient(135deg, #c0152a 0%, #9b0f20 100%)", borderRadius: 22, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "white" }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Departure</div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>22 Aug · LX401 Dublin → Zurich</div>
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
          <Chip active={activeTab === "budget"} onClick={() => setActiveTab("budget")} tone="orange">💰 Budget</Chip>
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
          <Chip active={activeTab === "learning"} onClick={() => setActiveTab("learning")} tone="red">
            📚 Learn
          </Chip>
          <Chip active={activeTab === "transport"} onClick={() => setActiveTab("transport")} tone="sky">
            🚂 Transport
          </Chip>
          <Chip active={activeTab === "rainevening"} onClick={() => setActiveTab("rainevening")} tone="warm">
            🌧️ Rain & Evenings
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
                              {/* Today badge on current day */}
                              {(() => {
                                const todId = getTodayDayId();
                                return todId === day.id ? (
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0891b2", color: "white", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700, alignSelf: "flex-start" }}>
                                    🌄 Today
                                  </div>
                                ) : null;
                              })()}
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
                                </div>
                              ))}
                              {/* Inline missions strip */}
                              {(() => {
                                const dayMissions = questItems.filter((q) => (q.days || []).includes(day.id));
                                if (dayMissions.length === 0) return null;
                                const doneCount = dayMissions.filter((q) => q.checked[activeKid]).length;
                                return (
                                  <div style={{ borderRadius: 14, border: "1.5px solid #c4b5fd", background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", padding: "12px 14px" }}>
                                    <button
                                      onClick={() => setExpandedMissions((prev) => { const s = new Set(prev); s.has(day.id) ? s.delete(day.id) : s.add(day.id); return s; })}
                                      style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                          <span style={{ fontSize: 11, color: "#7c3aed", transition: "transform 0.2s", display: "inline-block", transform: expandedMissions.has(day.id) ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                                          <div style={{ fontSize: 12, fontWeight: 800, color: "#4c1d95" }}>🎯 Missions</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#7c3aed", fontWeight: 700 }}>
                                          {["k1","k2"].map((k,i) => {
                                            const kd = dayMissions.filter(q => q.checked[k]).length;
                                            return <span key={k}>{kidNames[i]}: {kd}/{dayMissions.length}</span>;
                                          })}
                                        </div>
                                      </div>
                                    </button>
                                    {expandedMissions.has(day.id) && <div style={{ marginTop: 10 }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                      {dayMissions.map((q) => {
                                        const doneK1 = q.checked["k1"];
                                        const doneK2 = q.checked["k2"];
                                        const bothDone = doneK1 && doneK2;
                                        return (
                                          <div
                                            key={q.id}
                                            style={{
                                              display: "flex", alignItems: "center", gap: 8,
                                              background: bothDone ? "rgba(124,58,237,0.1)" : "white",
                                              border: `1.5px solid ${bothDone ? "#a78bfa" : "#e2e8f0"}`,
                                              borderRadius: 10, padding: "6px 10px",
                                            }}
                                          >
                                            <span style={{ fontSize: 15, flexShrink: 0 }}>{q.emoji}</span>
                                            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: bothDone ? "#4c1d95" : "#374151", textDecoration: bothDone ? "line-through" : "none" }}>{q.text}</span>
                                            {["k1","k2"].map((k,i) => {
                                              const done = q.checked[k];
                                              return (
                                                <button key={k} onClick={() => toggleQuestItem(q.id, k)} style={{
                                                  flexShrink: 0, borderRadius: 999, padding: "3px 9px",
                                                  fontSize: 11, fontWeight: 800, cursor: "pointer",
                                                  border: `1.5px solid ${done ? "#7c3aed" : "#c4b5fd"}`,
                                                  background: done ? "#7c3aed" : "white",
                                                  color: done ? "white" : "#7c3aed",
                                                }}>
                                                  {done ? "✓ " : ""}{kidNames[i]}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    </div>}
                                  </div>
                                );
                              })()}
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
              <SectionTitle icon={<Train size={18} />} title="🎫 Half Fare Card — Save 50% on every Swiss journey" />
              <div style={{ display: "grid", gap: 14 }}>
                {/* Stat pills */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    { label: "Total cost", value: "£263.43", sub: "2 adults + 2 kids · PURCHASED ✅", bg: "#f0f9ff", border: "#7dd3fc", col: "#0369a1" },
                    { label: "Discount", value: "50% off", sub: "All trains, gondolas & cable cars", bg: "#f0fdf4", border: "#86efac", col: "#15803d" },
                    { label: "Validity", value: "30 days", sub: "Start on or just before 22 Aug", bg: "#fffbeb", border: "#fcd34d", col: "#b45309" },
                    { label: "Kids travel", value: "FREE 🎉", sub: "Under 16 with Swiss Family Card", bg: "#fdf4ff", border: "#e9d5ff", col: "#7e22ce" },
                  ].map(({ label, value, sub, bg, border, col }) => (
                    <div key={label} style={{ flex: 1, minWidth: 130, background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, color: col, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{value}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{sub}</div>
                    </div>
                  ))}
                </div>
                {/* Steps */}
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>How it works</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    ["1", "✅", "DONE — 2× Half Fare Cards + 2× Family Cards purchased via GetYourGuide app (£263.43). All 4 cards imported to Google Wallet."],
                    ["2", "📱", "Download the SBB app and select 'Half Fare Travelcard' as discount type. No need to link card — just show Google Wallet to conductor."],
                    ["3", "🚆", "Search any route in the app — it automatically applies your 50% discount at checkout"],
                    ["4", "📲", "Show the ticket on your phone to the conductor. That's it!"],
                  ].map(([n, icon, text]) => (
                    <div key={n} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ background: "#c0152a", color: "white", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{n}</div>
                      <div style={{ fontSize: 13, color: "#334155" }}><span style={{ marginRight: 4 }}>{icon}</span>{text}</div>
                    </div>
                  ))}
                </div>
                {/* Warning */}
                <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#991b1b", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                  <span>Buy on the <strong>GetYourGuide app</strong> <em>before you fly</em> to use the discount code. Not available for instant purchase on arrival at the airport.</span>
                </div>
                {/* Family Card banner */}
                <div style={{ background: "#fdf4ff", border: "1.5px solid #e9d5ff", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#6b21a8", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>👨‍👩‍👧‍👦</span>
                  <div>
                    <strong>Swiss Family Card — kids under 16 travel FREE</strong><br />
                    <span style={{ opacity: 0.9 }}>You get a free Family Card when buying your Half Fare Cards. <strong>Add your children during checkout</strong> on GetYourGuide — they'll be listed on the card. Kids must be accompanied by a parent to travel free.</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Dublin Airport Parking */}
            <Card style={{ padding: 18 }}>
              <SectionTitle icon={<Plane size={18} />} title="🚗 Dublin Airport Parking" />
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Booking reference</label>
                  <input
                    type="text"
                    placeholder="e.g. DUB-2026-XXXXX"
                    value={parking.ref}
                    onChange={(e) => setParking((p) => ({ ...p, ref: e.target.value }))}
                    style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 14, fontWeight: 700, color: "#0f172a", outline: "none", fontFamily: "monospace" }}
                  />
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Confirmation URL (for QR code)</label>
                  <input
                    type="url"
                    placeholder="Paste your booking confirmation link here"
                    value={parking.url}
                    onChange={(e) => setParking((p) => ({ ...p, url: e.target.value }))}
                    style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#0f172a", outline: "none" }}
                  />
                </div>
                {parking.url && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "14px 0 6px" }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(parking.url)}&size=180x180&margin=8`}
                      alt="Parking QR code"
                      style={{ width: 180, height: 180, borderRadius: 10, border: "2px solid #e2e8f0" }}
                    />
                    <div style={{ fontSize: 11, color: "#64748b", textAlign: "center" }}>Show this QR code at the car park barrier</div>
                    {parking.ref && <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 15, color: "#0f172a", background: "#f1f5f9", padding: "4px 12px", borderRadius: 6 }}>{parking.ref}</div>}
                  </div>
                )}
                {!parking.url && (
                  <div style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: 10, padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                    📲 Paste your confirmation URL above to generate a QR code
                  </div>
                )}
                <a href="https://www.dublinairport.com/parking" target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#1d4ed8", textDecoration: "none", fontWeight: 600 }}>
                  <ExternalLink size={12} /> Book at dublinairport.com
                </a>
              </div>
            </Card>

            {/* Pre-trip checklist */}
            <Card style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <SectionTitle icon={<CheckSquare size={18} />} title="✅ Before you fly" />
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                  {pretripChecklist.filter((i) => i.done).length}/{pretripChecklist.length} done
                </div>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {pretripChecklist.map((item) => (
                  <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: 10,
                    background: item.done ? "#f0fdf4" : "#f8fafc", border: `1.5px solid ${item.done ? "#86efac" : "#e2e8f0"}`,
                    transition: "all 0.2s", cursor: "pointer" }}
                    onClick={() => setPretripChecklist((prev) => prev.map((i) => i.id === item.id ? { ...i, done: !i.done } : i))}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${item.done ? "#16a34a" : "#94a3b8"}`,
                      background: item.done ? "#16a34a" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {item.done && <span style={{ color: "white", fontSize: 12, fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: item.done ? "#15803d" : "#334155", textDecoration: item.done ? "line-through" : "none",
                      textDecorationColor: "#86efac", flex: 1, fontWeight: item.done ? 500 : 600 }}>{item.text}</span>
                    {item.link && !item.done && (
                      <a href={item.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                        style={{ color: "#3b82f6", flexShrink: 0 }}><ExternalLink size={13} /></a>
                    )}
                  </div>
                ))}
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

            {/* Emergency Contacts */}
            <Card style={{ padding: 18, gridColumn: "1 / -1", borderLeft: "4px solid #dc2626" }}>
              <SectionTitle icon={<span style={{ fontSize: 18 }}>🆘</span>} title="Emergency Contacts & Numbers" />
              <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                {/* Swiss Emergency Numbers */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>🇨🇭 Swiss Emergency Numbers</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {[
                      { num: "112", label: "European Emergency (universal)" },
                      { num: "117", label: "Police (Polizei)" },
                      { num: "118", label: "Fire Brigade (Feuerwehr)" },
                      { num: "144", label: "Ambulance (Sanität)" },
                      { num: "1414", label: "Swiss Air Rescue / Rega (mountain)" },
                    ].map(({ num, label }) => (
                      <a key={num} href={`tel:${num}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
                        padding: "7px 10px", borderRadius: 10, background: "#fff1f2", border: "1.5px solid #fecaca" }}>
                        <span style={{ fontWeight: 900, fontSize: 15, color: "#dc2626", minWidth: 38 }}>{num}</span>
                        <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{label}</span>
                      </a>
                    ))}
                  </div>
                </div>
                {/* Local Contacts */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>📍 Local Contacts</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {[
                      { label: "Apartment host — Myriam", num: "", note: "Check confirmation email for number" },
                      { label: "Spital Grindelwald (local clinic)", num: "+41 33 854 85 50", note: "Dorfstrasse 141, 3818 Grindelwald" },
                      { label: "Spital Interlaken (main hospital)", num: "+41 33 826 26 26", note: "Weissenaustrasse 27, 3800 Interlaken" },
                      { label: "ZRH Airport info", num: "+41 43 816 22 11", note: "Zurich Airport general enquiries" },
                      { label: "🔴 Travel insurance hotline", num: "", note: "Add your policy number & emergency number before you travel" },
                    ].map(({ label, num, note }) => (
                      <div key={label} style={{ padding: "7px 10px", borderRadius: 10, background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a" }}>{label}</div>
                        {num && <a href={`tel:${num.replace(/\s/g,"")}`} style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600, textDecoration: "none" }}>{num}</a>}
                        {note && <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Useful reminders */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>✅ Good to Know</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {[
                      "EHIC cards cover emergency treatment in Switzerland — carry them at all times",
                      "Swiss Air Rescue (Rega) helicopters operate in the Alps — dial 1414 for mountain emergencies",
                      "Nearest A&E for serious emergencies is Spital Interlaken (~35 min from Grindelwald by train)",
                      "Keep a photo of everyone's passport in your phone camera roll",
                      "SWISS and Aer Lingus booking refs: YMKW98 · 2TLA5F",
                    ].map((tip) => (
                      <div key={tip} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 10px",
                        borderRadius: 10, background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
                        <span style={{ color: "#059669", fontSize: 12, marginTop: 1, flexShrink: 0 }}>•</span>
                        <span style={{ fontSize: 12, color: "#374151" }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => setBudgetCurrency("CHF")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: budgetCurrency === "CHF" ? "2px solid #0284c7" : "1px solid #cbd5e1",
                        background: budgetCurrency === "CHF" ? "#eff6ff" : "white",
                        color: budgetCurrency === "CHF" ? "#0284c7" : "#64748b",
                        fontWeight: budgetCurrency === "CHF" ? 700 : 500,
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      CHF (CHF)
                    </button>
                    <button
                      onClick={() => setBudgetCurrency("GBP")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: budgetCurrency === "GBP" ? "2px solid #0284c7" : "1px solid #cbd5e1",
                        background: budgetCurrency === "GBP" ? "#eff6ff" : "white",
                        color: budgetCurrency === "GBP" ? "#0284c7" : "#64748b",
                        fontWeight: budgetCurrency === "GBP" ? 700 : 500,
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      GBP (£)
                    </button>
                  </div>
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
                  <div style={{ fontSize: 12, color: "#64748b" }}>Total Expenses ({budgetCurrency})</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 10, fontSize: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span>Total</span><span>{budgetCurrency === "CHF" ? CHF.format(totals.expenses) : GBP.format(totals.expenses * CHF_TO_GBP)}</span></div>
                  </div>
                </div>
              </div>

              <BudgetEditor
                title="Expenses"
                lines={budget.expenses}
                onAdd={() => addBudgetLine("expenses")}
                onRemove={(id) => removeBudgetLine("expenses", id)}
                onChange={(id, patch) => updateBudgetLine("expenses", id, patch)}
                currency={budgetCurrency}
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

            {/* Must-try Swiss foods & drinks */}
            <Card style={{ padding: "14px 16px" }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🇨🇭 Must-Try Swiss Foods & Drinks</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.5 }}>
                Your Swiss food bucket list — tick these off across the trip, at restaurants or grabbed from Coop/Migros.
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  { emoji: "🫕", name: "Fondue", notes: "Dip baby potatoes into a pot of melted cheese. The cheese blend varies by region — sometimes flavoured with truffle, garlic, tomato, or even Champagne!" },
                  { emoji: "🧀", name: "Raclette", notes: "A slice of cheese warmed under a broiler until bubbling, then poured over small potatoes. Often topped with paprika or black pepper." },
                  { emoji: "🧀", name: "Swiss cheese (hyper-regional)", notes: "Not just the holey stuff! Visit a local Molkerei (cheese shop) or grocery counter and try what's local to the area. Favourites: Kaltbach Bergkäse, Tilsiter, or a spreadable fresh cheese with herbs." },
                  { emoji: "🍞", name: "Käseschnitte", notes: "Basically raclette poured over a thick slice of bread instead of potatoes — sometimes topped with a soft-cooked egg." },
                  { emoji: "🌭", name: "Dried sausage", notes: "Meat & cheese platters feature local dried sausage that tastes different valley to valley. You can buy this from most farm fridges too!" },
                  { emoji: "🌭", name: "Wurst", notes: "Just like Germany, sausage is a staple here and on the menu everywhere, especially mountain restaurants." },
                  { emoji: "🥔", name: "Rösti", notes: "A large hash brown patty, sometimes filled with diced onion and bacon. Often topped with a wurst and gravy — the Swiss national dish." },
                  { emoji: "🍺", name: "Local beers", notes: "Appenzeller is one of the best breweries in the country. Rugenbräu (your local Bernese Oberland brewery) is also excellent, plus loads of small craft brewers." },
                  { emoji: "🥤", name: "Rivella soda", notes: "The most popular soda in Switzerland — try it FIRST before you learn what it's made from (milk whey)!" },
                  { emoji: "🍪", name: "Kambly cookies", notes: "Swiss brand with hundreds of cookie varieties. Sample for free at their factory shop in Trubschachen if you're ever passing." },
                  { emoji: "🍫", name: "Swiss chocolate", notes: "Splurge at fancy shops like Läderach, or grab bars from the grocery store — Lindt, Cailler, Halba and Frey are all popular local brands." },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "8px 12px" }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#78350f" }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.4, marginTop: 2 }}>{item.notes}</div>
                    </div>
                  </div>
                ))}
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

          const todayDayId = getTodayDayId();
          const todayDay   = todayDayId ? DEFAULT_ITINERARY.find((d) => d.id === todayDayId) : null;
          const daysUntil  = getDaysUntilTrip();
          const tripOver   = new Date() > TRIP_END;
          const todayMissions = todayDay
            ? questItems.filter((q) => (q.days || []).includes(todayDayId))
            : [];
          const todayDone = todayMissions.filter((q) => q.checked[kidKey]).length;

          return (
            <div style={{ display: "grid", gap: 16 }}>

              {/* ── TODAY'S MISSIONS HERO ── */}
              {tripOver ? (
                <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)", borderRadius: 20, padding: "20px 20px", color: "white", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 6 }}>🏆🇨🇭🏔️</div>
                  <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Adventure complete!</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>Hope Switzerland was incredible. {kidName} completed {kidDoneCount} of {questItems.length} missions!</div>
                </div>
              ) : todayDay ? (
                <div style={{ background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)", borderRadius: 20, padding: "18px 18px 16px", color: "white" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>🌄 Today's Missions</div>
                  <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 2 }}>{todayDay.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 12 }}>📍 {todayDay.location}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
                    {todayMissions.length === 0 ? (
                      <div style={{ fontSize: 13, opacity: 0.75 }}>Travel day — enjoy the journey! 🚂</div>
                    ) : todayMissions.map((q) => {
                      const doneK1 = q.checked["k1"];
                      const doneK2 = q.checked["k2"];
                      const bothDone = doneK1 && doneK2;
                      return (
                        <div
                          key={q.id}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: bothDone ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
                            borderRadius: 12, padding: "8px 12px",
                            opacity: bothDone ? 0.7 : 1,
                          }}
                        >
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{q.emoji}</span>
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "white", textDecoration: bothDone ? "line-through" : "none" }}>{q.text}</span>
                          {["k1","k2"].map((k, i) => {
                            const done = q.checked[k];
                            return (
                              <button key={k} onClick={() => toggleQuestItem(q.id, k)} style={{
                                flexShrink: 0, borderRadius: 999, padding: "3px 9px",
                                fontSize: 11, fontWeight: 800, cursor: "pointer", border: "none",
                                background: done ? "white" : "rgba(255,255,255,0.25)",
                                color: done ? "#0e7490" : "white",
                              }}>
                                {done ? "✓" : ""} {kidNames[i]}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  {todayMissions.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {["k1","k2"].map((k, i) => {
                        const kDone = todayMissions.filter(q => q.checked[k]).length;
                        return (
                          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, width: 42, flexShrink: 0 }}>{kidNames[i]}</div>
                            <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", borderRadius: 999, height: 5, overflow: "hidden" }}>
                              <div style={{ height: "100%", borderRadius: 999, background: "white", width: `${(kDone / todayMissions.length) * 100}%`, transition: "width 0.4s" }} />
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, width: 32, textAlign: "right" }}>{kDone}/{todayMissions.length}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)", borderRadius: 20, padding: "20px 18px", color: "white" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>⏳ Trip Countdown</div>
                  <div style={{ fontWeight: 900, fontSize: 28, marginBottom: 4 }}>{daysUntil} days to go</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>Until the adventure begins — 22 Aug 2026 🏔️</div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Come back on the day for your daily missions!</div>
                </div>
              )}

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
            photo:      { label: "Photo Spots",emoji: "📸",  accent: "#db2777", bg: "#fdf2f8",  border: "#f9a8d4" },
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
                    <button onClick={() => setMapShowRoutes((r) => !r)} style={{
                      background: mapShowRoutes ? "white" : "rgba(255,255,255,0.2)",
                      color: mapShowRoutes ? "#0369a1" : "white",
                      border: "none", borderRadius: 10, padding: "7px 12px",
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                    }}>
                      🚂 Routes
                    </button>
                  )}
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

              {/* Route legend (map mode, routes on) */}
              {mapViewMode === "map" && mapShowRoutes && (
                <Card style={{ padding: "12px 14px" }}>
                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>🗺️ Route Legend</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                    {[
                      { color: "#e11d48", label: "Train (BLS/SBB)",         dash: false },
                      { color: "#ea580c", label: "Rack Railway",             dash: false },
                      { color: "#2563eb", label: "Cable car / Gondola",      dash: true  },
                      { color: "#1e3a8a", label: "Lake Steamer",             dash: false },
                      { color: "#16a34a", label: "Funicular",                dash: true  },
                      { color: "#d97706", label: "Bus",                      dash: false },
                    ].map(({ color, label, dash }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <svg width="28" height="8">
                          <line x1="0" y1="4" x2="28" y2="4"
                            stroke={color} strokeWidth="3"
                            strokeDasharray={dash ? "6 4" : "none"} />
                        </svg>
                        <span style={{ color: "#374151" }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>Tap any route line on the map for its name</div>
                </Card>
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

                      {/* Main emoji — tappable to expand reference photo */}
                      <div
                        onClick={() => place.refImage && setExpandedPhotoId(expandedPhotoId === place.id ? null : place.id)}
                        style={{ fontSize: 36, marginBottom: 2, cursor: place.refImage ? "pointer" : "default", userSelect: "none" }}
                        title={place.refImage ? "Tap to see the shot" : undefined}
                      >{place.emoji}{place.refImage ? <span style={{ fontSize: 11, verticalAlign: "middle", marginLeft: 4, color: meta.accent, fontWeight: 700 }}>{expandedPhotoId === place.id ? "▲" : "▼"}</span> : null}</div>

                      {/* Expandable reference photo */}
                      {place.refImage && expandedPhotoId === place.id && (
                        <div style={{ margin: "0 -14px", overflow: "hidden", maxHeight: 160 }}>
                          <img
                            src={place.refImage}
                            alt={place.name}
                            loading="lazy"
                            style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                            onError={e => { e.target.parentElement.style.display = "none"; }}
                          />
                        </div>
                      )}

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

        {activeTab === "learning" && (
        <div style={{ display: "grid", gap: 12 }}>
          {/* Header — gradient banner matching Map/Quest tabs */}
          <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", borderRadius: 18, padding: "16px 18px", color: "white" }}>
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 10 }}>📚 Pre-Trip Learning</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {LEARNING_SECTIONS.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setLearningSection(sec.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "none",
                    background: learningSection === sec.id ? "white" : "rgba(255,255,255,0.2)",
                    color: learningSection === sec.id ? "#5b21b6" : "white",
                    fontWeight: learningSection === sec.id ? 700 : 500,
                    cursor: "pointer",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {sec.emoji} {sec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Learning content cards */}
          {learningSection === "language" ? (
            // Language: single column (phrases need full width)
            DEFAULT_LEARNING_ITEMS.filter(item => item.section === "language").map(item => (
              <Card key={item.id} style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{item.title}</h4>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {item.phrases.map((p, idx) => (
                    <div key={idx} style={{ borderLeft: "2px solid #2563eb", paddingLeft: 10 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{p.word}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>English: {p.translation}</div>
                      <div style={{ color: "#94a3b8", fontSize: 11, fontStyle: "italic" }}>Pronunciation: {p.pronunciation}</div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          ) : (
            // Facts / culture / landmarks / fun — responsive grid (3 cols on desktop, 2 on tablet, 1 on mobile)
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {DEFAULT_LEARNING_ITEMS.filter(item => item.section === learningSection).map(item => (
                <Card key={item.id} style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginBottom: 3, lineHeight: 1.3 }}>{item.title}</div>
                  <p style={{ margin: 0, color: "#475569", fontSize: 12, lineHeight: 1.4 }}>{item.description}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

        {activeTab === "transport" && (() => {
          const filtered = transportFilter === "all"
            ? DEFAULT_TRANSPORT_ROUTES
            : DEFAULT_TRANSPORT_ROUTES.filter(r => r.type === transportFilter);
          return (
            <div style={{ display: "grid", gap: 14 }}>
              {/* Header */}
              <div style={{ background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)", borderRadius: 18, padding: "16px 18px", color: "white" }}>
                <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 6 }}>🚂 Transport Guide</div>
                <div style={{ fontSize: 13, opacity: 0.88, marginBottom: 12 }}>Key routes, times & prices · Half Fare Cards save ~50% on everything</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {TRANSPORT_TYPES.map(tt => (
                    <button
                      key={tt.id}
                      onClick={() => setTransportFilter(tt.id)}
                      style={{
                        padding: "6px 12px", borderRadius: 999, border: "none", cursor: "pointer",
                        background: transportFilter === tt.id ? "white" : "rgba(255,255,255,0.2)",
                        color: transportFilter === tt.id ? "#0e7490" : "white",
                        fontWeight: transportFilter === tt.id ? 700 : 500, fontSize: 13,
                        display: "inline-flex", alignItems: "center", gap: 5,
                      }}
                    >
                      {tt.emoji} {tt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Route cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 10 }}>
                {filtered.map(route => (
                  <Card key={route.id} style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ fontSize: 26, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{route.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>{route.from} → {route.to}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{route.duration} · {route.frequency}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: route.notes ? 5 : 0 }}>
                          <SmallBadge color="slate">{route.priceFull}</SmallBadge>
                          <SmallBadge color="green">½ {route.priceHalf}</SmallBadge>
                          <SmallBadge color="amber">{route.provider}</SmallBadge>
                        </div>
                        {route.notes && <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{route.notes}</div>}
                      </div>
                      <a
                        href={route.sbbUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flexShrink: 0, background: "#e11d48", color: "white",
                          borderRadius: 10, padding: "7px 11px", fontWeight: 700,
                          fontSize: 12, textDecoration: "none", whiteSpace: "nowrap",
                        }}
                      >
                        Timetable →
                      </a>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Useful apps */}
              <Card style={{ padding: "14px 16px" }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>📱 Useful Apps & Links</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { href: "https://www.sbb.ch/en", label: "🇨🇭 SBB — Swiss Federal Railways (all national trains & timetables)" },
                    { href: "https://www.bls.ch/en", label: "🚂 BLS — Regional trains, lake steamers & Grindelwald area" },
                    { href: "https://www.jungfrau.ch/en-gb/", label: "🏔️ Jungfrau Railways — gondolas, cable cars & mountain trains" },
                    { href: "https://www.postauto.ch/en", label: "🚌 PostBus Switzerland — valley & mountain buses" },
                    { href: "https://www.swissrailways.com/en/buy-jungfraujoch-ticket", label: "🎟️ Book Jungfraujoch tickets (50% off with Half Fare Card, Flex Cancellation available)" },
                  ].map(link => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block", color: "#0891b2", fontWeight: 600, fontSize: 13,
                        textDecoration: "none", padding: "8px 10px", borderRadius: 10,
                        background: "#f0f9ff", border: "1px solid #bae6fd",
                      }}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </Card>

              {/* Webcams & Weather */}
              <Card style={{ padding: "14px 16px" }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>📷 Webcams & Mountain Weather</div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, lineHeight: 1.5 }}>
                  Check these <strong>first thing in the morning (~7am)</strong> — mountain weather is clearest early. If summits are in cloud by mid-morning they usually stay that way. Use these before committing to Jungfraujoch or any mountain day.
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { href: "https://www.jungfrau.ch/en-gb/live/webcams/", label: "❄️ Jungfrau.ch webcams — Jungfraujoch, Männlichen AND Grindelwald First all on one page", tip: "One-stop check for 3 of your key mountain days before booking." },
                    { href: "https://grindelwald.swiss/en/service/webcams.html", label: "🏔️ Grindelwald webcams — First, Männlichen, Kleine Scheidegg, village", tip: "Best all-in-one view across your most-used mountains." },
                    { href: "https://jungfrauregion.swiss/en/service/webcams.html", label: "🌄 Jungfrau Region webcams — 30+ cams including Schilthorn, Mürren, Lauterbrunnen", tip: "Use for Schilthorn/Mürren day and Lauterbrunnen valley." },
                    { href: "https://schilthorn.swiss/en/pizgloria/Livecam", label: "🎬 Schilthorn webcam — check before Piz Gloria / Mürren day", tip: "Bond World views depend on clear weather. Check night before." },
                    { href: "https://www.bergfex.com/sommer/jungfrau-region/webcams/", label: "🌦️ Bergfex — mountain forecasts + live cams for whole Jungfrau region", tip: "Best for 2-3 day forecasts to plan ahead." },
                    { href: "https://www.swisspanorama.com/", label: "🔭 SwissPanorama — live 360° views from Jungfraujoch, Schilthorn & Männlichen", tip: "High-res panoramic cams — great for checking visibility." },
                    { href: "https://www.meteoswiss.admin.ch/", label: "🌤️ MeteoSwiss — official Swiss weather forecast with minute-by-minute rain/sunshine", tip: "Most accurate Swiss forecast. Check hourly breakdown before committing to mountain days." },
                  ].map(link => (
                    <div key={link.href} style={{ borderRadius: 10, background: "#f0fdf4", border: "1px solid #86efac", overflow: "hidden" }}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "block", color: "#166534", fontWeight: 600, fontSize: 13,
                          textDecoration: "none", padding: "8px 10px",
                        }}
                      >
                        {link.label}
                      </a>
                      <div style={{ fontSize: 11, color: "#166534", opacity: 0.8, padding: "0 10px 8px", lineHeight: 1.4 }}>💡 {link.tip}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          );
        })()}

        {activeTab === "rainevening" && (
          <div style={{ display: "grid", gap: 12 }}>
            <Card style={{ padding: "14px 16px" }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>💡 Weather Strategy</div>
              <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.7 }}>
                🌦️ Weather varies <strong>valley to valley</strong> — raining in Grindelwald doesn't mean it's raining in Brienz, Thun, or even Lauterbrunnen. Always check <strong>multiple webcams</strong> before deciding your day.<br /><br />
                📱 Check <strong>MeteoSwiss</strong> (not your phone's weather app) for minute-by-minute forecasts. Check the <strong>night before</strong> AND again <strong>first thing in the morning</strong>.<br /><br />
                ☁️ It could be foggy in the valley but clear on the peaks, or cloudy in the mountains and sunny over the lakes. Don't assume — check the cams.<br /><br />
                🌤️ Don't wait for perfect weather — clouds can be higher than expected and rain stops as quickly as it starts. Get outside anyway and you'll often be rewarded.<br /><br />
                🧥 As the Swiss say: <strong>"There's no such thing as bad weather, only bad clothing."</strong> Keep rain jackets in your backpacks at all times. Pack spare socks and a change of clothes for the kids.
              </div>
            </Card>

            <Card style={{ padding: "14px 16px" }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🌧️ Rainy Day Activities</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.5 }}>
                Ordered by distance from the Airbnb. Mix and match to fill a day!
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { emoji: "🏔️", name: "Glacier Gorge (Gletscherschlucht)", location: "30 min walk from Airbnb or Bus 122", time: "~2 hours", cost: "CHF 19/adult, CHF 10/child, under 6 free", notes: "Your #1 rainy day pick. Sheltered 300m-deep canyon carved by glacier. Spider web net over the gorge. Actually MORE atmospheric in rain — waterfalls are fuller and mist rises from the canyon. Open daily 9:30am–6pm." },
                  { emoji: "🏊", name: "Sportzentrum Grindelwald — Indoor Pool", location: "Dorfstrasse 110, ~15 min walk", time: "2–3 hours", cost: "CHF 5/person with Grindelwald Guest Card!", notes: "Indoor pool with 70m water slide ('Black Hole' with flashing lights), 1m diving board, non-swimmers pool, kids paddling pool. 28°C water. Ropes course and café upstairs. Wellness area + sauna CHF 15pp. Ask Myriam for the Guest Card — you get it FREE when staying in Grindelwald!" },
                  { emoji: "🧀", name: "Farm Fridges around Grindelwald", location: "Scattered around Grindelwald village", time: "1–2 hours", cost: "Pay what you see (honesty system)", notes: "Self-service refrigerators and shops selling local cheese, sausage, milk, eggs, jam, syrup, and handmade crafts. Venture off the main street to find them — great rainy day treasure hunt for the kids!" },
                  { emoji: "☕", name: "Café & Chocolate Hopping", location: "Grindelwald village", time: "All morning", cost: "CHF 20–40", notes: "Wander the village cafés — hot chocolate, pastries, card games with the kids. Try Ovomaltine hot chocolate. Browse souvenir shops. Save village exploring for rainy days — use sunny days for the mountains!" },
                  { emoji: "🍫", name: "DIY Swiss Chocolate Taste Test", location: "Your Airbnb", time: "1 hour", cost: "CHF 15–25", notes: "Buy a selection from Coop — Ragusa, Toblerone, Lindt, Frey, Cailler. Blindfold taste test with the kids. Rate each one. The Swiss eat 25lbs of chocolate per person per year — do your bit!" },
                  { emoji: "🏛️", name: "Grindelwald Museum", location: "Grindelwald village", time: "~1 hour", cost: "~CHF 5", notes: "Small local history museum — village life, farming traditions, mountaineering history. Good for filling an hour." },
                  { emoji: "🚶", name: "Walk Bort → Grindelwald (cloudy but dry)", location: "Gondola to Bort, walk down", time: "~1.5 hours", cost: "Gondola ticket", notes: "If it's cloudy but NOT raining — gondola up to Bort, then walk back down through stunning rolling hills, farms, and meadows to Grindelwald village. Beautiful even without mountain views." },
                  { emoji: "💧", name: "Trümmelbach Falls", location: "Lauterbrunnen valley (~45 min from Grindelwald)", time: "1–2 hours", cost: "CHF 14/adult, CHF 7/child", notes: "Europe's largest waterfalls INSIDE a mountain — 20,000 litres per second thundering through rock tunnels. Accessed by underground lift. Completely rain-proof and even more spectacular after rain. A must-do!" },
                  { emoji: "🦇", name: "St. Beatus Caves", location: "Near Interlaken (~40 min from Grindelwald)", time: "2–3 hours", cost: "~CHF 20/adult, CHF 12/child", notes: "Cave tour with stalactites, underground lake, and stunning waterfall at the entrance. Legend says a dragon once lived here — kids will love the story. Completely rain-proof." },
                  { emoji: "🏰", name: "Castle Tours — Lake Thun", location: "Spiez / Thun / Oberhofen (~1 hr train)", time: "Half day", cost: "~CHF 10–15/castle", notes: "Lake Thun is dotted with impressive castles. Spiez Castle overlooks the lake and vineyards. Oberhofen Castle sits right on the water. Thun Castle has panoramic views. Combine with a boat ride on the lake." },
                  { emoji: "🏘️", name: "Ballenberg Open-Air Museum", location: "Near Brienz (~45 min from Grindelwald)", time: "Half to full day", cost: "CHF 32/adult, kids free with Family Card", notes: "66 historic Swiss buildings from across the country, relocated and rebuilt in a huge outdoor park. Live craft demos — bread baking, cheese making, wood carving. Farm animals. Massive site, could spend all day. Great for kids." },
                  { emoji: "🐄", name: "Trauffer Wooden Cow Museum", location: "Brienz (~45 min from Grindelwald)", time: "1–2 hours", cost: "~CHF 10", notes: "See how the famous Swiss wooden cows are made. Interactive for kids. Brienz is also the centre of Swiss wood carving — browse the shops and watch carvers at work." },
                  { emoji: "🌊", name: "Giessbach Falls + Grand Hotel", location: "Lake Brienz (boat from Interlaken/Brienz)", time: "Half day", cost: "Boat ticket + free entry", notes: "14-cascade waterfall tumbling 500m down the mountainside. Reached by historic funicular (oldest in Switzerland). The Grand Hotel terrace is stunning even in rain. Combine with Lake Brienz boat ride." },
                  { emoji: "🍺", name: "Rugenbräu Brewery", location: "Interlaken (~30 min train)", time: "1–2 hours", cost: "~CHF 20–30pp", notes: "Local brewery in Matten bei Interlaken, brewing since 1866. The only brewery in the entire Bernese Oberland! Beer tasting — the Dunkel is excellent. But the real surprise: WHISKEY TASTING. Their signature whisky is aged 4 years in the cellar, then 7 years at the top of the Jungfrau in ice at 3,600m. Fiery, unique, unforgettable. Good paired with an Interlaken wander on a drizzly day." },
                  { emoji: "🏊", name: "Mürren Sportcenter — Swimming Pool", location: "Mürren (1hr from Grindelwald)", time: "Half day", cost: "Entry fee applies", notes: "If already in Mürren when weather turns. Swimming pool open in summer. Good backup during your Mürren day." },
                  { emoji: "🎳", name: "Funland Thun (Indoor Soft Play)", location: "Thun (~50 min train)", time: "Half day", cost: "~CHF 15/child", notes: "Indoor soft play — ball pit, tunnel slide, climbing ramp, 11m racing slide. Kids up to 11 years. WiFi and bistro for parents. Worth the train for a full-day washout." },
                ].map((item, i) => (
                  <div key={i} style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{item.emoji} {item.name}</div>
                    <div style={{ fontSize: 11, color: "#0369a1", marginBottom: 6 }}>📍 {item.location} · ⏱️ {item.time} · 💰 {item.cost}</div>
                    <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{item.notes}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ padding: "14px 16px" }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🌙 Evening Ideas</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.5 }}>
                Most evenings you'll be knackered after a mountain day — don't over-plan. Here's a mix of low-key options.
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🏠 At the Airbnb</div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.7 }}>
                    🍫 Movie night with Swiss chocolate — Ragusa, Toblerone and Lindt from Coop<br />
                    🃏 Card games / board games — pack a few or buy a cheap deck at Coop<br />
                    🧀 Cook a Swiss meal — Rösti, Cervelat sausages, melted cheese on bread. Älplermagronen (Swiss mac and cheese) is easy and kids love it<br />
                    🍫 DIY chocolate taste test — blindfold the kids, rate each bar out of 10<br />
                    🫕 Fondue night — if Alpenglück has a fondue set, buy the cheese from Coop and do it properly!<br />
                    🍷 Wine from Coop — try Lavaux or Valais region whites and rosés (Switzerland's best wine regions)<br />
                    🌟 Stargazing from the balcony — Grindelwald has low light pollution at 1,034m. August = good chance of shooting stars (Perseids)<br />
                    📱 Plan tomorrow — check MeteoSwiss forecast and webcams over a glass of wine
                  </div>
                </div>

                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🚶 Out in the Village</div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.7 }}>
                    🌅 Evening stroll to watch sunset over the Eiger — golden hour late August around 8pm<br />
                    🍺 Local beer at a quiet bar — look for spots with more locals than tourists<br />
                    🍦 Ice cream walk — most village shops open until 9pm in summer<br />
                    🍕 Pizza takeaway and eat at the apartment — easy, kids happy, no fuss<br />
                    🧀 Hunt for farm fridges — self-service honesty fridges with local cheese, eggs, jam, and crafts hidden around Grindelwald's side streets
                  </div>
                </div>

                <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>⭐ One Special Evening</div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.7 }}>
                    🌄 <strong>Harder Kulm Sunset</strong> — on your Interlaken day, take the funicular up around 7pm. Watch sunset from the Two Lakes Bridge viewpoint overlooking Lake Thun and Lake Brienz with the full Eiger/Mönch/Jungfrau panorama. Last funicular down ~9:30pm. Save for a clear evening.
                  </div>
                </div>

                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🛒 Evening Shopping List (grab from Coop Day 2)</div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.7 }}>
                    🍫 Swiss chocolate selection — Ragusa, Toblerone, Lindt, Frey, Cailler (for taste test!)<br />
                    🧀 Fondue/raclette cheese — if Alpenglück has a fondue set, do it properly one evening!<br />
                    🌭 Cervelat sausages — the Swiss BBQ staple<br />
                    🍷 White wine from Lavaux or Valais — ask at the Coop counter<br />
                    🥤 Rivella + fruit syrups (raspberry, elderflower or Alpine herb — dilute with sparkling water)<br />
                    🍞 Fresh bread for evening sandwiches<br />
                    🃏 Cheap card game or kids activity book
                  </div>
                </div>
              </div>
            </Card>

            <Card style={{ padding: "14px 16px" }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🎬 Film & TV Locations</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.5 }}>
                You're walking through more movie sets than you'd think! Fun game for the kids — "spot the film location" at each stop.
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { emoji: "⚔️", name: "Star Wars: Revenge of the Sith (2005)", location: "Grindelwald First", notes: "The mountain ridges at Grindelwald First became Princess Leia's home planet Alderaan — digitally enhanced for the film. Look around and imagine it as a galaxy far, far away!" },
                  { emoji: "🔫", name: "On Her Majesty's Secret Service (1969)", location: "Schilthorn / Piz Gloria + Grindelwald First", notes: "Bond's villain lair was filmed at Piz Gloria (now Bond World 007). Less known: the helicopter chase scenes used the ridgelines at Grindelwald First too — so First appears in TWO of your film spots." },
                  { emoji: "🏔️", name: "Touching the Void (2003)", location: "Jungfrau region", notes: "BAFTA-winning true story of a climbing accident in the Peruvian Andes — but mostly filmed right here, with the Jungfrau region standing in for the Andes." },
                  { emoji: "🇰🇷", name: "Crash Landing on You (Netflix)", location: "Jungfraujoch, Grindelwald First, Eiger Glacier, Kleine Scheidegg, Iseltwald, Giessbach, Lake Brienz", notes: "Netflix's biggest-ever non-English series — a South Korean heiress paraglides into North Korea. Huge chunks filmed across your ENTIRE itinerary. This is why so many Korean tourists visit these exact spots — you're walking the whole filming map!" },
                  { emoji: "📺", name: "Running Man (Korean variety show)", location: "Jungfraujoch + Schilthorn", notes: "Massively popular across Asia — featured both of your big mountain days." },
                  { emoji: "🦄", name: "Fantastic Beasts: The Crimes of Grindelwald", location: "Visible from Wengen", notes: "Villain Gellert Grindelwald's castle Nurmengard is visible from Wengen in the film. Yes — the character is literally named after your village!" },
                  { emoji: "🎖️", name: "Band of Brothers (HBO)", location: "Interlaken, Unterseen, Lake Thun, Grand Hotel Giessbach", notes: "Same Grand Hotel Giessbach you'll visit on your Lake Brienz day — used as a filming location for this acclaimed WWII miniseries." },
                  { emoji: "📖", name: "The Lord of the Rings (inspiration, not filmed here)", location: "Lauterbrunnen Valley", notes: "J.R.R. Tolkien visited the Jungfrau region and it's widely believed Lauterbrunnen Valley inspired Rivendell — the elven refuge in his books. Not filmed here, but a lovely bit of trivia for the valley." },
                ].map((item, i) => (
                  <div key={i} style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{item.emoji} {item.name}</div>
                    <div style={{ fontSize: 11, color: "#a21caf", marginBottom: 6 }}>📍 {item.location}</div>
                    <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{item.notes}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
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

function BudgetEditor({ title, lines, onAdd, onRemove, onChange, currency = "CHF" }) {
  const subtotal = useMemo(() => sumAmounts(lines), [lines]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <SmallBadge color="blue">Subtotal: {currency === "CHF" ? CHF.format(subtotal) : GBP.format(subtotal * CHF_TO_GBP)}</SmallBadge>
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
                  <div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{line.category || "Uncategorised"}</div>
                    {line.amount !== null && line.amount !== undefined && line.amount !== "" && (
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
                        {currency === "CHF" ? CHF.format(Number(line.amount) || 0) : GBP.format((Number(line.amount) || 0) * CHF_TO_GBP)}
                      </div>
                    )}
                  </div>
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
