'use server';

/**
 * @fileOverview Generates baseball cards by first creating templates with AI, then composing them with player photos and logos using Cloudinary.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateCardTemplate } from './generate-card-template';
import { composeCard } from '@/services/cardComposer';

const GenerateComposedCardInputSchema = z.object({
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
  style: z.string().optional().describe('Style preference for the card template (e.g., "modern", "vintage", "classic")'),
});
export type GenerateComposedCardInput = z.infer<typeof GenerateComposedCardInputSchema>;

const GenerateComposedCardOutputSchema = z.object({
  cardFrontDataUri: z
    .string()
    .describe(
      'A URL to the generated front of the baseball card image from Cloudinary.'
    ),
  cardBackDataUri: z
    .string()
    .describe(
      'A URL to the generated back of the baseball card image from Cloudinary.'
    ),
  playerStats: z.string().describe('Fake player statistics for the back of the card.'),
});
export type GenerateComposedCardOutput = z.infer<typeof GenerateComposedCardOutputSchema>;

export async function generateComposedCard(
  input: GenerateComposedCardInput
): Promise<GenerateComposedCardOutput> {
  return generateComposedCardFlow(input);
}

const generateComposedCardFlow = ai.defineFlow(
  {
    name: 'generateComposedCardFlow',
    inputSchema: GenerateComposedCardInputSchema,
    outputSchema: GenerateComposedCardOutputSchema,
  },
  async (input: GenerateComposedCardInput): Promise<GenerateComposedCardOutput> => {
    const { playerName, playerPhotoDataUri, teamLogoDataUri, style = 'modern' } = input;

    // Step 1: Generate Player Stats using a text model (without requiring images)
    const statsResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: [
        {text: `You are an expert baseball statistician.
Generate fake, but realistic-looking, player statistics for a rookie player named ${playerName}.
Create appropriate stats for a young, promising player just starting their career.
Output only the statistics as a single block of text suitable for a baseball card.

Format the response as:
Batting Average: [realistic average like .285-.320]
Home Runs: [modest number for rookie, 8-20]
RBIs: [reasonable number, 35-75]
Stolen Bases: [small number, 5-25]
Games Played: [partial season, 85-140]
---
[Write a brief, engaging 2-3 sentence bio about this rookie player's potential and standout qualities. Make it inspiring and age-appropriate.]

Player Name: ${playerName}`}
      ]
    });
    const playerStats = statsResponse.text;

    if (!playerStats) {
      throw new Error('Failed to generate player stats.');
    }

    // Step 2: Generate card templates
    const [frontTemplate, backTemplate] = await Promise.all([
      generateCardTemplate({ style, cardType: 'front' }),
      generateCardTemplate({ style, cardType: 'back' })
    ]);

    // Step 3: Compose cards using Cloudinary
    const [frontComposed, backComposed] = await Promise.all([
      composeCard({
        templateDataUri: frontTemplate.templateDataUri,
        playerPhotoDataUri,
        teamLogoDataUri,
        playerName,
      }),
      composeCard({
        templateDataUri: backTemplate.templateDataUri,
        playerPhotoDataUri,
        teamLogoDataUri,
        playerName,
      })
    ]);

    return {
      cardFrontDataUri: frontComposed.frontImageUrl,
      cardBackDataUri: backComposed.backImageUrl,
      playerStats,
    };
  }
);