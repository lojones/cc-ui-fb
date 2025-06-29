/**
 * Background removal service for player photos
 * Supports multiple providers with fallback options
 */

export interface BackgroundRemovalResult {
  success: boolean;
  processedImageDataUri?: string;
  originalImageDataUri: string;
  provider: string;
  error?: string;
}

export interface BackgroundRemovalOptions {
  preferredProvider?: 'withoutbg' | 'photoroom' | 'mock';
  quality?: 'high' | 'medium' | 'low';
  format?: 'png' | 'jpg';
}

/**
 * Remove background from image using WithoutBG API
 */
async function removeBackgroundWithWithoutBG(
  imageDataUri: string,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> {
  const apiKey = process.env.WITHOUTBG_API_KEY;
  
  if (!apiKey) {
    throw new Error('WithoutBG API key not configured');
  }

  try {
    // Convert data URI to base64 for API (remove the data:image/...;base64, prefix)
    const base64Data = imageDataUri.split(',')[1];
    
    const response = await fetch('https://api.withoutbg.com/v1.0/image-without-background-base64', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        image_base64: base64Data
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WithoutBG API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // WithoutBG returns the processed image as base64 in the response
    if (!result.img_without_background_base64) {
      throw new Error('No processed image returned from WithoutBG API');
    }

    // Convert back to data URI format
    const processedDataUri = `data:image/png;base64,${result.img_without_background_base64}`;

    return {
      success: true,
      processedImageDataUri: processedDataUri,
      originalImageDataUri: imageDataUri,
      provider: 'withoutbg'
    };
  } catch (error) {
    return {
      success: false,
      originalImageDataUri: imageDataUri,
      provider: 'withoutbg',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Remove background using PhotoRoom API (alternative provider)
 */
async function removeBackgroundWithPhotoRoom(
  imageDataUri: string,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> {
  const apiKey = process.env.PHOTOROOM_API_KEY;
  
  if (!apiKey) {
    throw new Error('PhotoRoom API key not configured');
  }

  try {
    // Convert data URI to blob for form data
    const response = await fetch(imageDataUri);
    const blob = await response.blob();
    
    const formData = new FormData();
    formData.append('image_file', blob);
    formData.append('format', options.format || 'png');
    
    const apiResponse = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    });

    if (!apiResponse.ok) {
      throw new Error(`PhotoRoom API error: ${apiResponse.status}`);
    }

    const resultBlob = await apiResponse.blob();
    const processedDataUri = await blobToDataUri(resultBlob);

    return {
      success: true,
      processedImageDataUri: processedDataUri,
      originalImageDataUri: imageDataUri,
      provider: 'photoroom'
    };
  } catch (error) {
    return {
      success: false,
      originalImageDataUri: imageDataUri,
      provider: 'photoroom',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Mock background removal for development/testing
 */
async function mockBackgroundRemoval(
  imageDataUri: string,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real mock, we'd apply some basic processing
  // For now, just return the original image
  return {
    success: true,
    processedImageDataUri: imageDataUri,
    originalImageDataUri: imageDataUri,
    provider: 'mock'
  };
}

/**
 * Main background removal function with provider fallback
 */
export async function removeBackground(
  imageDataUri: string,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> {
  const providers = [
    options.preferredProvider || 'withoutbg',
    'photoroom',
    'mock'
  ].filter((provider, index, arr) => arr.indexOf(provider) === index); // Remove duplicates

  let lastError: string | undefined;

  for (const provider of providers) {
    try {
      let result: BackgroundRemovalResult;
      
      switch (provider) {
        case 'withoutbg':
          result = await removeBackgroundWithWithoutBG(imageDataUri, options);
          break;
        case 'photoroom':
          result = await removeBackgroundWithPhotoRoom(imageDataUri, options);
          break;
        case 'mock':
          result = await mockBackgroundRemoval(imageDataUri, options);
          break;
        default:
          continue;
      }

      if (result.success) {
        return result;
      }
      
      lastError = result.error;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      continue;
    }
  }

  // If all providers failed, return failure with original image
  return {
    success: false,
    originalImageDataUri: imageDataUri,
    provider: 'none',
    error: lastError || 'All background removal providers failed'
  };
}

/**
 * Utility function to convert blob to data URI
 */
function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Validate image before processing
 */
export function validateImageForBackgroundRemoval(dataUri: string): {
  valid: boolean;
  error?: string;
} {
  try {
    // Check if it's a valid data URI
    if (!dataUri.startsWith('data:image/')) {
      return { valid: false, error: 'Invalid image format' };
    }

    // Check file size (estimate from base64 length)
    const base64Data = dataUri.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > 10) {
      return { valid: false, error: 'Image too large (max 10MB)' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid image data' };
  }
}