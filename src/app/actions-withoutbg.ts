/**
 * Server Actions with WithoutBG Background Removal
 * This version uses WithoutBG.com for background removal and direct photo integration
 */
"use server";

import { generateCardWithPhoto, type GenerateCardWithPhotoInput, type GenerateCardWithPhotoOutput } from "@/ai/flows/generate-card-with-photo";
import { removeBackground, validateImageForBackgroundRemoval } from "@/lib/backgroundRemoval";

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
  backgroundRemoved?: boolean;
  processingTime?: number;
}

export async function createBaseballCardsAction(
  cardData: EnhancedCardData
): Promise<{ cards: CardVariation[] | null; error?: string }> {
  const timestamp = () => new Date().toISOString();
  const startTime = Date.now();
  
  console.log(`${timestamp()} 🎯 [WITHOUTBG-ACTION] Starting card generation with WithoutBG background removal`);
  console.log(`${timestamp()} 📝 [WITHOUTBG-ACTION] Player: ${cardData.playerName} (${cardData.playerPosition || 'unspecified'})`);
  console.log(`${timestamp()} 🏆 [WITHOUTBG-ACTION] Team: ${cardData.teamName || 'unspecified'}`);
  console.log(`${timestamp()} 🖼️ [WITHOUTBG-ACTION] Background removal: ${cardData.removeBackground ? 'enabled' : 'disabled'}`);

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
    console.log(`${timestamp()} ✅ [WITHOUTBG-ACTION] Validation passed, starting generation`);
    
    // Step 1: Handle background removal if requested
    let processedPlayerPhoto = cardData.playerPhotoDataUri;
    let backgroundRemoved = false;
    
    if (cardData.removeBackground) {
      console.log(`${timestamp()} 🔍 [WITHOUTBG-ACTION] Validating image for background removal...`);
      
      // Validate image before background removal
      const validation = validateImageForBackgroundRemoval(cardData.playerPhotoDataUri);
      if (!validation.valid) {
        console.log(`${timestamp()} ❌ [WITHOUTBG-ACTION] Image validation failed: ${validation.error}`);
        console.log(`${timestamp()} ⏭️ [WITHOUTBG-ACTION] Continuing with original image...`);
        // Continue with original image instead of failing
      } else {
        console.log(`${timestamp()} ✅ [WITHOUTBG-ACTION] Image validation passed, proceeding with WithoutBG...`);
        
        try {
          const bgRemovalResult = await removeBackground(cardData.playerPhotoDataUri, {
            preferredProvider: 'withoutbg',
            quality: 'high',
            format: 'png'
          });
          
          if (bgRemovalResult.success && bgRemovalResult.processedImageDataUri) {
            processedPlayerPhoto = bgRemovalResult.processedImageDataUri;
            backgroundRemoved = true;
            console.log(`${timestamp()} ✅ [WITHOUTBG-ACTION] Background removal successful using ${bgRemovalResult.provider}`);
          } else {
            console.log(`${timestamp()} ⚠️ [WITHOUTBG-ACTION] Background removal failed: ${bgRemovalResult.error}, using original image`);
          }
        } catch (bgError) {
          console.log(`${timestamp()} ⚠️ [WITHOUTBG-ACTION] Background removal error: ${bgError instanceof Error ? bgError.message : 'Unknown error'}, using original image`);
        }
      }
    } else {
      console.log(`${timestamp()} ⏭️ [WITHOUTBG-ACTION] Skipping background removal as requested`);
    }
    
    // Step 2: Generate cards with processed photo
    const numVariations = 3;
    const styles = [
      cardData.cardStyle,
      cardData.cardStyle === 'modern' ? 'classic' : 'modern',
      cardData.cardStyle === 'vintage' ? 'premium' : 'vintage'
    ];

    console.log(`${timestamp()} 🔧 [WITHOUTBG-ACTION] Creating ${numVariations} variations with styles: ${styles.join(', ')}`);
    const generationPromises: Promise<GenerateCardWithPhotoOutput>[] = [];
    
    for (let i = 0; i < numVariations; i++) {
      const input: GenerateCardWithPhotoInput = {
        playerName: cardData.playerName,
        playerPhotoDataUri: processedPlayerPhoto, // Use processed photo (with or without background removal)
        teamLogoDataUri: cardData.teamLogoDataUri,
        playerPosition: cardData.playerPosition,
        teamName: cardData.teamName,
        style: styles[i],
      };
      
      console.log(`${timestamp()} 🎨 [WITHOUTBG-ACTION] Creating variation ${i + 1} with style: ${styles[i]} ${backgroundRemoved ? '(background removed)' : '(original background)'}`);
      generationPromises.push(generateCardWithPhoto(input));
    }

    console.log(`${timestamp()} ⏳ [WITHOUTBG-ACTION] Waiting for all card generations to complete...`);
    const results = await Promise.all(generationPromises);
    console.log(`${timestamp()} ✅ [WITHOUTBG-ACTION] All card generations completed successfully`);
    
    const cards: CardVariation[] = results.map((result, index) => {
      const cardId = `withoutbg_card_${index + 1}_${Date.now()}`;
      const processingTime = Date.now() - startTime;
      
      console.log(`${timestamp()} 📋 [WITHOUTBG-ACTION] Creating card ${index + 1} with ID: ${cardId}`);
      console.log(`${timestamp()} 🖼️ [WITHOUTBG-ACTION] Card ${index + 1} front URL length: ${result.cardFrontDataUri?.length || 'missing'}`);
      console.log(`${timestamp()} 🔄 [WITHOUTBG-ACTION] Card ${index + 1} back URL length: ${result.cardBackDataUri?.length || 'missing'}`);
      
      return {
        ...result,
        id: cardId,
        backgroundRemoved,
        processingTime
      };
    });

    // Check for incomplete cards
    const incompleteCards = cards.filter(card => !card.cardFrontDataUri || !card.cardBackDataUri);
    if (incompleteCards.length > 0) {
        console.warn(`${timestamp()} ⚠️ [WITHOUTBG-ACTION] ${incompleteCards.length} card variations might be incomplete.`);
        incompleteCards.forEach((card) => {
          console.warn(`${timestamp()} ❌ [WITHOUTBG-ACTION] Incomplete card ${card.id}:`, {
            hasFront: !!card.cardFrontDataUri,
            hasBack: !!card.cardBackDataUri,
            hasStats: !!card.playerStats
          });
        });
    }

    console.log(`${timestamp()} 🎉 [WITHOUTBG-ACTION] Card generation with WithoutBG completed successfully`);
    console.log(`${timestamp()} 📦 [WITHOUTBG-ACTION] Returning ${cards.length} card variations (background removed: ${backgroundRemoved})`);
    console.log(`${timestamp()} ⏱️ [WITHOUTBG-ACTION] Total processing time: ${Date.now() - startTime}ms`);
    
    return { cards };
  } catch (err: unknown) {
    console.error(`${timestamp()} 💥 [WITHOUTBG-ACTION] Error generating cards with WithoutBG:`, err);
    if (err instanceof Error) {
      console.error(`${timestamp()} 💥 [WITHOUTBG-ACTION] Error stack:`, err.stack);
    }
    
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
    return { cards: null, error: `Failed to generate card designs: ${errorMessage}. Please try again.` };
  }
}