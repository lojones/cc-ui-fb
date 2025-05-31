"use client";

import Image from 'next/image';
import type { ChangeEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface ImageUploadInputProps {
  id: string;
  label: string;
  onFileChange: (file: File | null) => void;
  previewSrc: string | null;
  currentFileName: string | null;
  accept?: string;
  hint?: string;
  aspectRatio?: string; // e.g., 'aspect-square', 'aspect-[3/4]'
}

export function ImageUploadInput({
  id,
  label,
  onFileChange,
  previewSrc,
  currentFileName,
  accept = "image/*",
  hint = "kid person",
  aspectRatio = "aspect-[3/4]", // Default to a portrait-like aspect ratio for player photos
}: ImageUploadInputProps) {
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onFileChange(file || null);
  };

  return (
    <div className="space-y-2 w-full">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Card className="border-dashed border-2 hover:border-primary transition-colors">
        <CardContent className="p-4">
          <label
            htmlFor={id}
            className={`flex flex-col items-center justify-center space-y-2 cursor-pointer ${aspectRatio} w-full rounded-md`}
          >
            {previewSrc ? (
              <Image
                src={previewSrc}
                alt="Preview"
                width={aspectRatio === 'aspect-square' ? 200 : 150}
                height={aspectRatio === 'aspect-square' ? 200 : 200}
                className="rounded-md object-cover"
                data-ai-hint={hint}
              />
            ) : (
              <div className={`flex flex-col items-center justify-center text-muted-foreground ${aspectRatio === 'aspect-square' ? 'h-40 w-40' : 'h-52 w-40'}`}>
                <UploadCloud className="h-12 w-12 mb-2" />
                <span className="text-sm text-center">Click or drag to upload</span>
              </div>
            )}
            <Input
              id={id}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </CardContent>
      </Card>
      {currentFileName && (
        <p className="text-xs text-muted-foreground mt-1">File: {currentFileName}</p>
      )}
    </div>
  );
}
