#!/bin/bash
# Montaje: v1 (Nachito escucha, 3 s) → v0 (trío escucha, 4 s) → v2 (baile, 15 s) → v3 (te toca, 5 s) → placa 1.5 s
set -e
cd "$(dirname "$0")"
N="scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1,format=yuv420p"
ffmpeg -v error -y \
  -i vid/v1-escucha-final.mp4 -i vid/v0-trio-escucha.mp4 -i vid/v2-baile-final.mp4 -i vid/v3-tetoca-final.mp4 -i placa.mp4 \
  -filter_complex "[0]trim=0:3,setpts=PTS-STARTPTS,$N[a];[1]$N[b];[2]$N[c];[3]$N[d];[4]$N[e];[b][c]xfade=transition=fade:duration=0.3:offset=3.74[bc];[a][bc][d][e]concat=n=4:v=1:a=0[v]" \
  -map "[v]" -c:v libx264 -crf 20 -preset slow -movflags +faststart nachito-sintonizate-mudo.mp4
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 nachito-sintonizate-mudo.mp4)
# Audio de la referencia (uso académico) alineado al inicio del baile (t=7 s), con entrada/salida suaves
ffmpeg -v error -y -i nachito-sintonizate-mudo.mp4 -i ../insumos/pase-jamal.mp4 \
  -filter_complex "[1:a]afade=t=in:d=0.3,adelay=6740|6740,afade=t=out:st=$(echo "$D-2" | bc):d=2,apad,atrim=0:$D[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart nachito-sintonizate.mp4
ls -la nachito-sintonizate*.mp4
