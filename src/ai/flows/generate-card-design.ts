
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

const generateCardDesignFlow = ai.defineFlow(
  {
    name: 'generateCardDesignFlow',
    inputSchema: GenerateCardDesignInputSchema,
    outputSchema: GenerateCardDesignOutputSchema,
  },
  async (input: GenerateCardDesignInput): Promise<GenerateCardDesignOutput> => {
    const { playerName, playerPhotoDataUri, teamLogoDataUri } = input;

    // Step 1: Generate Player Stats using a text model
    const statsResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash', // Configured default text model
      prompt: [
        {text: `You are an expert baseball statistician.
Generate fake, but realistic-looking, player statistics for ${playerName}.
Consider the player's appearance from the photo and the team context from the logo.
Output only the statistics as a single block of text suitable for a baseball card.
Example format:
Batting Average: .300
Home Runs: 25
RBIs: 80
Stolen Bases: 15
---
A brief, engaging bio about the player's rookie season and potential.

Player Name: ${playerName}`},
        {media: {url: playerPhotoDataUri}},
        {media: {url: teamLogoDataUri}}
      ]
    });
    const playerStats = statsResponse.text;

    if (!playerStats) {
      throw new Error('Failed to generate player stats.');
    }

    // Step 2: Generate Card Front Image using the experimental image model
    const frontImagePrompt = [
      { media: { url: playerPhotoDataUri } },
      { media: { url: teamLogoDataUri } },
      { text: `Design a visually appealing baseball card front for a rookie player named ${playerName}.
Incorporate the player's photo and the team logo prominently.
The style should be modern and exciting, suitable for a "Rookie Card".
Player Name: ${playerName}` },
    ];

    const { media: cardFrontMediaObj } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: frontImagePrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    if (!cardFrontMediaObj?.url) {
      throw new Error('Failed to generate card front image.');
    }
    const cardFrontDataUri = cardFrontMediaObj.url;

    // Step 3: Generate Card Back Image using the experimental image model
    const backImagePrompt = [
      { media: { url: teamLogoDataUri } }, // Team logo is usually on the back
      // Optionally, could include playerPhotoDataUri again if desired for the back design concept
      { text: `Design a baseball card back for ${playerName}.
It should display the player's name, team logo, and the following statistics clearly and attractively:
${playerStats}
The design should be clean, readable, and complement a modern rookie card aesthetic.
Player Name: ${playerName}` },
    ];

    const { media: cardBackMediaObj } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: backImagePrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!cardBackMediaObj?.url) {
      throw new Error('Failed to generate card back image.');
    }
    const cardBackDataUri = cardBackMediaObj.url;

    return {
      cardFrontDataUri,
      cardBackDataUri,
      playerStats,
    };
  }
);
