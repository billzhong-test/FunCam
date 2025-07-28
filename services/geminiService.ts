import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    // This will be handled by the environment, but good practice to check.
    console.warn("API_KEY environment variable not set. The app will not work without it.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Converts a base64 data URL to a Gemini GenerativePart.
 * It strips the "data:image/jpeg;base64," prefix.
 */
function base64ToGenerativePart(base64ImageData: string, mimeType: string) {
    const base64Data = base64ImageData.split(',')[1];
    if (!base64Data) {
        throw new Error("Invalid base64 image data.");
    }
    return {
        inlineData: {
            data: base64Data,
            mimeType,
        },
    };
}

/**
 * Uses a multimodal model to generate a creative text prompt based on an image.
 * This is a private helper function.
 */
const generateImagePrompt = async (base64ImageData: string): Promise<string> => {
    const imagePart = base64ToGenerativePart(base64ImageData, "image/jpeg");
    const textPart = {
        text: `Analyze the person in this photo. Create a detailed, descriptive prompt for an image generation model to create a new, funny image based on this person.
        First, describe their key visual features like hair style and color, facial hair, glasses, and general appearance.
        Then, add a surreal, absurd, or hilarious element to the scene. Be creative!
        For example: 'A photorealistic image of a man with short brown hair and a beard, wearing a black t-shirt. He is riding a skateboard made of a giant slice of pizza.'
        The prompt should be a single, direct instruction for an AI image generator. Do not add any conversational text or explanation. Just output the prompt.`
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });
    
    const text = response.text;
    if (!text) {
        throw new Error("API failed to generate an image prompt.");
    }
    return text.trim();
};

export const generateFunnyImage = async (base64ImageData: string): Promise<string> => {
    try {
        // Step 1: Generate a text prompt based on the user's image
        const imagePrompt = await generateImagePrompt(base64ImageData);

        // Step 2: Generate an image using the new prompt
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: imagePrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                // Keep it square for consistency with original capture aspect
                aspectRatio: '1:1', 
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image.imageBytes) {
             throw new Error("Image generation failed to return an image.");
        }

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;

    } catch (error) {
        console.error("Error generating funny image:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API call failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the image.");
    }
};
