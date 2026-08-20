export type Language = "en" | "hi";

const dict = {
  greeting: { en: "Good evening, Priyanshu.", hi: "शुभ संध्या, प्रियांशु।" },
  greetingSub: { en: "What do you need today?", hi: "आज आपको क्या चाहिए?" },
  readyToListen: { en: "READY TO LISTEN", hi: "सुनने के लिए तैयार" },
  heroPrompt: { en: "What would you like to add?", hi: "आप क्या खरीदना चाहते हैं?" },
  listening: { en: "Listening…", hi: "सुन रहा हूँ…" },
  processing: { en: "Understanding your command…", hi: "आपकी बात समझ रहा हूँ…" },
  notUnderstood: { en: "Sorry, I couldn't understand that.", hi: "क्षमा करें, मैं समझ नहीं पाया।" },
  tryAgain: { en: "Try again", hi: "पुनः प्रयास करें" },
  trySaying: { en: "Try saying", hi: "बोलकर देखें" },
  youSaid: { en: "YOU SAID", hi: "आपने कहा" },
  action: { en: "ACTION", hi: "क्रिया" },
  item: { en: "ITEM", hi: "वस्तु" },
  quantity: { en: "QUANTITY", hi: "मात्रा" },
  shoppingList: { en: "Shopping List", hi: "खरीद सूची" },
  items: { en: "items", hi: "वस्तुएँ" },
  completed: { en: "completed", hi: "पूर्ण" },
  addItem: { en: "Add item", hi: "वस्तु जोड़ें" },
  addToList: { en: "Add to List", hi: "सूची में जोड़ें" },
  smartSuggestions: { en: "Smart Suggestions", hi: "स्मार्ट सुझाव" },
  suggestionsSub: { en: "Based on your shopping habits", hi: "आपकी खरीदारी की आदतों के आधार पर" },
  findSomething: { en: "Find something", hi: "कुछ खोजें" },
  findSomethingSub: { en: "Search products with your voice.", hi: "अपनी आवाज़ से उत्पाद खोजें।" },
  searchPlaceholder: {
    en: "Try saying: Find organic apples under ₹200",
    hi: "बोलें: ₹200 से कम में ऑर्गैनिक सेब खोजें",
  },
  recentActivity: { en: "Recent activity", hi: "हाल की गतिविधि" },
  emptyListTitle: { en: "Your list is clear.", hi: "आपकी सूची खाली है।" },
  emptyListSub: {
    en: "Tap the microphone and tell me what you need.",
    hi: "माइक्रोफ़ोन दबाएँ और बताएँ आपको क्या चाहिए।",
  },
  startSpeaking: { en: "Start speaking", hi: "बोलना शुरू करें" },
  add: { en: "Add", hi: "जोड़ें" },
  viewOptions: { en: "View options", hi: "विकल्प देखें" },
  noResultsTitle: { en: "No products matched your request.", hi: "कोई उत्पाद नहीं मिला।" },
  noResultsSub: {
    en: "Try a broader filter or a different product.",
    hi: "फ़िल्टर बदलकर पुनः प्रयास करें।",
  },
  home: { en: "Home", hi: "होम" },
  list: { en: "List", hi: "सूची" },
  discover: { en: "Discover", hi: "खोज" },
  search: { en: "Search", hi: "खोज" },
  history: { en: "History", hi: "इतिहास" },
  settings: { en: "Settings", hi: "सेटिंग्स" },
  micUnavailable: { en: "Microphone access is required.", hi: "माइक्रोफ़ोन की अनुमति आवश्यक है।" },
  results: { en: "results", hi: "परिणाम" },
} satisfies Record<string, Record<Language, string>>;

export type TranslationKey = keyof typeof dict;

export const translate = (key: TranslationKey, lang: Language) => dict[key][lang];
