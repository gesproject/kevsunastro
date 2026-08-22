import { mockShows } from "@/data/mock";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { Show } from "@/types";

type ShowRecord = {
  id: string;
  date: string;
  venue: string;
  city: string;
  country: string;
  ticket_url: string | null;
  is_sold_out: boolean | null;
  is_free: boolean | null;
};

function mapShow(row: ShowRecord): Show {
  return {
    id: row.id,
    date: row.date,
    venue: row.venue,
    city: row.city,
    country: row.country,
    ticketUrl: row.ticket_url ?? undefined,
    isSoldOut: row.is_sold_out ?? undefined,
    isFree: row.is_free ?? undefined,
  };
}

export async function GET() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return Response.json(mockShows);
  }

  const { data, error } = await supabase
    .from("shows")
    .select("id,date,venue,city,country,ticket_url,is_sold_out,is_free")
    .order("date", { ascending: true });

  if (error || !data) {
    if (error) console.error("shows query failed:", error);
    return Response.json(mockShows);
  }

  return Response.json((data as ShowRecord[]).map(mapShow));
}
