
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { createBaseballCardsAction } from './actions';
import { useToast } from "@/hooks/use-toast";
import { Wand2, Repeat, Settings, User, Trophy, Camera } from 'lucide-react';
import { ClientCanvasCardGenerator } from '@/components/ClientCanvasCardGenerator';
import type { ClientCardResult } from '@/lib/client-canvas-generator';
import { DebugPanel } from '@/components/DebugPanel';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function HomePage() {
  // Basic player information
  const [playerName, setPlayerName] = useState<string>('');
  const [playerPosition, setPlayerPosition] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  
  // Card details
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardSet, setCardSet] = useState<string>('');
  const [cardYear, setCardYear] = useState<string>(new Date().getFullYear().toString());
  
  // File uploads
  const [kidPhotoFile, setKidPhotoFile] = useState<File | null>(null);
  const [teamLogoFile, setTeamLogoFile] = useState<File | null>(null);
  
  // Image previews
  const [kidPhotoPreview, setKidPhotoPreview] = useState<string | null>(null);
  const [teamLogoPreview, setTeamLogoPreview] = useState<string | null>(null);

  // Player biography and custom stats
  const [playerBio, setPlayerBio] = useState<string>('');
  const [customStats, setCustomStats] = useState<string>('');
  const [useCustomStats, setUseCustomStats] = useState<boolean>(false);
  
  // Advanced options
  const [removeBackground, setRemoveBackground] = useState<boolean>(true);
  const [cardStyle, setCardStyle] = useState<string>('modern');
  
  // Application state
  const [generatedCards, setGeneratedCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCanvasGenerator, setShowCanvasGenerator] = useState<boolean>(false);
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
    
    // Enhanced validation
    if (!playerName.trim() || !kidPhotoFile || !teamLogoFile) {
      toast({
        title: "Missing Required Information",
        description: "Please provide player name, kid's photo, and team logo.",
        variant: "destructive",
      });
      return;
    }

    // Validate custom stats if enabled
    if (useCustomStats && !customStats.trim()) {
      toast({
        title: "Missing Custom Stats",
        description: "Please provide custom statistics or disable the custom stats option.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGeneratedCards([]); // Clear previous cards

    try {
      const playerPhotoDataUri = await fileToDataUri(kidPhotoFile);
      const teamLogoDataUri = await fileToDataUri(teamLogoFile);

      // Prepare enhanced card data
      const cardData = {
        playerName: playerName.trim(),
        playerPosition: playerPosition.trim(),
        teamName: teamName.trim(),
        cardNumber: cardNumber.trim(),
        cardSet: cardSet.trim(),
        cardYear: cardYear.trim(),
        playerBio: playerBio.trim(),
        customStats: useCustomStats ? customStats.trim() : undefined,
        cardStyle,
        removeBackground,
        playerPhotoDataUri,
        teamLogoDataUri,
      };

      const result = await createBaseballCardsAction(cardData);

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

  const handleCanvasComplete = (results: ClientCardResult[]) => {
    // Convert client canvas results to CardData format
    const canvasCards: CardData[] = results.map((result, index) => ({
      id: `canvas_card_${index + 1}_${Date.now()}`,
      cardFrontDataUri: result.frontDataUri,
      cardBackDataUri: result.backDataUri,
      playerStats: result.playerStats
    }));
    
    setGeneratedCards(canvasCards);
    setShowCanvasGenerator(false);
    
    toast({
      title: "Canvas Cards Generated!",
      description: `Successfully created ${canvasCards.length} card variations using canvas rendering.`,
    });
  };

  const handleCanvasError = (error: string) => {
    toast({
      title: "Canvas Generation Failed",
      description: error,
      variant: "destructive",
    });
    setShowCanvasGenerator(false);
  };

  const startCanvasGeneration = () => {
    // Validate required fields
    if (!playerName.trim() || !kidPhotoFile || !teamLogoFile) {
      toast({
        title: "Missing Required Information",
        description: "Please fill in player name and upload both photos before generating cards.",
        variant: "destructive",
      });
      return;
    }
    
    setShowCanvasGenerator(true);
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-background font-body">
      <AppHeader />
      <main className="w-full max-w-6xl space-y-8 flex-grow">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center sm:text-left">Create Your Kid's Rookie Card</CardTitle>
            <CardDescription className="text-center sm:text-left">
              Create professional-quality baseball cards with detailed player information, custom statistics, and AI-powered designs!
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} suppressHydrationWarning={true}>
            <CardContent className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger value="photos" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Photos
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Card Details
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Advanced
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="playerName" className="text-base font-medium">Player's Name *</Label>
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
                      <Label htmlFor="playerPosition" className="text-base font-medium">Position</Label>
                      <Select value={playerPosition} onValueChange={setPlayerPosition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pitcher">Pitcher</SelectItem>
                          <SelectItem value="catcher">Catcher</SelectItem>
                          <SelectItem value="first-base">First Base</SelectItem>
                          <SelectItem value="second-base">Second Base</SelectItem>
                          <SelectItem value="third-base">Third Base</SelectItem>
                          <SelectItem value="shortstop">Shortstop</SelectItem>
                          <SelectItem value="left-field">Left Field</SelectItem>
                          <SelectItem value="center-field">Center Field</SelectItem>
                          <SelectItem value="right-field">Right Field</SelectItem>
                          <SelectItem value="outfield">Outfield</SelectItem>
                          <SelectItem value="infield">Infield</SelectItem>
                          <SelectItem value="utility">Utility</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamName" className="text-base font-medium">Team Name</Label>
                    <Input
                      id="teamName"
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g., Lions, Eagles, Wildcats"
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="playerBio" className="text-base font-medium">Player Biography</Label>
                    <Textarea
                      id="playerBio"
                      value={playerBio}
                      onChange={(e) => setPlayerBio(e.target.value)}
                      placeholder="Tell us about this player's strengths, achievements, or what makes them special on the field..."
                      rows={3}
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">This will help generate better card designs and more personalized statistics.</p>
                  </div>
                </TabsContent>

                <TabsContent value="photos" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageUploadInput
                      id="kidPhoto"
                      label="Player Photo *"
                      onFileChange={setKidPhotoFile}
                      previewSrc={kidPhotoPreview}
                      currentFileName={kidPhotoFile?.name || null}
                      hint="action shot of kid playing baseball"
                      aspectRatio="aspect-[3/4]"
                    />
                    <ImageUploadInput
                      id="teamLogo"
                      label="Team Logo *"
                      onFileChange={setTeamLogoFile}
                      previewSrc={teamLogoPreview}
                      currentFileName={teamLogoFile?.name || null}
                      hint="team logo or emblem"
                      aspectRatio="aspect-square"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 bg-secondary/20 rounded-lg">
                    <Checkbox
                      id="removeBackground"
                      checked={removeBackground}
                      onCheckedChange={(checked) => setRemoveBackground(checked as boolean)}
                    />
                    <Label htmlFor="removeBackground" className="text-sm font-medium cursor-pointer">
                      Automatically remove background from player photo
                    </Label>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber" className="text-base font-medium">Card Number</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="e.g., #42"
                        className="text-base"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cardSet" className="text-base font-medium">Card Set/Series</Label>
                      <Input
                        id="cardSet"
                        type="text"
                        value={cardSet}
                        onChange={(e) => setCardSet(e.target.value)}
                        placeholder="e.g., Rookie Stars, Future Legends"
                        className="text-base"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cardYear" className="text-base font-medium">Year</Label>
                      <Input
                        id="cardYear"
                        type="text"
                        value={cardYear}
                        onChange={(e) => setCardYear(e.target.value)}
                        placeholder="e.g., 2024"
                        className="text-base"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="useCustomStats"
                        checked={useCustomStats}
                        onCheckedChange={(checked) => setUseCustomStats(checked as boolean)}
                      />
                      <Label htmlFor="useCustomStats" className="text-base font-medium cursor-pointer">
                        Use custom statistics instead of AI-generated ones
                      </Label>
                    </div>
                    
                    {useCustomStats && (
                      <div className="space-y-2">
                        <Label htmlFor="customStats" className="text-base font-medium">Custom Statistics</Label>
                        <Textarea
                          id="customStats"
                          value={customStats}
                          onChange={(e) => setCustomStats(e.target.value)}
                          placeholder="Batting Average: .325&#10;Home Runs: 12&#10;RBIs: 45&#10;Stolen Bases: 8&#10;Games Played: 120&#10;---&#10;Rising star with excellent plate discipline and speed on the bases."
                          rows={6}
                          className="text-base font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Format: One stat per line. Use "---" to separate stats from bio text.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardStyle" className="text-base font-medium">Card Style</Label>
                      <Select value={cardStyle} onValueChange={setCardStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select card style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern - Clean, contemporary design</SelectItem>
                          <SelectItem value="classic">Classic - Traditional baseball card look</SelectItem>
                          <SelectItem value="vintage">Vintage - Retro 1980s-90s style</SelectItem>
                          <SelectItem value="premium">Premium - Luxury finish with special effects</SelectItem>
                          <SelectItem value="rookie">Rookie Special - Designed for first-year players</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Pro Tips:</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Use high-quality, well-lit photos for best results</li>
                      <li>• Action shots work better than posed photos</li>
                      <li>• Team logos should be clear and high-resolution</li>
                      <li>• Player biographies help create more personalized cards</li>
                      <li>• Different styles work better for different age groups</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1 text-lg py-6">
                {isLoading ? (
                  <LoadingIndicator message="Generating your custom cards..." />
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" /> Generate with AI
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={startCanvasGeneration}
                disabled={isLoading}
                className="flex-1 text-lg py-6"
              >
                <Settings className="mr-2 h-5 w-5" /> Generate with Canvas
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
                <Button onClick={() => {
                    setGeneratedCards([]);
                    setPlayerName('');
                    setPlayerPosition('');
                    setTeamName('');
                    setCardNumber('');
                    setCardSet('');
                    setCardYear(new Date().getFullYear().toString());
                    setKidPhotoFile(null);
                    setTeamLogoFile(null);
                    setKidPhotoPreview(null);
                    setTeamLogoPreview(null);
                    setPlayerBio('');
                    setCustomStats('');
                    setUseCustomStats(false);
                    setRemoveBackground(true);
                    setCardStyle('modern');
                    // Optionally scroll to top: window.scrollTo(0,0);
                }} variant="outline">
                    <Repeat className="mr-2 h-4 w-4" /> Create New Cards
                </Button>
            </div>
          </section>
        )}

        {showCanvasGenerator && (
          <ClientCanvasCardGenerator
            playerData={{
              name: playerName,
              position: playerPosition,
              teamName: teamName,
              cardNumber: cardNumber,
              cardSet: cardSet,
              cardYear: cardYear,
              bio: playerBio,
              customStats: customStats,
              playerPhotoDataUri: kidPhotoPreview || '',
              teamLogoDataUri: teamLogoPreview || '',
              style: cardStyle
            }}
            onComplete={handleCanvasComplete}
            onError={handleCanvasError}
          />
        )}
      </main>
      
      {/* Debug panel - only shows in development */}
      <DebugPanel />
      
      <footer className="w-full text-center py-6 mt-auto">
        <p className="text-sm text-muted-foreground" suppressHydrationWarning={true}>
          &copy; {new Date().getFullYear()} Rookie Card Maker. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
