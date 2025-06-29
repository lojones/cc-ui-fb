/**
 * Server Actions with Direct Photo Integration
 * This version embeds the child's photo directly in AI generation instead of using Cloudinary overlays
 */
"use server";

import { generateCardWithPhoto, type GenerateCardWithPhotoInput, type GenerateCardWithPhotoOutput } from "@/ai/flows/generate-card-with-photo";

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

export interface CardVariation extends GenerateCardWithPhotoOutput {
  id: string;
}

export async function createBaseballCardsAction(
  cardData: EnhancedCardData
): Promise<{ cards: CardVariation[] | null; error?: string }> {
  const timestamp = () => new Date().toISOString();
  console.log(`${timestamp()} 🎯 [PHOTO-ACTION] Starting card generation with direct photo integration`);
  console.log(`${timestamp()} 📝 [PHOTO-ACTION] Player: ${cardData.playerName} (${cardData.playerPosition || 'unspecified'})`);
  console.log(`${timestamp()} 🏆 [PHOTO-ACTION] Team: ${cardData.teamName || 'unspecified'}`);

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
    console.log(`${timestamp()} ✅ [PHOTO-ACTION] Validation passed, starting generation`);
    
    const numVariations = 3;
    const styles = [
      cardData.cardStyle,
      cardData.cardStyle === 'modern' ? 'classic' : 'modern',
      cardData.cardStyle === 'vintage' ? 'premium' : 'vintage'
    ];

    console.log(`${timestamp()} 🔧 [PHOTO-ACTION] Creating ${numVariations} variations with styles: ${styles.join(', ')}`);
    const generationPromises: Promise<GenerateCardWithPhotoOutput>[] = [];
    
    for (let i = 0; i < numVariations; i++) {
      const input: GenerateCardWithPhotoInput = {
        playerName: cardData.playerName,
        playerPhotoDataUri: cardData.playerPhotoDataUri,
        teamLogoDataUri: cardData.teamLogoDataUri,
        playerPosition: cardData.playerPosition,
        teamName: cardData.teamName,
        style: styles[i],
      };
      
      console.log(`${timestamp()} 🎨 [PHOTO-ACTION] Creating variation ${i + 1} with style: ${styles[i]}`);
      generationPromises.push(generateCardWithPhoto(input));
    }

    console.log(`${timestamp()} ⏳ [PHOTO-ACTION] Waiting for all card generations to complete...`);
    const results = await Promise.all(generationPromises);
    console.log(`${timestamp()} ✅ [PHOTO-ACTION] All card generations completed successfully`);
    
    const cards: CardVariation[] = results.map((result, index) => {
      const cardId = `photo_card_${index + 1}_${Date.now()}`;
      
      console.log(`${timestamp()} 📋 [PHOTO-ACTION] Creating card ${index + 1} with ID: ${cardId}`);
      console.log(`${timestamp()} 🖼️ [PHOTO-ACTION] Card ${index + 1} front URL length: ${result.cardFrontDataUri?.length || 'missing'}`);
      console.log(`${timestamp()} 🔄 [PHOTO-ACTION] Card ${index + 1} back URL length: ${result.cardBackDataUri?.length || 'missing'}`);
      
      return {
        ...result,
        id: cardId
      };
    });

    // Check for incomplete cards
    const incompleteCards = cards.filter(card => !card.cardFrontDataUri || !card.cardBackDataUri);
    if (incompleteCards.length > 0) {
        console.warn(`${timestamp()} ⚠️ [PHOTO-ACTION] ${incompleteCards.length} card variations might be incomplete.`);
        incompleteCards.forEach((card) => {
          console.warn(`${timestamp()} ❌ [PHOTO-ACTION] Incomplete card ${card.id}:`, {
            hasFront: !!card.cardFrontDataUri,
            hasBack: !!card.cardBackDataUri,
            hasStats: !!card.playerStats
          });
        });
    }

    console.log(`${timestamp()} 🎉 [PHOTO-ACTION] Card generation with photo integration completed successfully`);
    console.log(`${timestamp()} 📦 [PHOTO-ACTION] Returning ${cards.length} card variations`);
    
    return { cards };
  } catch (err: unknown) {
    console.error(`${timestamp()} 💥 [PHOTO-ACTION] Error generating cards with photo integration:`, err);
    if (err instanceof Error) {
      console.error(`${timestamp()} 💥 [PHOTO-ACTION] Error stack:`, err.stack);
    }
    
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
    return { cards: null, error: `Failed to generate card designs: ${errorMessage}. Please try again.` };
  }
}