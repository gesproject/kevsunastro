// TypeScript interfaces for the Sölbo website data schema

export interface Show {
  id: string;
  date: string; // ISO date string, e.g. "2025-08-15"
  venue: string;
  city: string;
  country: string;
  ticketUrl?: string;
  isSoldOut?: boolean;
  isFree?: boolean;
  featuredImage?: string;
}

export interface Release {
  id: string;
  title: string;
  releaseDate: string; // ISO date string
  type: "single" | "ep" | "album";
  artworkUrl?: string;
  spotifyUrl?: string;
  soundcloudUrl?: string;
  bandcampUrl?: string;
  youtubeUrl?: string;
}

export interface Link {
  id: string;
  label: string;
  url: string;
  platform:
    | "spotify"
    | "soundcloud"
    | "bandcamp"
    | "youtube"
    | "instagram"
    | "facebook"
    | "tiktok"
    | "twitter"
    | "other";
}

export interface Content {
  bio: string;
  heroVideoUrl?: string; // URL for hero background video
  heroHeadline?: string;
  heroTagline?: string;
  profileImageUrl?: string;
  pressPhotoUrl?: string;
  bookingEmail?: string;
}
