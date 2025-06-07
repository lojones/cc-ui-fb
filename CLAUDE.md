# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- `npm run dev` - Start development server on port 9002 with Turbopack
- `npm run build` - Build the production application  
- `npm run lint` - Run ESLint checks
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit AI server with file watching

## Project Architecture

### Core Application
This is a **Rookie Card Maker** - a Next.js app that generates AI-powered baseball cards for kids. Users upload a child's photo and team logo, then the app generates 3 variations of baseball cards using Google's Gemini AI models.

### Key Architecture Components

**AI Integration (Genkit + Google AI)**
- `src/ai/genkit.ts` - Main AI configuration using Genkit with Google AI plugin and Gemini 2.0 Flash model
- `src/ai/flows/generate-card-design.ts` - Primary AI flow that generates both card images and player stats
- Uses both text generation (stats) and experimental image generation (card designs)
- Generates front/back card images as data URIs along with fake player statistics

**Main Application Flow**
- `src/app/page.tsx` - Main UI with form for player name, photo upload, team logo upload
- `src/app/actions.ts` - Server action that orchestrates card generation (creates 3 variations concurrently)
- `src/components/PlayerCardDisplay.tsx` - Card viewer with tabs for front/back, download functionality

**Component Structure**
- Uses shadcn/ui components extensively (Button, Card, Tabs, Input, etc.)
- Custom components: AppHeader, ImageUploadInput, LoadingIndicator, PlayerCardDisplay
- Tailwind CSS for styling with custom design system colors

### Design System
- Primary color: Vibrant blue (#29ABE2)
- Background: Light gray (#F0F0F0) 
- Accent: Teal (#29E2C0)
- Font: Inter for clean, modern UI
- Card aspect ratio: 2.5:3.5 (standard baseball card proportions)

### Data Flow
1. User uploads kid photo + team logo, enters name
2. Files converted to data URIs on client
3. Server action calls AI flow 3 times for variations
4. AI generates stats (text) then front/back card images
5. Results displayed in tabbed interface with download options

### Error Handling
- Comprehensive validation for required fields
- Toast notifications for user feedback
- Graceful handling of AI generation failures
- Loading states during generation process

## Important Notes
- Image generation uses experimental Gemini 2.0 Flash model (`googleai/gemini-2.0-flash-exp`)
- All images handled as data URIs throughout the pipeline
- Card generation is parallelized for performance (3 concurrent requests)
- No persistent storage - cards exist only in browser session