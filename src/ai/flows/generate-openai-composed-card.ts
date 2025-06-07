'use server';

/**
 * @fileOverview Generates baseball cards using OpenAI DALL-E for templates, then composing them with player photos and logos using Cloudinary.
 */

import { generateOpenAITemplate } from './generate-openai-template';
import { composeCard } from '@/services/cardComposer';
import { openai } from '@/lib/openai';

export interface OpenAIComposedCardInput {
  playerPhotoDataUri: string;
  teamLogoDataUri: string;
  playerName: string;
  style?: string;
  frontReferenceImageDataUri?: string; // Optional reference for front template
  backReferenceImageDataUri?: string; // Optional reference for back template
}

export interface OpenAIComposedCardOutput {
  cardFrontDataUri: string;
  cardBackDataUri: string;
  playerStats: string;
}

export async function generateOpenAIComposedCard(
  input: OpenAIComposedCardInput
): Promise<OpenAIComposedCardOutput> {
  const { playerName, playerPhotoDataUri, teamLogoDataUri, style = 'modern', frontReferenceImageDataUri, backReferenceImageDataUri } = input;
  const timestamp = () => new Date().toISOString();

  console.log(`${timestamp()} 🚀 [OPENAI-FLOW] Starting card generation for player: ${playerName} (style: ${style})`);
  console.log(`${timestamp()} 📸 [OPENAI-FLOW] Photo data URI length:`, playerPhotoDataUri.length);
  console.log(`${timestamp()} 🏆 [OPENAI-FLOW] Logo data URI length:`, teamLogoDataUri.length);

  // Step 1: Generate Player Stats using OpenAI text generation
  console.log(`${timestamp()} 📊 [OPENAI-FLOW] Step 1: Generating player stats with GPT-4...`);
  const statsResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert baseball statistician who creates realistic rookie player statistics.',
      },
      {
        role: 'user',
        content: `Generate fake, but realistic-looking, player statistics for a rookie player named ${playerName}.
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

Player Name: ${playerName}`,
      },
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  const playerStats = statsResponse.choices[0]?.message?.content;
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