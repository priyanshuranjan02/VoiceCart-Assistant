# 🛒 VoiceCart — Voice-First Shopping Assistant

> A multilingual, voice-first shopping assistant that lets users manage shopping lists, search products, and receive intelligent recommendations through natural language.

**VoiceCart** is a React + TypeScript application built for a Software Engineering technical assessment. It combines native browser speech recognition, deterministic multilingual NLP, a rule-based recommendation engine, multi-criteria product search, and persistent client-side state into a single mobile-first experience.

The application is designed around one principle:

> **Speak naturally. VoiceCart understands the intent and performs the action.**

---

## ✨ Highlights

* 🎙️ **Real browser voice recognition** with live interim/final transcripts
* 🧠 **Deterministic multilingual NLP** for English, Hindi, Hinglish, and Devanagari input
* 🛒 **Voice-controlled shopping list** with add, remove, update, complete, and clear actions
* 📦 **Automatic categorization** and quantity/unit extraction
* 🔎 **Voice product search** with product, brand, organic, size, and price constraints
* 💡 **Three-pillar recommendations** based on shopping habits, seasons, and product substitutes
* 💾 **Persistent state** using versioned `localStorage`
* 🔊 **Optional spoken confirmations** using browser Speech Synthesis
* 📱 **Responsive, mobile-first UI** with a voice-centric interaction model
* ✨ **Motion-based interactions** with reduced-motion support
* 🧪 **46 automated tests** covering NLP, shopping, search, recommendations, and persistence

---

# 🌟 Features

## 🎙️ 1. Real Browser Voice Recognition

VoiceCart uses the browser's native Speech Recognition APIs instead of a simulated voice pipeline.

Supported APIs:

* `SpeechRecognition`
* `webkitSpeechRecognition`

The voice lifecycle is:

```text
Idle
  ↓
Listening
  ↓
Live Transcript
  ↓
Processing
  ↓
Intent + Entity Extraction
  ↓
Action
  ↓
Confirmation
```

The interface provides:

* real-time interim transcripts
* final transcript handling
* animated listening state
* microphone permission handling
* timeout/no-speech handling
* unsupported-browser detection
* manual fallback when speech recognition is unavailable

---

## 🧠 2. Multilingual NLP Command Engine

VoiceCart uses a deterministic client-side NLP engine rather than requiring a cloud LLM.

### Supported intents

| Intent      | Example                          |
| ----------- | -------------------------------- |
| `ADD`       | "Add 2 bottles of milk"          |
| `REMOVE`    | "Remove bread"                   |
| `UPDATE`    | "Make milk quantity 3"           |
| `COMPLETE`  | "Mark apples as completed"       |
| `SEARCH`    | "Find organic apples under ₹200" |
| `RECOMMEND` | "What should I buy?"             |
| `CLEAR`     | "Clear my shopping list"         |

### Example natural-language commands

```text
Add two bottles of milk
I need five apples
Put bread on my list
Remove milk
Take apples off my list
Change milk quantity to 3
Find organic apples under ₹200
What should I buy?
```

### Multilingual support

English:

```text
Add two bottles of milk
```

Hindi:

```text
दो किलो सेब जोड़ो
```

Hinglish:

```text
Do packet bread add karo
```

The NLP layer supports:

* English number words
* Hindi/Hinglish number words
* Devanagari numbers and number words
* common units
* brand extraction
* product normalization
* price constraint extraction
* size extraction

Examples of supported entities include:

```text
2
two
दो
२

kg
g
litre
bottle
packet
pieces
bunch
loaf
किलो
लीटर
पैकेट
बोतल
```

---

# 🛒 3. Shopping List Engine

VoiceCart contains a dedicated shopping domain layer rather than embedding list logic inside React components.

### Supported operations

* Add item
* Remove item
* Update quantity
* Increment/decrement quantity
* Complete/uncomplete item
* Clear list
* Clear completed items

### Smart deduplication

Adding the same product merges quantities.

Example:

```text
Milk × 1
+
Milk × 2
=
Milk × 3
```

### Automatic categorization

Products are grouped into categories such as:

* Dairy
* Produce
* Bakery
* Snacks
* Personal Care
* Beverages
* Pantry
* Other

Unknown products safely fall back to `Other`.

---

# 💡 4. Intelligent Recommendation Engine

VoiceCart uses a three-pillar recommendation system.

### 1. Habit / Purchase History

Analyzes previous purchase intervals and elapsed time.

Example:

```text
You usually buy Milk every 7 days.
Last purchased 8 days ago.

→ You may need Milk.
```

### 2. Dynamic Seasonal Recommendations

Seasonal suggestions are determined from the current calendar month rather than being permanently hard-coded.

Examples include:

* summer produce
* winter fruits
* monsoon items

### 3. Product Substitutes

The substitution graph provides alternatives when users want another option.

Examples:

```text
Milk
├── Almond Milk
├── Soy Milk
└── Oat Milk
```

```text
Bread
└── Multigrain Bread
```

The user can view alternatives and add a substitute directly to the shopping list.

---

# 🔎 5. Multi-Criteria Product Search

VoiceCart supports voice-driven search using multiple constraints simultaneously.

Supported search attributes:

* product
* brand
* organic status
* size
* maximum price
* availability

Examples:

```text
Find toothpaste under ₹200

Find organic apples

Find NatureFresh apples

Find 1 kg apples under ₹200

Find NatureFresh organic apples, 1 kg, under ₹200
```

A voice query is converted into structured constraints before being evaluated against the product catalog.

Conceptually:

```json
{
  "product": "apples",
  "brand": "NatureFresh",
  "organic": true,
  "size": "1 kg",
  "maxPrice": 200
}
```

Search results support direct **Add to List** actions.

---

# 💾 6. Persistence & History

VoiceCart does not require a backend database for its core functionality.

User-specific state is persisted using a versioned `localStorage` layer:

```text
voicecart_v1_state
```

Persisted information includes:

* shopping list
* completed items
* activity history
* purchase history
* language preference

The persistence layer also provides an in-memory fallback for restricted storage environments.

Malformed stored state is handled safely instead of crashing the application.

---

# 🔊 7. Optional Spoken Feedback

VoiceCart can provide optional spoken confirmations using the browser's `SpeechSynthesis` API.

Example:

> "Added two bottles of Milk."

This is supplementary to the visual confirmation system and does not replace the UI feedback.

---

# ✨ 8. UI / UX

VoiceCart follows a **voice-first, mobile-first** interaction model.

The interface uses:

* dark premium visual language
* subtle glassmorphism
* soft gradients
* responsive cards
* Motion-based micro-interactions
* animated voice states
* real-time transcript feedback
* loading and error states
* responsive navigation

The microphone remains the primary interaction rather than being treated as an additional feature on a conventional shopping UI.

---

# 🏗️ Architecture

```text
                         User
                          │
                          ▼
                    Voice / Mic Input
                          │
                          ▼
             Browser Speech Recognition
                          │
                          ▼
                 Interim / Final Text
                          │
                          ▼
            Deterministic NLP Engine
            ┌────────────────────────┐
            │ Intent Classification  │
            │ Entity Extraction      │
            │ Number / Unit Parsing  │
            │ Product Normalization  │
            └────────────┬───────────┘
                         │
                         ▼
                  Command Dispatcher
                         │
        ┌────────────────┼─────────────────┐
        ▼                ▼                 ▼
 Shopping Engine    Search Engine    Recommendation Engine
        │                │                 │
        ▼                ▼                 ▼
    List State       Product Data       History/Season/
        │                │               Substitutes
        └────────────────┼─────────────────┘
                         ▼
                  Application State
                         │
                         ▼
                  Persistence Layer
                         │
                         ▼
                    React UI
                         │
             ┌───────────┴──────────┐
             ▼                      ▼
         Visual Feedback      Optional Speech
```

---

# 📂 Project Structure

```text
src/
├── domain/
│   ├── command.ts
│   ├── product.ts
│   ├── shopping.ts
│   └── recommendation.ts
│
├── services/
│   ├── speech/
│   │   ├── recognition.ts
│   │   └── synthesis.ts
│   │
│   ├── nlp/
│   │   ├── parser.ts
│   │   ├── entities.ts
│   │   ├── numbers.ts
│   │   └── normalizer.ts
│   │
│   ├── shopping/
│   │   ├── listEngine.ts
│   │   └── categorizer.ts
│   │
│   ├── search/
│   │   └── searchEngine.ts
│   │
│   ├── recommendations/
│   │   └── engine.ts
│   │
│   └── persistence/
│       └── storage.ts
│
├── lib/
│   └── voicecart/
│       ├── store.tsx
│       ├── useVoiceSession.ts
│       ├── useMicAvailability.ts
│       ├── data.ts
│       ├── i18n.ts
│       └── motion.ts
│
├── components/
│   └── voicecart/
│       ├── VoiceCommandCenter.tsx
│       ├── VoiceButton.tsx
│       ├── TranscriptPanel.tsx
│       ├── ShoppingList.tsx
│       ├── ShoppingListItem.tsx
│       ├── SmartSuggestions.tsx
│       ├── RecommendationCard.tsx
│       ├── VoiceSearch.tsx
│       ├── SearchResults.tsx
│       ├── ProductCard.tsx
│       ├── RecentActivity.tsx
│       ├── LanguageSelector.tsx
│       ├── AddItemDialog.tsx
│       └── AppShell.tsx
│
└── __tests__/
    ├── nlp.test.ts
    ├── shopping.test.ts
    ├── search.test.ts
    ├── recommendation.test.ts
    └── persistence.test.ts
```

---

# 🧪 Testing & Quality

The current implementation includes **46 automated tests** covering the core business logic.

| Area                     |     Coverage |
| ------------------------ | -----------: |
| NLP / intents / entities |     23 tests |
| Shopping engine          |      7 tests |
| Search engine            |      6 tests |
| Recommendation engine    |      5 tests |
| Persistence              |      5 tests |
| **Total**                | **46 tests** |

Current quality checks:

```text
npm test   → 46/46 passing
npm run lint → 0 errors
npm run build → successful
```

The implementation has also been manually verified for:

* browser speech recognition
* speech synthesis
* English and Hindi commands
* shopping-list operations
* multi-filter product search
* recommendations
* persistence
* responsive desktop UI
* responsive mobile UI

---

# 🌐 Browser Support

Voice recognition depends on browser support for the Web Speech API.

| Browser        | Speech Recognition | Speech Synthesis | Manual Input |
| -------------- | ------------------ | ---------------- | ------------ |
| Chrome Desktop | ✅                  | ✅                | ✅            |
| Chrome Android | ✅                  | ✅                | ✅            |
| Microsoft Edge | ✅                  | ✅                | ✅            |
| Safari         | Browser-dependent  | ✅                | ✅            |
| Firefox        | Limited / fallback | ✅                | ✅            |

If speech recognition is unavailable, VoiceCart provides a clear fallback instead of silently pretending that speech was recognized.

---

# 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### UI

* shadcn/ui
* Lucide Icons
* Motion for React

### Browser APIs

* Web Speech API
* Speech Synthesis API
* localStorage

### Testing

* Vitest

### Architecture

* Domain-driven application services
* Deterministic NLP
* Client-side state management
* Versioned persistence layer

---

# 🚀 Getting Started

## Prerequisites

* Node.js `>= 18`
* npm `>= 9`

## 1. Clone the repository

```bash
git clone https://github.com/priyanshuranjan02/VoiceCart-Assistant.git
cd VoiceCart-Assistant
```

## 2. Install dependencies

```bash
npm install
```

## 3. Start the development server

```bash
npm run dev
```

Open the URL shown by Vite in your browser.

## 4. Run tests

```bash
npm test
```

## 5. Run lint

```bash
npm run lint
```

## 6. Create a production build

```bash
npm run build
```

---

# 🎤 Example Voice Commands

### Shopping List

```text
"Add two bottles of milk."

"I need five apples."

"Remove bread."

"Make milk quantity three."

"Mark apples as completed."
```

### Search

```text
"Find organic apples."

"Find toothpaste under ₹200."

"Find NatureFresh apples."

"Find 1 kg apples under ₹200."
```

### Recommendations

```text
"What should I buy?"

"What am I likely to need?"

"Suggest an alternative to milk."
```

### Hindi / Hinglish

```text
"दो किलो सेब जोड़ो"

"ब्रेड हटा दो"

"दो packet bread add karo"
```

---

# 🧠 Design Decisions

## Why deterministic NLP instead of an LLM?

VoiceCart intentionally uses a deterministic NLP engine for its core shopping commands.

This provides:

* predictable behavior
* low latency
* no external API dependency
* no API-key management
* easier testing
* offline-capable command processing
* easier debugging
* reproducible results

An external LLM is not required for the core application.

## Why no external database?

VoiceCart is intentionally database-free for this assessment.

The application separates:

```text
Product Catalog
→ local application data

User State
→ versioned localStorage
```

This keeps the application lightweight and removes unnecessary backend infrastructure while retaining persistence and recommendation history.

The architecture can later be extended with a remote catalog or database without changing the core domain services.

## Why a local product catalog?

The product catalog is a controlled dataset used to demonstrate:

* search
* filtering
* categorization
* recommendations
* substitutes

The application does **not** claim to provide live marketplace pricing or inventory.

---

# ⚠️ Limitations

* Browser speech recognition availability varies by browser and platform.
* Voice recognition quality depends on microphone quality, language selection, pronunciation, and browser implementation.
* The product catalog is a local/sample dataset rather than live marketplace inventory.
* Recommendations are rule-based rather than trained machine-learning predictions.
* User data is stored locally in the browser and is not synchronized across devices.

---

# 📌 Assessment Deliverables

### Live Application

`https://<YOUR_DEPLOYED_URL>`

### GitHub Repository

`https://github.com/priyanshuranjan02/VoiceCart-Assistant`

---

# 👨‍💻 Project

**VoiceCart — Voice-First Shopping Assistant**

Built as a Software Engineering technical assessment demonstrating:

* voice interaction
* natural-language processing
* multilingual support
* search
* recommendations
* state management
* persistence
* responsive UI/UX
* automated testing
* maintainable software architecture
