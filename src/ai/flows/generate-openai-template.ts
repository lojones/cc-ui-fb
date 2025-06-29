'use server';

/**
 * @fileOverview Generates baseball card templates using OpenAI DALL-E without player photos or logos.
 * Templates are designed with placeholder areas for photos and logos to be added later via Cloudinary.
 */

import { openai } from '@/lib/openai';

export interface OpenAITemplateInput {
  style?: string;
  cardType: 'front' | 'back';
  referenceImageDataUri?: string; // Optional reference image to guide generation
}

export interface OpenAITemplateOutput {
  templateDataUri: string;
}

export async function generateOpenAITemplate(
  input: OpenAITemplateInput
): Promise<OpenAITemplateOutput> {
  const { style = 'modern', cardType, referenceImageDataUri } = input;
  const timestamp = () => new Date().toISOString();

  console.log(`${timestamp()} 🎨 [DALLE] Starting template generation: ${cardType} card, ${style} style`);
  if (referenceImageDataUri) {
    console.log(`${timestamp()} 🖼️ [DALLE] Using reference image, length: ${referenceImageDataUri.length}`);
  }

  let prompt: string;
  
  const baseRequirements = `
CRITICAL REQUIREMENTS - MUST FOLLOW EXACTLY:
1. EXACT DIMENSIONS: 1024x1792 pixels (matches 2.5" x 3.5" baseball card ratio)
2. ABSOLUTELY NO TEXT: Zero words, letters, numbers, or characters of any kind
3. NO TYPOGRAPHY: No fonts, no text overlays, no written content whatsoever
4. SINGLE CARD ONLY: Do not show multiple cards or layouts
5. VERTICAL ORIENTATION: Portrait mode only
6. TEMPLATE ONLY: Empty colored areas and shapes for future content placement
${referenceImageDataUri ? '7. FOLLOW REFERENCE: Use the provided reference image as a style and layout guide but remove all text' : ''}`;

  if (cardType === 'front') {
    prompt = `Create a baseball card front template design in ${style} style.

Requirements:
- Vertical rectangle 1024x1792 pixels
- Large rectangular area in center for photo placement
- Small square area in top corner for logo placement
- Banner area at bottom for text placement
- Decorative border design around edges
- Bright sports card colors
- Clean geometric layout
- No text or letters anywhere
- Single card template only

The design should be a colorful template with empty areas for future content placement.`;
  } else {
    prompt = `Create a baseball card back template design in ${style} style.

Requirements:
- Vertical rectangle 1024x1792 pixels
- Small circle area at top for logo placement
- Rectangular area below for name placement
- Grid of rectangular boxes for statistics placement
- Visual divider lines between sections
- Clean organized layout
- Bright sports card colors
- No text or letters anywhere
- Single card template only

The design should be a colorful template with empty boxes for future content placement.`;
  }

  console.log(`${timestamp()} 📝 [DALLE] Generated prompt length: ${prompt.length} characters`);
  
  try {
    console.log(`${timestamp()} 🔄 [GPT-IMAGE] Making request to GPT Image using Images API...`);
    
    // Use the simple prompt directly with GPT Image model
    const finalPrompt = prompt;
    console.log(`${timestamp()} 📝 [GPT-IMAGE] Using direct prompt:`, finalPrompt);
    
    const result = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: finalPrompt,
    });
    
    console.log(`${timestamp()} ✅ [GPT-IMAGE] Received response from GPT Image`);

    // Extract base64 image data from the response
    const image_base64 = result.data && result.data[0] && result.data[0].b64_json;
    
    if (!image_base64) {
      console.error(`${timestamp()} ❌ [GPT-IMAGE] No image data received from GPT Image`);
      throw new Error('No image data received from GPT Image');
    }
    
    console.log(`${timestamp()} 📦 [GPT-IMAGE] Image data received, length:`, image_base64.length);
    
    const templateDataUri = `data:image/png;base64,${image_base64}`;
    console.log(`${timestamp()} ✅ [GPT-IMAGE] Template data URI created, total length:`, templateDataUri.length);
    
    return { templateDataUri };
  } catch (error) {
    console.error(`${timestamp()} 💥 [GPT-IMAGE] GPT Image generation error:`, error);
    if (error instanceof Error) {
      console.error(`${timestamp()} 💥 [GPT-IMAGE] Error stack:`, error.stack);
    }
    throw new Error(`Failed to generate ${cardType} template with GPT Image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}