/**
 * Server Actions with Client-Side Canvas Generation
 * This version coordinates with client-side canvas generation to avoid server-side dependencies
 */
"use server";

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

export interface ClientCardVariation {
  id: string;
  cardFrontDataUri: string;
  cardBackDataUri: string;
  playerStats: string;
  backgroundRemoved?: boolean;
  processingTime: number;
}

export async function createBaseballCardsAction(
  cardData: EnhancedCardData
): Promise<{ cards: ClientCardVariation[] | null; error?: string }> {
  const timestamp = () => new Date().toISOString();
  const startTime = Date.now();
  
  console.log(`${timestamp()} 🎯 [CLIENT-CANVAS-ACTION] Starting client-side canvas card generation`);
  console.log(`${timestamp()} 📝 [CLIENT-CANVAS-ACTION] Player: ${cardData.playerName} (${cardData.playerPosition || 'unspecified'})`);
  console.log(`${timestamp()} 🏆 [CLIENT-CANVAS-ACTION] Team: ${cardData.teamName || 'unspecified'}`);
  console.log(`${timestamp()} 🖼️ [CLIENT-CANVAS-ACTION] Background removal: ${cardData.removeBackground ? 'enabled' : 'disabled'}`);

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
    console.log(`${timestamp()} ✅ [CLIENT-CANVAS-ACTION] Validation passed, starting generation`);
    
    // Step 1: Handle background removal if requested (server-side)
    let processedPlayerPhoto = cardData.playerPhotoDataUri;
    let backgroundRemoved = false;
    
    if (cardData.removeBackground) {
      console.log(`${timestamp()} 🔍 [CLIENT-CANVAS-ACTION] Validating image for background removal...`);
      
      // Validate image before background removal
      const validation = validateImageForBackgroundRemoval(cardData.playerPhotoDataUri);
      if (!validation.valid) {
        console.log(`${timestamp()} ❌ [CLIENT-CANVAS-ACTION] Image validation failed: ${validation.error}`);
        console.log(`${timestamp()} ⏭️ [CLIENT-CANVAS-ACTION] Continuing with original image...`);
        // Continue with original image instead of failing
      } else {
        console.log(`${timestamp()} ✅ [CLIENT-CANVAS-ACTION] Image validation passed, proceeding with WithoutBG...`);
        
        try {
          const bgRemovalResult = await removeBackground(cardData.playerPhotoDataUri, {
            preferredProvider: 'withoutbg',
            quality: 'high',
            format: 'png'
          });
          
          if (bgRemovalResult.success && bgRemovalResult.processedImageDataUri) {
            processedPlayerPhoto = bgRemovalResult.processedImageDataUri;
            backgroundRemoved = true;
            console.log(`${timestamp()} ✅ [CLIENT-CANVAS-ACTION] Background removal successful using ${bgRemovalResult.provider}`);
          } else {
            console.log(`${timestamp()} ⚠️ [CLIENT-CANVAS-ACTION] Background removal failed: ${bgRemovalResult.error}, using original image`);
          }
        } catch (bgError) {
          console.log(`${timestamp()} ⚠️ [CLIENT-CANVAS-ACTION] Background removal error: ${bgError instanceof Error ? bgError.message : 'Unknown error'}, using original image`);
        }
      }
    } else {
      console.log(`${timestamp()} ⏭️ [CLIENT-CANVAS-ACTION] Skipping background removal as requested`);
    }
    
    // Step 2: Prepare data for client-side generation
    const numVariations = 3;
    const styles = [
      cardData.cardStyle,
      cardData.cardStyle === 'modern' ? 'classic' : 'modern',
      cardData.cardStyle === 'vintage' ? 'premium' : 'vintage'
    ];

    console.log(`${timestamp()} 🔧 [CLIENT-CANVAS-ACTION] Preparing ${numVariations} variations with styles: ${styles.join(', ')}`);
    
    // Return processed data for client-side generation
    // The actual canvas generation will happen on the client side
    const cards: ClientCardVariation[] = styles.map((style, index) => {
      const cardId = `client_card_${index + 1}_${Date.now()}`;
      const processingTime = Date.now() - startTime;
      
      console.log(`${timestamp()} 📋 [CLIENT-CANVAS-ACTION] Preparing card ${index + 1} with ID: ${cardId}`);
      
      return {
        id: cardId,
        cardFrontDataUri: '', // Will be populated by client-side generation
        cardBackDataUri: '',  // Will be populated by client-side generation
        playerStats: '',      // Will be populated by client-side generation
        backgroundRemoved,
        processingTime
      };
    });

    console.log(`${timestamp()} 🎉 [CLIENT-CANVAS-ACTION] Server-side preparation completed successfully`);
    console.log(`${timestamp()} 📦 [CLIENT-CANVAS-ACTION] Returning ${cards.length} card variations (background removed: ${backgroundRemoved})`);
    console.log(`${timestamp()} ⏱️ [CLIENT-CANVAS-ACTION] Total processing time: ${Date.now() - startTime}ms`);
    
    // Return the processed photo and metadata for client-side generation
    return { 
      cards,
      // Include processed photo data for client-side use
      processedPlayerPhoto,
      backgroundRemoved
    } as any;
    
  } catch (err: unknown) {
    console.error(`${timestamp()} 💥 [CLIENT-CANVAS-ACTION] Error in server-side preparation:`, err);
    if (err instanceof Error) {
      console.error(`${timestamp()} 💥 [CLIENT-CANVAS-ACTION] Error stack:`, err.stack);
    }
    
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
    return { cards: null, error: `Failed to prepare card generation: ${errorMessage}. Please try again.` };
  }
}