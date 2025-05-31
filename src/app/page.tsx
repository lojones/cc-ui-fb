"use client";

import { useState, type FormEvent, useEffect } from 'react';
import Image from 'next/image';
import { AppHeader } from '@/components/AppHeader';
import { ImageUploadInput } from '@/components/ImageUploadInput';
import { PlayerCardDisplay, type CardData } from '@/components/PlayerCardDisplay';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createBaseballCardsAction } from './actions';
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from 'lucide-react';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function HomePage() {
  const [playerName, setPlayerName] = useState<string>('');
  const [kidPhotoFile, setKidPhotoFile] = useState<File | null>(null);
  const [teamLogoFile, setTeamLogoFile] = useState<File | null>(null);
  
  const [kidPhotoPreview, setKidPhotoPreview] = useState<string | null>(null);
  const [teamLogoPreview, setTeamLogoPreview] = useState<string | null>(null);

  const [generatedCards, setGeneratedCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (kidPhotoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setKidPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(kidPhotoFile);
    } else {
      setKidPhotoPreview(null);
    }
  }, [kidPhotoFile]);

  useEffect(() => {
    if (teamLogoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(teamLogoFile);
    } else {
      setTeamLogoPreview(null);
    }
  }, [teamLogoFile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!playerName || !kidPhotoFile || !teamLogoFile) {
      toast({
        title: "Missing Information",
        description: "Please provide player name, kid's photo, and team logo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGeneratedCards([]); // Clear previous cards

    try {
      const playerPhotoDataUri = await fileToDataUri(kidPhotoFile);
      const teamLogoDataUri = await fileToDataUri(teamLogoFile);

      const result = await createBaseballCardsAction(playerName, playerPhotoDataUri, teamLogoDataUri);

      if (result.error) {
        toast({
          title: "Generation Failed",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.cards) {
        setGeneratedCards(result.cards);
        toast({
          title: "Cards Generated!",
          description: "Your rookie cards are ready to view.",
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-background font-body">
      <AppHeader />
      <main className="w-full max-w-4xl space-y-8 flex-grow">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center sm:text-left">Create Your Kid's Rookie Card</CardTitle>
            <CardDescription className="text-center sm:text-left">
              Upload a photo of your young athlete, their team logo, and enter their name to generate unique, fun baseball cards!
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="playerName" className="text-base">Player's Name</Label>
                <Input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="e.g., Alex Johnson"
                  required
                  className="text-base"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUploadInput
                  id="kidPhoto"
                  label="Kid's Photo"
                  onFileChange={setKidPhotoFile}
                  previewSrc={kidPhotoPreview}
                  currentFileName={kidPhotoFile?.name || null}
                  hint="kid playing sport"
                  aspectRatio="aspect-[3/4]"
                />
                <ImageUploadInput
                  id="teamLogo"
                  label="Team Logo"
                  onFileChange={setTeamLogoFile}
                  previewSrc={teamLogoPreview}
                  currentFileName={teamLogoFile?.name || null}
                  hint="team logo sports"
                  aspectRatio="aspect-square"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto text-lg py-6">
                {isLoading ? (
                  <LoadingIndicator message="Generating..." />
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" /> Generate Cards
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {isLoading && !generatedCards.length && (
          <Card className="shadow-xl">
            <CardContent className="p-6">
              <LoadingIndicator />
            </CardContent>
          </Card>
        )}

        {!isLoading && generatedCards.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-center font-headline">Your Generated Cards!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedCards.map((card, index) => (
                <PlayerCardDisplay 
                  key={card.id} 
                  cardData={card} 
                  playerName={playerName} 
                  variationNumber={index + 1} 
                />
              ))}
            </div>
             <div className="flex justify-center mt-8">
                <Button onClick={() => {
                    setGeneratedCards([]);
                    setPlayerName('');
                    setKidPhotoFile(null);
                    setTeamLogoFile(null);
                    setKidPhotoPreview(null);
                    setTeamLogoPreview(null);
                    // Optionally scroll to top: window.scrollTo(0,0);
                }} variant="outline">
                    <Repeat className="mr-2 h-4 w-4" /> Create New Cards
                </Button>
            </div>
          </section>
        )}
      </main>
      <footer className="w-full text-center py-6 mt-auto">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Rookie Card Maker. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
