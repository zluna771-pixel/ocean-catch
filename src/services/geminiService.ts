import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface SpeciesInfo {
  name: string;
  nameZh: string;
  scientificName: string;
  description: string;
  descriptionZh: string;
  habitat: string;
  habitatZh: string;
  funFact: string;
  funFactZh: string;
}

export async function identifySpecies(base64Image: string): Promise<SpeciesInfo> {
  const model = "gemini-3-flash-preview";
  
  try {
    const imageData = base64Image.split(',')[1];
    if (!imageData) throw new Error("Invalid image source data.");

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            {
              text: "System Instruction: You are a professional marine biologist expert. \n\nTask: Identify the exact sea fish or marine species in this image. Distinguish correctly between similar types (e.g., Golden Pompano vs Golden Trevally vs other Jacks). Provide accurate details in both English and Chinese. \n\nOutput: Return ONLY the JSON object matching the requested schema."
            },
            {
              inlineData: {
                data: imageData,
                mimeType: "image/jpeg"
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            nameZh: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            description: { type: Type.STRING },
            descriptionZh: { type: Type.STRING },
            habitat: { type: Type.STRING },
            habitatZh: { type: Type.STRING },
            funFact: { type: Type.STRING },
            funFactZh: { type: Type.STRING }
          },
          required: ["name", "nameZh", "scientificName", "description", "descriptionZh", "habitat", "habitatZh", "funFact", "funFactZh"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      console.warn("AI returned empty text. Image might be unclear or blocked by safety filters.");
      throw new Error("Unable to identify species. Please ensure the creature is clearly visible and try again.");
    }
    
    try {
      return JSON.parse(text.trim());
    } catch (parseError) {
      console.error("JSON Parse Error. Raw Text:", text.substring(0, 100));
      throw new Error("Data parsing error. Please try another shot.");
    }
  } catch (error: any) {
    console.error("Identification Error Details:", error);
    const msg = error.message || "Identification service error.";
    throw new Error(msg.includes("location") ? "Service restricted in your area." : msg);
  }
}
