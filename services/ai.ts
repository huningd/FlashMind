import { GoogleGenAI, Type } from "@google/genai";

export interface AI_Flashcard {
  front: string;
  back: string;
}

// Helper to determine the API Key
// Priority: User Settings (localStorage) -> Environment Variable
function getApiKey(): string | undefined {
  const customKey = localStorage.getItem('custom_api_key');
  if (customKey && customKey.trim() !== '') {
    return customKey;
  }
  return process.env.API_KEY;
}

// We initialize the client inside the function to ensure process.env is accessible
// and to prevent top-level runtime errors if 'process' is undefined during module loading.

export async function generateFlashcardsFromImage(
  base64Image: string, 
  mimeType: string,
  userPrompt: string = ""
): Promise<AI_Flashcard[]> {
  
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key fehlt. Bitte konfiguriere den API Key in den Einstellungen.");
  }

  // Initialize client here
  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Using gemini-3-pro-preview for complex reasoning tasks (extracting study material)
  const modelId = "gemini-3-pro-preview";

  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: base64Image,
    },
  };

  const promptText = `
    Analyze the attached image and create a set of flashcards for studying.
    ${userPrompt ? `User instructions: ${userPrompt}` : ''}
    
    If the image contains text (like a document, book page, or notes), extract key concepts, terms, or questions.
    If the image is an object or scene, create identifying questions or conceptual questions related to it.
    
    Create concise Question (front) and Answer (back) pairs.
    Keep the language matching the content of the image (e.g. if image text is German, use German).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [imagePart, { text: promptText }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: "The question or front side of the card" },
              back: { type: Type.STRING, description: "The answer or back side of the card" },
            },
            required: ["front", "back"],
          },
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return Array.isArray(data) ? data : [];
    }
    return [];

  } catch (error: any) {
    console.error("Gemini AI Generation Error:", error);
    if (error.message?.includes('API key')) {
        throw new Error("Ungültiger API Key. Bitte prüfe deine Einstellungen.");
    }
    throw new Error("Fehler bei der KI-Generierung. Bitte versuche es erneut.");
  }
}

export async function generateFlashcardsFromText(
  topic: string,
  deckDescription: string = ""
): Promise<AI_Flashcard[]> {
  
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key fehlt. Bitte konfiguriere den API Key in den Einstellungen.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const modelId = "gemini-3-pro-preview"; // Using Pro for better creative generation and context understanding

  const promptText = `
    Create a set of study flashcards based on the following topic or text provided by the user.
    
    User Input / Topic: "${topic}"
    
    ${deckDescription ? `Context (Deck Description): The cards belong to a deck described as: "${deckDescription}". Ensure the difficulty and subject matter align with this description.` : ''}

    Instructions:
    1. Create concise Question (front) and Answer (back) pairs.
    2. Focus on key facts, definitions, or concepts.
    3. If the input is raw text, summarize it into Q&A.
    4. If the input is a topic, generate relevant questions.
    5. Detect the language of the topic/description and generate cards in that language.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [{ text: promptText }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: "The question or front side of the card" },
              back: { type: Type.STRING, description: "The answer or back side of the card" },
            },
            required: ["front", "back"],
          },
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error: any) {
    console.error("Gemini AI Text Generation Error:", error);
     if (error.message?.includes('API key')) {
        throw new Error("Ungültiger API Key. Bitte prüfe deine Einstellungen.");
    }
    throw new Error("Fehler bei der KI-Generierung. Bitte versuche es erneut.");
  }
}