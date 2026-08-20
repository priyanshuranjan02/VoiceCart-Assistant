# VoiceCart — Voice-First Shopping Assistant

VoiceCart is a voice-first shopping assistant designed to simplify grocery list management through natural speech commands in both **English** and **Hindi**. It features real-time speech recognition, a deterministic multilingual Natural Language Processing (NLP) engine, an intelligent 3-pillar recommendation system, combined voice search, and persistent state management.

---

## 🌟 Key Features

### 🎙️ 1. Real Browser Voice Recognition

- **Native Web Speech Recognition**: Supports standard `SpeechRecognition` and `webkitSpeechRecognition`.
- **Real-time Streaming Transcripts**: Visualizes interim transcripts while speaking, accompanied by responsive waveform and pulse animations.
- **Microphone Permissions & Fallbacks**: Graceful error handling for permission denials, unsupported browsers, and no-speech timeouts, with simulated badge phrase fallback.
- **Multilingual Input**: Seamless switching between Indian English (`en-IN`) and Hindi (`hi-IN`).

### 🧠 2. Multilingual NLP Command Engine

- **Structured Intent Classification**:
  - `ADD`: _"Add 2 bottles of milk"_, _"I need five apples"_, _"दूध जोड़ो"_, _"दो किलो सेब जोड़ो"_, _"2 packet chips add karo"_
  - `REMOVE`: _"Remove milk"_, _"Delete bread"_, _"Take apples off my list"_, _"ब्रेड हटा दो"_
  - `UPDATE`: _"Make milk quantity 3"_, _"Change apples to 5"_, _"दूध 3 कर दो"_
  - `COMPLETE`: _"Mark milk as completed"_, _"Completed apples"_, _"सेब हो गया"_
  - `SEARCH`: _"Find toothpaste under 200"_, _"Find organic apples"_, _"Colgate paste khojo"_
  - `RECOMMEND`: _"What should I buy?"_, _"Suggest something"_, _"क्या खरीदना चाहिए?"_
  - `CLEAR`: _"Clear my shopping list"_, _"Empty cart"_, _"लिस्ट खाली करो"_
- **Comprehensive Entity Extraction**:
  - English numeric words (`one`, `two`, `five`, `dozen`, `half`)
  - Hindi & Hinglish numerals (`ek`, `do`, `teen`, `chaar`, `paanch`, `darjan`, `aadha`)
  - Devanagari numerals (`१`, `२`, `३`, `एक`, `दो`, `तीन`, `चार`, `पाँच`, `दर्जन`, `आधा`)
  - Unit parsing (`kg`, `g`, `litre`, `bottle`, `pack`, `pieces`, `bunch`, `tubes`, `loaf`, `carton`, `किलो`, `लीटर`, `पैकेट`, `बोतल`)
  - Brand extraction (`Amul`, `Britannia`, `Colgate`, `NatureFresh`, `FreshFarm`, `Dabur`, `Lay's`, etc.)
  - Price ceiling detection (`Under ₹200`, `below 150`, `200 se kam`)

### 🛒 3. Shopping List & Automatic Categorization

- **Smart Deduplication & Merging**: Adding _Milk_ (quantity 2) when _Milk_ (quantity 1) exists merges into _Milk × 3_.
- **Automatic Category Grouping**: Auto-maps products into `Dairy`, `Produce`, `Bakery`, `Snacks`, `Personal Care`, `Beverages`, `Pantry`, and safely defaults novel items to `Other`.
- **Quantity & Checkoff Controls**: Increment, decrement, toggle completion, and delete actions directly from UI or by voice.

### 💡 4. Intelligent 3-Pillar Recommendation Engine

1. **Habit / Frequency Analysis**: Analyzes purchase history intervals to predict replenishment needs (e.g. _"You usually buy this every 7 days · Last purchased 8 days ago"_).
2. **Dynamic Seasonal Matching**: Evaluates calendar month dynamically (`new Date().getMonth()`) to recommend peak seasonal produce (Summer Mangoes, Winter Apples/Oranges, Monsoon harvest).
3. **Product Substitutes Graph**: Offers alternative options for staples (Milk ↔ Almond Milk ↔ Soy Milk, White Bread ↔ Multigrain Bread, Colgate ↔ Herbal Toothpaste).

### 🔍 5. Multi-Filter Product Search Engine

- Combined multi-attribute filtering by product concept, brand, organic status, and price constraint (`under ₹200`).
- Instant "Add to List" action directly from search results.

### 💾 6. Persistence & History Tracking

- Schema-versioned `localStorage` storage layer (`voicecart_v1_state`) saving items, activity logs, purchase records, and language preference.
- Built-in fallback to an in-memory store in private browsing or restricted storage environments.

### 🔊 7. Optional Spoken Audio Feedback

- Lightweight `SpeechSynthesis` verbal confirmations (e.g., _"Added 2 bottles of Milk"_) upon successful command execution.

---

## 🏗️ Architecture & Pipeline

```text
User Speech / Mic
       ↓
Browser Speech Recognition (SpeechRecognition / webkitSpeechRecognition)
       ↓
Interim / Final Transcript
       ↓
Deterministic NLP Engine (Intent Classifier + Multilingual Entity Extractor)
       ↓
Command Dispatcher (useVoiceCart / Store)
 ┌───────────────────────┬──────────────────────────┬────────────────────────┐
 ↓                       ↓                          ↓                        ↓
Shopping List Engine    Search Engine         Recommendation Engine    Activity & Storage
(Merge, Delete, Group)  (Multi-filter query)  (Habit, Season, Graph)   (localStorage Sync)
       ↓                       ↓                          ↓                        ↓
UI Animation & Updates  Search Results View   Smart Suggestions View   Live Activity & Toast
       ↓
Optional Speech Synthesis Confirmation ("Added 2 bottles of Milk")
```

---

## 📂 Project Structure

```text
src/
├── domain/                      # Core domain types & interfaces
│   ├── command.ts               # Intent, ParsedCommand, Entity models
│   ├── product.ts               # Product, Category, Season models
│   ├── shopping.ts              # ListItem, Activity, PurchaseHistory models
│   └── recommendation.ts        # Suggestion & Recommendation models
│
├── services/                    # Framework-agnostic business logic
│   ├── speech/
│   │   ├── recognition.ts       # Browser SpeechRecognition adapter
│   │   └── synthesis.ts         # Optional SpeechSynthesis feedback
│   ├── nlp/
│   │   ├── parser.ts            # Command tokenizer & intent classifier
│   │   ├── entities.ts          # Quantity, unit, brand, price extractors
│   │   ├── numbers.ts           # Multilingual (EN/HI/Devanagari) number parser
│   │   └── normalizer.ts        # Product concept and Unicode normalizer
│   ├── shopping/
│   │   ├── listEngine.ts        # Pure shopping list operations & deduplication
│   │   └── categorizer.ts       # Product-to-category classifier
│   ├── search/
│   │   └── searchEngine.ts      # Multi-criteria local search
│   ├── recommendations/
│   │   └── engine.ts            # Habit, dynamic seasonal & substitute engine
│   └── persistence/
│       └── storage.ts           # LocalStorage engine with memory fallback
│
├── lib/voicecart/               # Context providers & React adapters
│   ├── store.tsx                # Central app state & persistence bridge
│   ├── useVoiceSession.ts       # Speech lifecycle hook
│   ├── useMicAvailability.ts    # Mic capability hook
│   ├── data.ts                  # Product catalog & default datasets
│   ├── i18n.ts                  # Localization dictionary
│   └── motion.ts                # Animation spring presets
│
├── components/voicecart/        # Preserved UI components
│   ├── VoiceCommandCenter.tsx   # Microphone interaction hub
│   ├── VoiceButton.tsx          # Pulse/waveform voice button
│   ├── TranscriptPanel.tsx      # Real-time transcript & parsed tags
│   ├── ShoppingList.tsx         # Category-grouped grocery list
│   ├── ShoppingListItem.tsx     # Item tile with quantity/checkoff controls
│   ├── SmartSuggestions.tsx     # 3-pillar recommendation cards & modal
│   ├── RecommendationCard.tsx   # Individual suggestion tile
│   ├── VoiceSearch.tsx          # Combined filter voice search bar
│   ├── SearchResults.tsx        # Search output grid
│   ├── ProductCard.tsx          # Product card with one-tap add
│   ├── RecentActivity.tsx       # Timestamped activity log
│   ├── LanguageSelector.tsx     # Language toggle (EN / हिं)
│   ├── AddItemDialog.tsx        # Manual add modal
│   └── AppShell.tsx             # Responsive layout & navigation
│
└── __tests__/                   # Vitest automated test suites
    ├── nlp.test.ts              # Multilingual NLP intent & entity tests
    ├── shopping.test.ts         # List engine, merge & categorizer tests
    ├── search.test.ts           # Multi-filter search tests
    ├── recommendation.test.ts   # Habit, seasonal & substitute tests
    └── persistence.test.ts      # Storage serialization & fallback tests
```

---

## 🌐 Browser Compatibility Matrix

| Browser                               | Speech Recognition                       | Speech Synthesis | Manual Fallback |
| :------------------------------------ | :--------------------------------------- | :--------------- | :-------------- |
| **Google Chrome (Desktop & Android)** | ✅ Native (`webkitSpeechRecognition`)    | ✅ Supported     | ✅ Available    |
| **Microsoft Edge**                    | ✅ Native                                | ✅ Supported     | ✅ Available    |
| **Safari (macOS & iOS)**              | ✅ Supported (`webkitSpeechRecognition`) | ✅ Supported     | ✅ Available    |
| **Firefox**                           | ⚠️ Fallback to Click-to-Speak badge      | ✅ Supported     | ✅ Available    |

---

## 🛠️ Local Development & Testing

### Prerequisites

- Node.js `>= 18.0.0`
- npm `>= 9.0.0`

### 1. Install Dependencies

```sh
npm install
```

### 2. Run Automated Test Suite

```sh
npm test
```

### 3. Run Development Server

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```sh
npm run build
```

### 5. Run Linter

```sh
npm run lint
```

---

## 🔬 Design Decisions & Limitations

- **Deterministic NLP over Cloud LLM**: For speed, zero network latency, offline capability, predictability, and privacy, NLP parsing is executed deterministically on the client using multilingual tokenizers, phonetic alias matching, and grammar pattern extractors.
- **Client-side State & Storage**: State is managed in React with pure domain services and backed by versioned `localStorage`. No external database or backend server is required for full functionality.
- **Dynamic Date-driven Seasons**: Rather than hardcoding static recommendations, the system dynamically calculates the calendar month and maps seasonal products accordingly.
