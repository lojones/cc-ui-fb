/**
 * Simplified Server Actions for Baseball Card Generation
 * This version bypasses background removal to avoid validation errors
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
  console.log(`${timestamp()} 🎯 [SIMPLE-ACTION] Starting card generation process`);
  console.log(`${timestamp()} 📝 [SIMPLE-ACTION] Player name:`, cardData.playerName);

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
    console.log(`${timestamp()} ✅ [SIMPLE-ACTION] Validation passed, starting generation`);
    
    // Skip background removal for now to avoid validation issues
    const processedPlayerPhoto = cardData.playerPhotoDataUri;
    
    const numVariations = 3;
    const baseStyles = ['modern', 'classic', 'vintage'];
    
    const styles: string[] = [
      cardData.cardStyle,
      baseStyles.find(s => s !== cardData.cardStyle) || 'classic',
      baseStyles.find(s => s !== cardData.cardStyle && s !== baseStyles.find(s => s !== cardData.cardStyle)) || 'vintage'
    ];

    console.log(`${timestamp()} 🔧 [SIMPLE-ACTION] Loading reference images for ${numVariations} variations`);
    const referenceImages = await getRandomReferenceImages(numVariations);
    
    console.log(`${timestamp()} 🔧 [SIMPLE-ACTION] Creating generation promises for ${numVariations} variations`);
    const generationPromises: Promise<OpenAIComposedCardOutput>[] = [];
    
    for (let i = 0; i < numVariations; i++) {
      const referenceImage = referenceImages[i];
      
      const input: OpenAIComposedCardInput = {
        playerName: cardData.playerName,
        playerPhotoDataUri: processedPlayerPhoto,
        teamLogoDataUri: cardData.teamLogoDataUri,
        style: styles[i] || 'modern',
        frontReferenceImageDataUri: referenceImage?.dataUri,
        backReferenceImageDataUri: referenceImage?.dataUri,
        playerPosition: cardData.playerPosition,
        teamName: cardData.teamName,
        cardNumber: cardData.cardNumber,
        cardSet: cardData.cardSet,
        cardYear: cardData.cardYear,
        playerBio: cardData.playerBio,
        customStats: cardData.customStats,
      };
      
      console.log(`${timestamp()} 🎨 [SIMPLE-ACTION] Creating variation ${i + 1} with style: ${styles[i]}`);
      generationPromises.push(generateOpenAIComposedCard(input));
    }

    console.log(`${timestamp()} ⏳ [SIMPLE-ACTION] Waiting for all card generations to complete...`);
    const results = await Promise.all(generationPromises);
    console.log(`${timestamp()} ✅ [SIMPLE-ACTION] All card generations completed successfully`);
    
    const cards: CardVariation[] = results.map((result, index) => {
      const cardId = `card_variation_${index + 1}_${Date.now()}`;
      
      console.log(`${timestamp()} 📋 [SIMPLE-ACTION] Creating card ${index + 1} with ID: ${cardId}`);
      
      return {
        ...result,
        id: cardId
      };
    });

    const incompleteCards = cards.filter(card => !card.cardFrontDataUri || !card.cardBackDataUri);
    if (incompleteCards.length > 0) {
        console.warn(`${timestamp()} ⚠️ [SIMPLE-ACTION] ${incompleteCards.length} card variations might be incomplete.`);
    }

    console.log(`${timestamp()} 🎉 [SIMPLE-ACTION] Card generation process completed successfully`);
    console.log(`${timestamp()} 📦 [SIMPLE-ACTION] Returning ${cards.length} card variations`);
    
    return { cards };
  } catch (err: unknown) {
    console.error(`${timestamp()} 💥 [SIMPLE-ACTION] Error generating card designs:`, err);
    
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
    return { cards: null, error: `Failed to generate card designs: ${errorMessage}. Please try again.` };
  }
}