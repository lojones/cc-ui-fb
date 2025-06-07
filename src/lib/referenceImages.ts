import fs from 'fs';
import path from 'path';

export interface ReferenceImage {
  filename: string;
  dataUri: string;
}

/**
 * Get all reference images from the assets directory
 */
export async function getReferenceImages(): Promise<ReferenceImage[]> {
  const timestamp = () => new Date().toISOString();
  const assetsDir = path.join(process.cwd(), 'src', 'assets', 'baseball-card-templates');
  
  console.log(`${timestamp} 📁 [REFERENCE] Loading reference images from: ${assetsDir}`);
  
  try {
    const files = fs.readdirSync(assetsDir);
    const imageFiles = files.filter(file => 
      file.toLowerCase().endsWith('.png') || 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.jpeg')
    );
    
    console.log(`${timestamp} 📋 [REFERENCE] Found ${imageFiles.length} reference images:`, imageFiles);
    
    const referenceImages: ReferenceImage[] = [];
    
    for (const filename of imageFiles) {
      const filePath = path.join(assetsDir, filename);
      const imageBuffer = fs.readFileSync(filePath);
      const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      const base64 = imageBuffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;
      
      referenceImages.push({
        filename,
        dataUri
      });
      
      console.log(`${timestamp} ✅ [REFERENCE] Loaded ${filename}, size: ${imageBuffer.length} bytes`);
    }
    
    return referenceImages;
  } catch (error) {
    console.error(`${timestamp} 💥 [REFERENCE] Error loading reference images:`, error);
    return [];
  }
}

/**
 * Get a random reference image
 */
export async function getRandomReferenceImage(): Promise<ReferenceImage | null> {
  const timestamp = () => new Date().toISOString();
  const referenceImages = await getReferenceImages();
  
  if (referenceImages.length === 0) {
    console.warn(`${timestamp} ⚠️ [REFERENCE] No reference images available`);
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * referenceImages.length);
  const selectedImage = referenceImages[randomIndex];
  
  console.log(`${timestamp} 🎲 [REFERENCE] Selected random image: ${selectedImage.filename} (${randomIndex + 1}/${referenceImages.length})`);
  
  return selectedImage;
}

/**
 * Get multiple different random reference images for variations
 */
export async function getRandomReferenceImages(count: number): Promise<(ReferenceImage | null)[]> {
  const timestamp = () => new Date().toISOString();
  const referenceImages = await getReferenceImages();
  
  if (referenceImages.length === 0) {
    console.warn(`${timestamp} ⚠️ [REFERENCE] No reference images available`);
    return Array(count).fill(null);
  }
  
  console.log(`${timestamp} 🎯 [REFERENCE] Selecting ${count} different reference images`);
  
  const selectedImages: (ReferenceImage | null)[] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < count; i++) {
    if (usedIndices.size >= referenceImages.length) {
      // If we've used all available images, start over or use random selection
      usedIndices.clear();
    }
    
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * referenceImages.length);
    } while (usedIndices.has(randomIndex) && usedIndices.size < referenceImages.length);
    
    usedIndices.add(randomIndex);
    const selectedImage = referenceImages[randomIndex];
    selectedImages.push(selectedImage);
    
    console.log(`${timestamp} 🎲 [REFERENCE] Variation ${i + 1}: Selected ${selectedImage.filename}`);
  }
  
  return selectedImages;
}