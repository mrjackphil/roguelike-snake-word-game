import * as ROT from 'rot-js';

const W = 50;
const H = 50;
const display = new ROT.Display({width: W, height: H, fontSize: 16});
document.body.appendChild(display.getContainer());

// Map Generation
const map = new ROT.Map.Cellular(W, H);
const mapObj = mapObject();
map.randomize(0.5);
map.create();
map.create( (x, y, wall) => {
  wall && display.draw(x, y, "#", "green", "");
  wall && mapObj.addSolid(x, y);
});

interface Solids {
  solids: {x: number, y: number}[],
  addSolid: (x: number, y: number) => void,
  isSolid: (x: number, y: number) => boolean,
}

function mapObject(): Solids {
  return {
    solids: [],
    addSolid: function(x: number, y: number) {
      this.solids.push({x, y});
    },
    isSolid: function(x: number, y: number) {
      return this.solids.filter( (o: { x: number, y: number}) => o.x === x && o.y === y).length > 0;
    }
  }
}

// Units

const player = {
  x: 0,
  y: 0,
}

// Movement

function walk(dir: "left" | "right" | "up" | "down", pl: { x: number, y: number}) {
  const {x, y} = pl;
  display.draw(x, y, "", "", "");
  switch (dir) {
    case "left":
      !mapObj.isSolid(x - 1, y) && pl.x--;
      break;
    case "right":
      !mapObj.isSolid(x + 1, y) && pl.x++;
      break;
    case "down":
      !mapObj.isSolid(x, y + 1) && pl.y++;
      break;
    case "up":
      !mapObj.isSolid(x, y - 1) && pl.y--;
      break;
  }
  display.draw(player.x, player.y, "@", "red", "");
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
