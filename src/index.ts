import * as ROT from 'rot-js';

const W = 50;
const H = 50;
const display = new ROT.Display({width: W, height: H, fontSize: 16});
const text_display = new ROT.Display({width: W, height: 12, fontSize: 16});
document.body.appendChild(display.getContainer());
document.body.appendChild(text_display.getContainer());

// Map Generation
const map = new ROT.Map.Cellular(W, H);
const solids = createSolids();
map.randomize(0.5);
map.create();
map.connect(null, 0);
map.create( (x, y, wall) => {
  wall && display.draw(x, y, "#", "green", "");
  wall && solids.add(x, y);
});

interface Solids {
  solids: {x: number, y: number}[],
  add: (x: number, y: number) => void,
  is: (x: number, y: number) => boolean,
  not: (x: number, y: number) => boolean,
}

function createSolids(): Solids {
  return {
    solids: [],
    add: function(x: number, y: number) {
      this.solids.push({x, y});
    },
    is: function(x: number, y: number) {
      return this.solids.filter( (o: { x: number, y: number}) => o.x === x && o.y === y).length > 0;
    },
    not: function(x: number, y: number) {
      return this.solids.filter( (o: { x: number, y: number}) => o.x === x && o.y === y).length === 0;
    },
  }
}

// Units

const player = {
  x: 0,
  y: 0,
}

// Actions
interface Console {
  lines: string[],
  addLine: (s: string) => void;
  update: () => void;
}

function createConsole(d: ROT.Display): Console {
  return {
    lines: [],
    addLine: function(s: string) {
      this.lines.push(s);
      this.update();
    },
    update: function() {
      d.clear();
      this.lines
        .reverse()
        .slice(0, 10)
        .forEach( (s: string, i: number) => {
          d.drawText(1, 1 + i, s);
        });
    }
  }
}
const log = createConsole(text_display);

function text(s: string) {
  log.addLine(ROT.Util.capitalize(s));
}

// Movement

function walk(dir: "left" | "right" | "up" | "down", pl: { x: number, y: number}) {
  const {x, y} = pl;
  display.draw(x, y, "", "", "");
  switch (dir) {
    case "left":
      solids.not(x - 1, y) && pl.x--;
      break;
    case "right":
      solids.not(x + 1, y) && pl.x++;
      break;
    case "down":
      solids.not(x, y + 1) && pl.y++;
      break;
    case "up":
      solids.not(x, y - 1) && pl.y--;
      break;
  }
  display.draw(player.x, player.y, "@", "red", "");
  text(`you walked at ${pl.x}, ${pl.y}`);
}

// Input handling

document.addEventListener("keydown", (e) => {
  const {VK_W, VK_S, VK_A, VK_D} = ROT.KEYS;
  switch (e.keyCode) {
    case VK_W:
      walk("up", player);
      return;
    case VK_A:
      walk("left", player);
      return;
    case VK_D:
      walk("right", player);
      return;
    case VK_S:
      walk("down", player);
      return;
  }
});
