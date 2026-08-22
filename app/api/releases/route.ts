import { mockReleases } from "@/data/mock";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { Release } from "@/types";

type ReleaseRecord = {
  id: string;
  title: string;
  release_date: string;
  type: Release["type"];
  artwork_url: string | null;
  spotify_url: string | null;
  soundcloud_url: string | null;
  bandcamp_url: string | null;
  youtube_url: string | null;
};

function mapRelease(row: ReleaseRecord): Release {
  return {
    id: row.id,
    title: row.title,
    releaseDate: row.release_date,
    type: row.type,
    artworkUrl: row.artwork_url ?? undefined,
    spotifyUrl: row.spotify_url ?? undefined,
    soundcloudUrl: row.soundcloud_url ?? undefined,
    bandcampUrl: row.bandcamp_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
  };
}

export async function GET() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return Response.json(mockReleases);
  }

  const { data, error } = await supabase
    .from("releases")
    .select("id,title,release_date,type,artwork_url,spotify_url,soundcloud_url,bandcamp_url,youtube_url")
    .order("release_date", { ascending: false });

  if (error || !data) {
    if (error) console.error("releases query failed:", error);
    return Response.json(mockReleases);
  }

  return Response.json((data as ReleaseRecord[]).map(mapRelease));
}
