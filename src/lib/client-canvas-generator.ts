/**
 * Client-Side Canvas Baseball Card Generator
 * 
 * This system runs entirely in the browser using HTML5 Canvas API,
 * avoiding any server-side native dependencies while providing
 * sophisticated layered card generation.
 */

// Standard baseball card dimensions (2.5" x 3.5" at 300 DPI)
export const CARD_DIMENSIONS = {
  width: 750,  // 2.5 inches * 300 DPI
  height: 1050, // 3.5 inches * 300 DPI
  bleedArea: 37.5, // 0.125 inches bleed
  safeMargin: 75   // 0.25 inches safe margin
} as const;

export interface CardPlayerData {
  name: string;
  position?: string;
  teamName?: string;
  cardNumber?: string;
  cardSet?: string;
  cardYear?: string;
  bio?: string;
  customStats?: string;
  playerPhotoDataUri: string;
  teamLogoDataUri: string;
  style: string;
}

export interface ClientCardResult {
  frontDataUri: string;
  backDataUri: string;
  playerStats: string;
}

export class ClientCanvasGenerator {
  private frontCanvas: HTMLCanvasElement;
  private backCanvas: HTMLCanvasElement;
  private frontCtx: CanvasRenderingContext2D;
  private backCtx: CanvasRenderingContext2D;
  private playerData: CardPlayerData;
  
  // Debug flag - set to true to enable debugging features
  private debug = process.env.NODE_ENV === 'development';

  constructor(playerData: CardPlayerData) {
    this.playerData = playerData;
    
    // Create canvases
    this.frontCanvas = document.createElement('canvas');
    this.backCanvas = document.createElement('canvas');
    
    this.frontCanvas.width = CARD_DIMENSIONS.width;
    this.frontCanvas.height = CARD_DIMENSIONS.height;
    this.backCanvas.width = CARD_DIMENSIONS.width;
    this.backCanvas.height = CARD_DIMENSIONS.height;
    
    this.frontCtx = this.frontCanvas.getContext('2d')!;
    this.backCtx = this.backCanvas.getContext('2d')!;
    
    // Configure high-quality rendering
    this.frontCtx.imageSmoothingEnabled = true;
    this.frontCtx.imageSmoothingQuality = 'high';
    this.backCtx.imageSmoothingEnabled = true;
    this.backCtx.imageSmoothingQuality = 'high';
    
    // Debug helpers
    if (this.debug) {
      // Make canvases available globally for debugging
      (window as any).debugCanvases = {
        front: this.frontCanvas,
        back: this.backCanvas,
        frontCtx: this.frontCtx,
        backCtx: this.backCtx
      };
      
      console.log('🐛 [DEBUG] Canvas generator initialized. Access via window.debugCanvases');
    }
  }
  
  /**
   * Debug helper - pause execution for debugging
   */
  private debugPause(layerName: string) {
    if (this.debug) {
      console.log(`🐛 [DEBUG] Pausing at layer: ${layerName}`);
      console.log('🐛 [DEBUG] Front canvas state:', this.frontCanvas.toDataURL());
      
      // Show canvas state visually
      this.debugShowCanvas(this.frontCanvas, layerName);
      
      // Add a breakpoint here by setting a debugger statement
      // debugger; // Uncomment this line to add automatic breakpoints
    }
  }
  
  /**
   * Debug helper - log canvas state
   */
  private debugLog(message: string, data?: any) {
    if (this.debug) {
      console.log(`🐛 [DEBUG] ${message}`, data || '');
    }
  }
  
  /**
   * Debug helper - add canvas to page for visual debugging
   */
  private debugShowCanvas(canvas: HTMLCanvasElement, label: string) {
    if (this.debug) {
      const debugDiv = document.getElementById('debug-canvases') || this.createDebugDiv();
      
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'margin: 10px; padding: 10px; border: 1px solid #ccc; display: inline-block;';
      
      const labelEl = document.createElement('h4');
      labelEl.textContent = label;
      labelEl.style.cssText = 'margin: 0 0 10px 0; font-size: 14px;';
      
      const debugCanvas = canvas.cloneNode() as HTMLCanvasElement;
      const debugCtx = debugCanvas.getContext('2d')!;
      debugCtx.drawImage(canvas, 0, 0);
      
      // Scale down for debugging view
      debugCanvas.style.cssText = 'max-width: 200px; max-height: 280px; border: 1px solid #000;';
      
      wrapper.appendChild(labelEl);
      wrapper.appendChild(debugCanvas);
      debugDiv.appendChild(wrapper);
    }
  }
  
  /**
   * Create debug div if it doesn't exist
   */
  private createDebugDiv(): HTMLElement {
    let debugDiv = document.getElementById('debug-canvases');
    if (!debugDiv) {
      debugDiv = document.createElement('div');
      debugDiv.id = 'debug-canvases';
      debugDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: white;
        border: 2px solid #000;
        padding: 10px;
        z-index: 10000;
        max-height: 80vh;
        overflow-y: auto;
        font-family: monospace;
      `;
      
      const title = document.createElement('h3');
      title.textContent = '🐛 Debug Canvas States';
      title.style.cssText = 'margin: 0 0 10px 0; font-size: 16px;';
      debugDiv.appendChild(title);
      
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = 'position: absolute; top: 5px; right: 5px; border: none; background: red; color: white; width: 20px; height: 20px; cursor: pointer;';
      closeBtn.onclick = () => debugDiv!.remove();
      debugDiv.appendChild(closeBtn);
      
      document.body.appendChild(debugDiv);
    }
    return debugDiv;
  }

  /**
   * Main entry point for generating a complete baseball card
   */
  async generateCard(): Promise<ClientCardResult> {
    console.log('🎯 [CLIENT-CANVAS] Starting client-side card generation');
    
    try {
      // Generate front card with layered approach
      await this.buildFrontCard();
      
      // Generate back card
      await this.buildBackCard();
      
      // Generate player stats
      const playerStats = this.generatePlayerStats();
      
      const result = {
        frontDataUri: this.frontCanvas.toDataURL('image/png', 1.0),
        backDataUri: this.backCanvas.toDataURL('image/png', 1.0),
        playerStats
      };
      
      console.log('✅ [CLIENT-CANVAS] Card generation completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ [CLIENT-CANVAS] Error generating card:', error);
      throw error;
    }
  }

  /**
   * Build the front card with layered approach
   */
  private async buildFrontCard(): Promise<void> {
    this.debugLog('Building front card layers...');
    
    // Layer 1: Base Background
    this.debugLog('Starting Layer 1: Base Background');
    await this.renderBaseBackground();
    this.debugPause('Layer 1: Base Background');
    
    // Layer 2: Player Image Container (Previously Layer 4)
    this.debugLog('Starting Layer 2: Player Image Container');
    this.renderPlayerImageContainer();
    this.debugPause('Layer 2: Player Image Container');

    // Layer 3: Player Information Container (Previously Layer 5)
    this.debugLog('Starting Layer 3: Player Information Container');
    this.renderPlayerInformationContainer(); 
    this.debugPause('Layer 3: Player Information Container');

    // Layer 4: Player Logo Container (Previously Layer 6)
    this.debugLog('Starting Layer 4: Player Logo Container');
    this.renderPlayerLogoContainer(); 
    this.debugPause('Layer 4: Player Logo Container');
    
    // Layer 5: Player Image (Previously Layer 7)
    this.debugLog('Starting Layer 5: Player Image');
    await this.renderPlayerImage();
    this.debugPause('Layer 5: Player Image');
    
    // Layer 6: Team Information (Previously Layer 8)
    this.debugLog('Starting Layer 6: Team Information');
    await this.renderTeamInformation(); 
    this.debugPause('Layer 6: Team Information');
    
    // Layer 7: Player Information (Previously Layer 9)
    this.debugLog('Starting Layer 7: Player Information');
    this.renderPlayerInformation(); 
    this.debugPause('Layer 7: Player Information');
  }

  /**
   * Layer 1: Base Background
   */
  private async renderBaseBackground(): Promise<void> {
    const ctx = this.frontCtx;

    const playerNameFontFamily = '"Roboto Condensed", sans-serif'; // New font family
    ctx.font = `bold 50px ${playerNameFontFamily}`;
    
    try {
      // Load the SVG background texture from public folder
      const svgUrl = '/assets/bg-textures/wood1.svg';
      const backgroundImage = await this.loadImage(svgUrl);
      
      // Fill with a base color first (works well with wood grain texture)
      const style = this.playerData.style.toLowerCase();
      let baseColor = '#e8dcc0'; // warm cream base for wood
      
      if (style === 'vintage') {
        baseColor = '#d4c4a0'; // warmer vintage wood tone
      } else if (style === 'modern') {
        baseColor = '#3a3a3a'; // dark modern base
      }
      
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, CARD_DIMENSIONS.width, CARD_DIMENSIONS.height);
      
      // Stretch the SVG to cover the entire canvas
      // Since it's SVG, it will scale without pixelation
      this.debugLog('Stretching SVG background to fit canvas', { 
        canvasWidth: CARD_DIMENSIONS.width, 
        canvasHeight: CARD_DIMENSIONS.height,
        svgWidth: backgroundImage.width,
        svgHeight: backgroundImage.height
      });
      
      // Set opacity and blend mode for the wood texture overlay based on style
      let patternOpacity = 0.4;
      let blendMode: GlobalCompositeOperation = 'multiply';
      
      if (style === 'modern') {
        patternOpacity = 0.3;
        blendMode = 'multiply';
      } else if (style === 'vintage') {
        patternOpacity = 0.6;
        blendMode = 'overlay';
      } else { // classic
        patternOpacity = 0.4;
        blendMode = 'soft-light';
      }
      
      ctx.globalAlpha = patternOpacity;
      ctx.globalCompositeOperation = blendMode;
      
      // Draw the SVG stretched to fill the entire canvas
      ctx.drawImage(
        backgroundImage, 
        0, 0, // source x, y
        backgroundImage.width, backgroundImage.height, // source width, height
        0, 0, // destination x, y
        CARD_DIMENSIONS.width, CARD_DIMENSIONS.height // destination width, height
      );
      
      // Reset opacity and composite operation
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
      
      this.debugLog('SVG background stretched and applied successfully');
      
    } catch (error) {
      this.debugLog('Failed to load SVG background, using fallback gradient', error);
      
      // Fallback to gradient if SVG loading fails
      let gradient;
      const style = this.playerData.style.toLowerCase();
      
      if (style === 'vintage') {
        gradient = ctx.createLinearGradient(0, 0, 0, CARD_DIMENSIONS.height);
        gradient.addColorStop(0, '#f4e4bc');
        gradient.addColorStop(1, '#d4af37');
      } else if (style === 'modern') {
        gradient = ctx.createLinearGradient(0, 0, 0, CARD_DIMENSIONS.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#3498db');
      } else { // classic
        gradient = ctx.createLinearGradient(0, 0, 0, CARD_DIMENSIONS.height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f8f9fa');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CARD_DIMENSIONS.width, CARD_DIMENSIONS.height);
    }
    
    // Add subtle border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, CARD_DIMENSIONS.width - 4, CARD_DIMENSIONS.height - 4);
  }

  /**
   * Layer 2: Background Accents
   */
  private renderBackgroundAccents(): void {
    // const ctx = this.frontCtx;
    // const style = this.playerData.style.toLowerCase();
    
    // if (style === 'vintage') {
    //   // Add decorative corner elements
    //   ctx.fillStyle = '#8b4513';
    //   ctx.fillRect(0, 0, 100, 20);
    //   ctx.fillRect(CARD_DIMENSIONS.width - 100, 0, 100, 20);
    //   ctx.fillRect(0, CARD_DIMENSIONS.height - 20, 100, 20);
    //   ctx.fillRect(CARD_DIMENSIONS.width - 100, CARD_DIMENSIONS.height - 20, 100, 20);
    // } else if (style === 'modern') {
    //   // Add geometric accents
    //   ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
    //   ctx.fillRect(0, 200, CARD_DIMENSIONS.width, 100);
    //   ctx.fillRect(0, 400, CARD_DIMENSIONS.width, 100);
    // }
  }

  /**
   * Layer 3: Graphic Overlays (Previously Layer 6)
   */
  private renderGraphicOverlays(): void {
    const ctx = this.frontCtx;
    const style = this.playerData.style.toLowerCase();
    
    if (style === 'modern') {
      // Add modern overlay effects
      const gradient = ctx.createLinearGradient(0, 400, 0, 500);
      gradient.addColorStop(0, 'rgba(52, 152, 219, 0)');
      gradient.addColorStop(1, 'rgba(52, 152, 219, 0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 400, CARD_DIMENSIONS.width, 100);
    }
  }

  /**
   * Layer 4: Player Image Container (Previously Layer 3)
   */
  private renderPlayerImageContainer(): void {
    const ctx = this.frontCtx;
    const cornerRadius = 15;
    
    // Define the inner box based on safe margins on all sides
    const safeMargin = CARD_DIMENSIONS.safeMargin;
    const innerBoxX = safeMargin;
    const innerBoxY = safeMargin;
    const innerBoxWidth = CARD_DIMENSIONS.width - (2 * safeMargin);
    const innerBoxHeight = CARD_DIMENSIONS.height - (2 * safeMargin);

    // Calculate the total height available for the two containers themselves,
    // excluding the safeMargin that will separate them.
    const contentHeightForContainers = innerBoxHeight - safeMargin;

    // Player image container takes the top 80% of this available content height
    const containerX = innerBoxX;
    const containerY = innerBoxY;
    const containerWidth = innerBoxWidth;
    const containerHeight = contentHeightForContainers * 0.80;
    
    // Draw container background with rounded corners
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(containerX + cornerRadius, containerY);
    ctx.lineTo(containerX + containerWidth - cornerRadius, containerY);
    ctx.arcTo(containerX + containerWidth, containerY, containerX + containerWidth, containerY + cornerRadius, cornerRadius);
    ctx.lineTo(containerX + containerWidth, containerY + containerHeight - cornerRadius);
    ctx.arcTo(containerX + containerWidth, containerY + containerHeight, containerX + containerWidth - cornerRadius, containerY + containerHeight, cornerRadius);
    ctx.lineTo(containerX + cornerRadius, containerY + containerHeight);
    ctx.arcTo(containerX, containerY + containerHeight, containerX, containerY + containerHeight - cornerRadius, cornerRadius);
    ctx.lineTo(containerX, containerY + cornerRadius);
    ctx.arcTo(containerX, containerY, containerX + cornerRadius, containerY, cornerRadius);
    ctx.closePath();
    ctx.fill();
    
    // Add container border with rounded corners
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    // Path is already defined and closed from fill, so we can just stroke it
    ctx.stroke(); 
  }

  /**
   * Layer 5: Player Information Container (Previously Layer 4)
   */
  private renderPlayerInformationContainer(): void {
    const ctx = this.frontCtx;
    const cornerRadius = 15;
    
    const safeMargin = CARD_DIMENSIONS.safeMargin;
    const innerBoxX = safeMargin;
    const innerBoxY = safeMargin;
    const innerBoxWidth = CARD_DIMENSIONS.width - (2 * safeMargin);
    const innerBoxHeight = CARD_DIMENSIONS.height - (2 * safeMargin);
    const contentHeightForContainers = innerBoxHeight - safeMargin;
    
    const playerImageContainerActualHeight = contentHeightForContainers * 0.80;
    const thisContainerHeight = contentHeightForContainers * 0.20;

    // New: Calculate margin between info and logo container
    const marginBetweenContainers = innerBoxWidth * 0.10;
    const widthForBothContainers = innerBoxWidth - marginBetweenContainers;

    // PlayerInformationContainer takes 75% of the widthForBothContainers
    const containerX = innerBoxX;
    const containerY = innerBoxY + playerImageContainerActualHeight + safeMargin;
    const containerWidth = widthForBothContainers * 0.75; 
    
    this.debugLog('Player info container dimensions', {
      x: containerX,
      y: containerY,
      width: containerWidth,
      height: thisContainerHeight,
    });
    
    // Draw container background with rounded corners
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.moveTo(containerX + cornerRadius, containerY);
    ctx.lineTo(containerX + containerWidth - cornerRadius, containerY);
    ctx.arcTo(containerX + containerWidth, containerY, containerX + containerWidth, containerY + cornerRadius, cornerRadius);
    ctx.lineTo(containerX + containerWidth, containerY + thisContainerHeight - cornerRadius);
    ctx.arcTo(containerX + containerWidth, containerY + thisContainerHeight, containerX + containerWidth - cornerRadius, containerY + thisContainerHeight, cornerRadius);
    ctx.lineTo(containerX + cornerRadius, containerY + thisContainerHeight);
    ctx.arcTo(containerX, containerY + thisContainerHeight, containerX, containerY + thisContainerHeight - cornerRadius, cornerRadius);
    ctx.lineTo(containerX, containerY + cornerRadius);
    ctx.arcTo(containerX, containerY, containerX + cornerRadius, containerY, cornerRadius);
    ctx.closePath();
    ctx.fill();
    
    // Add container border with rounded corners
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke(); // Path is already defined and closed from fill
    
    // Add subtle inner shadow effect, respecting rounded corners
    ctx.save(); // Save context state before clipping
    ctx.clip(); // Clip to the rounded rectangle path defined above

    const gradient = ctx.createLinearGradient(containerX, containerY, containerX, containerY + 20);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(containerX, containerY, containerWidth, 20); // Fill the top part for shadow
    
    ctx.restore(); // Restore context state to remove clipping
  }

  /**
   * Layer 6: Player Logo Container (Previously Layer 6)
   */
  private renderPlayerLogoContainer(): void {
    const ctx = this.frontCtx;

    const safeMargin = CARD_DIMENSIONS.safeMargin;
    const innerBoxX = safeMargin;
    const innerBoxY = safeMargin;
    const innerBoxWidth = CARD_DIMENSIONS.width - (2 * safeMargin);
    const innerBoxHeight = CARD_DIMENSIONS.height - (2 * safeMargin);
    const contentHeightForContainers = innerBoxHeight - safeMargin;

    const playerImageContainerActualHeight = contentHeightForContainers * 0.80;
    
    // New: Calculate margin and widths
    const marginBetweenContainers = innerBoxWidth * 0.10;
    const widthForBothContainers = innerBoxWidth - marginBetweenContainers;
    const playerInfoContainerActualWidth = widthForBothContainers * 0.75;
    const thisContainerActualWidth = widthForBothContainers * 0.25;
    
    const thisContainerHeight = contentHeightForContainers * 0.20;

    // Positioned to the right of the player information container, after the margin
    const containerX = innerBoxX + playerInfoContainerActualWidth + marginBetweenContainers;
    const containerY = innerBoxY + playerImageContainerActualHeight + safeMargin;
    const containerWidth = thisContainerActualWidth; 

    this.debugLog('Player logo container dimensions', {
      x: containerX,
      y: containerY,
      width: containerWidth,
      height: thisContainerHeight,
    });

    // Draw a circular background/border for the logo container
    const centerX = containerX + containerWidth / 2;
    const centerY = containerY + thisContainerHeight / 2;
    const radius = 1.2 * (Math.min(containerWidth, thisContainerHeight) / 2 - 4); // Subtract padding for border

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Similar to other containers
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#666'; // Similar to player image container border
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Layer 7: Player Image (Previously Layer 5)
   */
  private async renderPlayerImage(): Promise<void> {
    const ctx = this.frontCtx;
    
    this.debugLog('[RENDER-PLAYER-IMAGE] Starting player image rendering');
    
    try {
      const playerImage = await this.loadImage(this.playerData.playerPhotoDataUri);
      
      // Calculate the PlayerImageContainer dimensions precisely as in renderPlayerImageContainer
      const safeMargin = CARD_DIMENSIONS.safeMargin;
      const innerBoxX = safeMargin;
      const innerBoxY = safeMargin;
      const innerBoxWidth = CARD_DIMENSIONS.width - (2 * safeMargin);
      const innerBoxHeight = CARD_DIMENSIONS.height - (2 * safeMargin);
      const contentHeightForContainers = innerBoxHeight - safeMargin;

      // These are the dimensions of the target box (PlayerImageContainer) for the image
      const targetContainerX = innerBoxX;
      const targetContainerY = innerBoxY;
      const targetContainerWidth = innerBoxWidth;
      const targetContainerHeight = contentHeightForContainers * 0.80;

      this.debugLog('[RENDER-PLAYER-IMAGE] Target container for image', {
        x: targetContainerX,
        y: targetContainerY,
        width: targetContainerWidth,
        height: targetContainerHeight
      });

      // Calculate scaling to fill the entire container while maintaining aspect ratio
      // This will crop parts of the image if necessary to avoid whitespace
      const imageAspect = playerImage.width / playerImage.height;
      const containerAspect = targetContainerWidth / targetContainerHeight;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imageAspect > containerAspect) {
        // Image is wider than container, so height fills the container and width is cropped
        drawHeight = targetContainerHeight;
        drawWidth = targetContainerHeight * imageAspect;
        drawX = targetContainerX + (targetContainerWidth - drawWidth) / 2; // Center horizontally (will be cropped)
        drawY = targetContainerY; // Fill from top
      } else {
        // Image is taller than container (or same aspect), so width fills the container and height is cropped
        drawWidth = targetContainerWidth;
        drawHeight = targetContainerWidth / imageAspect;
        drawX = targetContainerX; // Fill from left
        drawY = targetContainerY + (targetContainerHeight - drawHeight) / 2; // Center vertically (will be cropped)
      }
      
      this.debugLog('[RENDER-PLAYER-IMAGE] Drawing image with dimensions', {
        drawX,
        drawY,
        drawWidth,
        drawHeight,
        imageSrcWidth: playerImage.width,
        imageSrcHeight: playerImage.height
      });

      // Clip to the container boundaries to prevent overflow
      ctx.save();
      ctx.beginPath();
      ctx.rect(targetContainerX, targetContainerY, targetContainerWidth, targetContainerHeight);
      ctx.clip();
      
      // Draw the player image, scaled and positioned
      ctx.drawImage(playerImage, drawX, drawY, drawWidth, drawHeight);
      
      ctx.restore();
      
    } catch (error) {
      console.error('❌ [CLIENT-CANVAS] Error loading player image:', error);
      this.drawImagePlaceholder(ctx);
    }
  }

  /**
   * Layer 8: Team Information (Previously Layer 7)
   * Renders the team logo into the PlayerLogoContainer.
   * Team name rendering has been commented out as its previous position is likely unsuitable.
   */
  private async renderTeamInformation(): Promise<void> {
    const ctx = this.frontCtx;
    
    if (this.playerData.teamLogoDataUri) {
      try {
        const logoImage = await this.loadImage(this.playerData.teamLogoDataUri);

        // Recalculate PlayerLogoContainer dimensions for precise placement
        const safeMargin = CARD_DIMENSIONS.safeMargin;
        const innerBoxX = safeMargin;
        const innerBoxY = safeMargin;
        const innerBoxWidth = CARD_DIMENSIONS.width - (2 * safeMargin);
        const innerBoxHeight = CARD_DIMENSIONS.height - (2 * safeMargin);
        const contentHeightForContainers = innerBoxHeight - safeMargin;
        const playerImageContainerActualHeight = contentHeightForContainers * 0.80;
        const marginBetweenContainers = innerBoxWidth * 0.10;
        const widthForBothContainers = innerBoxWidth - marginBetweenContainers;
        const playerInfoContainerActualWidth = widthForBothContainers * 0.75;
        
        const logoContainerX = innerBoxX + playerInfoContainerActualWidth + marginBetweenContainers;
        const logoContainerY = innerBoxY + playerImageContainerActualHeight + safeMargin;
        const logoContainerWidth = widthForBothContainers * 0.25;
        const logoContainerHeight = contentHeightForContainers * 0.20;

        // This is the radius of the circle drawn in renderPlayerLogoContainer
        const logoCircleRadius = Math.min(logoContainerWidth, logoContainerHeight) / 2 - 4; 
        const logoCircleCenterX = logoContainerX + logoContainerWidth / 2;
        const logoCircleCenterY = logoContainerY + logoContainerHeight / 2;

        // Scale the logo to fit within the logoCircleRadius
        const imageAspect = logoImage.width / logoImage.height;
        const diameter = logoCircleRadius * 2;
        
        let drawWidth, drawHeight;
        if (imageAspect > 1) { // Image is wider than tall
          drawWidth = diameter;
          drawHeight = diameter / imageAspect;
        } else { // Image is taller than wide or square
          drawHeight = diameter;
          drawWidth = diameter * imageAspect;
        }

        const drawX = logoCircleCenterX - drawWidth / 2;
        const drawY = logoCircleCenterY - drawHeight / 2;

        this.debugLog('Drawing team logo', {
          cx: logoCircleCenterX, cy: logoCircleCenterY, r: logoCircleRadius,
          dx: drawX, dy: drawY, dw: drawWidth, dh: drawHeight
        });

        // Clip to the circle before drawing the image
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoCircleCenterX, logoCircleCenterY, logoCircleRadius, 0, Math.PI * 2);
        ctx.clip();
        
        ctx.drawImage(logoImage, drawX, drawY, drawWidth, drawHeight);
        
        ctx.restore(); // Remove clipping path

      } catch (error) {
        console.error('❌ [CLIENT-CANVAS] Error loading or drawing team logo:', error);
      }
    }
    
    // Render team name - Commented out as its previous position is likely unsuitable.
    // Consider moving this to renderPlayerInformation or another appropriate place if needed.
    /*
    if (this.playerData.teamName) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.playerData.teamName, CARD_DIMENSIONS.width / 2, 580);
    }
    */
  }

  /**
   * Layer 9: Player Information
   * Renders text like player name and position within designated areas of the PlayerInformationContainer.
   */
  private renderPlayerInformation(): void {
    const ctx = this.frontCtx;

    // --- Recalculate PlayerInformationContainer dimensions for precise layout --- 
    const safeMargin = CARD_DIMENSIONS.safeMargin;
    const innerBoxX = safeMargin;
    const innerBoxY = safeMargin; 
    const innerBoxWidth = CARD_DIMENSIONS.width - (2 * safeMargin);
    const innerBoxHeight = CARD_DIMENSIONS.height - (2 * safeMargin);
    const contentHeightForContainers = innerBoxHeight - safeMargin;
    const playerImageContainerActualHeight = contentHeightForContainers * 0.80;
    const marginBetweenInfoAndLogo = innerBoxWidth * 0.10;
    const widthForBothInfoAndLogoContainers = innerBoxWidth - marginBetweenInfoAndLogo;
    
    const infoContainerX = innerBoxX;
    const infoContainerY = innerBoxY + playerImageContainerActualHeight + safeMargin;
    const infoContainerWidth = widthForBothInfoAndLogoContainers * 0.75;
    const infoContainerHeight = contentHeightForContainers * 0.20;

    // --- Define internal layout parameters --- 
    const textPadding = 10; // Padding inside the infoContainer
    const spacingBetweenNameAndOtherInfo = 8;

    const usableTextX = infoContainerX + textPadding;
    const usableTextY = infoContainerY + textPadding;
    const usableTextWidth = infoContainerWidth - (2 * textPadding);
    const usableTextHeight = infoContainerHeight - (2 * textPadding);

    if (usableTextWidth <= 0 || usableTextHeight <= 0) {
        this.debugLog("PlayerInformationContainer has no usable space for text after padding.");
        return;
    }

    const totalContentHeight = usableTextHeight - spacingBetweenNameAndOtherInfo;
    const nameAreaHeight = totalContentHeight * 0.75;
    const otherInfoAreaHeight = totalContentHeight * 0.25;

    // --- Render Player Name (Top 75% of usable area) --- 
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; // Vertically center the text within its line height
    const nameCenterX = usableTextX + usableTextWidth / 2;
    const nameDisplayAreaCenterY = usableTextY + nameAreaHeight / 2; // Vertical center of the name's allocated area

    let optimalFontSize = nameAreaHeight; // Start with a font size based on the area height
    const minPlayerNameFontSize = 10; // Minimum practical font size for the name
    const playerNameFontFamily = '"Roboto Condensed", Arial, sans-serif'; // New font family
    ctx.font = `bold ${optimalFontSize}px ${playerNameFontFamily}`;

    if (this.playerData.name && this.playerData.name.trim() !== "") {
        // Iteratively find the largest font size that fits
        while (optimalFontSize > minPlayerNameFontSize) {
            ctx.font = `bold ${optimalFontSize}px ${playerNameFontFamily}`;
            const textMetrics = ctx.measureText(this.playerData.name);
            const currentTextWidth = textMetrics.width;
            const currentTextHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;

            if (currentTextWidth <= usableTextWidth && currentTextHeight <= nameAreaHeight) {
                break;
            }
            optimalFontSize -= 1; 
        }
        optimalFontSize = Math.max(optimalFontSize, minPlayerNameFontSize);
    }
    ctx.font = `bold ${optimalFontSize}px ${playerNameFontFamily}`; // Set the determined optimal font size
    ctx.fillText(this.playerData.name, nameCenterX, nameDisplayAreaCenterY, usableTextWidth); 
    
    // --- Render Other Player Info (Bottom 25% of usable area) --- 
    const otherInfoAreaStartY = usableTextY + nameAreaHeight + spacingBetweenNameAndOtherInfo;
    const otherInfoCenterX = usableTextX + usableTextWidth / 2;

    let currentYPositionInOtherInfoArea = otherInfoAreaStartY;

    if (this.playerData.position) {
      ctx.font = `bold 18px ${playerNameFontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top'; // Align to the top of its line
      const positionTextMetrics = ctx.measureText(this.playerData.position);
      const positionTextHeight = positionTextMetrics.actualBoundingBoxAscent + positionTextMetrics.actualBoundingBoxDescent;
      
      // Center vertically within the otherInfoAreaHeight if it's the only item, or stack
      // For stacking, let's ensure it fits. If otherInfoAreaHeight is small, this might be tight.
      if (currentYPositionInOtherInfoArea + positionTextHeight < otherInfoAreaStartY + otherInfoAreaHeight) {
        ctx.fillText(this.playerData.position, otherInfoCenterX, currentYPositionInOtherInfoArea, usableTextWidth);
        currentYPositionInOtherInfoArea += positionTextHeight + 4; // Add line height + small gap
      }
    }
    
    const details = [];
    if (this.playerData.cardNumber) details.push(`#${this.playerData.cardNumber}`);
    if (this.playerData.cardYear) details.push(this.playerData.cardYear);

    if (details.length > 0) {
      // ctx.font = `14px ${playerNameFontFamily}`;
      ctx.fillStyle = '#555';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top'; // Align to the top of its line
      const detailsTextMetrics = ctx.measureText(details.join(' / '));
      const detailsTextHeight = detailsTextMetrics.actualBoundingBoxAscent + detailsTextMetrics.actualBoundingBoxDescent;

      if (currentYPositionInOtherInfoArea + detailsTextHeight < otherInfoAreaStartY + otherInfoAreaHeight) {
         ctx.fillText(details.join(' / '), otherInfoCenterX, currentYPositionInOtherInfoArea, usableTextWidth);
      }
    }
  }

  /**
   * Build the back card
   */
  private async buildBackCard(): Promise<void> {
    console.log('🔄 [CLIENT-CANVAS] Building back card...');
    
    const ctx = this.backCtx;
    
    // Background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, CARD_DIMENSIONS.width, CARD_DIMENSIONS.height);
    
    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, CARD_DIMENSIONS.width - 4, CARD_DIMENSIONS.height - 4);
    
    // Header
    ctx.fillStyle = '#333';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.playerData.name, CARD_DIMENSIONS.width / 2, 80);
    
    // Stats section
    let currentY = 150;
    
    // Biography
    if (this.playerData.bio) {
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Biography', 60, currentY);
      currentY += 40;
      
      ctx.font = '16px Arial, sans-serif';
      const bioLines = this.wrapText(ctx, this.playerData.bio, CARD_DIMENSIONS.width - 120);
      for (const line of bioLines.slice(0, 6)) {
        ctx.fillText(line, 60, currentY);
        currentY += 22;
      }
      currentY += 30;
    }
    
    // Stats
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('Season Stats', 60, currentY);
    currentY += 40;
    
    const stats = this.generatePlayerStats();
    const statLines = stats.split('\n').filter(line => line.trim());
    
    ctx.font = '16px Arial, sans-serif';
    for (const line of statLines.slice(0, 8)) {
      ctx.fillText(line, 60, currentY);
      currentY += 22;
    }
  }

  /**
   * Generate player statistics
   */
  private generatePlayerStats(): string {
    const stats = [
      `Games Played: ${Math.floor(Math.random() * 20) + 15}`,
      `Batting Average: .${Math.floor(Math.random() * 300) + 200}`,
      `Home Runs: ${Math.floor(Math.random() * 8) + 2}`,
      `RBIs: ${Math.floor(Math.random() * 25) + 10}`,
      `Stolen Bases: ${Math.floor(Math.random() * 10) + 3}`,
      `Fielding %: .${Math.floor(Math.random() * 100) + 900}`
    ];
    
    return stats.join('\n');
  }

  /**
   * Helper method to load images
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.debugLog(`Successfully loaded image: ${src}`, { width: img.width, height: img.height });
        resolve(img);
      };
      img.onerror = (error) => {
        this.debugLog(`Failed to load image: ${src}`, error);
        reject(error);
      };
      img.src = src;
    });
  }

  /**
   * Draw placeholder for missing images
   */
  private drawImagePlaceholder(ctx: CanvasRenderingContext2D): void {
    const x = CARD_DIMENSIONS.safeMargin + 10;
    const y = CARD_DIMENSIONS.safeMargin + 70;
    const width = CARD_DIMENSIONS.width - (2 * CARD_DIMENSIONS.safeMargin) - 20;
    const height = 380;
    
    ctx.fillStyle = '#ddd';
    ctx.fillRect(x, y, width, height);
    
    ctx.fillStyle = '#666';
    ctx.font = '24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Player Photo', x + width / 2, y + height / 2);
  }

  /**
   * Helper method to wrap text
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}