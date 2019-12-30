import * as ROT from 'rot-js';

const W = 50;
const H = 50;
const display = new ROT.Display({width: W, height: H, fontSize: 16});
const text_display = new ROT.Display({width: W, height: 12, fontSize: 16});
document.body.appendChild(display.getContainer());
document.body.appendChild(text_display.getContainer());

// Units

const player: Char = {
  id: 0,
  x: 0,
  y: 0,
}

const npc: Char = {
  id: 1,
  x: 20,
  y: 20,
}

// Types
interface Char {
  id: number;
  x: number;
  y: number;
  icon?: string;
}
interface Console {
  lines: string[],
  addLine: (s: string) => void;
  update: () => void;
}

interface Solids {
  solids: {x: number, y: number}[],
  add: (x: number, y: number) => void,
  is: (x: number, y: number) => boolean,
  not: (x: number, y: number) => boolean,
}

interface DrawEvent {
  events: { [key: string]: string },
  add: ROT.Display["draw"];
  draw: () => void;
}

// Utils
function drawSolids(s: Solids) {
  s.solids.forEach( s => {
    display.draw(s.x, s.y, "#", "green", "");
  })
}

function createLogger(l: Console) {
  return function(s: string) {
    l.addLine(ROT.Util.capitalize(s));
  }
}

function createPathCheckFunction(checks: Array<(x: number, y: number) => boolean>) {
  return function(x: number, y: number) {
    return checks.map( e => e(x,y) ).every( e => e === true );
  }
}

function getQuery(key: string) {
  const msgValue = (s: string) => {
    const keyValue = s.split('=');
    return keyValue[0] === key && keyValue[1];
  }

  return window.location.search
    .replace('?', '')
    .split('&')
    .map( s => msgValue(s) )
    .filter( e => e )[0];
}

class Decoder {
  value: string = "";
  constructor(s: string) {
    this.value = atob(s);
  }
}

class Counter {
  public i: number = 0;

  public add() {
    this.i = this.i + 1;
  }
}

const nCounter = new Counter();
const nDecoder = new Decoder(getQuery('msg'));

// Creators
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

function createDrawEvents(d: ROT.Display): DrawEvent {
  return {
    events: {},
    add: function(x: number, y: number, s: string, f: string, b: string) {
      if (!this.events[x+','+y]) {
        this.events[x+','+y] = [x, y, [], [], []];
      }

      s && this.events[x+','+y][2].push(s);
      f && this.events[x+','+y][3].push(f);
      b && this.events[x+','+y][4].push(b);
    },
    draw: function() {
      const { events } = this;
      d.clear();
      drawSolids(solids);
      for (const key in events) {
        if (events.hasOwnProperty(key)) {
          const e = events[key];
          d.draw(e[0], e[1], e[2], e[3], e[4]);
        }
      }
      this.events = {};
    }
  }
};

function createCharController(d: ROT.Display, dEv: DrawEvent) {
  return {
    walk: function (
      dir: "left" | "right" | "up" | "down",
      pl: { x: number, y: number},
      canWalkFunc: (x: number, y: number) => boolean
    ) {
      // Unpure using `nCounter`, `nDecoder`, `npc` variables
      const {x, y} = pl;
      const dOptions: { [k: string]: [number, number] } = {
        "left"  : [ x - 1, y ],
        "right" : [ x + 1, y ],
        "up"    : [ x, y - 1 ],
        "down"  : [ x, y + 1 ],
      };
      const checks = (d: string): boolean =>
        canWalkFunc(...dOptions[d]);

      // Remove position before move
      d.draw(x, y, "", "", "");

      switch (dir) {
        case "left":
          checks(dir) && pl.x--;
          break;
        case "right":
          checks(dir) && pl.x++;
          break;
        case "down":
          checks(dir) && pl.y++;
          break;
        case "up":
          checks(dir) && pl.y--;
          break;
      }
      dEv.add(pl.x, pl.y, "@", "red", "");

      function collidedWithNPC() {
        nCounter.add();
        // Skip whitespaces
        while (nDecoder.value[nCounter.i] === ' ') {
          nCounter.add();
        }

        npc.icon = nDecoder.value[nCounter.i];
        generateMap();
        while (!canWalkFunc(pl.x, pl.y)) {
          generateMap();
        }
        npcRandomMove(npc);
        sendLog(`${nDecoder.value.slice(0, nCounter.i)}`);
      }

      // Unpure usage of `npc` variable
      if (pl.x === npc.x && pl.y === npc.y) {
        collidedWithNPC();
      }
      // Unpure usage of `npc` variable
      npcTick(npc);
      dEv.draw();
    }
  }
}

function createEdgeChecker(
  minx: number,
  miny: number,
  maxx: number,
  maxy: number
) {
  return (x: number, y: number) =>
       x <= maxx - 1
    && x >= minx
    && y <= maxy - 1
    && y >= miny
}

// Initalization
const log = createConsole(text_display);
const sendLog = createLogger(log);
const drawEvents = createDrawEvents(display);
const solids = createSolids();
const char = createCharController(display, drawEvents);
const notEdge = createEdgeChecker(0, 0, W, H);
const isWalkable = createPathCheckFunction([solids.not.bind(solids), notEdge]);

// Map Generation
function generateMap() {
  const map = new ROT.Map.Cellular(W, H);
  solids.solids = [];
  map.randomize(0.5);
  map.create();
  map.connect(null, 0);
  map.create();
  map.connect( (x, y, wall) => {
    wall && solids.add(x, y);
    drawSolids(solids);
  }, 0, null);
}
generateMap();

// Movement
function npcTick(n: Char) {
  if ( isWalkable(n.x, n.y) ) {
    drawEvents.add(n.x, n.y, n.icon || nDecoder.value[0] || "N", "yellow", "");
    const astar = new ROT.Path.AStar(player.x, player.y, isWalkable, {topology: 4});
    astar.compute(n.x, n.y, (x, y) => {
      drawEvents.add(x, y, "", "", "rgb(133, 133, 133, 0.5)");
    });
  } else {
    npcRandomMove(n);
    npcTick(n);
  }
}

function npcRandomMove(n: Char) {
    n.x = Math.round(ROT.RNG.getNormal(0, W));
    n.y = Math.round(ROT.RNG.getNormal(0, H));
}

// Input handling

document.addEventListener("keydown", (e) => {
  const {VK_W, VK_S, VK_A, VK_D} = ROT.KEYS;
  switch (e.keyCode) {
    case VK_W:
      char.walk("up", player, isWalkable);
      return;
    case VK_A:
      char.walk("left", player, isWalkable);
      return;
    case VK_D:
      char.walk("right", player, isWalkable);
      return;
    case VK_S:
      char.walk("down", player, isWalkable);
      return;
  }
});
