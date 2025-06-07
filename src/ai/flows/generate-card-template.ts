'use server';

/**
 * @fileOverview Generates baseball card templates using generative AI without player photos or logos.
 * Templates are designed with placeholder areas for photos and logos to be added later via Cloudinary.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCardTemplateInputSchema = z.object({
  style: z.string().optional().describe('Style preference for the card template (e.g., "modern", "vintage", "classic")'),
  cardType: z.enum(['front', 'back']).describe('Whether to generate front or back template'),
});
export type GenerateCardTemplateInput = z.infer<typeof GenerateCardTemplateInputSchema>;

const GenerateCardTemplateOutputSchema = z.object({
  templateDataUri: z
    .string()
    .describe(
      'A data URI containing the generated baseball card template image. The data URI must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type GenerateCardTemplateOutput = z.infer<typeof GenerateCardTemplateOutputSchema>;

export async function generateCardTemplate(
  input: GenerateCardTemplateInput
): Promise<GenerateCardTemplateOutput> {
  return generateCardTemplateFlow(input);
}

const generateCardTemplateFlow = ai.defineFlow(
  {
    name: 'generateCardTemplateFlow',
    inputSchema: GenerateCardTemplateInputSchema,
    outputSchema: GenerateCardTemplateOutputSchema,
  },
  async (input: GenerateCardTemplateInput): Promise<GenerateCardTemplateOutput> => {
    const { style = 'modern', cardType } = input;

    let templatePrompt: string;
    
    if (cardType === 'front') {
      templatePrompt = `Design a ${style} baseball card front template with the following specifications:
      
      - Standard baseball card dimensions and proportions (2.5" x 3.5")
      - A clearly defined rectangular area for a player photo (center-left, approximately 40% of card width, 60% of card height)
      - A designated circular or square area for a team logo (top-right corner, small size)
      - A name plate area at the bottom for player name text overlay
      - Professional ${style} baseball card styling with borders, gradients, or textures
      - Color scheme suitable for rookie cards (vibrant, energetic)
      - NO actual photos, logos, or text - just the template design with placeholder areas
      - The areas for photo and logo should be visually distinct (different colors/shading) to show placement
      - Include decorative elements like borders, patterns, or graphic elements typical of baseball cards`;
    } else {
      templatePrompt = `Design a ${style} baseball card back template with the following specifications:
      
      - Standard baseball card dimensions and proportions (2.5" x 3.5")
      - A small area for team logo (top center, small size)
      - A designated text area for player name (below logo)
      - A large statistics section with clearly defined areas for:
        * Batting statistics (batting average, home runs, RBIs, etc.)
        * Bio/description text area
      - Professional ${style} baseball card back styling
      - Grid lines or sections to organize statistical information
      - Color scheme that complements typical baseball card designs
      - NO actual logos, text, or statistics - just the template layout
      - Use placeholder boxes or shaded areas to show where content will be placed
      - Include typical baseball card back elements like borders and section dividers`;
    }

    const { media: templateMediaObj } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [{ text: templatePrompt }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    if (!templateMediaObj?.url) {
      throw new Error(`Failed to generate card ${cardType} template.`);
    }
    
    return {
      templateDataUri: templateMediaObj.url,
    };
  }
);