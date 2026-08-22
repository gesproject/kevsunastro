-- Seed data copied from data/mock.ts.
-- Run after 001_schema.sql in the final client Supabase project.

insert into public.shows
  (date, venue, city, country, ticket_url, is_sold_out, is_free)
values
  ('2025-08-15', 'VELD', 'Toronto', 'CA', 'https://example.com/tickets/1', false, false),
  ('2025-09-03', 'Stereo', 'Montreal', 'CA', 'https://example.com/tickets/2', false, false),
  ('2025-10-11', 'New City Gas', 'Montreal', 'CA', null, true, false),
  ('2025-10-11', 'Newspeak', 'Montreal', 'CA', null, true, false),
  ('2025-11-22', 'Yoko Luna', 'Montreal', 'CA', null, false, true);

insert into public.releases
  (title, release_date, type, artwork_url, spotify_url, soundcloud_url, bandcamp_url, youtube_url)
values
  ('Threshold', '2025-03-01', 'ep', '/images/threshold-artwork.png', 'https://open.spotify.com/placeholder', 'https://soundcloud.com/placeholder', null, null),
  ('Mecca', '2026-04-10', 'single', '/images/mecca-solbo.png', 'https://open.spotify.com/placeholder', null, null, null),
  ('Periphery', '2024-06-20', 'album', '/images/periphery-artwork.png', 'https://open.spotify.com/placeholder', null, 'https://bandcamp.com/placeholder', null);

select count(*) as shows_count from public.shows;
select count(*) as releases_count from public.releases;
