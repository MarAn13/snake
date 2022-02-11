const canvas = document.getElementById('canvas');
// Get the device pixel ratio, falling back to 1.
const dpr = window.devicePixelRatio || 1;
// Get the size of the canvas in CSS pixels.
let rect = canvas.getBoundingClientRect();
// Give the canvas pixel dimensions of their CSS
// size * the device pixel ratio.
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
const window_width = window.innerWidth;
const window_height = window.innerHeight;
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);
///////////// consts
const sound_chew = new Audio("chew.wav");
const background_color = 'rgb(0, 0, 0)';
const snake_cell_color = 'rgb(0, 255, 0)';
const cherry_cell_color = 'rgb(255, 0, 0)';
const max_cherry_num = 1;
const game_delay = 3;
const grid_rows = 20,
    grid_cols = 20;
const max_tail_size = grid_rows * grid_cols + 1;
const cell_height = window_height / grid_rows,
    cell_width = window_width / grid_cols;
const cell_size = cell_height < cell_width ? cell_height : cell_width;
const cell_color = 'rgba(255, 255, 255, 0.1)';
const snake_spawn_point = [grid_cols / 2, grid_rows / 2];
//////////////////////////////////////////////////////////
let index = 0;

function gen_int(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

class Cherry {
    constructor(x, y, cell_color) {
        this.x = x;
        this.y = y;
        this.cell_color = cell_color;
    }
    draw(ctx, cell_size) {
        ctx.fillStyle = this.cell_color;
        ctx.fillRect(this.x * cell_size, this.y * cell_size, cell_size, cell_size);
    }
}

class Snake {
    constructor(x, y, max_tail_size, cell_color, sound_chew) {
        this.start_x = x;
        this.start_y = y;
        this.x = x;
        this.y = y;
        this.vx = 1;
        this.vy = 0;
        this.tail = [
            [this.x, this.y]
        ];
        this.tail_size = 1;
        this.max_tail_size = max_tail_size;
        this.cell_color = cell_color;
        this.sound_chew = sound_chew;
    }
    move(grid_rows, grid_cols) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x >= grid_cols) {
            this.x = 0;
        }
        if (this.x < 0) {
            this.x = grid_cols - 1;
        }
        if (this.y >= grid_rows) {
            this.y = 0;
        }
        if (this.y < 0) {
            this.y = grid_rows - 1;
        }
        this.tail.push([this.x, this.y]);
        if (this.tail.length === this.tail_size + 1) {
            this.tail.shift();
        }
        for (let i = this.tail.length - 2; i > -1; --i) {
            if (this.x === this.tail[i][0] &&
                this.y === this.tail[i][1]) {
                this.#restart();
                break;
            }
        }
    }
    draw(ctx, cell_size) {
        ctx.fillStyle = this.cell_color;
        for (let i = 0; i < this.tail.length; ++i) {
            ctx.fillRect(this.tail[i][0] * cell_size, this.tail[i][1] * cell_size, cell_size, cell_size);
        }
    }
    chew() {
        this.sound_chew.play();
    }
    #restart() {
        this.x = this.start_x;
        this.y = this.start_y;
        this.vx = 1;
        this.vy = 0;
        this.tail = [];
        this.tail_size = 1;
    }
}

class Game_Field {
    constructor(rows, cols, cell_size, cell_color, snake, max_cherry_num, cherry_cell_color) {
        this.rows = rows;
        this.cols = cols;
        this.cell_size = cell_size;
        this.cell_color = cell_color;
        this.snake = snake;
        this.cherries = [];
        this.max_cherry_num = max_cherry_num;
        this.cherry_cell_color = cherry_cell_color;
    }
    move_snake() {
        this.snake.move(this.rows, this.cols);
    }
    spawn_cherry() {
        for (let i = 0; i < this.max_cherry_num - this.cherries.length; ++i) {
            if (this.cherries.length > this.rows * this.cols - this.snake.tail.length) {
                break;
            }
            let temp_x = 0;
            let temp_y = 0;
            let pass = false;
            while (!pass) {
                pass = true;
                temp_x = gen_int(0, this.cols);
                temp_y = gen_int(0, this.rows);
                for (let j = 0; j < this.snake.tail.length; ++j) {
                    if (temp_x === this.snake.tail[j][0] && temp_y === this.snake.tail[j][1]) {
                        pass = false;
                        break;
                    }
                }
                if (!pass) {
                    continue;
                }
                for (let j = 0; j < this.cherries.length; ++j) {
                    if (temp_x === this.cherries[j].x && temp_y === this.cherries[j].y) {
                        pass = false;
                        break;
                    }
                }
            }
            this.cherries.push(new Cherry(temp_x, temp_y, this.cherry_cell_color));
        }
    }
    check_cherry() {
        let remove_index = 0;
        for (let i = 0; i < this.cherries.length - remove_index; ++i) {
            if (this.snake.x === this.cherries[i].x && this.snake.y === this.cherries[i].y) {
                this.snake.chew();
                if (this.snake.tail_size !== this.snake.max_tail_size) {
                    this.snake.tail_size += 1;
                }
                this.cherries.splice(i - remove_index, 1);
                ++remove_index;
            }
        }
    }
    draw(ctx) {
        ctx.strokeStyle = this.cell_color;
        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.cols; ++j) {
                ctx.strokeRect(j * this.cell_size, i * cell_size, cell_size, cell_size);
            }
        }
        this.snake.draw(ctx, this.cell_size);
        for (let i = 0; i < this.cherries.length; ++i) {
            this.cherries[i].draw(ctx, this.cell_size);
        }
    }
}

document.addEventListener('keydown', (event) => {
    const key_name = event.key;

    if (key_name === 'ArrowLeft') {
        if (snake.vx !== 1) {
            snake.vx = -1;
            snake.vy = 0;
        }
        return;
    } else if (key_name === 'ArrowRight') {
        if (snake.vx !== -1) {
            snake.vx = 1;
            snake.vy = 0;
        }
        return;
    } else if (key_name === 'ArrowUp') {
        if (snake.vy !== 1) {
            snake.vx = 0;
            snake.vy = -1;
        }
        return;
    } else if (key_name === 'ArrowDown') {
        if (snake.vy !== -1) {
            snake.vx = 0;
            snake.vy = 1;
        }
        return;
    }
}, false);

let snake = new Snake(snake_spawn_point[0], snake_spawn_point[1], max_tail_size, snake_cell_color, sound_chew);
let field = new Game_Field(grid_rows, grid_cols, cell_size, cell_color, snake, max_cherry_num, cherry_cell_color);


function update() {
    ctx.fillStyle = background_color;
    ctx.fillRect(0, 0, window_width, window_height);
    field.draw(ctx);
    if (index > game_delay) {
        field.move_snake();
        field.check_cherry();
        field.spawn_cherry();
        index = 0;
    }
    ++index;
    requestAnimationFrame(update);
}
requestAnimationFrame(update);