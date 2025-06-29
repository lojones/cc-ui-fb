/**
 * Enhanced Server Actions for Baseball Card Generation
 * 
 * This file contains enhanced Next.js server actions that handle the backend logic
 * for generating AI-powered baseball cards with advanced features like background removal,
 * enhanced player data, and iterative design validation.
 */
"use server";

import { generateOpenAIComposedCard, type OpenAIComposedCardInput } from "@/ai/flows/generate-openai-composed-card";
import { getRandomReferenceImages } from "@/lib/referenceImages";
import { removeBackground, validateImageForBackgroundRemoval } from "@/lib/backgroundRemoval";
import { type EnhancedCardInput, type EnhancedCardOutput } from "@/types/card";

/**
 * Enhanced card variation with processing metadata
 */
export interface EnhancedCardVariation extends EnhancedCardOutput {
  // Inherits all properties from EnhancedCardOutput
}

/**
 * Enhanced server action that orchestrates the baseball card generation process
 * 
 * This function:
 * 1. Validates enhanced input parameters
 * 2. Processes background removal if requested
 * 3. Creates 3 different card variations with different styles
 * 4. Uses AI to generate both front/back card images and player stats
 * 5. Returns the generated cards or error messages
 * 
 * @param input - Enhanced card input with all player details
 * @returns Promise with either generated cards or error message
 */
export async function createEnhancedBaseballCardsAction(
  input: EnhancedCardInput
): Promise<{ cards: EnhancedCardVariation[] | null; error?: string }> {
  // Helper function to add timestamps to console logs for debugging
  const timestamp = () => new Date().toISOString();
  const startTime = Date.now();
  
  console.log(`${timestamp()} 🎯 [ENHANCED-ACTION] Starting enhanced card generation process`);
  console.log(`${timestamp()} 📝 [ENHANCED-ACTION] Player:`, input.playerName, `(${input.playerPosition})`);
  console.log(`${timestamp()} 🏆 [ENHANCED-ACTION] Team:`, input.teamName);
  console.log(`${timestamp()} 📸 [ENHANCED-ACTION] Photo data URI length:`, input.playerPhotoDataUri ? input.playerPhotoDataUri.length : 'null');
  console.log(`${timestamp()} 🏆 [ENHANCED-ACTION] Logo data URI length:`, input.teamLogoDataUri ? input.teamLogoDataUri.length : 'null');
  console.log(`${timestamp()} 🎨 [ENHANCED-ACTION] Style:`, input.style || 'default');
  console.log(`${timestamp()} 🖼️ [ENHANCED-ACTION] Background removal:`, input.useBackgroundRemoval ? 'enabled' : 'disabled');

  // Enhanced input validation
  if (!input.playerName.trim()) {
    console.log(`${timestamp()} ❌ [ENHANCED-ACTION] Validation failed: Player name is required`);
    return { cards: null, error: "Player name is required." };
  }
  if (!input.playerPhotoDataUri) {
    console.log(`${timestamp()} ❌ [ENHANCED-ACTION] Validation failed: Player photo is required`);
    return { cards: null, error: "Player photo is required." };
  }
  if (!input.teamLogoDataUri) {
    console.log(`${timestamp()} ❌ [ENHANCED-ACTION] Validation failed: Team logo is required`);
    return { cards: null, error: "Team logo is required." };
  }
  
  // Validate image for background removal if requested
  if (input.useBackgroundRemoval) {
    const validation = validateImageForBackgroundRemoval(input.playerPhotoDataUri);
    if (!validation.valid) {
      console.log(`${timestamp()} ❌ [ENHANCED-ACTION] Image validation failed:`, validation.error);
      return { cards: null, error: `Image validation failed: ${validation.error}` };
    }
  }

  try {
    console.log(`${timestamp()} ✅ [ENHANCED-ACTION] Validation passed, starting generation`);
    
    // Process background removal if requested
    let processedPlayerPhotoDataUri = input.playerPhotoDataUri;
    let backgroundRemoved = false;
    
    if (input.useBackgroundRemoval) {
      console.log(`${timestamp()} 🖼️ [ENHANCED-ACTION] Processing background removal...`);
      const bgRemovalResult = await removeBackground(input.playerPhotoDataUri, {
        quality: 'high',
        format: 'png'
      });
      
      if (bgRemovalResult.success && bgRemovalResult.processedImageDataUri) {
        processedPlayerPhotoDataUri = bgRemovalResult.processedImageDataUri;
        backgroundRemoved = true;
        console.log(`${timestamp()} ✅ [ENHANCED-ACTION] Background removal successful using ${bgRemovalResult.provider}`);
      } else {
        console.log(`${timestamp()} ⚠️ [ENHANCED-ACTION] Background removal failed: ${bgRemovalResult.error}, continuing with original image`);
      }
    }
    
    // Configuration for card generation
    const numVariations = 3; // Generate 3 different card variations for variety
    const baseStyle = input.style || 'modern';
    const styles = [baseStyle, 'classic', 'vintage']; // Use requested style as primary, then variations

    console.log(`${timestamp()} 🔧 [ENHANCED-ACTION] Loading reference images for ${numVariations} variations`);
    
    // Get different random reference baseball card templates for each variation
    const referenceImages = await getRandomReferenceImages(numVariations);
    
    console.log(`${timestamp()} 🔧 [ENHANCED-ACTION] Creating generation promises for`, numVariations, 'variations');
    // Array to hold promises for concurrent card generation
    const generationPromises: Promise<any>[] = [];
    
    // Create generation requests for each card variation
    for (let i = 0; i < numVariations; i++) {
      const referenceImage = referenceImages[i];
      
      // Build enhanced input object for AI card generation
      const aiInput: OpenAIComposedCardInput = {
        playerName: input.playerName,
        playerPosition: input.playerPosition,
        teamName: input.teamName,
        cardNumber: input.cardNumber,
        playerBio: input.playerBio,
        customStats: input.customStats,
        playerPhotoDataUri: processedPlayerPhotoDataUri, // Use processed photo
        teamLogoDataUri: input.teamLogoDataUri,
        style: styles[i] || baseStyle,
        frontReferenceImageDataUri: referenceImage?.dataUri,
        backReferenceImageDataUri: referenceImage?.dataUri,
      };
      
      console.log(`${timestamp()} 🎨 [ENHANCED-ACTION] Creating variation ${i + 1} with style: ${styles[i]}, reference: ${referenceImage?.filename || 'none'}`);
      
      // Add the generation promise to our array
      generationPromises.push(generateOpenAIComposedCard(aiInput));
    }

    console.log(`${timestamp()} ⏳ [ENHANCED-ACTION] Waiting for all card generations to complete...`);
    // Execute all card generations concurrently
    const results = await Promise.all(generationPromises);
    console.log(`${timestamp()} ✅ [ENHANCED-ACTION] All card generations completed successfully`);
    
    console.log(`${timestamp()} 🔄 [ENHANCED-ACTION] Processing results and creating enhanced card variations`);
    // Transform AI results into enhanced CardVariation objects
    const cards: EnhancedCardVariation[] = results.map((result, index) => {
      const cardId = `enhanced_card_${index + 1}_${Date.now()}`;
      const processingTime = Date.now() - startTime;
      
      console.log(`${timestamp()} 📋 [ENHANCED-ACTION] Creating enhanced card ${index + 1} with ID: ${cardId}`);
      console.log(`${timestamp()} 🖼️ [ENHANCED-ACTION] Card ${index + 1} front URL length:`, result.cardFrontDataUri?.length || 'missing');
      console.log(`${timestamp()} 🔄 [ENHANCED-ACTION] Card ${index + 1} back URL length:`, result.cardBackDataUri?.length || 'missing');
      console.log(`${timestamp()} 📊 [ENHANCED-ACTION] Card ${index + 1} stats length:`, result.playerStats?.length || 'missing');
      
      return {
        ...result,
        id: cardId,
        backgroundRemoved,
        style: styles[index] || baseStyle,
        processingTime,
        // Additional enhancement metadata
        designTheme: `${styles[index]} baseball card with ${input.teamName} branding`,
        colorPalette: ['#FF0000', '#0000FF', '#FFFFFF'], // This would be dynamically generated
        typography: 'Modern Sans-Serif with Baseball Script accents'
      } as EnhancedCardVariation;
    });

    // Quality check: Verify that all cards have required components
    const incompleteCards = cards.filter(card => !card.cardFrontDataUri || !card.cardBackDataUri);
    if (incompleteCards.length > 0) {
        console.warn(`${timestamp()} ⚠️ [ENHANCED-ACTION] ${incompleteCards.length} card variations might be incomplete.`);
        incompleteCards.forEach((card) => {
          console.warn(`${timestamp()} ❌ [ENHANCED-ACTION] Incomplete card ${card.id}:`, {
            hasFront: !!card.cardFrontDataUri,
            hasBack: !!card.cardBackDataUri,
            hasStats: !!card.playerStats
          });
        });
    }

    console.log(`${timestamp()} 🎉 [ENHANCED-ACTION] Enhanced card generation process completed successfully`);
    console.log(`${timestamp()} 📦 [ENHANCED-ACTION] Returning`, cards.length, 'enhanced card variations');
    
    return { cards };
  } catch (err: unknown) {
    console.error(`${timestamp()} 💥 [ENHANCED-ACTION] Error generating enhanced card designs:`, err);
    if (err instanceof Error) {
      console.error(`${timestamp()} 💥 [ENHANCED-ACTION] Error stack:`, err.stack);
    }
    
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
    return { cards: null, error: `Failed to generate enhanced card designs: ${errorMessage}. Please try again.` };
  }
}