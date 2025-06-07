/**
 * Server Actions for Baseball Card Generation
 * 
 * This file contains Next.js server actions that handle the backend logic
 * for generating AI-powered baseball cards. Server actions run on the server
 * and can be called directly from client components.
 */
"use server";

import { generateOpenAIComposedCard, type OpenAIComposedCardInput, type OpenAIComposedCardOutput } from "@/ai/flows/generate-openai-composed-card";
import { getRandomReferenceImages } from "@/lib/referenceImages";

/**
 * Extended card output that includes a unique identifier
 * This helps track individual card variations in the UI
 */
export interface CardVariation extends OpenAIComposedCardOutput {
  id: string; // Unique identifier for each generated card variation
}

/**
 * Main server action that orchestrates the baseball card generation process
 * 
 * This function:
 * 1. Validates input parameters (name, photo, logo)
 * 2. Creates 3 different card variations with different styles
 * 3. Uses AI to generate both front/back card images and player stats
 * 4. Returns the generated cards or error messages
 * 
 * @param playerName - The child's name to put on the card
 * @param playerPhotoDataUri - Base64 data URI of the uploaded player photo
 * @param teamLogoDataUri - Base64 data URI of the uploaded team logo
 * @returns Promise with either generated cards or error message
 */
export async function createBaseballCardsAction(
  playerName: string,
  playerPhotoDataUri: string,
  teamLogoDataUri: string
): Promise<{ cards: CardVariation[] | null; error?: string }> {
  // Helper function to add timestamps to console logs for debugging
  const timestamp = () => new Date().toISOString();
  console.log(`${timestamp()} 🎯 [ACTION] Starting card generation process`);
  console.log(`${timestamp()} 📝 [ACTION] Player name:`, playerName);
  console.log(`${timestamp()} 📸 [ACTION] Photo data URI length:`, playerPhotoDataUri ? playerPhotoDataUri.length : 'null');
  console.log(`${timestamp()} 🏆 [ACTION] Logo data URI length:`, teamLogoDataUri ? teamLogoDataUri.length : 'null');

  // Input validation - ensure all required fields are provided
  if (!playerName.trim()) {
    console.log(`${timestamp()} ❌ [ACTION] Validation failed: Player name is required`);
    return { cards: null, error: "Player name is required." };
  }
  if (!playerPhotoDataUri) {
    console.log(`${timestamp()} ❌ [ACTION] Validation failed: Player photo is required`);
    return { cards: null, error: "Player photo is required." };
  }
  if (!teamLogoDataUri) {
    console.log(`${timestamp()} ❌ [ACTION] Validation failed: Team logo is required`);
    return { cards: null, error: "Team logo is required." };
  }

  try {
    console.log(`${timestamp()} ✅ [ACTION] Validation passed, starting generation`);
    
    // Configuration for card generation
    const numVariations = 3; // Generate 3 different card variations for variety
    const styles = ['modern', 'classic', 'vintage']; // Different visual styles to create variety

    console.log(`${timestamp()} 🔧 [ACTION] Loading reference images for ${numVariations} variations`);
    
    // Get different random reference baseball card templates for each variation
    // These serve as visual references for the AI to understand card layout and design
    const referenceImages = await getRandomReferenceImages(numVariations);
    
    console.log(`${timestamp()} 🔧 [ACTION] Creating generation promises for`, numVariations, 'variations');
    // Array to hold promises for concurrent card generation (for better performance)
    const generationPromises: Promise<OpenAIComposedCardOutput>[] = [];
    
    // Create generation requests for each card variation
    for (let i = 0; i < numVariations; i++) {
      const referenceImage = referenceImages[i];
      
      // Build input object for AI card generation
      const input: OpenAIComposedCardInput = {
        playerName,                    // Child's name for the card
        playerPhotoDataUri,           // Uploaded photo of the child
        teamLogoDataUri,              // Uploaded team logo
        style: styles[i] || 'modern', // Visual style (modern, classic, or vintage)
        frontReferenceImageDataUri: referenceImage?.dataUri, // Template for front design
        backReferenceImageDataUri: referenceImage?.dataUri,  // Template for back design (same as front)
      };
      
      console.log(`${timestamp()} 🎨 [ACTION] Creating variation ${i + 1} with style: ${styles[i]}, reference: ${referenceImage?.filename || 'none'}`);
      
      // Add the generation promise to our array (will execute concurrently)
      generationPromises.push(generateOpenAIComposedCard(input));
    }

    console.log(`${timestamp()} ⏳ [ACTION] Waiting for all card generations to complete...`);
    // Execute all card generations concurrently for better performance
    // Each generation involves AI creating both front/back images + player stats
    const results = await Promise.all(generationPromises);
    console.log(`${timestamp()} ✅ [ACTION] All card generations completed successfully`);
    
    console.log(`${timestamp()} 🔄 [ACTION] Processing results and creating card variations`);
    // Transform AI results into CardVariation objects with unique IDs
    const cards: CardVariation[] = results.map((result, index) => {
      // Generate unique ID for each card variation
      const cardId = `card_variation_${index + 1}_${Date.now()}`;
      
      // Log details about each generated card for debugging
      console.log(`${timestamp()} 📋 [ACTION] Creating card ${index + 1} with ID: ${cardId}`);
      console.log(`${timestamp()} 🖼️ [ACTION] Card ${index + 1} front URL length:`, result.cardFrontDataUri?.length || 'missing');
      console.log(`${timestamp()} 🔄 [ACTION] Card ${index + 1} back URL length:`, result.cardBackDataUri?.length || 'missing');
      console.log(`${timestamp()} 📊 [ACTION] Card ${index + 1} stats length:`, result.playerStats?.length || 'missing');
      
      // Return the enhanced card object with unique ID
      return {
        ...result,  // Spread all AI-generated content (images, stats, etc.)
        id: cardId  // Add unique identifier for UI tracking
      };
    });

    // Quality check: Verify that all cards have required components
    // Sometimes AI generation can fail for individual variations
    const incompleteCards = cards.filter(card => !card.cardFrontDataUri || !card.cardBackDataUri);
    if (incompleteCards.length > 0) {
        console.warn(`${timestamp()} ⚠️ [ACTION] ${incompleteCards.length} card variations might be incomplete.`);
        incompleteCards.forEach((card, index) => {
          console.warn(`${timestamp()} ❌ [ACTION] Incomplete card ${card.id}:`, {
            hasFront: !!card.cardFrontDataUri,
            hasBack: !!card.cardBackDataUri,
            hasStats: !!card.playerStats
          });
        });
    }

    console.log(`${timestamp()} 🎉 [ACTION] Card generation process completed successfully`);
    console.log(`${timestamp()} 📦 [ACTION] Returning`, cards.length, 'card variations');
    
    // Return successful result with generated cards
    return { cards };
  } catch (err: unknown) {
    // Error handling: Log detailed error information for debugging
    console.error(`${timestamp()} 💥 [ACTION] Error generating card designs:`, err);
    if (err instanceof Error) {
      console.error(`${timestamp()} 💥 [ACTION] Error stack:`, err.stack);
    }
    
    // Extract user-friendly error message
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
    
    // Return error result that the UI can display to the user
    return { cards: null, error: `Failed to generate card designs: ${errorMessage}. Please try again.` };
  }
}
