// src/app/actions.ts
"use server";

import { generateCardDesign, type GenerateCardDesignInput, type GenerateCardDesignOutput } from "@/ai/flows/generate-card-design";

export interface CardVariation extends GenerateCardDesignOutput {
  id: string;
}

export async function createBaseballCardsAction(
  playerName: string,
  playerPhotoDataUri: string,
  teamLogoDataUri: string
): Promise<{ cards: CardVariation[] | null; error?: string }> {
  if (!playerName.trim()) {
    return { cards: null, error: "Player name is required." };
  }
  if (!playerPhotoDataUri) {
    return { cards: null, error: "Player photo is required." };
  }
  if (!teamLogoDataUri) {
    return { cards: null, error: "Team logo is required." };
  }

  try {
    const generationPromises: Promise<GenerateCardDesignOutput>[] = [];
    const numVariations = 3; // Generate 3 variations

    for (let i = 0; i < numVariations; i++) {
      const input: GenerateCardDesignInput = {
        playerName,
        playerPhotoDataUri,
        teamLogoDataUri,
      };
      // Add a slight variation instruction to the prompt if the model supports it,
      // or rely on inherent model variability. For now, we assume inherent variability.
      // If explicit variation is needed, the prompt in generate-card-design.ts might need adjustment
      // or this input could include a variation seed/parameter if the flow supported it.
      generationPromises.push(generateCardDesign(input));
    }

    const results = await Promise.all(generationPromises);
    
    const cards: CardVariation[] = results.map((result, index) => ({
      ...result,
      id: `card_variation_${index + 1}_${Date.now()}` // Unique ID for each card variation
    }));

    // Check if any card URI is missing (can happen if AI fails for one variation)
    if (cards.some(card => !card.cardFrontDataUri || !card.cardBackDataUri)) {
        console.warn("Some card variations might be incomplete.");
    }


    return { cards };
  } catch (err: unknown) {
    console.error("Error generating card designs:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
    return { cards: null, error: `Failed to generate card designs: ${errorMessage}. Please try again.` };
  }
}
