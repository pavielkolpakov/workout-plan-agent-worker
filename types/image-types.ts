import type {
  ImageAsset,
  ImageOwnerType,
  ImageType,
  ImageVisibility,
} from "../db/schema";

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSize?: number;
}

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
}

export interface ImageMetadata extends ImageAsset {
  public_url?: string;
}

export type { ImageAsset, ImageOwnerType, ImageType, ImageVisibility };
