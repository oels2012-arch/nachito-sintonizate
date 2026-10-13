#!/bin/bash
# encode.sh <input> <name>  → MP4 720p/1080p, WebM VP9 720p, póster JPG (sin audio)
set -e
IN="$1"; N="$2"; OUT="$(dirname "$0")/../web/public/assets"
ffmpeg -v error -y -i "$IN" -an -vf "scale=720:-2" -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart "$OUT/$N-720.mp4"
ffmpeg -v error -y -i "$IN" -an -vf "scale=1080:-2" -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart "$OUT/$N-1080.mp4"
ffmpeg -v error -y -i "$IN" -an -vf "scale=720:-2" -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 "$OUT/$N-720.webm"
ffmpeg -v error -y -ss 0.3 -i "$IN" -frames:v 1 -vf "scale=720:-2" -q:v 4 "$OUT/$N-poster.jpg"
ls -la "$OUT" | grep "$N"
