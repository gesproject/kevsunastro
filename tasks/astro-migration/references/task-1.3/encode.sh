#!/usr/bin/env bash
# Task 1.3 hero delivery benchmark - asset encode + objective quality measurement.
# Run from repo root: bash tasks/astro-migration/references/task-1.3/encode.sh
# Produces tasks/astro-migration/references/task-1.3/assets/** (git-ignored) and results/encode-sizes.csv
set -u

SRC=public/frames-mobile
OUT=tasks/astro-migration/references/task-1.3/assets
RES=tasks/astro-migration/references/task-1.3/results
mkdir -p "$OUT/webp" "$OUT/avif" "$OUT/video" "$RES"

CSV="$RES/encode-sizes.csv"
echo "variant,files,total_bytes,ssim_all" > "$CSV"

# $1 = decodable input, $2 = "seq" when input 0 is an image sequence (must be forced to
# 30 fps too, or the two inputs desynchronise at 25 vs 30 and SSIM is meaningless).
ssim_of () {
  local rate=""
  [ "${2:-}" = "seq" ] && rate="-framerate 30"
  ffmpeg -hide_banner $rate -i "$1" -framerate 30 -i "$SRC/frame_%04d.jpg" -lavfi ssim -f null - 2>&1 |
    grep -o 'All:[0-9.]*' | tail -1 | cut -d: -f2
}
# ffmpeg's image2 demuxer cannot bind an .avif sequence to a filtergraph, so AVIF quality
# is sampled frame-by-frame instead of over the full sequence.
ssim_avif_sample () {
  for i in 1 13 25 37 49 61 73 85 97 109 121 133 145 157 169 181 193; do
    f=$(printf "frame_%04d" $i)
    ffmpeg -hide_banner -i "$OUT/avif/$f.avif" -i "$SRC/$f.jpg" -lavfi ssim -f null - 2>&1 |
      grep -o 'All:[0-9.]*' | cut -d: -f2
  done | awk '{s+=$1; n++} END {printf "%.6f", s/n}'
}
dir_bytes () { find "$1" -type f -printf '%s\n' | awk '{s+=$1} END {print s+0}'; }
dir_count () { find "$1" -type f | wc -l | tr -d ' '; }

# ---- A0: shipped JPEG baseline (measured, not re-encoded) ----
echo "jpeg-baseline,$(dir_count $SRC),$(dir_bytes $SRC),1.000000" >> "$CSV"

# ---- A1: WebP q80 ----
echo "== webp q80 =="
for f in "$SRC"/frame_*.jpg; do
  n=$(basename "$f" .jpg)
  ffmpeg -y -v error -i "$f" -c:v libwebp -quality 80 -preset picture "$OUT/webp/$n.webp"
done
echo "webp-q80,$(dir_count $OUT/webp),$(dir_bytes $OUT/webp),$(ssim_of "$OUT/webp/frame_%04d.webp" seq)" >> "$CSV"

# ---- A2: AVIF crf32 (still-picture) ----
echo "== avif crf32 =="
for f in "$SRC"/frame_*.jpg; do
  n=$(basename "$f" .jpg)
  ffmpeg -y -v error -i "$f" -c:v libaom-av1 -crf 32 -cpu-used 6 -still-picture 1 "$OUT/avif/$n.avif"
done
echo "avif-crf32,$(dir_count $OUT/avif),$(dir_bytes $OUT/avif),$(ssim_avif_sample)" >> "$CSV"

# ---- B: scrub-capable video, 30 fps, same 1176x1764 source frames ----
enc_h264 () { # $1 = gop, $2 = label
  ffmpeg -y -v error -framerate 30 -i "$SRC/frame_%04d.jpg" \
    -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p -g "$1" -keyint_min "$1" -sc_threshold 0 \
    -movflags +faststart -an "$OUT/video/$2.mp4"
  echo "$2,1,$(stat -c%s "$OUT/video/$2.mp4"),$(ssim_of "$OUT/video/$2.mp4")" >> "$CSV"
}
echo "== h264 =="
enc_h264 30 h264-crf23-gop30
enc_h264 10 h264-crf23-gop10
enc_h264 1  h264-crf23-allintra

echo "== vp9 =="
ffmpeg -y -v error -framerate 30 -i "$SRC/frame_%04d.jpg" \
  -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -pix_fmt yuv420p -g 10 -keyint_min 10 -an \
  "$OUT/video/vp9-crf32-gop10.webm"
echo "vp9-crf32-gop10,1,$(stat -c%s "$OUT/video/vp9-crf32-gop10.webm"),$(ssim_of "$OUT/video/vp9-crf32-gop10.webm")" >> "$CSV"

# ---- poster / final frame fallbacks ----
ffmpeg -y -v error -i "$SRC/frame_0001.jpg" -c:v libwebp -quality 80 -preset picture "$OUT/poster-first.webp"
ffmpeg -y -v error -i "$SRC/frame_0193.jpg" -c:v libwebp -quality 80 -preset picture "$OUT/poster-final.webp"
echo "poster-first-webp,1,$(stat -c%s "$OUT/poster-first.webp")," >> "$CSV"
echo "poster-final-webp,1,$(stat -c%s "$OUT/poster-final.webp")," >> "$CSV"

echo "DONE"
cat "$CSV"
