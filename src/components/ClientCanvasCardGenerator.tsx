"use client";

import { useState } from 'react';
import { ClientCanvasGenerator, type CardPlayerData, type ClientCardResult } from '@/lib/client-canvas-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingIndicator } from '@/components/LoadingIndicator';

interface ClientCanvasCardGeneratorProps {
  playerData: CardPlayerData;
  onComplete: (results: ClientCardResult[]) => void;
  onError: (error: string) => void;
}

export function ClientCanvasCardGenerator({ 
  playerData, 
  onComplete, 
  onError 
}: ClientCanvasCardGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCards = async () => {
    setIsGenerating(true);
    
    try {
      console.log('🎯 [CLIENT-COMPONENT] Starting client-side card generation');
      
      // Create variations with different styles
      const styles = ['modern', 'classic', 'vintage'];
      const results: ClientCardResult[] = [];
      
      for (let i = 0; i < styles.length; i++) {
        const variationData = {
          ...playerData,
          style: styles[i]
        };
        
        console.log(`🎨 [CLIENT-COMPONENT] Generating variation ${i + 1} with style: ${styles[i]}`);
        
        const generator = new ClientCanvasGenerator(variationData);
        const result = await generator.generateCard();
        results.push(result);
      }
      
      console.log('✅ [CLIENT-COMPONENT] All card variations generated successfully');
      onComplete(results);
      
    } catch (error) {
      console.error('❌ [CLIENT-COMPONENT] Error generating cards:', error);
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Canvas Card Generation</h3>
          <p className="text-sm text-gray-600">
            Generate high-quality baseball cards using advanced canvas rendering
          </p>
          
          {isGenerating ? (
            <div className="space-y-4">
              <LoadingIndicator message="Generating cards with canvas..." />
              <p className="text-sm text-gray-500">
                Creating layered designs with your child&apos;s photo...
              </p>
            </div>
          ) : (
            <Button 
              onClick={generateCards}
              className="w-full"
              variant="default"
            >
              Generate Canvas Cards
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}