#!/bin/bash

# Create directory structure
mkdir -p pacman-clone/{build,includes/{js,css},app/style/{audio,graphics/spriteSheets/{characters/{pacman,ghosts/{blinky,pinky,inky,clyde}},pickups,text,maze}}}

cd pacman-clone

# Download JavaScript files
curl -o build/app.js https://freepacman.org/build/app.js
curl -o includes/js/core-game-site.js https://turbo.freevideogames.org/includes/js/core-game-site.js
curl -o includes/js/screenfull.min.js https://turbo.freevideogames.org/includes/js/screenfull.min.js

# Download CSS files
curl -o build/app.css https://freepacman.org/build/app.css
curl -o includes/css/core-game-site.css https://turbo.freevideogames.org/includes/css/core-game-site.css
curl -o includes/css/side-navigation.css https://turbo.freevideogames.org/includes/css/side-navigation.css
curl -o includes/css/pacman.css https://turbo.freevideogames.org/includes/css/pacman.css

# Download main graphics
curl -o app/style/graphics/backdrop.png https://freepacman.org/app/style/graphics/backdrop.png
curl -o app/style/graphics/extra_life.png https://freepacman.org/app/style/graphics/extra_life.png
curl -o app/style/graphics/pacman_logo.png https://freepacman.org/app/style/graphics/pacman_logo.png

# Download Pacman sprites
for sprite in arrow_down arrow_left arrow_right arrow_up pacman_death pacman_error pacman_down pacman_left pacman_right pacman_up; do
    curl -o app/style/graphics/spriteSheets/characters/pacman/${sprite}.svg \\
         https://freepacman.org/app/style/graphics/spriteSheets/characters/pacman/${sprite}.svg
done

# Download Blinky sprites
for sprite in blinky_down_angry blinky_down_annoyed blinky_down blinky_left_angry blinky_left_annoyed blinky_left blinky_right_angry blinky_right_annoyed blinky_right blinky_up_angry blinky_up_annoyed blinky_up; do
    curl -o app/style/graphics/spriteSheets/characters/ghosts/blinky/${sprite}.svg \\
         https://freepacman.org/app/style/graphics/spriteSheets/characters/ghosts/blinky/${sprite}.svg
done

# Download other ghost sprites
for ghost in pinky inky clyde; do
    for dir in down left right up; do
        curl -o app/style/graphics/spriteSheets/characters/ghosts/${ghost}/${ghost}_${dir}.svg \\
             https://freepacman.org/app/style/graphics/spriteSheets/characters/ghosts/${ghost}/${ghost}_${dir}.svg
    done
done

# Download ghost eyes and scared sprites
for dir in down left right up; do
    curl -o app/style/graphics/spriteSheets/characters/ghosts/eyes_${dir}.svg \\
         https://freepacman.org/app/style/graphics/spriteSheets/characters/ghosts/eyes_${dir}.svg
done
curl -o app/style/graphics/spriteSheets/characters/ghosts/scared_blue.svg \\
     https://freepacman.org/app/style/graphics/spriteSheets/characters/ghosts/scared_blue.svg
curl -o app/style/graphics/spriteSheets/characters/ghosts/scared_white.svg \\
     https://freepacman.org/app/style/graphics/spriteSheets/characters/ghosts/scared_white.svg

# Download pickup sprites
for pickup in pacdot powerPellet apple bell cherry galaxian key melon orange strawberry; do
    curl -o app/style/graphics/spriteSheets/pickups/${pickup}.svg \\
         https://freepacman.org/app/style/graphics/spriteSheets/pickups/${pickup}.svg
done

# Download text sprites
curl -o app/style/graphics/spriteSheets/text/ready.svg \\
     https://freepacman.org/app/style/graphics/spriteSheets/text/ready.svg
for points in 100 200 300 400 500 700 800 1000 1600 2000 3000 5000; do
    curl -o app/style/graphics/spriteSheets/text/${points}.svg \\
         https://freepacman.org/app/style/graphics/spriteSheets/text/${points}.svg
done

# Download maze
curl -o app/style/graphics/spriteSheets/maze/maze_blue.svg \\
     https://freepacman.org/app/style/graphics/spriteSheets/maze/maze_blue.svg

echo "Download complete! Files saved in ./pacman-clone/"