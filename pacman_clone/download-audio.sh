#!/bin/bash

cd pacman-clone

echo "Downloading Pacman audio files..."

# List of audio files from app.js
audio_files=(
    "game_start"
    "pause"
    "pause_beat"
    "siren_1"
    "siren_2"
    "siren_3"
    "power_up"
    "extra_life"
    "eyes"
    "eat_ghost"
    "death"
    "fruit"
    "dot_1"
    "dot_2"
)

for audio in "${audio_files[@]}"; do
    echo "  - ${audio}.mp3"
    curl -L -f -o "app/style/audio/${audio}.mp3" "https://freepacman.org/app/style/audio/${audio}.mp3" || echo "Failed: ${audio}"
done

echo ""
echo "Download complete!"
echo "Audio files downloaded:"
ls -la app/style/audio/
