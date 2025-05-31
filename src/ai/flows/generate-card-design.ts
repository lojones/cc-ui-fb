'use server';

/**
 * @fileOverview Generates baseball card designs using generative AI based on uploaded images and a team logo.
 *
 * - generateCardDesign - A function that handles the baseball card design generation process.
 * - GenerateCardDesignInput - The input type for the generateCardDesign function.
 * - GenerateCardDesignOutput - The return type for the generateCardDesign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCardDesignInputSchema = z.object({
  playerPhotoDataUri: z
    .string()
    .describe(
      "A photo of the player, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  teamLogoDataUri: z
    .string()
    .describe(
      "A photo of the team logo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  playerName: z.string().describe('The name of the player.'),
});
export type GenerateCardDesignInput = z.infer<typeof GenerateCardDesignInputSchema>;

const GenerateCardDesignOutputSchema = z.object({
  cardFrontDataUri: z
    .string()
    .describe(
      'A data URI containing the generated front of the baseball card image.  The data URI must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'  
    ),
  cardBackDataUri: z
    .string()
    .describe(
      'A data URI containing the generated back of the baseball card image. The data URI must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    
    ),
  playerStats: z.string().describe('Fake player statistics for the back of the card.'),
});
export type GenerateCardDesignOutput = z.infer<typeof GenerateCardDesignOutputSchema>;

export async function generateCardDesign(
  input: GenerateCardDesignInput
): Promise<GenerateCardDesignOutput> {
  return generateCardDesignFlow(input);
}

const cardDesignPrompt = ai.definePrompt({
  name: 'cardDesignPrompt',
  input: {schema: GenerateCardDesignInputSchema},
  output: {schema: GenerateCardDesignOutputSchema},
  prompt: `You are an expert baseball card designer.\n\nYou will use the player's photo and team logo to create a unique baseball card design.\nYou will also generate fake player statistics for the back of the card.\n\nPlayer Name: {{{playerName}}}\nPlayer Photo: {{media url=playerPhotoDataUri}}\nTeam Logo: {{media url=teamLogoDataUri}}\n\nBased on this information, generate the front and back images of a baseball card, along with player statistics for the back.\nReturn the card front and back images as data URIs and the player statistics as a string.\n\nEnsure the generated images are visually appealing and suitable for a baseball card design.\nYour output should include realistic but fake statistics appropriate for a baseball player.\n`,
});

const generateCardDesignFlow = ai.defineFlow(
  {
    name: 'generateCardDesignFlow',
    inputSchema: GenerateCardDesignInputSchema,
    outputSchema: GenerateCardDesignOutputSchema,
  },
  async input => {
    // Generate card images and stats using the prompt
    const {output} = await cardDesignPrompt(input);

    return output!;
  }
);
