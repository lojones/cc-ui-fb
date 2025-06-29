/**
 * Quick fix for the validation error
 * This replaces the problematic validation code with a simpler version
 */
"use server";

import { generateOpenAIComposedCard, type OpenAIComposedCardInput, type OpenAIComposedCardOutput } from "@/ai/flows/generate-openai-composed-card";
import { getRandomReferenceImages } from "@/lib/referenceImages";

export interface EnhancedCardData {
  playerName: string;
  playerPosition?: string;
  teamName?: string;
  cardNumber?: string;
  cardSet?: string;
  cardYear?: string;
  playerBio?: string;
  customStats?: string;
  cardStyle: string;
  removeBackground: boolean;
  playerPhotoDataUri: string;
  teamLogoDataUri: string;
}

export interface CardVariation extends OpenAIComposedCardOutput {
  id: string;
}

export async function createBaseballCardsAction(
  cardData: EnhancedCardData
): Promise<{ cards: CardVariation[] | null; error?: string }> {
  const timestamp = () => new Date().toISOString();
  console.log(`${timestamp()} 🎯 [QUICK-FIX] Starting card generation`);

  // Basic validation
  if (!cardData.playerName.trim()) {
    return { cards: null, error: "Player name is required." };
  }
  if (!cardData.playerPhotoDataUri) {
    return { cards: null, error: "Player photo is required." };
  }
  if (!cardData.teamLogoDataUri) {
    return { cards: null, error: "Team logo is required." };
  }

  try {
    const numVariations = 3;
    const styles = [cardData.cardStyle, 'classic', 'vintage'];
    
    console.log(`${timestamp()} 🔧 [QUICK-FIX] Loading reference images`);
    const referenceImages = await getRandomReferenceImages(numVariations);
    
    const generationPromises: Promise<OpenAIComposedCardOutput>[] = [];
    
    for (let i = 0; i < numVariations; i++) {
      const referenceImage = referenceImages[i];
      
      const input: OpenAIComposedCardInput = {
        playerName: cardData.playerName,
        playerPhotoDataUri: cardData.playerPhotoDataUri, // Skip background removal for now
        teamLogoDataUri: cardData.teamLogoDataUri,
        style: styles[i] || 'modern',
        frontReferenceImageDataUri: referenceImage?.dataUri,
        backReferenceImageDataUri: referenceImage?.dataUri,
        playerPosition: cardData.playerPosition,
        teamName: cardData.teamName,
        cardNumber: cardData.cardNumber,
        cardYear: cardData.cardYear, // Use cardYear as defined in OpenAIComposedCardInput
        playerBio: cardData.playerBio,
        customStats: cardData.customStats,
      };
      
      generationPromises.push(generateOpenAIComposedCard(input));
    }

    const results = await Promise.all(generationPromises);
    
    const cards: CardVariation[] = results.map((result, index) => ({
      ...result,
      id: `card_variation_${index + 1}_${Date.now()}`
    }));

    return { cards };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
    return { cards: null, error: `Failed to generate card designs: ${errorMessage}` };
  }
}