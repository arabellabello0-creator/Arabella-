
export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type VideoResolution = "720p" | "1080p";

export interface VideoGenerationOptions {
  prompt: string;
  image?: {
    data: string;
    mimeType: string;
  };
  aspectRatio: AspectRatio;
  resolution: VideoResolution;
}

export type TtsVoice = 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir';
