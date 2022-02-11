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
let cherries = [];
const max_cherry_num = 1;
let index = 0;
const game_delay = 3;
const grid_rows = 20,
    grid_cols = 20;
const max_tail_size = grid_rows * grid_cols + 1;
const cell_height = window_height / grid_rows,
    cell_width = window_width / grid_cols;
const cell_size = cell_height < cell_width ? cell_height : cell_width;

function gen_int(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

class Snake {
    constructor(x, y, tail_max_size) {
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
        ctx.fillStyle = "rgb(0, 255, 0)";
        for (let i = 0; i < this.tail.length; ++i) {
            ctx.fillRect(this.tail[i][0] * cell_size, this.tail[i][1] * cell_size, cell_size, cell_size);
        }
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

class Cherry {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    draw(ctx, cell_size) {
        ctx.fillStyle = "rgb(255, 0, 0)";
        ctx.fillRect(this.x * cell_size, this.y * cell_size, cell_size, cell_size);
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

let snake = new Snake(grid_cols / 2, grid_rows / 2, max_tail_size);

function update() {
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, window_width, window_height);
    snake.draw(ctx, cell_size);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    for (let i = 0; i < grid_rows; ++i) {
        for (let j = 0; j < grid_cols; ++j) {
            ctx.strokeRect(j * cell_size, i * cell_size, cell_size, cell_size);
        }
    }
    for (let i = 0; i < cherries.length; ++i) {
        cherries[i].draw(ctx, cell_size);
    }
    if (index > game_delay) {
        snake.move(grid_rows, grid_cols);
        let remove_index = 0;
        for (let i = 0; i < cherries.length - remove_index; ++i) {
            if (snake.x === cherries[i].x && snake.y === cherries[i].y) {
                if (snake.tail_size !== max_tail_size) {
                    snake.tail_size += 1;
                }
                cherries.splice(i - remove_index, 1);
                ++remove_index;
            }
        }
        for (let i = 0; i < max_cherry_num - cherries.length; ++i) {
            if (cherries.length > grid_rows * grid_cols - snake.tail.length){
                break;
            }
            let temp_x = 0;
            let temp_y = 0;
            let pass = false;
            while (!pass) {
                pass = true;
                temp_x = gen_int(0, grid_cols);
                temp_y = gen_int(0, grid_rows);
                for (let j = 0; j < snake.tail.length; ++j) {
                    if (temp_x === snake.tail[j][0] && temp_y === snake.tail[j][1]) {
                        pass = false;
                        break;
                    }
                }
                if (!pass) {
                    continue;
                }
                for (let j = 0; j < cherries.length; ++j) {
                    if (temp_x === cherries[j].x && temp_y === cherries[j].y) {
                        pass = false;
                        break;
                    }
                }
            }
            cherries.push(new Cherry(temp_x, temp_y));
        }
        index = 0;
    }
    ++index;
    requestAnimationFrame(update);
}
requestAnimationFrame(update);