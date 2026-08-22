# Supabase Migration

Use these files when the final client Supabase account is created.

1. Create a Supabase project in `ca-central-1` / Montreal.
2. Open SQL Editor and run `001_schema.sql`.
3. Open SQL Editor and run `002_seed.sql`.
4. Confirm `shows_count` is `5` and `releases_count` is `3`.
5. Confirm Storage has a public bucket named `release-artwork`.
6. Copy the project URL, anon key, and service-role key into Vercel environment variables.

Do not commit real Supabase keys. The service-role key must stay server-only and must not use a `NEXT_PUBLIC_` prefix.
