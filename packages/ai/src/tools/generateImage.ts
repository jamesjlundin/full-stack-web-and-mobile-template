import { experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Image generation model - using OpenAI's DALL-E 3 (gpt-image-1.5 requires AI SDK 6+)
const IMAGE_MODEL = "dall-e-3";

export const generateImageToolSchema = z.object({
  prompt: z.string().describe("Detailed description of the image to generate"),
  size: z
    .enum(["1024x1024", "1792x1024", "1024x1792"])
    .default("1024x1024")
    .describe("Image dimensions (square, landscape, or portrait)"),
});

export type GenerateImageInput = z.infer<typeof generateImageToolSchema>;

export type GenerateImageResult = {
  success: true;
  imageBase64: string;
  prompt: string;
  size: string;
} | {
  success: false;
  error: string;
};

/**
 * Generate an image using OpenAI's GPT Image 1.5 model
 * Returns base64 image data that should be uploaded to Vercel Blob
 */
export async function executeGenerateImage(
  input: GenerateImageInput
): Promise<GenerateImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "Image generation requires an OpenAI API key. Please configure OPENAI_API_KEY.",
    };
  }

  try {
    const { image } = await generateImage({
      model: openai.image(IMAGE_MODEL),
      prompt: input.prompt,
      size: input.size,
    });

    return {
      success: true,
      imageBase64: image.base64,
      prompt: input.prompt,
      size: input.size,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image generation failed";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Tool definition for use with Vercel AI SDK streamText
 */
export const generateImageToolDef = {
  description:
    "Generate an image from a text description. Use when the user explicitly asks for an image to be generated (e.g., 'generate an image of...', 'create a picture of...', 'show me an image of...') or when a message starts with 'Generate an image:'.",
  inputSchema: generateImageToolSchema,
};
