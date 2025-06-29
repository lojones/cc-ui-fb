/**
 * Enhanced data types for the baseball card generation system
 */

export interface PlayerStats {
  // Batting stats
  battingAverage?: number;
  homeRuns?: number;
  rbis?: number;
  runs?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  stolenBases?: number;
  onBasePercentage?: number;
  sluggingPercentage?: number;
  
  // Pitching stats (for pitchers)
  wins?: number;
  losses?: number;
  era?: number;
  inningsPitched?: number;
  strikeouts?: number;
  walks?: number;
  saves?: number;
  whip?: number;
  
  // Universal stats
  gamesPlayed?: number;
  errors?: number;
  fieldingPercentage?: number;
}

export interface EnhancedCardInput {
  // Basic player info
  playerName: string;
  playerPosition: string;
  teamName: string;
  
  // Card details
  cardNumber: string;
  setYear: string;
  
  // Optional content
  playerBio?: string;
  customStats?: string;
  
  // Media files
  playerPhotoDataUri: string;
  teamLogoDataUri: string;
  
  // Generation options
  style?: 'modern' | 'classic' | 'vintage' | 'premium' | 'rookie';
  useBackgroundRemoval?: boolean;
}

export interface EnhancedCardOutput {
  id: string;
  
  // Generated card images
  cardFrontDataUri: string;
  cardBackDataUri: string;
  
  // Generated or custom statistics
  playerStats: string;
  parsedStats?: PlayerStats;
  
  // Additional generated content
  designTheme?: string;
  colorPalette?: string[];
  typography?: string;
  
  // Processing metadata
  processingTime?: number;
  backgroundRemoved?: boolean;
  style: string;
}

export interface CardDesignSpec {
  // Visual design decisions
  backgroundColor: string;
  accentColors: string[];
  primaryFont: string;
  secondaryFont: string;
  
  // Layout specifications
  playerImageArea: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderStyle?: string;
    borderColor?: string;
  };
  
  // Text positioning
  playerNamePosition: { x: number; y: number };
  teamNamePosition: { x: number; y: number };
  positionPosition: { x: number; y: number };
  
  // Decorative elements
  accentGraphics: string[];
  framingElements: string[];
}

export interface VisualValidationResult {
  approved: boolean;
  feedback: string;
  suggestions?: string[];
  confidence: number;
}