/**
 * Alternative card generation that includes the child's photo directly in AI generation
 * This bypasses the Cloudinary composition step
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCardWithPhotoInputSchema = z.object({
  playerPhotoDataUri: z.string(),
  teamLogoDataUri: z.string(),
  playerName: z.string(),
  playerPosition: z.string().optional(),
  teamName: z.string().optional(),
  style: z.string().optional(),
});

const GenerateCardWithPhotoOutputSchema = z.object({
  cardFrontDataUri: z.string(),
  cardBackDataUri: z.string(),
  playerStats: z.string(),
});

export type GenerateCardWithPhotoInput = z.infer<typeof GenerateCardWithPhotoInputSchema>;
export type GenerateCardWithPhotoOutput = z.infer<typeof GenerateCardWithPhotoOutputSchema>;

export async function generateCardWithPhoto(
  input: GenerateCardWithPhotoInput
): Promise<GenerateCardWithPhotoOutput> {
  return generateCardWithPhotoFlow(input);
}

const generateCardWithPhotoFlow = ai.defineFlow(
  {
    name: 'generateCardWithPhotoFlow',
    inputSchema: GenerateCardWithPhotoInputSchema,
    outputSchema: GenerateCardWithPhotoOutputSchema,
  },
  async (input: GenerateCardWithPhotoInput): Promise<GenerateCardWithPhotoOutput> => {
    const { playerName, playerPhotoDataUri, teamLogoDataUri, playerPosition, teamName, style = 'modern' } = input;

    const timestamp = () => new Date().toISOString();
    console.log(`${timestamp()} 🎯 [PHOTO-FLOW] Starting direct photo integration for: ${playerName}`);

    // Step 1: Generate Player Stats
    const statsResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: [
        {
          text: `Generate realistic rookie baseball player statistics for ${playerName}.
          ${playerPosition ? `Position: ${playerPosition}` : ''}
          ${teamName ? `Team: ${teamName}` : ''}
          
          Create appropriate stats for a young player:
          - Batting Average: .280-.320
          - Home Runs: 8-15
          - RBIs: 35-55
          - Games Played: 85-120
          
          Format as card-ready text with a brief inspiring bio.`
        }
      ]
    });

    const playerStats = statsResponse.text || 'Promising rookie with great potential!';

    // Step 2: Generate Front Card with Photo Integration
    console.log(`${timestamp()} 🎨 [PHOTO-FLOW] Generating front card with integrated photo`);
    
    const frontPrompt = [
      { media: { url: playerPhotoDataUri } },
      { media: { url: teamLogoDataUri } },
      { 
        text: `Create a professional baseball trading card FRONT design featuring this player photo and team logo.

        Design Requirements:
        - Player Name: ${playerName}
        ${playerPosition ? `- Position: ${playerPosition}` : ''}
        ${teamName ? `- Team: ${teamName}` : ''}
        - Style: ${style} baseball card design
        
        IMPORTANT: The player photo must be prominently featured and clearly visible on the card.
        - Place the player photo as the main central element
        - Add the team logo in a corner position
        - Include the player name prominently
        - Use colors that complement the team logo
        - Create a professional, exciting baseball card layout
        
        Make this look like a real, high-quality baseball trading card that a kid would be excited to own.`
      }
    ];

    const { media: frontMediaObj } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: frontPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    if (!frontMediaObj?.url) {
      throw new Error('Failed to generate front card image.');
    }

    // Step 3: Generate Back Card
    console.log(`${timestamp()} 🔄 [PHOTO-FLOW] Generating back card with stats`);
    
    const backPrompt = [
      { media: { url: teamLogoDataUri } },
      { 
        text: `Create a professional baseball trading card BACK design for ${playerName}.
        
        Include these statistics prominently and clearly:
        ${playerStats}
        
        Design Requirements:
        - Clean, readable layout for statistics
        - Team logo prominently displayed
        - Player name at the top
        ${teamName ? `- Team name: ${teamName}` : ''}
        - Professional ${style} styling
        - Easy-to-read fonts and good contrast
        
        Make this look like the back of a real baseball trading card with clear, professional statistics layout.`
      }
    ];

    const { media: backMediaObj } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: backPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!backMediaObj?.url) {
      throw new Error('Failed to generate back card image.');
    }

    console.log(`${timestamp()} ✅ [PHOTO-FLOW] Card generation completed successfully`);

    return {
      cardFrontDataUri: frontMediaObj.url,
      cardBackDataUri: backMediaObj.url,
      playerStats,
    };
  }
);