"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { ImageUploadInput } from '@/components/ImageUploadInput';
import { PlayerCardDisplay, type CardData } from '@/components/PlayerCardDisplay';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createEnhancedBaseballCardsAction } from './enhanced-actions';
import { useToast } from "@/hooks/use-toast";
import { Wand2, Repeat, Info } from 'lucide-react';
import { type EnhancedCardInput } from '@/types/card';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const BASEBALL_POSITIONS = [
  'Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base',
  'Shortstop', 'Left Field', 'Center Field', 'Right Field',
  'Designated Hitter', 'Utility Player', 'Rookie'
];

const CARD_STYLES = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'premium', label: 'Premium' },
  { value: 'rookie', label: 'Rookie Special' }
];

export default function EnhancedHomePage() {
  // Basic player info
  const [playerName, setPlayerName] = useState<string>('');
  const [playerPosition, setPlayerPosition] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  
  // Card details
  const [cardNumber, setCardNumber] = useState<string>('');
  const [setYear, setSetYear] = useState<string>('');
  
  // Optional content
  const [playerBio, setPlayerBio] = useState<string>('');
  const [customStats, setCustomStats] = useState<string>('');
  const [useCustomStats, setUseCustomStats] = useState<boolean>(false);
  
  // Generation options
  const [cardStyle, setCardStyle] = useState<string>('modern');
  const [useBackgroundRemoval, setUseBackgroundRemoval] = useState<boolean>(true);
  
  // Media files
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
    setGeneratedCards([]);

    try {
      const playerPhotoDataUri = await fileToDataUri(kidPhotoFile);
      const teamLogoDataUri = await fileToDataUri(teamLogoFile);

      const enhancedInput: EnhancedCardInput = {
        playerName,
        playerPosition: playerPosition || 'Rookie',
        teamName: teamName || 'All-Stars',
        cardNumber: cardNumber || '1',
        setYear: setYear || new Date().getFullYear().toString(),
        playerBio: playerBio || undefined,
        customStats: useCustomStats ? customStats : undefined,
        playerPhotoDataUri,
        teamLogoDataUri,
        style: cardStyle as any,
        useBackgroundRemoval
      };

      const result = await createEnhancedBaseballCardsAction(enhancedInput);

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
          description: "Your enhanced rookie cards are ready to view.",
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

  const resetForm = () => {
    setGeneratedCards([]);
    setPlayerName('');
    setPlayerPosition('');
    setTeamName('');
    setCardNumber('');
    setSetYear('');
    setPlayerBio('');
    setCustomStats('');
    setUseCustomStats(false);
    setCardStyle('modern');
    setUseBackgroundRemoval(true);
    setKidPhotoFile(null);
    setTeamLogoFile(null);
    setKidPhotoPreview(null);
    setTeamLogoPreview(null);
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-background font-body">
      <AppHeader />
      <main className="w-full max-w-4xl space-y-8 flex-grow">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center sm:text-left">
              Create Your Kid's Enhanced Rookie Card
            </CardTitle>
            <CardDescription className="text-center sm:text-left">
              Generate professional-quality baseball cards with advanced features like background removal, 
              custom statistics, and multiple design styles!
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit} suppressHydrationWarning={true}>
            <CardContent className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="photos">Photos</TabsTrigger>
                  <TabsTrigger value="details">Card Details</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="playerName" className="text-base">Player's Name *</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="playerPosition" className="text-base">Position</Label>
                      <Select value={playerPosition} onValueChange={setPlayerPosition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          {BASEBALL_POSITIONS.map((position) => (
                            <SelectItem key={position} value={position}>
                              {position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teamName" className="text-base">Team Name</Label>
                    <Input
                      id="teamName"
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g., Lightning Bolts, Thunder Hawks"
                      className="text-base"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="photos" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageUploadInput
                      id="kidPhoto"
                      label="Kid's Photo *"
                      onFileChange={setKidPhotoFile}
                      previewSrc={kidPhotoPreview}
                      currentFileName={kidPhotoFile?.name || null}
                      hint="Clear photo of kid playing baseball"
                      aspectRatio="aspect-[3/4]"
                    />
                    <ImageUploadInput
                      id="teamLogo"
                      label="Team Logo *"
                      onFileChange={setTeamLogoFile}
                      previewSrc={teamLogoPreview}
                      currentFileName={teamLogoFile?.name || null}
                      hint="Team or league logo"
                      aspectRatio="aspect-square"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="backgroundRemoval"
                      checked={useBackgroundRemoval}
                      onCheckedChange={(checked) => setUseBackgroundRemoval(checked as boolean)}
                    />
                    <Label htmlFor="backgroundRemoval" className="text-sm">
                      Remove background from player photo (recommended)
                    </Label>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber" className="text-base">Card Number</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="e.g., 7, 1 of 1"
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setYear" className="text-base">Set/Year</Label>
                      <Input
                        id="setYear"
                        type="text"
                        value={setYear}
                        onChange={(e) => setSetYear(e.target.value)}
                        placeholder={`e.g., ${new Date().getFullYear()} Rookies`}
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardStyle" className="text-base">Card Style</Label>
                      <Select value={cardStyle} onValueChange={setCardStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CARD_STYLES.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="playerBio" className="text-base">Player Biography</Label>
                    <Textarea
                      id="playerBio"
                      value={playerBio}
                      onChange={(e) => setPlayerBio(e.target.value)}
                      placeholder="Tell us about this player's achievements, playing style, or what makes them special..."
                      className="text-base min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="useCustomStats"
                        checked={useCustomStats}
                        onCheckedChange={(checked) => setUseCustomStats(checked as boolean)}
                      />
                      <Label htmlFor="useCustomStats" className="text-sm">
                        Provide custom statistics instead of AI-generated ones
                      </Label>
                    </div>
                    
                    {useCustomStats && (
                      <div className="space-y-2">
                        <Label htmlFor="customStats" className="text-base">Custom Statistics</Label>
                        <Textarea
                          id="customStats"
                          value={customStats}
                          onChange={(e) => setCustomStats(e.target.value)}
                          placeholder="Batting Average: .350&#10;Home Runs: 12&#10;RBIs: 45&#10;Stolen Bases: 8&#10;Games Played: 95&#10;---&#10;A brief bio about the player's season..."
                          className="text-base min-h-[120px] font-mono"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Pro Tips:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Use high-quality, well-lit photos for best results</li>
                      <li>• Background removal works best with clear subject separation</li>
                      <li>• Player biography helps generate more personalized statistics</li>
                      <li>• Different styles create unique visual themes for each variation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto text-lg py-6">
                {isLoading ? (
                  <LoadingIndicator message="Generating enhanced cards..." />
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" /> Generate Enhanced Cards
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
            <h2 className="text-2xl font-bold text-center font-headline">Your Enhanced Generated Cards!</h2>
            <div className="flex flex-col gap-8">
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
              <Button onClick={resetForm} variant="outline">
                <Repeat className="mr-2 h-4 w-4" /> Create New Cards
              </Button>
            </div>
          </section>
        )}
      </main>
      <footer className="w-full text-center py-6 mt-auto">
        <p className="text-sm text-muted-foreground" suppressHydrationWarning={true}>
          &copy; {new Date().getFullYear()} Enhanced Rookie Card Maker. All rights reserved.
        </p>
      </footer>
    </div>
  );
}