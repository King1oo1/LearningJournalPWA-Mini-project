// static/js/snake.js - for the Snake game
class SnakeGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Game settings
        this.tileCount = 20;
        this.gridSize = 20;

        // Game state
        this.snake = [];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameLoop = null;
        this.playerName = "";

        // Food tracking
        this.foodEaten = 0;
        this.specialFoodActive = false;
        this.specialFood = {};

        // Game screens
        this.currentScreen = "welcome";

        // SLOWER GAME SPEED
        this.baseSpeed = 250;
        this.currentSpeed = this.baseSpeed;
        this.minSpeed = 150;

        // Initialize game
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.resetGame();
        this.bindEvents();
        this.bindEnhancedButtonFeedback();
        this.loadLeaderboard();
        this.loadHighScore();
        this.showWelcomeScreen();

        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;

        let size = Math.min(container.clientWidth, container.clientHeight);

        this.canvas.width = size;
        this.canvas.height = size;
        this.gridSize = size / this.tileCount;

        if (this.currentScreen === "game") {
            this.draw();
        }
    }

    resetGame() {
        this.snake = [
            {x: 10, y: 10},
            {x: 9, y: 10},
            {x: 8, y: 10}
        ];
        this.generateFood();
        this.dx = 1;
        this.dy = 0;
        this.score = 0;
        this.foodEaten = 0;
        this.specialFoodActive = false;
        this.gameRunning = false;
        this.gamePaused = false;
        this.currentSpeed = this.baseSpeed;

        this.updateScore();
    }

    generateFood() {
        this.food = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount),
            type: 'normal'
        };

        for (let segment of this.snake) {
            if (segment.x === this.food.x && segment.y === this.food.y) {
                this.generateFood();
                break;
            }
        }
    }

    generateSpecialFood() {
        this.specialFood = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount),
            type: 'special'
        };

        for (let segment of this.snake) {
            if (segment.x === this.specialFood.x && segment.y === this.specialFood.y) {
                this.generateSpecialFood();
                return;
            }
        }

        if (this.specialFood.x === this.food.x && this.specialFood.y === this.food.y) {
            this.generateSpecialFood();
            return;
        }

        this.specialFoodActive = true;
    }

    bindEvents() {
        // Keyboard controls for both desktop and mobile
        document.addEventListener('keydown', (e) => {
            if (this.currentScreen !== "game") return;

            if (e.key === ' ' && !this.gameRunning && !this.gamePaused) {
                this.startGame();
                return;
            }

            if (e.key === ' ' && this.gameRunning) {
                this.togglePause();
                return;
            }

            if (e.key === 'Escape') {
                this.exitToWelcome();
                return;
            }

            if (!this.gameRunning || this.gamePaused) return;

            // Prevent reverse direction
            if (e.key === 'ArrowLeft' && this.dx === 0) {
                this.dx = -1;
                this.dy = 0;
            } else if (e.key === 'ArrowUp' && this.dy === 0) {
                this.dx = 0;
                this.dy = -1;
            } else if (e.key === 'ArrowRight' && this.dx === 0) {
                this.dx = 1;
                this.dy = 0;
            } else if (e.key === 'ArrowDown' && this.dy === 0) {
                this.dx = 0;
                this.dy = 1;
            }
        });

        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            if (this.currentScreen !== "game") return;

            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.currentScreen !== "game" || !this.gameRunning || this.gamePaused) return;

            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const dx = touchX - touchStartX;
            const dy = touchY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && this.dx === 0) {
                    this.dx = 1;
                    this.dy = 0;
                } else if (dx < 0 && this.dx === 0) {
                    this.dx = -1;
                    this.dy = 0;
                }
            } else {
                if (dy > 0 && this.dy === 0) {
                    this.dx = 0;
                    this.dy = 1;
                } else if (dy < 0 && this.dy === 0) {
                    this.dx = 0;
                    this.dy = -1;
                }
            }

            e.preventDefault();
        });

        // Control buttons
        const startBtn = document.getElementById('snake-start');
        const pauseBtn = document.getElementById('snake-pause');
        const restartBtn = document.getElementById('snake-restart');
        const exitBtn = document.getElementById('snake-exit');

        if (startBtn) startBtn.addEventListener('click', () => {
            if (this.currentScreen === "game" && !this.gameRunning && !this.gamePaused) {
                this.startGame();
            } else if (this.currentScreen === "game" && this.gamePaused) {
                this.togglePause();
            }
        });

        if (pauseBtn) pauseBtn.addEventListener('click', () => {
            if (this.currentScreen === "game" && this.gameRunning) {
                this.togglePause();
            }
        });

        if (restartBtn) restartBtn.addEventListener('click', () => {
            if (this.currentScreen === "game") {
                this.restartGame();
            }
        });

        if (exitBtn) exitBtn.addEventListener('click', () => {
            if (this.currentScreen === "game") {
                this.exitToWelcome();
            }
        });

        // Direction buttons
        const upBtn = document.getElementById('snake-up');
        const downBtn = document.getElementById('snake-down');
        const leftBtn = document.getElementById('snake-left');
        const rightBtn = document.getElementById('snake-right');

        if (upBtn) upBtn.addEventListener('click', () => {
            if (this.currentScreen === "game" && this.gameRunning && !this.gamePaused && this.dy === 0) {
                this.dx = 0;
                this.dy = -1;
            }
        });

        if (downBtn) downBtn.addEventListener('click', () => {
            if (this.currentScreen === "game" && this.gameRunning && !this.gamePaused && this.dy === 0) {
                this.dx = 0;
                this.dy = 1;
            }
        });

        if (leftBtn) leftBtn.addEventListener('click', () => {
            if (this.currentScreen === "game" && this.gameRunning && !this.gamePaused && this.dx === 0) {
                this.dx = -1;
                this.dy = 0;
            }
        });

        if (rightBtn) rightBtn.addEventListener('click', () => {
            if (this.currentScreen === "game" && this.gameRunning && !this.gamePaused && this.dx === 0) {
                this.dx = 1;
                this.dy = 0;
            }
        });

        // Welcome screen button
        const startGameBtn = document.getElementById('start-game-btn');
        const nameInput = document.getElementById('player-name-input');

        if (startGameBtn) startGameBtn.addEventListener('click', () => {
            if (nameInput && nameInput.value.trim()) {
                this.playerName = nameInput.value.trim();
                this.showGameScreen();
                setTimeout(() => {
                    this.startGame();
                    this.enterFullScreen();
                }, 500);
            } else {
                this.showErrorMessage("Please enter your name to start the game!");
            }
        });

        if (nameInput) nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                startGameBtn.click();
            }
        });
    }

    bindEnhancedButtonFeedback() {
        const directionButtons = ['snake-up', 'snake-down', 'snake-left', 'snake-right'];

        directionButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('mousedown', () => {
                    btn.classList.add('pressed');
                });

                btn.addEventListener('touchstart', () => {
                    btn.classList.add('pressed');
                });

                btn.addEventListener('mouseup', () => {
                    btn.classList.remove('pressed');
                });

                btn.addEventListener('touchend', () => {
                    btn.classList.remove('pressed');
                });

                btn.addEventListener('mouseleave', () => {
                    btn.classList.remove('pressed');
                });
            }
        });
    }

    enterFullScreen() {
        const gameScreen = document.getElementById('snake-game-screen');
        if (gameScreen && gameScreen.requestFullscreen) {
            gameScreen.requestFullscreen().catch(err => {
                console.log('Full screen error:', err);
            });
        }
    }

    exitFullScreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }

    handleFullscreenChange() {
        if (!document.fullscreenElement && this.currentScreen === "game") {
            if (this.gameRunning && !this.gamePaused) {
                this.togglePause();
            }
        }
    }

    showWelcomeScreen() {
        this.currentScreen = "welcome";
        document.getElementById('snake-welcome-screen').style.display = 'flex';
        document.getElementById('snake-game-screen').style.display = 'none';
        document.getElementById('snake-game-over').style.display = 'none';

        const nameInput = document.getElementById('player-name-input');
        if (nameInput) nameInput.value = '';

        this.exitFullScreen();
        this.loadLeaderboard();
    }

    showGameScreen() {
        this.currentScreen = "game";
        document.getElementById('snake-welcome-screen').style.display = 'none';
        document.getElementById('snake-game-screen').style.display = 'block';
        document.getElementById('snake-game-over').style.display = 'none';

        this.resetGame();
        this.draw();
        this.updateControlButtons();
    }

    showGameOverScreen() {
        this.currentScreen = "gameOver";
        this.exitFullScreen();

        setTimeout(() => {
            document.getElementById('snake-welcome-screen').style.display = 'none';
            document.getElementById('snake-game-screen').style.display = 'none';
            document.getElementById('snake-game-over').style.display = 'flex';

            document.getElementById('final-player-name').textContent = this.playerName;
            document.getElementById('final-score').textContent = this.score;

            this.checkHighScore();
            this.loadLeaderboard();
        }, 100);
    }

    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;

        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, this.currentSpeed);

        this.updateControlButtons();
    }

    togglePause() {
        if (this.gamePaused) {
            this.gamePaused = false;
            this.gameLoop = setInterval(() => {
                this.update();
                this.draw();
            }, this.currentSpeed);
        } else {
            this.gamePaused = true;
            clearInterval(this.gameLoop);
        }

        this.updateControlButtons();
        this.draw();
    }

    restartGame() {
        clearInterval(this.gameLoop);
        this.resetGame();
        this.gameRunning = false;
        this.gamePaused = false;
        this.draw();
        this.updateControlButtons();
    }

    exitToWelcome() {
        clearInterval(this.gameLoop);
        this.exitFullScreen();
        setTimeout(() => {
            this.showWelcomeScreen();
        }, 300);
    }

    update() {
        if (!this.gameRunning || this.gamePaused) return;

        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};

        // Screen wrapping
        if (head.x < 0) head.x = this.tileCount - 1;
        else if (head.x >= this.tileCount) head.x = 0;
        if (head.y < 0) head.y = this.tileCount - 1;
        else if (head.y >= this.tileCount) head.y = 0;

        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }

        this.snake.unshift(head);

        // Check food collision - NORMAL FOOD
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.foodEaten++;
            this.generateFood();
            this.updateScore();

            // Check if we should spawn special food (every 5 normal foods)
            if (this.foodEaten % 5 === 0 && !this.specialFoodActive) {
                this.generateSpecialFood();
            }

            // Update high score if needed
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.updateHighScore();
            }

            // Speed up game slightly
            if (this.score % 100 === 0 && this.gameLoop) {
                clearInterval(this.gameLoop);
                this.currentSpeed = Math.max(this.minSpeed, this.baseSpeed - Math.floor(this.score / 100) * 20);
                this.gameLoop = setInterval(() => {
                    this.update();
                    this.draw();
                }, this.currentSpeed);
            }
        }
        // Check food collision - SPECIAL FOOD
        else if (this.specialFoodActive && head.x === this.specialFood.x && head.y === this.specialFood.y) {
            this.score += 50;
            this.specialFoodActive = false;
            this.updateScore();

            // Update high score if needed
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.updateHighScore();
            }

            // Show special food collected message
            this.showSpecialFoodMessage();
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.tileCount; i++) {
            for (let j = 0; j < this.tileCount; j++) {
                this.ctx.strokeRect(i * this.gridSize, j * this.gridSize, this.gridSize, this.gridSize);
            }
        }

        // Draw snake with enhanced graphics
        this.drawEnhancedSnake();

        // Draw food
        this.drawFood();

        // Draw special food if active
        if (this.specialFoodActive) {
            this.drawSpecialFood();
        }

        // Draw pause overlay if game is paused
        if (this.gamePaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    drawEnhancedSnake() {
        // Draw snake body with gradient effect
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];

            if (i === 0) {
                // Enhanced head with better eyes
                this.drawEnhancedSnakeHead(segment);
            } else if (i === this.snake.length - 1) {
                // Enhanced tail
                this.drawEnhancedSnakeTail(segment);
            } else {
                // Body segment with gradient color
                const gradient = this.ctx.createRadialGradient(
                    segment.x * this.gridSize + this.gridSize/2,
                    segment.y * this.gridSize + this.gridSize/2,
                    0,
                    segment.x * this.gridSize + this.gridSize/2,
                    segment.y * this.gridSize + this.gridSize/2,
                    this.gridSize/2
                );

                // Calculate color intensity based on position
                const intensity = 1 - (i / this.snake.length) * 0.3;
                gradient.addColorStop(0, `rgb(${76 * intensity}, ${175 * intensity}, ${80 * intensity})`);
                gradient.addColorStop(1, `rgb(${69 * intensity}, ${160 * intensity}, ${73 * intensity})`);

                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);

                // Add shine effect
                this.ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
                this.ctx.fillRect(segment.x * this.gridSize + 2, segment.y * this.gridSize + 2, this.gridSize - 5, 2);
            }
        }
    }

    drawEnhancedSnakeHead(head) {
        // Head with gradient and shine
        const gradient = this.ctx.createRadialGradient(
            head.x * this.gridSize + this.gridSize/2,
            head.y * this.gridSize + this.gridSize/2,
            0,
            head.x * this.gridSize + this.gridSize/2,
            head.y * this.gridSize + this.gridSize/2,
            this.gridSize/2
        );
        gradient.addColorStop(0, '#2E7D32');
        gradient.addColorStop(1, '#1B5E20');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(head.x * this.gridSize, head.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);

        // Add shine to head
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(head.x * this.gridSize + 2, head.y * this.gridSize + 2, this.gridSize - 5, 3);

        // IMPROVED EYES 
        this.drawEnhancedEyes(head);
    }

    drawEnhancedEyes(head) {
        const eyeSize = 4;
        const pupilSize = 2;
        const eyeOffset = 5;

        // Eye whites with shadow
        this.ctx.fillStyle = 'white';

        if (this.dx === 1) { // Moving right
            // Right eye 
            this.ctx.fillRect((head.x * this.gridSize) + this.gridSize - eyeOffset - 1, (head.y * this.gridSize) + eyeOffset, eyeSize, eyeSize);
            // Left eye
            this.ctx.fillRect((head.x * this.gridSize) + this.gridSize - eyeOffset - 1, (head.y * this.gridSize) + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);

            // Pupils looking right
            this.ctx.fillStyle = '#1A237E';
            this.ctx.fillRect((head.x * this.gridSize) + this.gridSize - eyeOffset + 1, (head.y * this.gridSize) + eyeOffset + 1, pupilSize, pupilSize);
            this.ctx.fillRect((head.x * this.gridSize) + this.gridSize - eyeOffset + 1, (head.y * this.gridSize) + this.gridSize - eyeOffset - eyeSize + 1, pupilSize, pupilSize);

        } else if (this.dx === -1) { // Moving left
            // Left eye (facing direction)
            this.ctx.fillRect((head.x * this.gridSize) + eyeOffset, (head.y * this.gridSize) + eyeOffset, eyeSize, eyeSize);
            // Right eye
            this.ctx.fillRect((head.x * this.gridSize) + eyeOffset, (head.y * this.gridSize) + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);

            // Pupils looking left
            this.ctx.fillStyle = '#1A237E';
            this.ctx.fillRect((head.x * this.gridSize) + eyeOffset + 1, (head.y * this.gridSize) + eyeOffset + 1, pupilSize, pupilSize);
            this.ctx.fillRect((head.x * this.gridSize) + eyeOffset + 1, (head.y * this.gridSize) + this.gridSize - eyeOffset - eyeSize + 1, pupilSize, pupilSize);

        } else if (this.dy === 1) { // Moving down
            // Bottom eyes
            this.ctx.fillRect((head.x * this.gridSize) + eyeOffset, (head.y * this.gridSize) + this.gridSize - eyeOffset - 1, eyeSize, eyeSize);
            this.ctx.fillRect((head.x * this.gridSize) + this.gridSize - eyeOffset - eyeSize, (head.y * this.gridSize) + this.gridSize - eyeOffset - 1, eyeSize, eyeSize);

            // Pupils looking down
            this.ctx.fillStyle = '#1A237E';
            this.ctx.fillRect((head.x * this.gridSize) + eyeOffset + 1, (head.y * this.gridSize) + this.gridSize - eyeOffset + 1, pupilSize, pupilSize);
            this.ctx.fillRect((head.x * this.gridSize) + this.gridSize - eyeOffset - eyeSize + 1, (head.y * this.gridSize) + this.gridSize - eyeOffset + 1, pupilSize, pupilSize);

        } else if (this.dy === -1) { // Moving up
            // Top eyes
            this.ctx.fillRect((head.x * this.gridSize) + eyeOffset, (head.y * this.gridSize) + eyeOffset, eyeSize, eyeSize);
            this.ctx.fillRect((head.x * this.gridSize) + this.gridSize - eyeOffset - eyeSize, (head.y * this.gridSize) + eyeOffset, eyeSize, eyeSize);

            // Pupils looking up
            this.ctx.fillStyle = '#1A237E';
            this.ctx.fillRect((head.x * this.gridSize) + eyeOffset + 1, (head.y * this.gridSize) + eyeOffset + 1, pupilSize, pupilSize);
            this.ctx.fillRect((head.x * this.gridSize) + this.gridSize - eyeOffset - eyeSize + 1, (head.y * this.gridSize) + eyeOffset + 1, pupilSize, pupilSize);
        }

        // Add eye shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        if (this.dx === 1) {
            this.ctx.fillRect((head.x * this.gridSize) + this.gridSize - eyeOffset + 0.5, (head.y * this.gridSize) + eyeOffset + 0.5, 1, 1);
            this.ctx.fillRect((head.x * this.gridSize) + this.gridSize - eyeOffset + 0.5, (head.y * this.gridSize) + this.gridSize - eyeOffset - eyeSize + 0.5, 1, 1);
        } else if (this.dx === -1) {
            this.ctx.fillRect((head.x * this.gridSize) + eyeOffset + 0.5, (head.y * this.gridSize) + eyeOffset + 0.5, 1, 1);
            this.ctx.fillRect((head.x * this.gridSize) + eyeOffset + 0.5, (head.y * this.gridSize) + this.gridSize - eyeOffset - eyeSize + 0.5, 1, 1);
        } else if (this.dy === 1) {
            this.ctx.fillRect((head.x * this.gridSize) + eyeOffset + 0.5, (head.y * this.gridSize) + this.gridSize - eyeOffset + 0.5, 1, 1);
            this.ctx.fillRect((head.x * this.gridSize) + this.gridSize - eyeOffset - eyeSize + 0.5, (head.y * this.gridSize) + this.gridSize - eyeOffset + 0.5, 1, 1);
        } else if (this.dy === -1) {
            this.ctx.fillRect((head.x * this.gridSize) + eyeOffset + 0.5, (head.y * this.gridSize) + eyeOffset + 0.5, 1, 1);
            this.ctx.fillRect((head.x * this.gridSize) + this.gridSize - eyeOffset - eyeSize + 0.5, (head.y * this.gridSize) + eyeOffset + 0.5, 1, 1);
        }
    }

    drawEnhancedSnakeTail(tail) {
        // Tail with gradient
        const gradient = this.ctx.createRadialGradient(
            tail.x * this.gridSize + this.gridSize/2,
            tail.y * this.gridSize + this.gridSize/2,
            0,
            tail.x * this.gridSize + this.gridSize/2,
            tail.y * this.gridSize + this.gridSize/2,
            this.gridSize/2
        );
        gradient.addColorStop(0, '#1B5E20');
        gradient.addColorStop(1, '#0D3B13');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(tail.x * this.gridSize, tail.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);

        // Tail tip based on direction
        this.ctx.fillStyle = '#0D3B13';
        const prevSegment = this.snake[this.snake.length - 2];
        const tailDirection = {
            x: tail.x - prevSegment.x,
            y: tail.y - prevSegment.y
        };

        // Draw tail tip with rounded effect
        if (tailDirection.x === 1) {
            this.ctx.fillRect(tail.x * this.gridSize, tail.y * this.gridSize + 2, this.gridSize / 3, this.gridSize - 4);
        } else if (tailDirection.x === -1) {
            this.ctx.fillRect(tail.x * this.gridSize + this.gridSize * 2/3, tail.y * this.gridSize + 2, this.gridSize / 3, this.gridSize - 4);
        } else if (tailDirection.y === 1) {
            this.ctx.fillRect(tail.x * this.gridSize + 2, tail.y * this.gridSize, this.gridSize - 4, this.gridSize / 3);
        } else if (tailDirection.y === -1) {
            this.ctx.fillRect(tail.x * this.gridSize + 2, tail.y * this.gridSize + this.gridSize * 2/3, this.gridSize - 4, this.gridSize / 3);
        }
    }

    drawFood() {
        // Normal food with gradient and shine
        const gradient = this.ctx.createRadialGradient(
            this.food.x * this.gridSize + this.gridSize/2,
            this.food.y * this.gridSize + this.gridSize/2,
            0,
            this.food.x * this.gridSize + this.gridSize/2,
            this.food.y * this.gridSize + this.gridSize/2,
            this.gridSize/2
        );
        gradient.addColorStop(0, '#e74c3c');
        gradient.addColorStop(1, '#c0392b');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);

        // Food shine effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.fillRect(this.food.x * this.gridSize + 2, this.food.y * this.gridSize + 2, this.gridSize - 5, 2);
    }

    drawSpecialFood() {
        // Special food - bigger and golden
        const centerX = this.specialFood.x * this.gridSize + this.gridSize/2;
        const centerY = this.specialFood.y * this.gridSize + this.gridSize/2;
        const radius = this.gridSize / 1.5;

        // Golden gradient
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.7, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Special food shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius/3, centerY - radius/3, radius/4, 0, Math.PI * 2);
        this.ctx.fill();

        // Pulsing effect (visual only)
        const pulse = (Date.now() % 1000) / 1000;
        const pulseSize = 1 + pulse * 0.2;

        this.ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + pulse * 0.3})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * pulseSize, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    gameOver() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);

        setTimeout(() => {
            this.showGameOverScreen();
        }, 500);
    }

    updateScore() {
        const scoreElement = document.getElementById('current-score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    }

    updateHighScore() {
        const highScoreElement = document.getElementById('high-score');
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore;
        }

        localStorage.setItem('snakeHighScore', this.highScore.toString());
    }

    loadHighScore() {
        const savedHighScore = localStorage.getItem('snakeHighScore');
        if (savedHighScore) {
            this.highScore = parseInt(savedHighScore);
            this.updateHighScore();
        }
    }

    updateControlButtons() {
        const startBtn = document.getElementById('snake-start');
        const pauseBtn = document.getElementById('snake-pause');
        const restartBtn = document.getElementById('snake-restart');

        if (startBtn) startBtn.classList.remove('active');
        if (pauseBtn) pauseBtn.classList.remove('active');
        if (restartBtn) restartBtn.classList.remove('active');

        if (this.gameRunning && !this.gamePaused) {
            if (startBtn) startBtn.style.display = 'none';
            if (pauseBtn) {
                pauseBtn.style.display = 'block';
                pauseBtn.classList.add('active');
            }
        } else if (this.gameRunning && this.gamePaused) {
            if (startBtn) {
                startBtn.style.display = 'block';
                startBtn.innerHTML = '▶️';
                startBtn.classList.add('active');
            }
            if (pauseBtn) pauseBtn.style.display = 'none';
        } else {
            if (startBtn) {
                startBtn.style.display = 'block';
                startBtn.innerHTML = '▶️';
            }
            if (pauseBtn) pauseBtn.style.display = 'none';

            if (restartBtn && !this.gameRunning && this.score > 0) {
                restartBtn.classList.add('active');
            }
        }
    }

    showSpecialFoodMessage() {
        this.showMessage('🎉 SPECIAL FOOD! +50 POINTS!', 'success');
    }

    async checkHighScore() {
        try {
            const response = await fetch('/api/snake-scores');
            if (!response.ok) throw new Error('Network response was not ok');

            const scores = await response.json();
            const minScore = scores.length < 10 ? 0 : (scores[scores.length - 1]?.score || 0);

            if (this.score > minScore || scores.length < 10) {
                const submitted = await this.submitHighScore();
                if (submitted) {
                    this.showHighScoreForm();
                }
            }
        } catch (error) {
            console.error('Error checking high scores:', error);
        }
    }

    showHighScoreForm() {
        const highScoreForm = document.getElementById('snake-high-score-form');
        if (highScoreForm) {
            highScoreForm.style.display = 'block';
        }
    }

    async submitHighScore() {
        if (!this.playerName.trim()) {
            this.playerName = 'Anonymous';
        }

        try {
            const response = await fetch('/api/snake-scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: this.playerName,
                    score: this.score
                })
            });

            if (response.ok) {
                console.log('High score submitted successfully');
                return true;
            } else {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                return false;
            }
        } catch (error) {
            console.error('Error submitting high score:', error);
            return false;
        }
    }

    async loadLeaderboard() {
        try {
            const response = await fetch('/api/snake-scores');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const scores = await response.json();
            this.displayLeaderboard(scores);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.displayLeaderboard([]);
        }
    }

displayLeaderboard(scores) {
    const leaderboardElement = document.getElementById('snake-leaderboard');
    if (!leaderboardElement) return;

    if (!scores || scores.length === 0) {
        leaderboardElement.innerHTML = '<div class="leaderboard-empty">No high scores yet. Be the first!</div>';
        return;
    }

    scores.sort((a, b) => b.score - a.score);

    let html = '<h4>Top Scores</h4><ol>';

    scores.forEach((score, index) => {
        const isCurrentPlayer = score.name === this.playerName && score.score === this.score;
        const highlightClass = isCurrentPlayer ? 'current-player' : '';

        html += `
            <li class="${highlightClass}">
                <div class="leaderboard-player">
                    <span class="leaderboard-name">${score.name}</span>
                </div>
                <span class="leaderboard-score">${score.score}</span>
            </li>
        `;
    });

    html += '</ol>';
    leaderboardElement.innerHTML = html;
}

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const msg = document.createElement('div');
        const isSuccess = type === 'success';

        msg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isSuccess ? 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px ${isSuccess ? 'rgba(39, 174, 96, 0.4)' : 'rgba(231, 76, 60, 0.4)'};
            z-index: 1001;
            animation: slideInRight 0.5s ease, slideOutRight 0.5s ease 2.5s;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: 300px;
        `;

        msg.innerHTML = `${isSuccess ? '✅' : '❌'} ${message}`;
        document.body.appendChild(msg);

        setTimeout(() => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        }, 3000);
    }
}

// Welcome Screen Animation
function initWelcomeAnimation() {
    const canvas = document.getElementById('welcome-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const gridSize = 10;
    const tileCount = 20;

    let snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    let food = {x: 15, y: 10};
    let dx = 1;
    let frameCount = 0;

    function draw() {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i < tileCount; i++) {
            for (let j = 0; j < tileCount; j++) {
                ctx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
            }
        }

        snake.forEach((segment, index) => {
            if (index === 0) {
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
            } else {
                ctx.fillStyle = '#45a049';
                ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
            }
        });

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);

        frameCount++;
        if (frameCount % 30 === 0) {
            const head = {x: snake[0].x + dx, y: snake[0].y};

            if (head.x >= tileCount - 1) {
                dx = -1;
                head.x = tileCount - 2;
            } else if (head.x <= 0) {
                dx = 1;
                head.x = 1;
            }

            snake.unshift(head);
            snake.pop();
        }

        requestAnimationFrame(draw);
    }

    draw();
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Game instance
    const snakeGame = new SnakeGame('snake-canvas');

    // Event listeners
    document.getElementById('play-again-btn')?.addEventListener('click', function() {
        snakeGame.showGameScreen();
        setTimeout(() => {
            snakeGame.startGame();
            snakeGame.enterFullScreen();
        }, 500);
    });

    document.getElementById('back-to-menu-btn')?.addEventListener('click', function() {
        snakeGame.showWelcomeScreen();
    });

    // Initialize welcome animation
    initWelcomeAnimation();

    // Make game globally available
    window.snakeGame = snakeGame;
});

