// Mock data for local development — all hardcoded.
// Replace with Supabase queries in a future phase.

import type { Show, Release, Link, Content } from "@/types";

export const mockShows: Show[] = [
  {
    id: "show-1",
    date: "2025-08-15",
    venue: "VELD",
    city: "Toronto",
    country: "CA",
    ticketUrl: "https://example.com/tickets/1",
    isSoldOut: false,
  },
  {
    id: "show-2",
    date: "2025-09-03",
    venue: "Stereo",
    city: "Montreal",
    country: "CA",
    ticketUrl: "https://example.com/tickets/2",
    isSoldOut: false,
  },
  {
    id: "show-3",
    date: "2025-10-11",
    venue: "New City Gas",
    city: "Montreal",
    country: "CA",
    isSoldOut: true,
  },
  {
    id: "show-4",
    date: "2025-10-11",
    venue: "Newspeak",
    city: "Montreal",
    country: "CA",
    isSoldOut: true,
  },
  {
    id: "show-5",
    date: "2025-11-22",
    venue: "Yoko Luna",
    city: "Montreal",
    country: "CA",
    isFree: true,
  },
];

export const mockReleases: Release[] = [
  {
    id: "release-1",
    title: "Threshold",
    releaseDate: "2025-03-01",
    type: "ep",
    artworkUrl: "/images/threshold-artwork.png",
    spotifyUrl: "https://open.spotify.com/placeholder",
    soundcloudUrl: "https://soundcloud.com/placeholder",
  },
  {
    id: "release-2",
    title: "Mecca",
    releaseDate: "2026-04-10",
    type: "single",
    artworkUrl: "/images/mecca-solbo.png",
    spotifyUrl: "https://open.spotify.com/placeholder",
  },
  {
    id: "release-3",
    title: "Periphery",
    releaseDate: "2024-06-20",
    type: "album",
    artworkUrl: "/images/periphery-artwork.png",
    spotifyUrl: "https://open.spotify.com/placeholder",
    bandcampUrl: "https://bandcamp.com/placeholder",
  },
];

export const mockLinks: Link[] = [
  {
    id: "link-1",
    label: "Spotify",
    url: "https://open.spotify.com/placeholder",
    platform: "spotify",
  },
  {
    id: "link-2",
    label: "SoundCloud",
    url: "https://soundcloud.com/placeholder",
    platform: "soundcloud",
  },
  {
    id: "link-3",
    label: "Instagram",
    url: "https://www.instagram.com/solbo__/?hl=en",
    platform: "instagram",
  },
  {
    id: "link-4",
    label: "TikTok",
    url: "https://www.tiktok.com/@solbo__",
    platform: "tiktok",
  },
  {
    id: "link-5",
    label: "Facebook",
    url: "https://www.facebook.com/solbo.music",
    platform: "facebook",
  },
];

// Mobile lnk.bio-style quick links shown in the Hero header.
// Update this array to change the mobile link-in-bio bar without touching layout code.
export const mockMobileLinks: Link[] = [
  {
    id: "mobile-link-music",
    label: "Music",
    url: "#music",
    platform: "other",
  },
  {
    id: "mobile-link-shows",
    label: "Shows",
    url: "#shows",
    platform: "other",
  },
  {
    id: "mobile-link-spotify",
    label: "Spotify",
    url: "https://open.spotify.com/placeholder",
    platform: "spotify",
  },
  {
    id: "mobile-link-instagram",
    label: "Instagram",
    url: "https://instagram.com/placeholder",
    platform: "instagram",
  },
  {
    id: "mobile-link-booking",
    label: "Booking",
    url: "mailto:booking@solbo.studio",
    platform: "other",
  },
];

export const mockContent: Content = {
  bio: "Sölbo is an electronic music artist crafting immersive soundscapes at the intersection of techno, ambient, and experimental club music. Based in Northern Europe, Sölbo's productions are defined by their tension between darkness and warmth, space and density.",
  heroVideoUrl: "/videos/Solbo-Hero-V2.mp4",
  heroHeadline: "Sölbo",
  heroTagline: "Tension between darkness and warmth.",
  profileImageUrl: "/images/solbo-profile.jpg",
  pressPhotoUrl: undefined,
  bookingEmail: "booking@solbo.studio",
};
