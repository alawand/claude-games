import pygame
import sys
import random

# Initialize Pygame
pygame.init()

# Set up some constants
WIDTH = 640
HEIGHT = 480
WHITE = (255, 255, 255)
YELLOW = (255, 255, 0)
RED = (255, 0, 0)
BLACK = (0, 0, 0)

# Set up the display
win = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Pacman")

# Set up the font for score display
font = pygame.font.Font(None, 36)

class Pacman:
    def __init__(self):
        self.x = 320
        self.y = 240
        self.direction = 'right'
        self.speed = 3
        self.size = 20

    def draw(self, win):
        # Draw Pacman as a yellow circle with an opening
        if self.direction == 'right':
            angle_start = 45
            angle_end = 315
        elif self.direction == 'left':
            angle_start = 225
            angle_end = 135
        elif self.direction == 'up':
            angle_start = 135
            angle_end = 225
        else: # down
            angle_start = 315
            angle_end = 45

        pygame.draw.arc(win, YELLOW, (self.x - self.size//2, self.y -
self.size//2,
            self.size, self.size), math.radians(angle_start),
math.radians(angle_end), 1)

    def move(self):
        keys = pygame.key.get_pressed()
        if keys[pygame.K_UP]:
            self.direction = 'up'
            self.y -= self.speed
        if keys[pygame.K_DOWN]:
            self.direction = 'down'
            self.y += self.speed
        if keys[pygame.K_LEFT]:
            self.direction = 'left'
            self.x -= self.speed
        if keys[pygame.K_RIGHT]:
            self.direction = 'right'
            self.x += self.speed

class Dot:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.size = 2
        self.collected = False

    def draw(self, win):
        if not self.collected:
            pygame.draw.circle(win, WHITE, (self.x, self.y), self.size)

class Ghost:
    def __init__(self):
        self.x = 320
        self.y = 240
        self.speed = 2
        self.size = 20

    def draw(self, win):
        pygame.draw.circle(win, RED, (self.x, self.y), self.size)

def main():
    clock = pygame.time.Clock()
    pacman = Pacman()
    ghost = Ghost()

    # Create dots randomly on the screen
    dots = []
    for _ in range(50):
        x = random.randint(0, WIDTH)
        y = random.randint(0, HEIGHT)
        dots.append(Dot(x, y))

    score = 0

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

        win.fill(BLACK)

        # Draw maze walls (simplified)
        pygame.draw.rect(win, WHITE, (100, 100, 400, 20))
        pygame.draw.rect(win, WHITE, (100, 200, 400, 20))
        pygame.draw.rect(win, WHITE, (100, 300, 400, 20))

        # Move Pacman
        pacman.move()

        # Check for dot collection
        for dot in dots:
            if not dot.collected and abs(pacman.x - dot.x) < 5 and abs(pacman.y - dot.y) < 5:
                dot.collected = True
                score += 10

        # Draw all elements
        for dot in dots:
            dot.draw(win)

        ghost.draw(win)
        pacman.draw(win)

        # Display score
        text = font.render(f"Score: {score}", True, WHITE)
        win.blit(text, (10, 10))

        pygame.display.update()
        clock.tick(60)

if __name__ == "__main__":
    import math
    main()