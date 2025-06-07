"use client";

import Image from 'next/image';
import { Download, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface CardData {
  id: string;
  cardFrontDataUri: string;
  cardBackDataUri: string;
  playerStats: string;
}

interface PlayerCardDisplayProps {
  cardData: CardData;
  playerName: string;
  variationNumber: number;
}

export function PlayerCardDisplay({ cardData, playerName, variationNumber }: PlayerCardDisplayProps) {
  const downloadImage = (dataUri: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full shadow-lg overflow-hidden">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Variation {variationNumber}</CardTitle>
        <CardDescription className="text-base">Player: {playerName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Front Card */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg font-headline text-center">Card Front</h3>
            <div className="aspect-[2.5/3.5] w-full max-w-md mx-auto relative bg-muted rounded-lg overflow-hidden">
              {cardData.cardFrontDataUri ? (
                <Image src={cardData.cardFrontDataUri} alt={`${playerName} - Card Front - Variation ${variationNumber}`} layout="fill" objectFit="contain" data-ai-hint="baseball card" />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Front Preview N/A</div>
              )}
            </div>
          </div>
          
          {/* Back Card */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg font-headline text-center">Card Back</h3>
            <div className="aspect-[2.5/3.5] w-full max-w-md mx-auto relative bg-muted rounded-lg overflow-hidden">
              {cardData.cardBackDataUri ? (
                <Image src={cardData.cardBackDataUri} alt={`${playerName} - Card Back - Variation ${variationNumber}`} layout="fill" objectFit="contain" data-ai-hint="baseball card stats"/>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Back Preview N/A</div>
              )}
            </div>
            
            {/* Player Stats */}
            <div className="p-4 bg-secondary/50 rounded-md">
              <h4 className="font-semibold text-sm mb-2 font-headline">Player Stats:</h4>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{cardData.playerStats || "No stats generated."}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadImage(cardData.cardFrontDataUri, `${playerName}_card_front_var${variationNumber}.png`)}
          disabled={!cardData.cardFrontDataUri}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Front
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadImage(cardData.cardBackDataUri, `${playerName}_card_back_var${variationNumber}.png`)}
          disabled={!cardData.cardBackDataUri}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Back
        </Button>
      </CardFooter>
    </Card>
  );
}
