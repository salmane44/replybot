import { GoogleGenAI } from "@google/genai";
import { ChannelProfile, CommentData } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const analyzeChannelProfile = async (channelIdentifier: string): Promise<Partial<ChannelProfile>> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      I need to configure an AI persona for a YouTube channel identified by: "${channelIdentifier}".
      
      Tasks:
      1. Search for this channel on YouTube (it might be a Name, Handle, Channel ID, or Full URL).
      2. **Crucial**: Look at the **titles and descriptions** of the most recent videos found for this channel.
      3. Based on the video content, descriptions, and channel "About" section, analyze the persona.
      
      Return a response in the following strict format:
      NAME: [The actual display name of the channel]
      DESCRIPTION: [A concise description of the channel's niche based on its video topics (max 300 chars)]
      KEYWORDS: [5 comma-separated adjectives describing the style (e.g., fast-paced, educational, chaotic)]
      TONE: [Pick exactly one: Friendly, Professional, Humorous, Sarcastic, or Hype]
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable grounding to find real channel info
        temperature: 0.5,
      },
    });

    const text = response.text || "";
    
    // Simple parsing logic based on the requested format
    const nameMatch = text.match(/NAME:\s*(.+)/i);
    const descriptionMatch = text.match(/DESCRIPTION:\s*(.+)/i);
    const keywordsMatch = text.match(/KEYWORDS:\s*(.+)/i);
    const toneMatch = text.match(/TONE:\s*(.+)/i);

    const detectedTone = toneMatch ? toneMatch[1].trim() : "Friendly";
    const validTones = ['Friendly', 'Professional', 'Humorous', 'Sarcastic', 'Hype'];
    const finalTone = validTones.find(t => t.toLowerCase() === detectedTone.toLowerCase()) || 'Friendly';

    return {
      name: nameMatch ? nameMatch[1].trim() : channelIdentifier, // Update name if found
      description: descriptionMatch ? descriptionMatch[1].trim() : "",
      styleKeywords: keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [],
      tone: finalTone as any,
    };

  } catch (error) {
    console.error("Error analyzing channel:", error);
    throw new Error("Failed to analyze channel. Please try entering details manually.");
  }
};

export const generateReply = async (
  profile: ChannelProfile,
  comment: CommentData
): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";

    const systemInstruction = `
      You are the content creator for the YouTube channel "${profile.name}".
      
      Channel Description:
      ${profile.description}
      
      Your Persona:
      - Tone: ${profile.tone}
      - Keywords: ${profile.styleKeywords.join(", ")}
      
      Task:
      Reply to the viewer's comment. 
      - If a video URL/context is provided, use the search tool to understand what happened in the video so the reply is accurate.
      - Be authentic to the creator's style.
      - Keep it under 300 characters unless the question is complex.
    `;

    // Construct a context-aware prompt
    let userPrompt = `Viewer Name: ${comment.author}\nViewer Comment: "${comment.text}"\n`;

    if (comment.videoUrl) {
      userPrompt += `\nContext: The comment is on this video: ${comment.videoUrl}. Use Google Search to find the video title and description to understand the context.`;
    }

    userPrompt += `\nWrite the reply:`;

    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }], // ENABLED: Real search for video context
        temperature: 0.7,
      },
    });

    return response.text || "Could not generate a reply.";
  } catch (error) {
    console.error("Error generating reply:", error);
    throw new Error("Failed to generate reply. Please check your connection and API key.");
  }
};
