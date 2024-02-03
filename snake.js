const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// game starter (audio issues otherwise)
const button_play = document.getElementById("button_play");
button_play.addEventListener("click", start_canvas, false);

const snake_chew_sound = new Audio("chew.wav");
snake_chew_sound.preload = "auto";
const background_color = "rgba(0, 0, 0, 1)";
const snake_head_color = "rgba(0, 200, 0, 1)";
const snake_tail_color = "rgba(0, 255, 0, 1)";
const cherry_cell_color = "rgba(255, 0, 0, 1)";
const cell_color = "rgba(255, 255, 255, 0.75)";
const cherry_max_n = 1;
const n_cols = 20,
  n_rows = 20;
// potential max tail size in respect to grid dimensions
const global_snake_tail_max_size = n_cols * n_rows;
const cell_size = {
  width: canvas.width / n_cols,
  height: canvas.height / n_rows,
};
const snake_spawn_point = {
  x: Math.floor(n_cols / 2),
  y: Math.floor(n_rows / 2),
};

function gen_int(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  // [min, max)
  return Math.floor(Math.random() * (max - min) + min);
}

class Cherry {
  constructor(x, y, fill_color) {
    this.x = x;
    this.y = y;
    this.fill_color = fill_color;
  }
  draw(ctx) {
    ctx.fillStyle = this.fill_color;
    ctx.fillRect(
      this.x * cell_size.width,
      this.y * cell_size.height,
      cell_size.width,
      cell_size.height
    );
  }
}

class Snake {
  constructor(x, y, head_color, tail_color) {
    this.x = x;
    this.y = y;
    this.speed_x = 1;
    this.speed_y = 0;
    // queue
    this.tail = [];
    //
    this.tail_map = new Map();
    this.tail_max_size = 1;
    this.head_color = head_color;
    this.tail_color = tail_color;
    this.sound = snake_chew_sound;
  }
  draw(ctx) {
    ctx.fillStyle = this.tail_color;
    for (let i = 0; i < this.tail.length; ++i) {
      ctx.fillRect(
        this.tail[i].x * cell_size.width,
        this.tail[i].y * cell_size.height,
        cell_size.width,
        cell_size.height
      );
    }
    ctx.fillStyle = this.head_color;
    ctx.fillRect(
      this.x * cell_size.width,
      this.y * cell_size.height,
      cell_size.width,
      cell_size.height
    );
  }
  move() {
    // tail processing
    if (this.tail.length === this.tail_max_size) {
      let removed_el = this.tail.shift();
      this.tail_map.delete(`(${removed_el.x},${removed_el.y})`);
    }
    this.tail.push({ x: this.x, y: this.y });
    this.tail_map.set(`(${this.x},${this.y})`, { x: this.x, y: this.y });

    // move processing
    this.x += this.speed_x;
    this.y += this.speed_y;
    if (this.x >= n_cols) {
      this.x = 0;
    } else if (this.x < 0) {
      this.x = n_cols - 1;
    }
    if (this.y >= n_rows) {
      this.y = 0;
    } else if (this.y < 0) {
      this.y = n_rows - 1;
    }
  }
  // play eat sound (chew)
  play_sound() {
    this.sound.play();
  }
}

const Game = {
  IN_PROGRESS: true,
  END: false,
};
class Game_Field {
  constructor(snake, rows, cols, stroke_color) {
    this.snake = snake;
    this.rows = rows;
    this.cols = cols;
    this.stroke_color = stroke_color;
    this.cherries = new Map();
    this.status = Game.IN_PROGRESS;
  }
  draw(ctx) {
    ctx.strokeStyle = this.stroke_color;
    for (let i = 0; i < this.cols; ++i) {
      for (let j = 0; j < this.rows; ++j) {
        ctx.strokeRect(
          i * cell_size.width,
          j * cell_size.height,
          cell_size.width,
          cell_size.height
        );
      }
    }
    for (let cherry of this.cherries.values()) {
      cherry.draw(ctx);
    }
    this.snake.draw(ctx);
  }
  spawn_cherry() {
    //check if any space left to spawn a new cherry -> spawn cherry
    if (
      this.cherries.size < cherry_max_n &&
      this.rows * this.cols - this.cherries.size - this.snake.tail.length - 1 > 0
    ) {
      let x = gen_int(0, this.cols);
      let y = gen_int(0, this.rows);
      while (
        this.snake.tail_map.has(`(${x},${y})`) ||
        this.cherries.has(`(${x},${y})`)
      ) {
        x = gen_int(0, this.cols);
        y = gen_int(0, this.rows);
      }
      let cherry = new Cherry(x, y, cherry_cell_color);
      this.cherries.set(`(${cherry.x},${cherry.y})`, cherry);
    }
  }
  // check snake's head collision with cherry (yumm)
  check_cherry() {
    if (this.cherries.has(`(${this.snake.x},${this.snake.y})`)) {
      this.cherries.delete(`(${this.snake.x},${this.snake.y})`);
      this.snake.play_sound();
      ++this.snake.tail_max_size;
    }
  }
  // check snake's head collision with its tail
  check_snake() {
    if (this.snake.tail_map.has(`(${this.snake.x},${this.snake.y})`)) {
      this.reset();
      console.log("TRY AGAIN NEXT TIME!");
    }
  }
  reset() {
    // reset snake
    this.snake.x = snake_spawn_point.x;
    this.snake.y = snake_spawn_point.y;
    this.snake.speed_x = 1;
    this.snake.speed_y = 0;
    this.snake.tail = [];
    this.snake.tail_map = new Map();
    this.snake.tail_max_size = 1;
    // reset cherries
    this.cherries = new Map();
    // reset field
    this.status = Game.IN_PROGRESS;
  }
  // game loop update
  update() {
    if (this.snake.tail_max_size + 1 === global_snake_tail_max_size) {
      this.end_game();
      return;
    }
    this.check_snake();
    this.check_cherry();
    this.spawn_cherry();
    this.snake.move();
  }
  end_game() {
    // TODO: CODE FOR END GAME CONGRATULATIONS
    this.status = Game.END;
    console.log("CONGRATULATIONS!!!");
  }
}

document.addEventListener(
  "keydown",
  (event) => {
    const key_name = event.key;

    if (key_name === "ArrowLeft" && field.snake.speed_x !== 1) {
      field.snake.speed_x = -1;
      field.snake.speed_y = 0;
    } else if (key_name === "ArrowRight" && field.snake.speed_x !== -1) {
      field.snake.speed_x = 1;
      field.snake.speed_y = 0;
    } else if (key_name === "ArrowUp" && field.snake.speed_y !== 1) {
      field.snake.speed_x = 0;
      field.snake.speed_y = -1;
    } else if (key_name === "ArrowDown" && field.snake.speed_y !== -1) {
      field.snake.speed_x = 0;
      field.snake.speed_y = 1;
    }
  },
  false
);

// main game update loop
function update() {
  window.requestAnimationFrame(update);
  if (field.status === Game.END) field.reset();

  time_now = window.performance.now();
  const time_dur = time_now - time_prev;

  // limit fps
  if (time_dur < time_per_frame) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = background_color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  field.draw(ctx);
  // limit snake movement
  if (count === game_update_limit) {
    field.update();
    count = 0;
  } else ++count;

  const time_excess = time_dur % time_per_frame;
  time_prev = time_now - time_excess;
  ++frames;
}

function start_canvas() {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) requestAnimationFrame(update);
  });
  button_play.style.display = "none";
  canvas.style.display = "inline";
  requestAnimationFrame(update);
  // debug
  //setInterval(debug_info, 1000);
}

async function debug_info() {
  console.log(
    `[DEBUG]:\n\tLOOP:\n\t\tFPS: ${frames}\n\t\tUPDATE_TIMER: ${count}\n\tFIELD:\n\t\tN_COLS: ${n_cols}\n\t\tN_ROWS: ${n_rows}\n\t\tCELL_SIZE: ${cell_size.width} ${cell_size.height}\n\t\tCHERRY_MAX_N: ${cherry_max_n}\n\t\tSTATUS: ${field.status}\n\tSNAKE:\n\t\tSNAKE_POS: ${field.snake.x} ${field.snake.y}\n\t\tSNAKE_SPEED: ${field.snake.speed_x} ${field.snake.speed_y}\n\t\tSNAKE_TAIL_SIZE: ${field.snake.tail.length}`
  );
  frames = 0;
}

// main

// game vars init
let snake = new Snake(
  snake_spawn_point.x,
  snake_spawn_point.y,
  snake_head_color,
  snake_tail_color
);
let field = new Game_Field(snake, n_rows, n_cols, cell_color);

// game update loop vars init
let count = 0;
const game_update_limit = 5;
const fps = 60;
const time_per_frame = 1000 / fps;
let time_prev = window.performance.now();
let time_now = undefined;

// debug
let frames = 0;
