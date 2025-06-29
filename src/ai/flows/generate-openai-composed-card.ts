'use server';

/**
 * @fileOverview Generates baseball cards using OpenAI DALL-E for templates, then composing them with player photos and logos using Cloudinary.
 */

import { generateOpenAITemplate } from './generate-openai-template';
import { composeCard } from '@/services/cardComposer';
import { openai } from '@/lib/openai';

export interface OpenAIComposedCardInput {
  // Required fields
  playerPhotoDataUri: string;
  teamLogoDataUri: string;
  playerName: string;
  
  // Style and template options
  style?: string;
  frontReferenceImageDataUri?: string; // Optional reference for front template
  backReferenceImageDataUri?: string; // Optional reference for back template
  
  // Enhanced player information
  playerPosition?: string;
  teamName?: string;
  cardNumber?: string;
  cardSet?: string;
  cardYear?: string;
  playerBio?: string;
  customStats?: string; // Pre-defined stats to use instead of generating
}

export interface OpenAIComposedCardOutput {
  cardFrontDataUri: string;
  cardBackDataUri: string;
  playerStats: string;
}

export async function generateOpenAIComposedCard(
  input: OpenAIComposedCardInput
): Promise<OpenAIComposedCardOutput> {
  const { 
    playerName, 
    playerPhotoDataUri, 
    teamLogoDataUri, 
    style = 'modern', 
    frontReferenceImageDataUri, 
    backReferenceImageDataUri,
    playerPosition,
    teamName,
    cardNumber,
    cardSet,
    cardYear,
    playerBio,
    customStats
  } = input;
  
  const timestamp = () => new Date().toISOString();

  console.log(`${timestamp()} 🚀 [OPENAI-FLOW] Starting enhanced card generation for player: ${playerName}`);
  console.log(`${timestamp()} 🏟️ [OPENAI-FLOW] Position: ${playerPosition || 'unspecified'}, Team: ${teamName || 'unspecified'}`);
  console.log(`${timestamp()} 🎨 [OPENAI-FLOW] Style: ${style}, Set: ${cardSet || 'unspecified'}, Year: ${cardYear || 'current'}`);
  console.log(`${timestamp()} 📸 [OPENAI-FLOW] Photo data URI length:`, playerPhotoDataUri.length);
  console.log(`${timestamp()} 🏆 [OPENAI-FLOW] Logo data URI length:`, teamLogoDataUri.length);
  console.log(`${timestamp()} 📝 [OPENAI-FLOW] Custom stats provided:`, !!customStats);
  console.log(`${timestamp()} 📖 [OPENAI-FLOW] Biography provided:`, !!playerBio);

  // Step 1: Generate or use custom Player Stats
  let playerStats: string;
  
  if (customStats) {
    console.log(`${timestamp()} 📊 [OPENAI-FLOW] Step 1: Using provided custom statistics`);
    playerStats = customStats;
  } else {
    console.log(`${timestamp()} 📊 [OPENAI-FLOW] Step 1: Generating contextual player stats with GPT-4...`);
    
    // Build enhanced context for stat generation
    let contextPrompt = `Generate fake, but realistic-looking, player statistics for a rookie player named ${playerName}.`;
    
    if (playerPosition) {
      contextPrompt += ` The player is a ${playerPosition}.`;
    }
    
    if (teamName) {
      contextPrompt += ` They play for the ${teamName}.`;
    }
    
    if (cardYear) {
      contextPrompt += ` This is their ${cardYear} season stats.`;
    }
    
    if (playerBio) {
      contextPrompt += `\n\nPlayer Background: ${playerBio}`;
      contextPrompt += `\nUse this background information to create appropriate statistics that match their described abilities and playing style.`;
    }
    
    contextPrompt += `\n\nCreate appropriate stats for a young, promising player just starting their career.
Output only the statistics as a single block of text suitable for a baseball card.

Format the response as:
Batting Average: [realistic average like .285-.320, adjust based on position and background]
Home Runs: [modest number for rookie, 8-20, adjust for position - pitchers get fewer]
RBIs: [reasonable number, 35-75, adjust based on position and described abilities]
Stolen Bases: [small number, 5-25, higher for speedier positions]
Games Played: [partial season, 85-140]`;

    if (playerPosition) {
      if (playerPosition.toLowerCase().includes('pitcher')) {
        contextPrompt += `
ERA: [earned run average, 3.20-4.50 for rookie]
Wins: [modest wins, 6-12]
Strikeouts: [good for rookie pitcher, 85-150]
WHIP: [walks + hits per inning, 1.20-1.45]`;
      }
    }

    contextPrompt += `
---
[Write a brief, engaging 2-3 sentence bio about this rookie player's potential and standout qualities. Make it inspiring and age-appropriate.`;
    
    if (playerBio) {
      contextPrompt += ` Incorporate elements from their background but expand with baseball-specific achievements and potential.`;
    }
    
    contextPrompt += `]

Player Name: ${playerName}`;
    
    const statsResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert baseball statistician who creates realistic rookie player statistics. You tailor statistics to match player positions and backgrounds, ensuring they are age-appropriate and inspiring for young players.',
        },
        {
          role: 'user',
          content: contextPrompt,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    playerStats = statsResponse.choices[0]?.message?.content || '';
  }

  if (!playerStats) {
    console.error(`${timestamp()} ❌ [OPENAI-FLOW] Failed to generate player stats - no content in response`);
    throw new Error('Failed to generate player stats.');
  }
  console.log(`${timestamp()} ✅ [OPENAI-FLOW] Player stats generated successfully, length:`, playerStats.length);

  // Step 2: Generate card templates
  console.log(`${timestamp()} 🎨 [OPENAI-FLOW] Step 2: Generating card templates with GPT Image...`);
  console.log(`${timestamp()} 🎨 [OPENAI-FLOW] Generating front template...`);
  console.log(`${timestamp()} 🎨 [OPENAI-FLOW] Generating back template...`);
  const [frontTemplate, backTemplate] = await Promise.all([
    generateOpenAITemplate({ 
      style, 
      cardType: 'front',
      referenceImageDataUri: frontReferenceImageDataUri
    }),
    generateOpenAITemplate({ 
      style, 
      cardType: 'back',
      referenceImageDataUri: backReferenceImageDataUri
    })
  ]);
  console.log(`${timestamp()} ✅ [OPENAI-FLOW] Templates generated successfully`);
  console.log(`${timestamp()} 🖼️ [OPENAI-FLOW] Front template data URI length:`, frontTemplate.templateDataUri.length);
  console.log(`${timestamp()} 🔄 [OPENAI-FLOW] Back template data URI length:`, backTemplate.templateDataUri.length);

  // Step 3: Compose cards using Cloudinary
  console.log(`${timestamp()} ☁️ [OPENAI-FLOW] Step 3: Composing cards with Cloudinary...`);
  console.log(`${timestamp()} ☁️ [OPENAI-FLOW] Composing front card...`);
  console.log(`${timestamp()} ☁️ [OPENAI-FLOW] Composing back card...`);
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
  console.log(`${timestamp()} ✅ [OPENAI-FLOW] Cards composed successfully`);
  console.log(`${timestamp()} 🖼️ [OPENAI-FLOW] Front composed URL:`, frontComposed.frontImageUrl);
  console.log(`${timestamp()} 🔄 [OPENAI-FLOW] Back composed URL:`, backComposed.backImageUrl);

  console.log(`${timestamp()} 🎉 [OPENAI-FLOW] Card generation completed for player:`, playerName);
  return {
    cardFrontDataUri: frontComposed.frontImageUrl,
    cardBackDataUri: backComposed.backImageUrl,
    playerStats,
  };
}