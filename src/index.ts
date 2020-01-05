import * as ROT from 'rot-js';

const W = 25;
const H = 25;
const FONT_SIZE = 16;

const display = new ROT.Display({
  width: W,
  height: H,
  fontSize: FONT_SIZE,
  forceSquareRatio: true
});
const text_display = new ROT.Display({
  width: W,
  height: 12,
  fontSize: FONT_SIZE
});
const appElem = document.createElement("div");

document.body.appendChild(appElem);
appElem.appendChild(display.getContainer());
appElem.appendChild(text_display.getContainer());

const [textAreaElem, btnElem, anchorElem] = createLinkGenerator(appElem);


(function(
  body: HTMLElement,
  el: HTMLElement,
  txt?: HTMLTextAreaElement,
  btn?: HTMLButtonElement,
  a?: HTMLAnchorElement,
){
  body.style.background = "black";
  body.style.display = "flex";
  body.style.justifyContent = "center";
  body.style.flexDirection = "column";
  body.style.alignItems = "center";

  el.style.maxWidth = "600px";

  txt.style.background = "black";
  txt.style.color = "white";
  txt.style.border = "1px solid white";
  txt.style.borderRadius = "5px";
  txt.style.resize = "none";
  txt.style.width = "100%";
  txt.placeholder = "Put your text here and press submit to generate link";
  txt.style.padding = "5px";
  txt.style.margin = "5px";

  btn.style.border = "1px solid white";
  btn.style.backgroundColor = "black";
  btn.style.color = "white";
  btn.style.display = "block";
  btn.style.margin = "5px auto";

  a.style.color = "white";
  a.style.padding = "5px";
  a.style.textAlign = "center";
  a.style.display = "block";
  a.style.margin = "5px";

})(document.body, appElem, textAreaElem, btnElem, anchorElem);

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

function b64EncodeUnicode(s: string) {
  return btoa(encodeURIComponent(s).replace( /%([0-9A-F]{2})/g,
    (match, p1) => String.fromCharCode(Number('0x' + p1)) ));
}

function b64DecodeUnicode(str: string) {
  return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
}

type LinkGeneratorOutput = [HTMLTextAreaElement, HTMLButtonElement, HTMLAnchorElement];
function createLinkGenerator(h: HTMLElement): LinkGeneratorOutput {
  const textarea = document.createElement('textarea');
  const href = document.createElement("a");
  const btn = document.createElement("button");

  btn.innerHTML = "Generate link";
  btn.addEventListener('click', () => {
    const url = window.location.origin + "?msg=" + b64EncodeUnicode(textarea.value);
    href.setAttribute("href", url);
    href.innerHTML = url;
  });

  h.appendChild(textarea);
  h.appendChild(btn);
  h.appendChild(href);
  return [textarea, btn, href];
}

// Creators
class Decoder {
  value: string = "You Win!";
  constructor(s: string) {
    if (s) {
      this.value = b64DecodeUnicode(s);
    }
  }
}

class Counter {
  public i: number = 0;

  public add() {
    this.i = this.i + 1;
  }
}

class Console {
  d: ROT.Display;
  lines: string[] = [];
  constructor(d: ROT.Display) {
    this.d = d;
  };

  public addLine(s: string): void {
    this.lines.push(s);
    this.update();
  }

  public update() {
    this.d.clear();
    this.lines
      .sort( (a, b) => b.length - a.length )
      .slice(0, 10)
      .forEach( (s: string, i: number) => {
        this.d.drawText(1, 1 + i, s);
      });
  }
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
      dEv.add(pl.x, pl.y, "@", "red", "black");

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
        drawSolids(solids);
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
const log = new Console(text_display);
const sendLog = createLogger(log);
const drawEvents = createDrawEvents(display);
const solids = createSolids();
const char = createCharController(display, drawEvents);
const notEdge = createEdgeChecker(0, 0, W, H);
const isWalkable = createPathCheckFunction([solids.not.bind(solids), notEdge]);
const nCounter = new Counter();
const nDecoder = new Decoder(getQuery('msg'));

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
  }, 0, null);
}
generateMap();
drawSolids(solids);

// Movement
function npcTick(n: Char) {
  if ( isWalkable(n.x, n.y) ) {
    drawEvents.add(n.x, n.y, n.icon || nDecoder.value[0] || "N", "yellow", "black");
    // const astar = new ROT.Path.AStar(player.x, player.y, isWalkable, {topology: 4});
    // astar.compute(n.x, n.y, (x, y) => {
    //   drawEvents.add(x, y, "", "", "rgb(133, 133, 133, 0.5)");
    // });
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

let move = "" as "left" | "right" | "up" | "down" | "";

function step() {
  move && char.walk(move, player, isWalkable);
  setTimeout(() => window.requestAnimationFrame(step), 50);
}

window.requestAnimationFrame(step);

document.addEventListener("keydown", (e) => {
  const {VK_W, VK_S, VK_A, VK_D} = ROT.KEYS;
  switch (e.keyCode) {
    case VK_W:
      // char.walk("up", player, isWalkable);
      move = "up";
      return;
    case VK_A:
      // char.walk("left", player, isWalkable);
      move = "left";
      return;
    case VK_D:
      // char.walk("right", player, isWalkable);
      move = "right";
      return;
    case VK_S:
      // char.walk("down", player, isWalkable);
      move = "down";
      return;
  }
});