import { ApiError } from "../utils/ApiError.js";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const generateGeminiResponse = async (prompt) => {
  if (!prompt?.trim()) {
    throw new ApiError(400, "Prompt is required");
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(503, "AI summary service is not configured");
  }

  try {
    const { ai } = await import("../config/gemini.js");

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    if (!response?.text) {
      throw new ApiError(503, "AI summary service returned an empty response");
    }

    return response.text;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    //normalising SDK errors into application's ApiError
    if (error?.status === 429 || error?.statusCode === 429) {
      //status code 429 means too many requests
      throw new ApiError(429, "AI summary rate limit exceeded");
    }

    if (error?.status >= 500 || error?.statusCode >= 500) {
      //status code 503 service unavailable
      throw new ApiError(503, "AI summary service is currently unavailable");
    }

    throw new ApiError(500, "Failed to generate AI summary");
  }
};

export { generateGeminiResponse };
