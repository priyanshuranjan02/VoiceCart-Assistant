# 🛒 VoiceCart — Voice-First Shopping Assistant

> An English, Hindi and Hinglish voice-first shopping assistant built as a frontend prototype using browser speech recognition, deterministic NLP, local product data, rule-based recommendations and browser-side persistence.

**VoiceCart** is a React + TypeScript application built for a Software Engineering technical assessment and engineering portfolio. It combines native browser speech recognition, deterministic multilingual NLP, a rule-based recommendation engine, multi-criteria product search, and persistent client-side state into a mobile-first experience.

The application is designed around one core principle:

> **Speak naturally. VoiceCart understands the intent and performs the action.**

---

## 🔗 Live Application & Repository

- **Live Demo:** [https://voicecart-assistant.vercel.app/](https://voicecart-assistant.vercel.app/)
- **GitHub Repository:** [https://github.com/priyanshuranjan02/VoiceCart-Assistant](https://github.com/priyanshuranjan02/VoiceCart-Assistant)
- **Browser QA & Testing Matrix:** [docs/BROWSER-QA.md](docs/BROWSER-QA.md)

---

## ✨ Highlights

- 🎙️ **Real browser voice recognition** using native Web Speech APIs with live streaming interim/final transcripts
- 🧠 **Deterministic multilingual NLP** for English, Hindi, Hinglish, and Devanagari input
- 🛒 **Voice-controlled shopping list** with add, remove, update, complete, and clear actions
- 📦 **Automatic categorization** and quantity/unit extraction
- 🔎 **Multi-constraint voice product search** filtering simultaneously by product name, brand, organic flag, size, and price ceiling
- 💡 **Three-pillar recommendations** based on verified past purchase intervals, dynamic seasonal calendar matching, and product substitutes
- 💾 **Persistent state** using versioned `localStorage` with in-memory fallback
- 🔊 **Spoken confirmations** using browser Speech Synthesis
- 📱 **Responsive, mobile-first UI** preserving modern glassmorphism and Motion interactions
- 🧪 **109 automated tests** covering speech recognition exactly-once finalization, abort invalidation, lifecycle, NLP, shopping, multi-constraint search, recommendations, and persistence

---

# 🌟 Features

## 🎙️ 1. Real Browser Voice Recognition

VoiceCart connects directly to native browser speech engines rather than using a mock speech pipeline.

### Supported APIs:

- `SpeechRecognition`
- `webkitSpeechRecognition`

```text
Idle → Listening → Live Interim Transcript → Final Result → Intent & Entity Parser → Domain Action → Audio & Toast Confirmation
```

The voice pipeline delivers:

- Real-time streaming interim transcripts
- Single-delivery final transcript guarantees preventing duplicate executions
- Pulsing audio waveform feedback
- Graceful silence detection (6s timeout) and max recognition duration guard (10s)
- Typed error handling (`not-allowed`, `no-speech`, `audio-capture`, `network`, `not-supported`, `no-match`, `aborted`)
- Direct manual text input and click fallback when speech recognition is unavailable or denied

---

## 🧠 2. Multilingual NLP Command Engine

VoiceCart employs a deterministic client-side NLP engine instead of a remote LLM API, ensuring sub-10ms processing latency, full offline capability, zero cloud operational cost, and test reproducibility.

### Supported intents

| Intent      | Purpose                    | English Example                  | Hindi / Hinglish Example                        |
| :---------- | :------------------------- | :------------------------------- | :---------------------------------------------- |
| `ADD`       | Add item & merge quantity  | "Add 2 bottles of milk"          | "दो किलो सेब जोड़ो" / "2 packet chips add karo" |
| `REMOVE`    | Remove item by name        | "Remove bread"                   | "ब्रेड हटा दो" / "Milk hata do"                 |
| `UPDATE`    | Update item quantity       | "Make milk quantity 3"           | "दूध 3 कर दो"                                   |
| `COMPLETE`  | Check off item as bought   | "Mark apples as completed"       | "सेब हो गया"                                    |
| `SEARCH`    | Search product catalog     | "Find organic apples under ₹200" | "₹200 से कम में सेब खोजो"                       |
| `RECOMMEND` | Request suggestions        | "What should I buy?"             | "क्या खरीदना चाहिए?"                            |
| `CLEAR`     | Clear entire shopping list | "Clear my shopping list"         | "लिस्ट खाली करो"                                |

### Entity Extraction

The NLP pipeline automatically extracts and normalizes:

- **Product Concept:** Maps multilingual synonyms (e.g., _milk_, _doodh_, _दूध_) to canonical products.
- **Quantity & Units:** Numeric digits, English words (_one_, _two_, _dozen_), Hindi words (_ek_, _do_, _teen_, _aadha_, _darjan_), and Devanagari numerals (_१_, _२_, _३_, _पाँच_).
- **Brand:** Recognizes brands like _Amul_, _Britannia_, _Colgate_, _NatureFresh_, _FreshFarm_, _Dabur_, etc.
- **Organic Flag:** Identifies _organic_, _jaivik_, _जैविक_.
- **Size:** Extracts package sizing (_1 kg_, _500 g_, _1 L_, _200 g_, _400 g_, _6 pcs_).
- **Price Ceilings:** Disambiguates maximum price constraints (_under 200_, _below ₹150_, _200 se kam_) from item quantities.

---

## 🛒 3. Shopping List Management & Categorization

- **Smart Quantity Merging:** Adding _Milk × 2_ when _Milk × 1_ is already present merges into _Milk × 3_ instead of cluttering the list with duplicate entries.
- **Automatic Categorization:** Classifies products into 8 standard grocery departments: `Dairy`, `Produce`, `Bakery`, `Snacks`, `Personal Care`, `Beverages`, `Pantry`, and safely falls back to `Other`.
- **Purchase History Integrity:** Adding an item to the list does _not_ record a purchase. Completing an item (checking it off as bought) consistently records a purchase event, with built-in deduplication.

---

## 💡 4. Three-Pillar Recommendation Engine

1. **Habit / Replenishment Cadence:**
   - **Strict Data Requirement:** Only products with $\ge 2$ verified past purchases qualify for interval calculation.
   - Calculates actual reorder intervals ($t_2 - t_1$) and elapsed days (e.g., _"You usually buy this every 7 days · Last purchased 8 days ago"_). Never fabricates purchase habits when history is insufficient.
2. **Dynamic Seasonal Matching:**
   - Calculates the season dynamically from the current date (`new Date().getMonth()`) rather than static text.
   - Prioritizes peak seasonal goods (e.g. Summer Mangoes, Winter Apples/Oranges, Monsoon harvest).
3. **Product Substitutes:**
   - Offers healthy or dietary alternatives for grocery staples (Milk ↔ Almond Milk ↔ Soy Milk; Bread ↔ Multigrain Bread; Colgate ↔ Herbal Toothpaste) with an interactive alternative selection dialog.

---

## 🔎 5. Multi-Constraint Product Search

The search engine simultaneously satisfies multiple constraints:

```text
"Find NatureFresh organic apples under 200"
→ brand: NatureFresh AND organic: true AND product: apples AND price <= 200
```

Also supports:

- Brand + price constraints without product nouns (e.g., _"Amul under 100"_, _"Find NatureFresh under 200"_)
- Availability filtering (`inStockOnly: true`)
- Case-insensitive matching and instant one-tap "Add to List"

---

## 💾 6. Persistence & Storage Reliability

- Stored in browser `localStorage` under the schema `voicecart_v1_state`.
- Sanitizes and validates items, activity entries, and purchase history on load to prevent crashes from corrupted or partial JSON.
- Automatic fallback to an in-memory store in restricted environments (e.g. private browsing or disabled storage).

---

# 🏗️ Architecture

```text
src/
├── domain/                      # Domain models & type definitions
│   ├── command.ts               # Intent, ParsedCommand, Entity models
│   ├── product.ts               # Product, Category, Season models
│   ├── shopping.ts              # ListItem, Activity, PurchaseHistory models
│   └── recommendation.ts        # Suggestion & Recommendation models
│
├── services/                    # Pure, testable business services
│   ├── speech/
│   │   ├── recognition.ts       # Browser Web Speech recognition adapter
│   │   └── synthesis.ts         # Browser SpeechSynthesis feedback
│   ├── nlp/
│   │   ├── parser.ts            # Command tokenizer & intent classifier
│   │   ├── entities.ts          # Quantity, unit, brand, size, price extractors
│   │   ├── numbers.ts           # Multilingual (EN/HI/Devanagari) numeral parser
│   │   └── normalizer.ts        # Product concept and Unicode normalizer
│   ├── shopping/
│   │   ├── listEngine.ts        # Pure shopping list operations & deduplication
│   │   └── categorizer.ts       # Automatic category classifier
│   ├── search/
│   │   └── searchEngine.ts      # Multi-criteria local search & filtering
│   ├── recommendations/
│   │   └── engine.ts            # Habit, dynamic seasonal & substitute engine
│   └── persistence/
│       └── storage.ts           # Versioned localStorage with memory fallback
│
├── lib/voicecart/               # Context providers & React adapters
│   ├── store.tsx                # Central app state & persistence sync
│   ├── useVoiceSession.ts       # Speech recognition lifecycle hook
│   ├── useMicAvailability.ts    # Voice capability & permission hook
│   ├── data.ts                  # Sample catalogue & defaults
│   ├── i18n.ts                  # Localization dictionary (EN / HI)
│   └── motion.ts                # Animation spring presets
│
├── components/voicecart/        # UI components
│   ├── VoiceCommandCenter.tsx   # Microphone interaction hub & error feedback
│   ├── VoiceButton.tsx          # Pulse/waveform animated voice button
│   ├── TranscriptPanel.tsx      # Real-time transcript & parsed tags
│   ├── ShoppingList.tsx         # Category-grouped grocery list
│   ├── ShoppingListItem.tsx     # Item tile with quantity/checkoff controls
│   ├── SmartSuggestions.tsx     # 3-pillar recommendation cards
│   ├── RecommendationCard.tsx   # Individual suggestion tile
│   ├── VoiceSearch.tsx          # Multi-constraint search bar & filter chips
│   ├── SearchResults.tsx        # Search output grid & empty states
│   ├── ProductCard.tsx          # Product card with one-tap add
│   ├── RecentActivity.tsx       # Timestamped activity log
│   ├── LanguageSelector.tsx     # Language toggle (EN / हिं)
│   ├── AddItemDialog.tsx        # Manual add modal
│   └── AppShell.tsx             # Responsive layout & navigation
│
└── __tests__/                   # Automated Vitest test suites
    ├── speech.test.ts           # Web Speech lifecycle, timeouts & error handling
    ├── nlp.test.ts              # Multilingual NLP intent & entity tests
    ├── shopping.test.ts         # List engine, merge & categorizer tests
    ├── search.test.ts           # Multi-filter search tests
    ├── recommendation.test.ts   # Habit, seasonal & substitute tests
    └── persistence.test.ts      # Storage serialization, recovery & fallback
```

---

# 🧪 Testing & Quality Assurance

VoiceCart features **109 passing automated tests** across 6 test suites using Vitest:

| Test Suite          | File                                   |     Tests     | Coverage Scope                                                                                                                                           |
| :------------------ | :------------------------------------- | :-----------: | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NLP Engine**      | `src/__tests__/nlp.test.ts`            |    **35**     | English, Hindi, Hinglish, Devanagari numerals, size/price disambiguation, whitespace/casing                                                              |
| **Speech Service**  | `src/__tests__/speech.test.ts`         |    **31**     | Exactly-once finalization, safety timer, abort immediate state cleanup, rapid restart, native InvalidStateError handling, timer scoping, honest confidence |
| **Product Search**  | `src/__tests__/search.test.ts`         |    **13**     | Multi-constraint queries, brand + price without nouns, stock filter, case-insensitivity                                                                  |
| **Shopping Engine** | `src/__tests__/shopping.test.ts`       |    **10**     | Add, smart merge, remove, update, completion toggle, un-done re-add, clear                                                                               |
| **Recommendations** | `src/__tests__/recommendation.test.ts` |    **10**     | Dynamic seasons, fresh-user empty history guard, 2-purchase threshold, elapsed days, unique product IDs                                                  |
| **Persistence**     | `src/__tests__/persistence.test.ts`    |    **10**     | Fresh user zero-history, v1 schema migration, future versions preservation, deep field type validation, language fallback                                 |
| **Total**           |                                        | **109 tests** | **100% Passing**                                                                                                                                         |

### Quality Checks

```bash
bun run test   → 109/109 passing
bun run lint   → 0 errors
bun run build  → Clean production build (Client + SSR + Nitro)
```

See [docs/BROWSER-QA.md](docs/BROWSER-QA.md) for the manual physical browser testing matrix.

---

# 🌐 Browser Support

| Browser                     |          Speech Recognition           | Speech Synthesis | Manual Text / Tap Fallback | Status                  |
| :-------------------------- | :-----------------------------------: | :--------------: | :------------------------: | :---------------------- |
| **Google Chrome (Desktop)** | ✅ Native (`webkitSpeechRecognition`) |   ✅ Supported   |        ✅ Available        | Verified                |
| **Microsoft Edge**          |               ✅ Native               |   ✅ Supported   |        ✅ Available        | Verified                |
| **Safari macOS (Desktop)**  |               ✅ Native               |   ✅ Supported   |        ✅ Available        | Verified                |
| **Safari iOS (Mobile)**     |            Supported by OS            |   ✅ Supported   |        ✅ Available        | Untested physically     |
| **Mozilla Firefox**         |        ⚠️ Fallback with notice        |   ✅ Supported   |        ✅ Available        | Verified (honest error) |

---

# ⚠️ Prototype Scope & Limitations

- **Sample Catalogue:** Product prices, sizes, and availability are illustrative demonstration data from a local catalogue.
- **Deterministic Recommendations:** Recommendations are rule-based heuristics rather than a trained black-box machine learning model.
- **Browser-Local Storage:** Data is persisted in browser `localStorage` and is not synchronized across different devices or browsers.
- **Speech Engine Variance:** Browser speech recognition accuracy depends on microphone hardware, ambient noise, accent, and the platform's speech service.

---

# 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, TanStack Start, Nitro
- **Styling & Animation:** Tailwind CSS, Motion for React, shadcn/ui, Lucide Icons
- **Browser APIs:** Web Speech API (`SpeechRecognition`), Speech Synthesis API, Web Storage API
- **Testing & Tooling:** Vitest, ESLint, Prettier, Bun

---

# 🚀 Local Development Setup

### Prerequisites

- [Bun](https://bun.sh/) `>= 1.1` (or Node.js `>= 18` with npm)

### 1. Clone the repository

```bash
git clone https://github.com/priyanshuranjan02/VoiceCart-Assistant.git
cd VoiceCart-Assistant
```

### 2. Install dependencies

```bash
bun install --frozen-lockfile
```

_(Or `npm install`)_

### 3. Run development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run automated test suite

```bash
bun run test
```

### 5. Run linter & formatter check

```bash
bun run lint
```

### 6. Build for production

```bash
bun run build
```
