import { describe, it, expect } from "vitest";
import { parseVoiceCommand } from "@/services/nlp/parser";

describe("NLP Command Engine", () => {
  describe("ADD Intent", () => {
    it("parses simple English add command", () => {
      const res = parseVoiceCommand("Add milk");
      expect(res.intent).toBe("ADD");
      expect(res.product).toBe("Milk");
      expect(res.quantity).toBe(1);
    });

    it("parses quantity and unit", () => {
      const res = parseVoiceCommand("Add 2 bottles of milk");
      expect(res.intent).toBe("ADD");
      expect(res.product).toBe("Milk");
      expect(res.quantity).toBe(2);
      expect(res.unit).toBe("bottles");
    });

    it("parses textual number", () => {
      const res = parseVoiceCommand("I need five apples");
      expect(res.intent).toBe("ADD");
      expect(res.product).toBe("Apples");
      expect(res.quantity).toBe(5);
    });

    it("parses colloquial phrasing 'Put bread on my list'", () => {
      const res = parseVoiceCommand("Put bread on my list");
      expect(res.intent).toBe("ADD");
      expect(res.product).toBe("Bread");
    });

    it("parses Hindi command 'दूध जोड़ो'", () => {
      const res = parseVoiceCommand("दूध जोड़ो");
      expect(res.intent).toBe("ADD");
      expect(res.product).toBe("Milk");
      expect(res.quantity).toBe(1);
    });

    it("parses Hindi command with Devanagari quantity 'दो किलो सेब जोड़ो'", () => {
      const res = parseVoiceCommand("दो किलो सेब जोड़ो");
      expect(res.intent).toBe("ADD");
      expect(res.product).toBe("Apples");
      expect(res.quantity).toBe(2);
      expect(res.unit).toBe("kg");
    });

    it("parses Hinglish command '2 packet chips add karo'", () => {
      const res = parseVoiceCommand("2 packet chips add karo");
      expect(res.intent).toBe("ADD");
      expect(res.product).toBe("Chips");
      expect(res.quantity).toBe(2);
      expect(res.unit).toBe("packs");
    });
  });

  describe("REMOVE Intent", () => {
    it("parses 'Remove milk'", () => {
      const res = parseVoiceCommand("Remove milk");
      expect(res.intent).toBe("REMOVE");
      expect(res.product).toBe("Milk");
    });

    it("parses 'Delete bread'", () => {
      const res = parseVoiceCommand("Delete bread");
      expect(res.intent).toBe("REMOVE");
      expect(res.product).toBe("Bread");
    });

    it("parses 'Take apples off my list'", () => {
      const res = parseVoiceCommand("Take apples off my list");
      expect(res.intent).toBe("REMOVE");
      expect(res.product).toBe("Apples");
    });

    it("parses Hindi 'ब्रेड हटा दो'", () => {
      const res = parseVoiceCommand("ब्रेड हटा दो");
      expect(res.intent).toBe("REMOVE");
      expect(res.product).toBe("Bread");
    });
  });

  describe("UPDATE Intent", () => {
    it("parses 'Make milk quantity 3'", () => {
      const res = parseVoiceCommand("Make milk quantity 3");
      expect(res.intent).toBe("UPDATE");
      expect(res.product).toBe("Milk");
      expect(res.quantity).toBe(3);
    });

    it("parses 'Change apples to 5'", () => {
      const res = parseVoiceCommand("Change apples to 5");
      expect(res.intent).toBe("UPDATE");
      expect(res.product).toBe("Apples");
      expect(res.quantity).toBe(5);
    });
  });

  describe("COMPLETE Intent", () => {
    it("parses 'Mark milk as completed'", () => {
      const res = parseVoiceCommand("Mark milk as completed");
      expect(res.intent).toBe("COMPLETE");
      expect(res.product).toBe("Milk");
    });

    it("parses 'Completed apples'", () => {
      const res = parseVoiceCommand("Completed apples");
      expect(res.intent).toBe("COMPLETE");
      expect(res.product).toBe("Apples");
    });
  });

  describe("SEARCH Intent", () => {
    it("parses 'Find toothpaste under 200'", () => {
      const res = parseVoiceCommand("Find toothpaste under 200");
      expect(res.intent).toBe("SEARCH");
      expect(res.product).toBe("Toothpaste");
      expect(res.maxPrice).toBe(200);
    });

    it("parses 'Find organic apples'", () => {
      const res = parseVoiceCommand("Find organic apples");
      expect(res.intent).toBe("SEARCH");
      expect(res.product).toBe("Apples");
      expect(res.organic).toBe(true);
    });

    it("parses brand search 'Find Colgate toothpaste'", () => {
      const res = parseVoiceCommand("Find Colgate toothpaste");
      expect(res.intent).toBe("SEARCH");
      expect(res.product).toBe("Toothpaste");
      expect(res.brand).toBe("Colgate");
    });
  });

  describe("RECOMMEND Intent", () => {
    it("parses 'What should I buy?'", () => {
      const res = parseVoiceCommand("What should I buy?");
      expect(res.intent).toBe("RECOMMEND");
    });

    it("parses 'Suggest something'", () => {
      const res = parseVoiceCommand("Suggest something");
      expect(res.intent).toBe("RECOMMEND");
    });

    it("parses Hindi 'क्या खरीदना चाहिए?'", () => {
      const res = parseVoiceCommand("क्या खरीदना चाहिए?");
      expect(res.intent).toBe("RECOMMEND");
    });
  });

  describe("CLEAR Intent", () => {
    it("parses 'Clear my shopping list'", () => {
      const res = parseVoiceCommand("Clear my shopping list");
      expect(res.intent).toBe("CLEAR");
    });

    it("parses 'Empty cart'", () => {
      const res = parseVoiceCommand("Empty cart");
      expect(res.intent).toBe("CLEAR");
    });
  });
});
