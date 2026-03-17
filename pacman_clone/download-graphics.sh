#!/bin/bash

cd pacman-clone

echo "Downloading Pacman sprites..."
for sprite in arrow_down arrow_left arrow_right arrow_up pacman_death pacman_error pacman_down pacman_left pacman_right pacman_up; do
    echo "  - ${sprite}.svg"
    curl -L -f -o "app/style/graphics/spriteSheets/characters/pacman/${sprite}.svg" "https://freepacman.org/app/style/graphics/spriteSheets/characters/pacman/${sprite}.svg" || echo "Failed: ${sprite}"
done

echo "Downloading Blinky (red ghost) sprites..."
for sprite in blinky_down_angry blinky_down_annoyed blinky_down blinky_left_angry blinky_left_annoyed blinky_left blinky_right_angry blinky_right_annoyed blinky_right blinky_up_angry blinky_up_annoyed blinky_up; do
    echo "  - ${sprite}.svg"
    curl -L -f -o "app/style/graphics/spriteSheets/characters/ghosts/blinky/${sprite}.svg" "https://freepacman.org/app/style/graphics/spriteSheets/characters/ghosts/blinky/${sprite}.svg" || echo "Failed: ${sprite}"
done

echo "Downloading Pinky (pink ghost) sprites..."
for dir in down left right up; do
    echo "  - pinky_${dir}.svg"
    curl -L -f -o "app/style/graphics/spriteSheets/characters/ghosts/pinky/pinky_${dir}.svg" "https://freepacman.org/app/style/graphics/spriteSheets/characters/ghosts/pinky/pinky_${dir}.svg" || echo "Failed: pinky_${dir}"
done

echo "Downloading Inky (cyan ghost) sprites..."
for dir in down left right up; do
    echo "  - inky_${dir}.svg"
    curl -L -f -o "app/style/graphics/spriteSheets/characters/ghosts/inky/inky_${dir}.svg" "https://freepacman.org/app/style/graphics/spriteSheets/characters/ghosts/inky/inky_${dir}.svg" || echo "Failed: inky_${dir}"
done

echo "Downloading Clyde (orange ghost) sprites..."
for dir in down left right up; do
    echo "  - clyde_${dir}.svg"
    curl -L -f -o "app/style/graphics/spriteSheets/characters/ghosts/clyde/clyde_${dir}.svg" "https://freepacman.org/app/style/graphics/spriteSheets/characters/ghosts/clyde/clyde_${dir}.svg" || echo "Failed: clyde_${dir}"
done

echo "Downloading ghost eyes and scared sprites..."
for dir in down left right up; do
    echo "  - eyes_${dir}.svg"
    curl -L -f -o "app/style/graphics/spriteSheets/characters/ghosts/eyes_${dir}.svg" "https://freepacman.org/app/style/graphics/spriteSheets/characters/ghosts/eyes_${dir}.svg" || echo "Failed: eyes_${dir}"
done
curl -L -f -o "app/style/graphics/spriteSheets/characters/ghosts/scared_blue.svg" "https://freepacman.org/app/style/graphics/spriteSheets/characters/ghosts/scared_blue.svg" || echo "Failed: scared_blue"
curl -L -f -o "app/style/graphics/spriteSheets/characters/ghosts/scared_white.svg" "https://freepacman.org/app/style/graphics/spriteSheets/characters/ghosts/scared_white.svg" || echo "Failed: scared_white"

echo "Downloading pickup sprites..."
for pickup in pacdot powerPellet apple bell cherry galaxian key melon orange strawberry; do
    echo "  - ${pickup}.svg"
    curl -L -f -o "app/style/graphics/spriteSheets/pickups/${pickup}.svg" "https://freepacman.org/app/style/graphics/spriteSheets/pickups/${pickup}.svg" || echo "Failed: ${pickup}"
done

echo "Downloading text sprites..."
curl -L -f -o "app/style/graphics/spriteSheets/text/ready.svg" "https://freepacman.org/app/style/graphics/spriteSheets/text/ready.svg" || echo "Failed: ready"
for points in 100 200 300 400 500 700 800 1000 1600 2000 3000 5000; do
    echo "  - ${points}.svg"
    curl -L -f -o "app/style/graphics/spriteSheets/text/${points}.svg" "https://freepacman.org/app/style/graphics/spriteSheets/text/${points}.svg" || echo "Failed: ${points}"
done

echo "Downloading maze..."
curl -L -f -o "app/style/graphics/spriteSheets/maze/maze_blue.svg" "https://freepacman.org/app/style/graphics/spriteSheets/maze/maze_blue.svg" || echo "Failed: maze_blue"

echo ""
echo "Download complete!"
echo "Total files downloaded:"
find app/style/graphics/spriteSheets -type f | wc -l