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
        <CardTitle className="font-headline">Variation {variationNumber}</CardTitle>
        <CardDescription>Player: {playerName}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="front" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="front">Front</TabsTrigger>
            <TabsTrigger value="back">Back</TabsTrigger>
          </TabsList>
          <TabsContent value="front">
            <div className="aspect-[2.5/3.5] w-full relative bg-muted rounded-lg overflow-hidden">
              {cardData.cardFrontDataUri ? (
                <Image src={cardData.cardFrontDataUri} alt={`${playerName} - Card Front - Variation ${variationNumber}`} layout="fill" objectFit="contain" data-ai-hint="baseball card" />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Front Preview N/A</div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="back">
            <div className="aspect-[2.5/3.5] w-full relative bg-muted rounded-lg overflow-hidden mb-4">
               {cardData.cardBackDataUri ? (
                <Image src={cardData.cardBackDataUri} alt={`${playerName} - Card Back - Variation ${variationNumber}`} layout="fill" objectFit="contain" data-ai-hint="baseball card stats"/>
              ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">Back Preview N/A</div>
              )}
            </div>
            <div className="mt-4 p-3 bg-secondary/50 rounded-md">
              <h4 className="font-semibold text-sm mb-1 font-headline">Player Stats:</h4>
              <p className="text-xs whitespace-pre-wrap">{cardData.playerStats || "No stats generated."}</p>
            </div>
          </TabsContent>
        </Tabs>
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
