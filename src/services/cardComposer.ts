import { cloudinary } from '@/lib/cloudinary';

export interface CompositionOptions {
  templateDataUri: string;
  playerPhotoDataUri: string;
  teamLogoDataUri: string;
  playerName: string;
}

export interface ComposedCard {
  frontImageUrl: string;
  backImageUrl: string;
}

/**
 * Uploads a data URI to Cloudinary and returns the public ID
 */
async function uploadDataUri(dataUri: string, folder: string, publicId?: string): Promise<string> {
  const timestamp = () => new Date().toISOString();
  console.log(`${timestamp()} ☁️ [CLOUDINARY] Uploading to folder: ${folder}, publicId: ${publicId}`);
  console.log(`${timestamp()} ☁️ [CLOUDINARY] Data URI length: ${dataUri.length}`);
  
  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
    });
    console.log(`${timestamp()} ✅ [CLOUDINARY] Upload successful, public_id: ${result.public_id}`);
    console.log(`${timestamp()} ✅ [CLOUDINARY] Upload URL: ${result.secure_url}`);
    return result.public_id;
  } catch (error) {
    console.error(`${timestamp()} 💥 [CLOUDINARY] Failed to upload to Cloudinary:`, error);
    if (error instanceof Error) {
      console.error(`${timestamp()} 💥 [CLOUDINARY] Error stack:`, error.stack);
    }
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Composes a baseball card by overlaying player photo and team logo onto a template
 */
export async function composeCard(options: CompositionOptions): Promise<ComposedCard> {
  const { templateDataUri, playerPhotoDataUri, teamLogoDataUri, playerName } = options;
  const timestamp = () => new Date().toISOString();
  
  console.log(`${timestamp()} 🏗️ [COMPOSER] Starting card composition for player: ${playerName}`);
  console.log(`${timestamp()} 🏗️ [COMPOSER] Template data URI length: ${templateDataUri.length}`);
  console.log(`${timestamp()} 🏗️ [COMPOSER] Player photo data URI length: ${playerPhotoDataUri.length}`);
  console.log(`${timestamp()} 🏗️ [COMPOSER] Team logo data URI length: ${teamLogoDataUri.length}`);
  
  try {
    // Upload all images to Cloudinary
    const timestampNum = Date.now();
    const sessionId = `session_${timestampNum}`;
    
    console.log(`${timestamp()} ☁️ [COMPOSER] Creating session: ${sessionId}`);
    console.log(`${timestamp()} ☁️ [COMPOSER] Uploading 3 images to Cloudinary...`);
    
    const [templateId, playerPhotoId, teamLogoId] = await Promise.all([
      uploadDataUri(templateDataUri, `templates/${sessionId}`, `template_${timestampNum}`),
      uploadDataUri(playerPhotoDataUri, `players/${sessionId}`, `player_${timestampNum}`),
      uploadDataUri(teamLogoDataUri, `logos/${sessionId}`, `logo_${timestampNum}`),
    ]);
    
    console.log(`${timestamp()} ✅ [COMPOSER] All uploads completed successfully`);
    console.log(`${timestamp()} 📋 [COMPOSER] Template ID: ${templateId}`);
    console.log(`${timestamp()} 📋 [COMPOSER] Player photo ID: ${playerPhotoId}`);
    console.log(`${timestamp()} 📋 [COMPOSER] Team logo ID: ${teamLogoId}`);

    // Compose front of card
    console.log(`${timestamp()} 🎨 [COMPOSER] Creating front card composition...`);
    // Format overlay IDs for Cloudinary (replace / with :)
    const playerOverlayId = playerPhotoId.replace(/\//g, ':');
    const logoOverlayId = teamLogoId.replace(/\//g, ':');
    
    console.log(`${timestamp()} 🔧 [COMPOSER] Player overlay ID:`, playerOverlayId);
    console.log(`${timestamp()} 🔧 [COMPOSER] Logo overlay ID:`, logoOverlayId);
    
    const frontImageUrl = cloudinary.url(templateId, {
      transformation: [
        // Add player photo overlay - adjust position and size as needed
        {
          overlay: playerOverlayId,
          width: 300,
          height: 400,
          crop: 'fill',
          gravity: 'face',
          x: 50,
          y: 50,
        },
        // Add team logo overlay - adjust position and size as needed
        {
          overlay: logoOverlayId,
          width: 80,
          height: 80,
          crop: 'fit',
          x: -120,
          y: -150,
          gravity: 'north_east',
        },
        // Add player name as text overlay
        {
          overlay: {
            font_family: 'Arial',
            font_size: 32,
            font_weight: 'bold',
            text: playerName,
          },
          color: 'white',
          y: 200,
          gravity: 'south',
        },
      ],
      format: 'png',
      quality: 'auto',
    });
    console.log(`${timestamp()} ✅ [COMPOSER] Front card URL generated:`, frontImageUrl);
    
    // Test: Generate a simple URL to verify the template exists
    const simpleTemplateUrl = cloudinary.url(templateId, {
      format: 'png',
      quality: 'auto',
    });
    console.log(`${timestamp()} 🧪 [COMPOSER] Simple template URL for testing:`, simpleTemplateUrl);

    // Create back card composition
    console.log(`${timestamp()} 🔄 [COMPOSER] Creating back card composition...`);
    const backImageUrl = cloudinary.url(templateId, {
      transformation: [
        // Different composition for back - maybe just logo and stats area
        {
          overlay: logoOverlayId,
          width: 100,
          height: 100,
          crop: 'fit',
          gravity: 'center',
          y: -100,
        },
        {
          overlay: {
            font_family: 'Arial',
            font_size: 24,
            font_weight: 'bold',
            text: playerName,
          },
          color: 'black',
          y: 50,
          gravity: 'center',
        },
      ],
      format: 'png',
      quality: 'auto',
    });
    console.log(`${timestamp()} ✅ [COMPOSER] Back card URL generated:`, backImageUrl);

    console.log(`${timestamp()} 🎉 [COMPOSER] Card composition completed successfully`);
    return {
      frontImageUrl,
      backImageUrl,
    };
  } catch (error) {
    console.error(`${timestamp()} 💥 [COMPOSER] Failed to compose card:`, error);
    if (error instanceof Error) {
      console.error(`${timestamp()} 💥 [COMPOSER] Error stack:`, error.stack);
    }
    throw new Error('Failed to compose baseball card');
  }
}

/**
 * Cleanup uploaded images after composition (optional)
 */
export async function cleanupSession(sessionId: string): Promise<void> {
  try {
    await Promise.all([
      cloudinary.api.delete_resources_by_prefix(`templates/${sessionId}/`),
      cloudinary.api.delete_resources_by_prefix(`players/${sessionId}/`),
      cloudinary.api.delete_resources_by_prefix(`logos/${sessionId}/`),
    ]);
  } catch (error) {
    console.error('Failed to cleanup Cloudinary resources:', error);
    // Don't throw - cleanup failures shouldn't break the app
  }
}