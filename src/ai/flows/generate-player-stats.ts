// src/ai/flows/generate-player-stats.ts
'use server';

/**
 * @fileOverview Generates fake, but realistic-looking, baseball stats for a player card.
 *
 * - generatePlayerStats - A function that generates the player stats.
 * - GeneratePlayerStatsInput - The input type for the generatePlayerStats function.
 * - GeneratePlayerStatsOutput - The return type for the generatePlayerStats function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePlayerStatsInputSchema = z.object({
  playerName: z.string().describe('The name of the baseball player.'),
  teamName: z.string().describe('The name of the baseball team.'),
});
export type GeneratePlayerStatsInput = z.infer<typeof GeneratePlayerStatsInputSchema>;

const GeneratePlayerStatsOutputSchema = z.object({
  battingAverage: z.number().describe('The batting average of the player.'),
  homeRuns: z.number().int().describe('The number of home runs the player has hit.'),
  rbis: z.number().int().describe('The number of RBIs the player has.'),
  era: z.number().describe('The ERA of the player, if they are a pitcher.'),
  wins: z.number().int().describe('The number of wins of the player, if they are a pitcher.'),
  losses: z.number().int().describe('The number of losses of the player, if they are a pitcher.'),
  description: z.string().describe('A short description of the player and their stats.')
});
export type GeneratePlayerStatsOutput = z.infer<typeof GeneratePlayerStatsOutputSchema>;

export async function generatePlayerStats(input: GeneratePlayerStatsInput): Promise<GeneratePlayerStatsOutput> {
  return generatePlayerStatsFlow(input);
}

const generatePlayerStatsPrompt = ai.definePrompt({
  name: 'generatePlayerStatsPrompt',
  input: {schema: GeneratePlayerStatsInputSchema},
  output: {schema: GeneratePlayerStatsOutputSchema},
  prompt: `You are an expert baseball statistician. Generate fake, but realistic-looking, baseball stats for a baseball card for the following player. Also generate a short description of the player and their stats.

Player Name: {{{playerName}}}
Team Name: {{{teamName}}}

Here is a list of stat categories that should be populated:
- Batting Average
- Home Runs
- RBIs
If the player is a pitcher, also include:
- ERA
- Wins
- Losses

Make sure all stats are realistic and make sense for the player.`,
});

const generatePlayerStatsFlow = ai.defineFlow(
  {
    name: 'generatePlayerStatsFlow',
    inputSchema: GeneratePlayerStatsInputSchema,
    outputSchema: GeneratePlayerStatsOutputSchema,
  },
  async input => {
    const {output} = await generatePlayerStatsPrompt(input);
    return output!;
  }
);
