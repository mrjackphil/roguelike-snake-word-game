
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
/**
 * This code is an implementation of Alea algorithm; (C) 2010 Johannes Baagøe.
 * Alea is licensed according to the http://en.wikipedia.org/wiki/MIT_License.
 */
const FRAC = 2.3283064365386963e-10; /* 2^-32 */
class RNG {
    constructor() {
        this._seed = 0;
        this._s0 = 0;
        this._s1 = 0;
        this._s2 = 0;
        this._c = 0;
    }
    getSeed() { return this._seed; }
    /**
     * Seed the number generator
     */
    setSeed(seed) {
        seed = (seed < 1 ? 1 / seed : seed);
        this._seed = seed;
        this._s0 = (seed >>> 0) * FRAC;
        seed = (seed * 69069 + 1) >>> 0;
        this._s1 = seed * FRAC;
        seed = (seed * 69069 + 1) >>> 0;
        this._s2 = seed * FRAC;
        this._c = 1;
        return this;
    }
    /**
     * @returns Pseudorandom value [0,1), uniformly distributed
     */
    getUniform() {
        let t = 2091639 * this._s0 + this._c * FRAC;
        this._s0 = this._s1;
        this._s1 = this._s2;
        this._c = t | 0;
        this._s2 = t - this._c;
        return this._s2;
    }
    /**
     * @param lowerBound The lower end of the range to return a value from, inclusive
     * @param upperBound The upper end of the range to return a value from, inclusive
     * @returns Pseudorandom value [lowerBound, upperBound], using ROT.RNG.getUniform() to distribute the value
     */
    getUniformInt(lowerBound, upperBound) {
        let max = Math.max(lowerBound, upperBound);
        let min = Math.min(lowerBound, upperBound);
        return Math.floor(this.getUniform() * (max - min + 1)) + min;
    }
    /**
     * @param mean Mean value
     * @param stddev Standard deviation. ~95% of the absolute values will be lower than 2*stddev.
     * @returns A normally distributed pseudorandom value
     */
    getNormal(mean = 0, stddev = 1) {
        let u, v, r;
        do {
            u = 2 * this.getUniform() - 1;
            v = 2 * this.getUniform() - 1;
            r = u * u + v * v;
        } while (r > 1 || r == 0);
        let gauss = u * Math.sqrt(-2 * Math.log(r) / r);
        return mean + gauss * stddev;
    }
    /**
     * @returns Pseudorandom value [1,100] inclusive, uniformly distributed
     */
    getPercentage() {
        return 1 + Math.floor(this.getUniform() * 100);
    }
    /**
     * @returns Randomly picked item, null when length=0
     */
    getItem(array) {
        if (!array.length) {
            return null;
        }
        return array[Math.floor(this.getUniform() * array.length)];
    }
    /**
     * @returns New array with randomized items
     */
    shuffle(array) {
        let result = [];
        let clone = array.slice();
        while (clone.length) {
            let index = clone.indexOf(this.getItem(clone));
            result.push(clone.splice(index, 1)[0]);
        }
        return result;
    }
    /**
     * @param data key=whatever, value=weight (relative probability)
     * @returns whatever
     */
    getWeightedValue(data) {
        let total = 0;
        for (let id in data) {
            total += data[id];
        }
        let random = this.getUniform() * total;
        let id, part = 0;
        for (id in data) {
            part += data[id];
            if (random < part) {
                return id;
            }
        }
        // If by some floating-point annoyance we have
        // random >= total, just return the last id.
        return id;
    }
    /**
     * Get RNG state. Useful for storing the state and re-setting it via setState.
     * @returns Internal state
     */
    getState() { return [this._s0, this._s1, this._s2, this._c]; }
    /**
     * Set a previously retrieved state.
     */
    setState(state) {
        this._s0 = state[0];
        this._s1 = state[1];
        this._s2 = state[2];
        this._c = state[3];
        return this;
    }
    /**
     * Returns a cloned RNG
     */
    clone() {
        let clone = new RNG();
        return clone.setState(this.getState());
    }
}
var RNG$1 = new RNG().setSeed(Date.now());

/**
 * @class Abstract display backend module
 * @private
 */
class Backend {
    getContainer() { return null; }
    setOptions(options) { this._options = options; }
}

class Canvas extends Backend {
    constructor() {
        super();
        this._ctx = document.createElement("canvas").getContext("2d");
    }
    schedule(cb) { requestAnimationFrame(cb); }
    getContainer() { return this._ctx.canvas; }
    setOptions(opts) {
        super.setOptions(opts);
        const style = (opts.fontStyle ? `${opts.fontStyle} ` : ``);
        const font = `${style} ${opts.fontSize}px ${opts.fontFamily}`;
        this._ctx.font = font;
        this._updateSize();
        this._ctx.font = font;
        this._ctx.textAlign = "center";
        this._ctx.textBaseline = "middle";
    }
    clear() {
        this._ctx.fillStyle = this._options.bg;
        this._ctx.fillRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);
    }
    eventToPosition(x, y) {
        let canvas = this._ctx.canvas;
        let rect = canvas.getBoundingClientRect();
        x -= rect.left;
        y -= rect.top;
        x *= canvas.width / rect.width;
        y *= canvas.height / rect.height;
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
            return [-1, -1];
        }
        return this._normalizedEventToPosition(x, y);
    }
}

/**
 * Always positive modulus
 * @param x Operand
 * @param n Modulus
 * @returns x modulo n
 */
function mod(x, n) {
    return (x % n + n) % n;
}
function clamp(val, min = 0, max = 1) {
    if (val < min)
        return min;
    if (val > max)
        return max;
    return val;
}
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.substring(1);
}
/**
 * Format a string in a flexible way. Scans for %s strings and replaces them with arguments. List of patterns is modifiable via String.format.map.
 * @param {string} template
 * @param {any} [argv]
 */
function format(template, ...args) {
    let map = format.map;
    let replacer = function (match, group1, group2, index) {
        if (template.charAt(index - 1) == "%") {
            return match.substring(1);
        }
        if (!args.length) {
            return match;
        }
        let obj = args[0];
        let group = group1 || group2;
        let parts = group.split(",");
        let name = parts.shift() || "";
        let method = map[name.toLowerCase()];
        if (!method) {
            return match;
        }
        obj = args.shift();
        let replaced = obj[method].apply(obj, parts);
        let first = name.charAt(0);
        if (first != first.toLowerCase()) {
            replaced = capitalize(replaced);
        }
        return replaced;
    };
    return template.replace(/%(?:([a-z]+)|(?:{([^}]+)}))/gi, replacer);
}
format.map = {
    "s": "toString"
};

var util = /*#__PURE__*/Object.freeze({
    __proto__: null,
    mod: mod,
    clamp: clamp,
    capitalize: capitalize,
    format: format
});

/**
 * @class Hexagonal backend
 * @private
 */
class Hex extends Canvas {
    constructor() {
        super();
        this._spacingX = 0;
        this._spacingY = 0;
        this._hexSize = 0;
    }
    draw(data, clearBefore) {
        let [x, y, ch, fg, bg] = data;
        let px = [
            (x + 1) * this._spacingX,
            y * this._spacingY + this._hexSize
        ];
        if (this._options.transpose) {
            px.reverse();
        }
        if (clearBefore) {
            this._ctx.fillStyle = bg;
            this._fill(px[0], px[1]);
        }
        if (!ch) {
            return;
        }
        this._ctx.fillStyle = fg;
        let chars = [].concat(ch);
        for (let i = 0; i < chars.length; i++) {
            this._ctx.fillText(chars[i], px[0], Math.ceil(px[1]));
        }
    }
    computeSize(availWidth, availHeight) {
        if (this._options.transpose) {
            availWidth += availHeight;
            availHeight = availWidth - availHeight;
            availWidth -= availHeight;
        }
        let width = Math.floor(availWidth / this._spacingX) - 1;
        let height = Math.floor((availHeight - 2 * this._hexSize) / this._spacingY + 1);
        return [width, height];
    }
    computeFontSize(availWidth, availHeight) {
        if (this._options.transpose) {
            availWidth += availHeight;
            availHeight = availWidth - availHeight;
            availWidth -= availHeight;
        }
        let hexSizeWidth = 2 * availWidth / ((this._options.width + 1) * Math.sqrt(3)) - 1;
        let hexSizeHeight = availHeight / (2 + 1.5 * (this._options.height - 1));
        let hexSize = Math.min(hexSizeWidth, hexSizeHeight);
        // compute char ratio
        let oldFont = this._ctx.font;
        this._ctx.font = "100px " + this._options.fontFamily;
        let width = Math.ceil(this._ctx.measureText("W").width);
        this._ctx.font = oldFont;
        let ratio = width / 100;
        hexSize = Math.floor(hexSize) + 1; // closest larger hexSize
        // FIXME char size computation does not respect transposed hexes
        let fontSize = 2 * hexSize / (this._options.spacing * (1 + ratio / Math.sqrt(3)));
        // closest smaller fontSize
        return Math.ceil(fontSize) - 1;
    }
    _normalizedEventToPosition(x, y) {
        let nodeSize;
        if (this._options.transpose) {
            x += y;
            y = x - y;
            x -= y;
            nodeSize = this._ctx.canvas.width;
        }
        else {
            nodeSize = this._ctx.canvas.height;
        }
        let size = nodeSize / this._options.height;
        y = Math.floor(y / size);
        if (mod(y, 2)) { /* odd row */
            x -= this._spacingX;
            x = 1 + 2 * Math.floor(x / (2 * this._spacingX));
        }
        else {
            x = 2 * Math.floor(x / (2 * this._spacingX));
        }
        return [x, y];
    }
    /**
     * Arguments are pixel values. If "transposed" mode is enabled, then these two are already swapped.
     */
    _fill(cx, cy) {
        let a = this._hexSize;
        let b = this._options.border;
        const ctx = this._ctx;
        ctx.beginPath();
        if (this._options.transpose) {
            ctx.moveTo(cx - a + b, cy);
            ctx.lineTo(cx - a / 2 + b, cy + this._spacingX - b);
            ctx.lineTo(cx + a / 2 - b, cy + this._spacingX - b);
            ctx.lineTo(cx + a - b, cy);
            ctx.lineTo(cx + a / 2 - b, cy - this._spacingX + b);
            ctx.lineTo(cx - a / 2 + b, cy - this._spacingX + b);
            ctx.lineTo(cx - a + b, cy);
        }
        else {
            ctx.moveTo(cx, cy - a + b);
            ctx.lineTo(cx + this._spacingX - b, cy - a / 2 + b);
            ctx.lineTo(cx + this._spacingX - b, cy + a / 2 - b);
            ctx.lineTo(cx, cy + a - b);
            ctx.lineTo(cx - this._spacingX + b, cy + a / 2 - b);
            ctx.lineTo(cx - this._spacingX + b, cy - a / 2 + b);
            ctx.lineTo(cx, cy - a + b);
        }
        ctx.fill();
    }
    _updateSize() {
        const opts = this._options;
        const charWidth = Math.ceil(this._ctx.measureText("W").width);
        this._hexSize = Math.floor(opts.spacing * (opts.fontSize + charWidth / Math.sqrt(3)) / 2);
        this._spacingX = this._hexSize * Math.sqrt(3) / 2;
        this._spacingY = this._hexSize * 1.5;
        let xprop;
        let yprop;
        if (opts.transpose) {
            xprop = "height";
            yprop = "width";
        }
        else {
            xprop = "width";
            yprop = "height";
        }
        this._ctx.canvas[xprop] = Math.ceil((opts.width + 1) * this._spacingX);
        this._ctx.canvas[yprop] = Math.ceil((opts.height - 1) * this._spacingY + 2 * this._hexSize);
    }
}

/**
 * @class Rectangular backend
 * @private
 */
class Rect extends Canvas {
    constructor() {
        super();
        this._spacingX = 0;
        this._spacingY = 0;
        this._canvasCache = {};
    }
    setOptions(options) {
        super.setOptions(options);
        this._canvasCache = {};
    }
    draw(data, clearBefore) {
        if (Rect.cache) {
            this._drawWithCache(data);
        }
        else {
            this._drawNoCache(data, clearBefore);
        }
    }
    _drawWithCache(data) {
        let [x, y, ch, fg, bg] = data;
        let hash = "" + ch + fg + bg;
        let canvas;
        if (hash in this._canvasCache) {
            canvas = this._canvasCache[hash];
        }
        else {
            let b = this._options.border;
            canvas = document.createElement("canvas");
            let ctx = canvas.getContext("2d");
            canvas.width = this._spacingX;
            canvas.height = this._spacingY;
            ctx.fillStyle = bg;
            ctx.fillRect(b, b, canvas.width - b, canvas.height - b);
            if (ch) {
                ctx.fillStyle = fg;
                ctx.font = this._ctx.font;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                let chars = [].concat(ch);
                for (let i = 0; i < chars.length; i++) {
                    ctx.fillText(chars[i], this._spacingX / 2, Math.ceil(this._spacingY / 2));
                }
            }
            this._canvasCache[hash] = canvas;
        }
        this._ctx.drawImage(canvas, x * this._spacingX, y * this._spacingY);
    }
    _drawNoCache(data, clearBefore) {
        let [x, y, ch, fg, bg] = data;
        if (clearBefore) {
            let b = this._options.border;
            this._ctx.fillStyle = bg;
            this._ctx.fillRect(x * this._spacingX + b, y * this._spacingY + b, this._spacingX - b, this._spacingY - b);
        }
        if (!ch) {
            return;
        }
        this._ctx.fillStyle = fg;
        let chars = [].concat(ch);
        for (let i = 0; i < chars.length; i++) {
            this._ctx.fillText(chars[i], (x + 0.5) * this._spacingX, Math.ceil((y + 0.5) * this._spacingY));
        }
    }
    computeSize(availWidth, availHeight) {
        let width = Math.floor(availWidth / this._spacingX);
        let height = Math.floor(availHeight / this._spacingY);
        return [width, height];
    }
    computeFontSize(availWidth, availHeight) {
        let boxWidth = Math.floor(availWidth / this._options.width);
        let boxHeight = Math.floor(availHeight / this._options.height);
        /* compute char ratio */
        let oldFont = this._ctx.font;
        this._ctx.font = "100px " + this._options.fontFamily;
        let width = Math.ceil(this._ctx.measureText("W").width);
        this._ctx.font = oldFont;
        let ratio = width / 100;
        let widthFraction = ratio * boxHeight / boxWidth;
        if (widthFraction > 1) { /* too wide with current aspect ratio */
            boxHeight = Math.floor(boxHeight / widthFraction);
        }
        return Math.floor(boxHeight / this._options.spacing);
    }
    _normalizedEventToPosition(x, y) {
        return [Math.floor(x / this._spacingX), Math.floor(y / this._spacingY)];
    }
    _updateSize() {
        const opts = this._options;
        const charWidth = Math.ceil(this._ctx.measureText("W").width);
        this._spacingX = Math.ceil(opts.spacing * charWidth);
        this._spacingY = Math.ceil(opts.spacing * opts.fontSize);
        if (opts.forceSquareRatio) {
            this._spacingX = this._spacingY = Math.max(this._spacingX, this._spacingY);
        }
        this._ctx.canvas.width = opts.width * this._spacingX;
        this._ctx.canvas.height = opts.height * this._spacingY;
    }
}
Rect.cache = false;

/**
 * @class Tile backend
 * @private
 */
class Tile extends Canvas {
    constructor() {
        super();
        this._colorCanvas = document.createElement("canvas");
    }
    draw(data, clearBefore) {
        let [x, y, ch, fg, bg] = data;
        let tileWidth = this._options.tileWidth;
        let tileHeight = this._options.tileHeight;
        if (clearBefore) {
            if (this._options.tileColorize) {
                this._ctx.clearRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
            }
            else {
                this._ctx.fillStyle = bg;
                this._ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
            }
        }
        if (!ch) {
            return;
        }
        let chars = [].concat(ch);
        let fgs = [].concat(fg);
        let bgs = [].concat(bg);
        for (let i = 0; i < chars.length; i++) {
            let tile = this._options.tileMap[chars[i]];
            if (!tile) {
                throw new Error(`Char "${chars[i]}" not found in tileMap`);
            }
            if (this._options.tileColorize) { // apply colorization
                let canvas = this._colorCanvas;
                let context = canvas.getContext("2d");
                context.globalCompositeOperation = "source-over";
                context.clearRect(0, 0, tileWidth, tileHeight);
                let fg = fgs[i];
                let bg = bgs[i];
                context.drawImage(this._options.tileSet, tile[0], tile[1], tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
                if (fg != "transparent") {
                    context.fillStyle = fg;
                    context.globalCompositeOperation = "source-atop";
                    context.fillRect(0, 0, tileWidth, tileHeight);
                }
                if (bg != "transparent") {
                    context.fillStyle = bg;
                    context.globalCompositeOperation = "destination-over";
                    context.fillRect(0, 0, tileWidth, tileHeight);
                }
                this._ctx.drawImage(canvas, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
            }
            else { // no colorizing, easy
                this._ctx.drawImage(this._options.tileSet, tile[0], tile[1], tileWidth, tileHeight, x * tileWidth, y * tileHeight, tileWidth, tileHeight);
            }
        }
    }
    computeSize(availWidth, availHeight) {
        let width = Math.floor(availWidth / this._options.tileWidth);
        let height = Math.floor(availHeight / this._options.tileHeight);
        return [width, height];
    }
    computeFontSize() {
        throw new Error("Tile backend does not understand font size");
    }
    _normalizedEventToPosition(x, y) {
        return [Math.floor(x / this._options.tileWidth), Math.floor(y / this._options.tileHeight)];
    }
    _updateSize() {
        const opts = this._options;
        this._ctx.canvas.width = opts.width * opts.tileWidth;
        this._ctx.canvas.height = opts.height * opts.tileHeight;
        this._colorCanvas.width = opts.tileWidth;
        this._colorCanvas.height = opts.tileHeight;
    }
}

function fromString(str) {
    let cached, r;
    if (str in CACHE) {
        cached = CACHE[str];
    }
    else {
        if (str.charAt(0) == "#") { // hex rgb
            let matched = str.match(/[0-9a-f]/gi) || [];
            let values = matched.map((x) => parseInt(x, 16));
            if (values.length == 3) {
                cached = values.map((x) => x * 17);
            }
            else {
                for (let i = 0; i < 3; i++) {
                    values[i + 1] += 16 * values[i];
                    values.splice(i, 1);
                }
                cached = values;
            }
        }
        else if ((r = str.match(/rgb\(([0-9, ]+)\)/i))) { // decimal rgb
            cached = r[1].split(/\s*,\s*/).map((x) => parseInt(x));
        }
        else { // html name
            cached = [0, 0, 0];
        }
        CACHE[str] = cached;
    }
    return cached.slice();
}
const CACHE = {
    "black": [0, 0, 0],
    "navy": [0, 0, 128],
    "darkblue": [0, 0, 139],
    "mediumblue": [0, 0, 205],
    "blue": [0, 0, 255],
    "darkgreen": [0, 100, 0],
    "green": [0, 128, 0],
    "teal": [0, 128, 128],
    "darkcyan": [0, 139, 139],
    "deepskyblue": [0, 191, 255],
    "darkturquoise": [0, 206, 209],
    "mediumspringgreen": [0, 250, 154],
    "lime": [0, 255, 0],
    "springgreen": [0, 255, 127],
    "aqua": [0, 255, 255],
    "cyan": [0, 255, 255],
    "midnightblue": [25, 25, 112],
    "dodgerblue": [30, 144, 255],
    "forestgreen": [34, 139, 34],
    "seagreen": [46, 139, 87],
    "darkslategray": [47, 79, 79],
    "darkslategrey": [47, 79, 79],
    "limegreen": [50, 205, 50],
    "mediumseagreen": [60, 179, 113],
    "turquoise": [64, 224, 208],
    "royalblue": [65, 105, 225],
    "steelblue": [70, 130, 180],
    "darkslateblue": [72, 61, 139],
    "mediumturquoise": [72, 209, 204],
    "indigo": [75, 0, 130],
    "darkolivegreen": [85, 107, 47],
    "cadetblue": [95, 158, 160],
    "cornflowerblue": [100, 149, 237],
    "mediumaquamarine": [102, 205, 170],
    "dimgray": [105, 105, 105],
    "dimgrey": [105, 105, 105],
    "slateblue": [106, 90, 205],
    "olivedrab": [107, 142, 35],
    "slategray": [112, 128, 144],
    "slategrey": [112, 128, 144],
    "lightslategray": [119, 136, 153],
    "lightslategrey": [119, 136, 153],
    "mediumslateblue": [123, 104, 238],
    "lawngreen": [124, 252, 0],
    "chartreuse": [127, 255, 0],
    "aquamarine": [127, 255, 212],
    "maroon": [128, 0, 0],
    "purple": [128, 0, 128],
    "olive": [128, 128, 0],
    "gray": [128, 128, 128],
    "grey": [128, 128, 128],
    "skyblue": [135, 206, 235],
    "lightskyblue": [135, 206, 250],
    "blueviolet": [138, 43, 226],
    "darkred": [139, 0, 0],
    "darkmagenta": [139, 0, 139],
    "saddlebrown": [139, 69, 19],
    "darkseagreen": [143, 188, 143],
    "lightgreen": [144, 238, 144],
    "mediumpurple": [147, 112, 216],
    "darkviolet": [148, 0, 211],
    "palegreen": [152, 251, 152],
    "darkorchid": [153, 50, 204],
    "yellowgreen": [154, 205, 50],
    "sienna": [160, 82, 45],
    "brown": [165, 42, 42],
    "darkgray": [169, 169, 169],
    "darkgrey": [169, 169, 169],
    "lightblue": [173, 216, 230],
    "greenyellow": [173, 255, 47],
    "paleturquoise": [175, 238, 238],
    "lightsteelblue": [176, 196, 222],
    "powderblue": [176, 224, 230],
    "firebrick": [178, 34, 34],
    "darkgoldenrod": [184, 134, 11],
    "mediumorchid": [186, 85, 211],
    "rosybrown": [188, 143, 143],
    "darkkhaki": [189, 183, 107],
    "silver": [192, 192, 192],
    "mediumvioletred": [199, 21, 133],
    "indianred": [205, 92, 92],
    "peru": [205, 133, 63],
    "chocolate": [210, 105, 30],
    "tan": [210, 180, 140],
    "lightgray": [211, 211, 211],
    "lightgrey": [211, 211, 211],
    "palevioletred": [216, 112, 147],
    "thistle": [216, 191, 216],
    "orchid": [218, 112, 214],
    "goldenrod": [218, 165, 32],
    "crimson": [220, 20, 60],
    "gainsboro": [220, 220, 220],
    "plum": [221, 160, 221],
    "burlywood": [222, 184, 135],
    "lightcyan": [224, 255, 255],
    "lavender": [230, 230, 250],
    "darksalmon": [233, 150, 122],
    "violet": [238, 130, 238],
    "palegoldenrod": [238, 232, 170],
    "lightcoral": [240, 128, 128],
    "khaki": [240, 230, 140],
    "aliceblue": [240, 248, 255],
    "honeydew": [240, 255, 240],
    "azure": [240, 255, 255],
    "sandybrown": [244, 164, 96],
    "wheat": [245, 222, 179],
    "beige": [245, 245, 220],
    "whitesmoke": [245, 245, 245],
    "mintcream": [245, 255, 250],
    "ghostwhite": [248, 248, 255],
    "salmon": [250, 128, 114],
    "antiquewhite": [250, 235, 215],
    "linen": [250, 240, 230],
    "lightgoldenrodyellow": [250, 250, 210],
    "oldlace": [253, 245, 230],
    "red": [255, 0, 0],
    "fuchsia": [255, 0, 255],
    "magenta": [255, 0, 255],
    "deeppink": [255, 20, 147],
    "orangered": [255, 69, 0],
    "tomato": [255, 99, 71],
    "hotpink": [255, 105, 180],
    "coral": [255, 127, 80],
    "darkorange": [255, 140, 0],
    "lightsalmon": [255, 160, 122],
    "orange": [255, 165, 0],
    "lightpink": [255, 182, 193],
    "pink": [255, 192, 203],
    "gold": [255, 215, 0],
    "peachpuff": [255, 218, 185],
    "navajowhite": [255, 222, 173],
    "moccasin": [255, 228, 181],
    "bisque": [255, 228, 196],
    "mistyrose": [255, 228, 225],
    "blanchedalmond": [255, 235, 205],
    "papayawhip": [255, 239, 213],
    "lavenderblush": [255, 240, 245],
    "seashell": [255, 245, 238],
    "cornsilk": [255, 248, 220],
    "lemonchiffon": [255, 250, 205],
    "floralwhite": [255, 250, 240],
    "snow": [255, 250, 250],
    "yellow": [255, 255, 0],
    "lightyellow": [255, 255, 224],
    "ivory": [255, 255, 240],
    "white": [255, 255, 255]
};

/**
 * @class Tile backend
 * @private
 */
class TileGL extends Backend {
    static isSupported() {
        return !!document.createElement("canvas").getContext("webgl2", { preserveDrawingBuffer: true });
    }
    constructor() {
        super();
        this._uniforms = {};
        try {
            this._gl = this._initWebGL();
        }
        catch (e) {
            alert(e.message);
        }
    }
    schedule(cb) { requestAnimationFrame(cb); }
    getContainer() { return this._gl.canvas; }
    setOptions(opts) {
        super.setOptions(opts);
        this._updateSize();
        let tileSet = this._options.tileSet;
        if (tileSet && "complete" in tileSet && !tileSet.complete) {
            tileSet.addEventListener("load", () => this._updateTexture(tileSet));
        }
        else {
            this._updateTexture(tileSet);
        }
    }
    draw(data, clearBefore) {
        const gl = this._gl;
        const opts = this._options;
        let [x, y, ch, fg, bg] = data;
        let scissorY = gl.canvas.height - (y + 1) * opts.tileHeight;
        gl.scissor(x * opts.tileWidth, scissorY, opts.tileWidth, opts.tileHeight);
        if (clearBefore) {
            if (opts.tileColorize) {
                gl.clearColor(0, 0, 0, 0);
            }
            else {
                gl.clearColor(...parseColor(bg));
            }
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        if (!ch) {
            return;
        }
        let chars = [].concat(ch);
        let bgs = [].concat(bg);
        let fgs = [].concat(fg);
        gl.uniform2fv(this._uniforms["targetPosRel"], [x, y]);
        for (let i = 0; i < chars.length; i++) {
            let tile = this._options.tileMap[chars[i]];
            if (!tile) {
                throw new Error(`Char "${chars[i]}" not found in tileMap`);
            }
            gl.uniform1f(this._uniforms["colorize"], opts.tileColorize ? 1 : 0);
            gl.uniform2fv(this._uniforms["tilesetPosAbs"], tile);
            if (opts.tileColorize) {
                gl.uniform4fv(this._uniforms["tint"], parseColor(fgs[i]));
                gl.uniform4fv(this._uniforms["bg"], parseColor(bgs[i]));
            }
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        /*
        
        
                for (let i=0;i<chars.length;i++) {
                    
                    if (this._options.tileColorize) { // apply colorization
                        let canvas = this._colorCanvas;
                        let context = canvas.getContext("2d") as CanvasRenderingContext2D;
                        context.globalCompositeOperation = "source-over";
                        context.clearRect(0, 0, tileWidth, tileHeight);
        
                        let fg = fgs[i];
                        let bg = bgs[i];
        
                        context.drawImage(
                            this._options.tileSet!,
                            tile[0], tile[1], tileWidth, tileHeight,
                            0, 0, tileWidth, tileHeight
                        );
        
                        if (fg != "transparent") {
                            context.fillStyle = fg;
                            context.globalCompositeOperation = "source-atop";
                            context.fillRect(0, 0, tileWidth, tileHeight);
                        }
        
                        if (bg != "transparent") {
                            context.fillStyle = bg;
                            context.globalCompositeOperation = "destination-over";
                            context.fillRect(0, 0, tileWidth, tileHeight);
                        }
        
                        this._ctx.drawImage(canvas, x*tileWidth, y*tileHeight, tileWidth, tileHeight);
                    } else { // no colorizing, easy
                        this._ctx.drawImage(
                            this._options.tileSet!,
                            tile[0], tile[1], tileWidth, tileHeight,
                            x*tileWidth, y*tileHeight, tileWidth, tileHeight
                        );
                    }
                }
        
        */
    }
    clear() {
        const gl = this._gl;
        gl.clearColor(...parseColor(this._options.bg));
        gl.scissor(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    computeSize(availWidth, availHeight) {
        let width = Math.floor(availWidth / this._options.tileWidth);
        let height = Math.floor(availHeight / this._options.tileHeight);
        return [width, height];
    }
    computeFontSize() {
        throw new Error("Tile backend does not understand font size");
    }
    eventToPosition(x, y) {
        let canvas = this._gl.canvas;
        let rect = canvas.getBoundingClientRect();
        x -= rect.left;
        y -= rect.top;
        x *= canvas.width / rect.width;
        y *= canvas.height / rect.height;
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
            return [-1, -1];
        }
        return this._normalizedEventToPosition(x, y);
    }
    _initWebGL() {
        let gl = document.createElement("canvas").getContext("webgl2", { preserveDrawingBuffer: true });
        window.gl = gl;
        let program = createProgram(gl, VS, FS);
        gl.useProgram(program);
        createQuad(gl);
        UNIFORMS.forEach(name => this._uniforms[name] = gl.getUniformLocation(program, name));
        this._program = program;
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.SCISSOR_TEST);
        return gl;
    }
    _normalizedEventToPosition(x, y) {
        return [Math.floor(x / this._options.tileWidth), Math.floor(y / this._options.tileHeight)];
    }
    _updateSize() {
        const gl = this._gl;
        const opts = this._options;
        const canvasSize = [opts.width * opts.tileWidth, opts.height * opts.tileHeight];
        gl.canvas.width = canvasSize[0];
        gl.canvas.height = canvasSize[1];
        gl.viewport(0, 0, canvasSize[0], canvasSize[1]);
        gl.uniform2fv(this._uniforms["tileSize"], [opts.tileWidth, opts.tileHeight]);
        gl.uniform2fv(this._uniforms["targetSize"], canvasSize);
    }
    _updateTexture(tileSet) {
        createTexture(this._gl, tileSet);
    }
}
const UNIFORMS = ["targetPosRel", "tilesetPosAbs", "tileSize", "targetSize", "colorize", "bg", "tint"];
const VS = `
#version 300 es

in vec2 tilePosRel;
out vec2 tilesetPosPx;

uniform vec2 tilesetPosAbs;
uniform vec2 tileSize;
uniform vec2 targetSize;
uniform vec2 targetPosRel;

void main() {
	vec2 targetPosPx = (targetPosRel + tilePosRel) * tileSize;
	vec2 targetPosNdc = ((targetPosPx / targetSize)-0.5)*2.0;
	targetPosNdc.y *= -1.0;

	gl_Position = vec4(targetPosNdc, 0.0, 1.0);
	tilesetPosPx = tilesetPosAbs + tilePosRel * tileSize;
}`.trim();
const FS = `
#version 300 es
precision highp float;

in vec2 tilesetPosPx;
out vec4 fragColor;
uniform sampler2D image;
uniform bool colorize;
uniform vec4 bg;
uniform vec4 tint;

void main() {
	fragColor = vec4(0, 0, 0, 1);

	vec4 texel = texelFetch(image, ivec2(tilesetPosPx), 0);

	if (colorize) {
		texel.rgb = tint.a * tint.rgb + (1.0-tint.a) * texel.rgb;
		fragColor.rgb = texel.a*texel.rgb + (1.0-texel.a)*bg.rgb;
		fragColor.a = texel.a + (1.0-texel.a)*bg.a;
	} else {
		fragColor = texel;
	}
}`.trim();
function createProgram(gl, vss, fss) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vss);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(vs) || "");
    }
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fss);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(fs) || "");
    }
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(p) || "");
    }
    return p;
}
function createQuad(gl) {
    const pos = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
}
function createTexture(gl, data) {
    let t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    return t;
}
let colorCache = {};
function parseColor(color) {
    if (!(color in colorCache)) {
        let parsed;
        if (color == "transparent") {
            parsed = [0, 0, 0, 0];
        }
        else if (color.indexOf("rgba") > -1) {
            parsed = (color.match(/[\d.]+/g) || []).map(Number);
            for (let i = 0; i < 3; i++) {
                parsed[i] = parsed[i] / 255;
            }
        }
        else {
            parsed = fromString(color).map($ => $ / 255);
            parsed.push(1);
        }
        colorCache[color] = parsed;
    }
    return colorCache[color];
}

function clearToAnsi(bg) {
    return `\x1b[0;48;5;${termcolor(bg)}m\x1b[2J`;
}
function colorToAnsi(fg, bg) {
    return `\x1b[0;38;5;${termcolor(fg)};48;5;${termcolor(bg)}m`;
}
function positionToAnsi(x, y) {
    return `\x1b[${y + 1};${x + 1}H`;
}
function termcolor(color) {
    const SRC_COLORS = 256.0;
    const DST_COLORS = 6.0;
    const COLOR_RATIO = DST_COLORS / SRC_COLORS;
    let rgb = fromString(color);
    let r = Math.floor(rgb[0] * COLOR_RATIO);
    let g = Math.floor(rgb[1] * COLOR_RATIO);
    let b = Math.floor(rgb[2] * COLOR_RATIO);
    return r * 36 + g * 6 + b * 1 + 16;
}
class Term extends Backend {
    constructor() {
        super();
        this._offset = [0, 0];
        this._cursor = [-1, -1];
        this._lastColor = "";
    }
    schedule(cb) { setTimeout(cb, 1000 / 60); }
    setOptions(options) {
        super.setOptions(options);
        let size = [options.width, options.height];
        let avail = this.computeSize();
        this._offset = avail.map((val, index) => Math.floor((val - size[index]) / 2));
    }
    clear() {
        process.stdout.write(clearToAnsi(this._options.bg));
    }
    draw(data, clearBefore) {
        // determine where to draw what with what colors
        let [x, y, ch, fg, bg] = data;
        // determine if we need to move the terminal cursor
        let dx = this._offset[0] + x;
        let dy = this._offset[1] + y;
        let size = this.computeSize();
        if (dx < 0 || dx >= size[0]) {
            return;
        }
        if (dy < 0 || dy >= size[1]) {
            return;
        }
        if (dx !== this._cursor[0] || dy !== this._cursor[1]) {
            process.stdout.write(positionToAnsi(dx, dy));
            this._cursor[0] = dx;
            this._cursor[1] = dy;
        }
        // terminals automatically clear, but if we're clearing when we're
        // not otherwise provided with a character, just use a space instead
        if (clearBefore) {
            if (!ch) {
                ch = " ";
            }
        }
        // if we're not clearing and not provided with a character, do nothing
        if (!ch) {
            return;
        }
        // determine if we need to change colors
        let newColor = colorToAnsi(fg, bg);
        if (newColor !== this._lastColor) {
            process.stdout.write(newColor);
            this._lastColor = newColor;
        }
        // write the provided symbol to the display
        let chars = [].concat(ch);
        process.stdout.write(chars[0]);
        // update our position, given that we wrote a character
        this._cursor[0]++;
        if (this._cursor[0] >= size[0]) {
            this._cursor[0] = 0;
            this._cursor[1]++;
        }
    }
    computeFontSize() { throw new Error("Terminal backend has no notion of font size"); }
    eventToPosition(x, y) { return [x, y]; }
    computeSize() { return [process.stdout.columns, process.stdout.rows]; }
}

/**
 * @namespace
 * Contains text tokenization and breaking routines
 */
const RE_COLORS = /%([bc]){([^}]*)}/g;
// token types
const TYPE_TEXT = 0;
const TYPE_NEWLINE = 1;
const TYPE_FG = 2;
const TYPE_BG = 3;
/**
 * Convert string to a series of a formatting commands
 */
function tokenize(str, maxWidth) {
    let result = [];
    /* first tokenization pass - split texts and color formatting commands */
    let offset = 0;
    str.replace(RE_COLORS, function (match, type, name, index) {
        /* string before */
        let part = str.substring(offset, index);
        if (part.length) {
            result.push({
                type: TYPE_TEXT,
                value: part
            });
        }
        /* color command */
        result.push({
            type: (type == "c" ? TYPE_FG : TYPE_BG),
            value: name.trim()
        });
        offset = index + match.length;
        return "";
    });
    /* last remaining part */
    let part = str.substring(offset);
    if (part.length) {
        result.push({
            type: TYPE_TEXT,
            value: part
        });
    }
    return breakLines(result, maxWidth);
}
/* insert line breaks into first-pass tokenized data */
function breakLines(tokens, maxWidth) {
    if (!maxWidth) {
        maxWidth = Infinity;
    }
    let i = 0;
    let lineLength = 0;
    let lastTokenWithSpace = -1;
    while (i < tokens.length) { /* take all text tokens, remove space, apply linebreaks */
        let token = tokens[i];
        if (token.type == TYPE_NEWLINE) { /* reset */
            lineLength = 0;
            lastTokenWithSpace = -1;
        }
        if (token.type != TYPE_TEXT) { /* skip non-text tokens */
            i++;
            continue;
        }
        /* remove spaces at the beginning of line */
        while (lineLength == 0 && token.value.charAt(0) == " ") {
            token.value = token.value.substring(1);
        }
        /* forced newline? insert two new tokens after this one */
        let index = token.value.indexOf("\n");
        if (index != -1) {
            token.value = breakInsideToken(tokens, i, index, true);
            /* if there are spaces at the end, we must remove them (we do not want the line too long) */
            let arr = token.value.split("");
            while (arr.length && arr[arr.length - 1] == " ") {
                arr.pop();
            }
            token.value = arr.join("");
        }
        /* token degenerated? */
        if (!token.value.length) {
            tokens.splice(i, 1);
            continue;
        }
        if (lineLength + token.value.length > maxWidth) { /* line too long, find a suitable breaking spot */
            /* is it possible to break within this token? */
            let index = -1;
            while (1) {
                let nextIndex = token.value.indexOf(" ", index + 1);
                if (nextIndex == -1) {
                    break;
                }
                if (lineLength + nextIndex > maxWidth) {
                    break;
                }
                index = nextIndex;
            }
            if (index != -1) { /* break at space within this one */
                token.value = breakInsideToken(tokens, i, index, true);
            }
            else if (lastTokenWithSpace != -1) { /* is there a previous token where a break can occur? */
                let token = tokens[lastTokenWithSpace];
                let breakIndex = token.value.lastIndexOf(" ");
                token.value = breakInsideToken(tokens, lastTokenWithSpace, breakIndex, true);
                i = lastTokenWithSpace;
            }
            else { /* force break in this token */
                token.value = breakInsideToken(tokens, i, maxWidth - lineLength, false);
            }
        }
        else { /* line not long, continue */
            lineLength += token.value.length;
            if (token.value.indexOf(" ") != -1) {
                lastTokenWithSpace = i;
            }
        }
        i++; /* advance to next token */
    }
    tokens.push({ type: TYPE_NEWLINE }); /* insert fake newline to fix the last text line */
    /* remove trailing space from text tokens before newlines */
    let lastTextToken = null;
    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        switch (token.type) {
            case TYPE_TEXT:
                lastTextToken = token;
                break;
            case TYPE_NEWLINE:
                if (lastTextToken) { /* remove trailing space */
                    let arr = lastTextToken.value.split("");
                    while (arr.length && arr[arr.length - 1] == " ") {
                        arr.pop();
                    }
                    lastTextToken.value = arr.join("");
                }
                lastTextToken = null;
                break;
        }
    }
    tokens.pop(); /* remove fake token */
    return tokens;
}
/**
 * Create new tokens and insert them into the stream
 * @param {object[]} tokens
 * @param {int} tokenIndex Token being processed
 * @param {int} breakIndex Index within current token's value
 * @param {bool} removeBreakChar Do we want to remove the breaking character?
 * @returns {string} remaining unbroken token value
 */
function breakInsideToken(tokens, tokenIndex, breakIndex, removeBreakChar) {
    let newBreakToken = {
        type: TYPE_NEWLINE
    };
    let newTextToken = {
        type: TYPE_TEXT,
        value: tokens[tokenIndex].value.substring(breakIndex + (removeBreakChar ? 1 : 0))
    };
    tokens.splice(tokenIndex + 1, 0, newBreakToken, newTextToken);
    return tokens[tokenIndex].value.substring(0, breakIndex);
}

/** Default with for display and map generators */
let DEFAULT_WIDTH = 80;
/** Default height for display and map generators */
let DEFAULT_HEIGHT = 25;
const DIRS = {
    4: [[0, -1], [1, 0], [0, 1], [-1, 0]],
    8: [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]],
    6: [[-1, -1], [1, -1], [2, 0], [1, 1], [-1, 1], [-2, 0]]
};
const KEYS = {
    /** Cancel key. */
    VK_CANCEL: 3,
    /** Help key. */
    VK_HELP: 6,
    /** Backspace key. */
    VK_BACK_SPACE: 8,
    /** Tab key. */
    VK_TAB: 9,
    /** 5 key on Numpad when NumLock is unlocked. Or on Mac, clear key which is positioned at NumLock key. */
    VK_CLEAR: 12,
    /** Return/enter key on the main keyboard. */
    VK_RETURN: 13,
    /** Reserved, but not used. */
    VK_ENTER: 14,
    /** Shift key. */
    VK_SHIFT: 16,
    /** Control key. */
    VK_CONTROL: 17,
    /** Alt (Option on Mac) key. */
    VK_ALT: 18,
    /** Pause key. */
    VK_PAUSE: 19,
    /** Caps lock. */
    VK_CAPS_LOCK: 20,
    /** Escape key. */
    VK_ESCAPE: 27,
    /** Space bar. */
    VK_SPACE: 32,
    /** Page Up key. */
    VK_PAGE_UP: 33,
    /** Page Down key. */
    VK_PAGE_DOWN: 34,
    /** End key. */
    VK_END: 35,
    /** Home key. */
    VK_HOME: 36,
    /** Left arrow. */
    VK_LEFT: 37,
    /** Up arrow. */
    VK_UP: 38,
    /** Right arrow. */
    VK_RIGHT: 39,
    /** Down arrow. */
    VK_DOWN: 40,
    /** Print Screen key. */
    VK_PRINTSCREEN: 44,
    /** Ins(ert) key. */
    VK_INSERT: 45,
    /** Del(ete) key. */
    VK_DELETE: 46,
    /***/
    VK_0: 48,
    /***/
    VK_1: 49,
    /***/
    VK_2: 50,
    /***/
    VK_3: 51,
    /***/
    VK_4: 52,
    /***/
    VK_5: 53,
    /***/
    VK_6: 54,
    /***/
    VK_7: 55,
    /***/
    VK_8: 56,
    /***/
    VK_9: 57,
    /** Colon (:) key. Requires Gecko 15.0 */
    VK_COLON: 58,
    /** Semicolon (;) key. */
    VK_SEMICOLON: 59,
    /** Less-than (<) key. Requires Gecko 15.0 */
    VK_LESS_THAN: 60,
    /** Equals (=) key. */
    VK_EQUALS: 61,
    /** Greater-than (>) key. Requires Gecko 15.0 */
    VK_GREATER_THAN: 62,
    /** Question mark (?) key. Requires Gecko 15.0 */
    VK_QUESTION_MARK: 63,
    /** Atmark (@) key. Requires Gecko 15.0 */
    VK_AT: 64,
    /***/
    VK_A: 65,
    /***/
    VK_B: 66,
    /***/
    VK_C: 67,
    /***/
    VK_D: 68,
    /***/
    VK_E: 69,
    /***/
    VK_F: 70,
    /***/
    VK_G: 71,
    /***/
    VK_H: 72,
    /***/
    VK_I: 73,
    /***/
    VK_J: 74,
    /***/
    VK_K: 75,
    /***/
    VK_L: 76,
    /***/
    VK_M: 77,
    /***/
    VK_N: 78,
    /***/
    VK_O: 79,
    /***/
    VK_P: 80,
    /***/
    VK_Q: 81,
    /***/
    VK_R: 82,
    /***/
    VK_S: 83,
    /***/
    VK_T: 84,
    /***/
    VK_U: 85,
    /***/
    VK_V: 86,
    /***/
    VK_W: 87,
    /***/
    VK_X: 88,
    /***/
    VK_Y: 89,
    /***/
    VK_Z: 90,
    /***/
    VK_CONTEXT_MENU: 93,
    /** 0 on the numeric keypad. */
    VK_NUMPAD0: 96,
    /** 1 on the numeric keypad. */
    VK_NUMPAD1: 97,
    /** 2 on the numeric keypad. */
    VK_NUMPAD2: 98,
    /** 3 on the numeric keypad. */
    VK_NUMPAD3: 99,
    /** 4 on the numeric keypad. */
    VK_NUMPAD4: 100,
    /** 5 on the numeric keypad. */
    VK_NUMPAD5: 101,
    /** 6 on the numeric keypad. */
    VK_NUMPAD6: 102,
    /** 7 on the numeric keypad. */
    VK_NUMPAD7: 103,
    /** 8 on the numeric keypad. */
    VK_NUMPAD8: 104,
    /** 9 on the numeric keypad. */
    VK_NUMPAD9: 105,
    /** * on the numeric keypad. */
    VK_MULTIPLY: 106,
    /** + on the numeric keypad. */
    VK_ADD: 107,
    /***/
    VK_SEPARATOR: 108,
    /** - on the numeric keypad. */
    VK_SUBTRACT: 109,
    /** Decimal point on the numeric keypad. */
    VK_DECIMAL: 110,
    /** / on the numeric keypad. */
    VK_DIVIDE: 111,
    /** F1 key. */
    VK_F1: 112,
    /** F2 key. */
    VK_F2: 113,
    /** F3 key. */
    VK_F3: 114,
    /** F4 key. */
    VK_F4: 115,
    /** F5 key. */
    VK_F5: 116,
    /** F6 key. */
    VK_F6: 117,
    /** F7 key. */
    VK_F7: 118,
    /** F8 key. */
    VK_F8: 119,
    /** F9 key. */
    VK_F9: 120,
    /** F10 key. */
    VK_F10: 121,
    /** F11 key. */
    VK_F11: 122,
    /** F12 key. */
    VK_F12: 123,
    /** F13 key. */
    VK_F13: 124,
    /** F14 key. */
    VK_F14: 125,
    /** F15 key. */
    VK_F15: 126,
    /** F16 key. */
    VK_F16: 127,
    /** F17 key. */
    VK_F17: 128,
    /** F18 key. */
    VK_F18: 129,
    /** F19 key. */
    VK_F19: 130,
    /** F20 key. */
    VK_F20: 131,
    /** F21 key. */
    VK_F21: 132,
    /** F22 key. */
    VK_F22: 133,
    /** F23 key. */
    VK_F23: 134,
    /** F24 key. */
    VK_F24: 135,
    /** Num Lock key. */
    VK_NUM_LOCK: 144,
    /** Scroll Lock key. */
    VK_SCROLL_LOCK: 145,
    /** Circumflex (^) key. Requires Gecko 15.0 */
    VK_CIRCUMFLEX: 160,
    /** Exclamation (!) key. Requires Gecko 15.0 */
    VK_EXCLAMATION: 161,
    /** Double quote () key. Requires Gecko 15.0 */
    VK_DOUBLE_QUOTE: 162,
    /** Hash (#) key. Requires Gecko 15.0 */
    VK_HASH: 163,
    /** Dollar sign ($) key. Requires Gecko 15.0 */
    VK_DOLLAR: 164,
    /** Percent (%) key. Requires Gecko 15.0 */
    VK_PERCENT: 165,
    /** Ampersand (&) key. Requires Gecko 15.0 */
    VK_AMPERSAND: 166,
    /** Underscore (_) key. Requires Gecko 15.0 */
    VK_UNDERSCORE: 167,
    /** Open parenthesis (() key. Requires Gecko 15.0 */
    VK_OPEN_PAREN: 168,
    /** Close parenthesis ()) key. Requires Gecko 15.0 */
    VK_CLOSE_PAREN: 169,
    /* Asterisk (*) key. Requires Gecko 15.0 */
    VK_ASTERISK: 170,
    /** Plus (+) key. Requires Gecko 15.0 */
    VK_PLUS: 171,
    /** Pipe (|) key. Requires Gecko 15.0 */
    VK_PIPE: 172,
    /** Hyphen-US/docs/Minus (-) key. Requires Gecko 15.0 */
    VK_HYPHEN_MINUS: 173,
    /** Open curly bracket ({) key. Requires Gecko 15.0 */
    VK_OPEN_CURLY_BRACKET: 174,
    /** Close curly bracket (}) key. Requires Gecko 15.0 */
    VK_CLOSE_CURLY_BRACKET: 175,
    /** Tilde (~) key. Requires Gecko 15.0 */
    VK_TILDE: 176,
    /** Comma (,) key. */
    VK_COMMA: 188,
    /** Period (.) key. */
    VK_PERIOD: 190,
    /** Slash (/) key. */
    VK_SLASH: 191,
    /** Back tick (`) key. */
    VK_BACK_QUOTE: 192,
    /** Open square bracket ([) key. */
    VK_OPEN_BRACKET: 219,
    /** Back slash (\) key. */
    VK_BACK_SLASH: 220,
    /** Close square bracket (]) key. */
    VK_CLOSE_BRACKET: 221,
    /** Quote (''') key. */
    VK_QUOTE: 222,
    /** Meta key on Linux, Command key on Mac. */
    VK_META: 224,
    /** AltGr key on Linux. Requires Gecko 15.0 */
    VK_ALTGR: 225,
    /** Windows logo key on Windows. Or Super or Hyper key on Linux. Requires Gecko 15.0 */
    VK_WIN: 91,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_KANA: 21,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_HANGUL: 21,
    /** 英数 key on Japanese Mac keyboard. Requires Gecko 15.0 */
    VK_EISU: 22,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_JUNJA: 23,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_FINAL: 24,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_HANJA: 25,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_KANJI: 25,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_CONVERT: 28,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_NONCONVERT: 29,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_ACCEPT: 30,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_MODECHANGE: 31,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_SELECT: 41,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_PRINT: 42,
    /** Linux support for this keycode was added in Gecko 4.0. */
    VK_EXECUTE: 43,
    /** Linux support for this keycode was added in Gecko 4.0.	 */
    VK_SLEEP: 95
};

const BACKENDS = {
    "hex": Hex,
    "rect": Rect,
    "tile": Tile,
    "tile-gl": TileGL,
    "term": Term
};
const DEFAULT_OPTIONS = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    transpose: false,
    layout: "rect",
    fontSize: 15,
    spacing: 1,
    border: 0,
    forceSquareRatio: false,
    fontFamily: "monospace",
    fontStyle: "",
    fg: "#ccc",
    bg: "#000",
    tileWidth: 32,
    tileHeight: 32,
    tileMap: {},
    tileSet: null,
    tileColorize: false
};
/**
 * @class Visual map display
 */
class Display {
    constructor(options = {}) {
        this._data = {};
        this._dirty = false; // false = nothing, true = all, object = dirty cells
        this._options = {};
        options = Object.assign({}, DEFAULT_OPTIONS, options);
        this.setOptions(options);
        this.DEBUG = this.DEBUG.bind(this);
        this._tick = this._tick.bind(this);
        this._backend.schedule(this._tick);
    }
    /**
     * Debug helper, ideal as a map generator callback. Always bound to this.
     * @param {int} x
     * @param {int} y
     * @param {int} what
     */
    DEBUG(x, y, what) {
        let colors = [this._options.bg, this._options.fg];
        this.draw(x, y, null, null, colors[what % colors.length]);
    }
    /**
     * Clear the whole display (cover it with background color)
     */
    clear() {
        this._data = {};
        this._dirty = true;
    }
    /**
     * @see ROT.Display
     */
    setOptions(options) {
        Object.assign(this._options, options);
        if (options.width || options.height || options.fontSize || options.fontFamily || options.spacing || options.layout) {
            if (options.layout) {
                let ctor = BACKENDS[options.layout];
                this._backend = new ctor();
            }
            this._backend.setOptions(this._options);
            this._dirty = true;
        }
        return this;
    }
    /**
     * Returns currently set options
     */
    getOptions() { return this._options; }
    /**
     * Returns the DOM node of this display
     */
    getContainer() { return this._backend.getContainer(); }
    /**
     * Compute the maximum width/height to fit into a set of given constraints
     * @param {int} availWidth Maximum allowed pixel width
     * @param {int} availHeight Maximum allowed pixel height
     * @returns {int[2]} cellWidth,cellHeight
     */
    computeSize(availWidth, availHeight) {
        return this._backend.computeSize(availWidth, availHeight);
    }
    /**
     * Compute the maximum font size to fit into a set of given constraints
     * @param {int} availWidth Maximum allowed pixel width
     * @param {int} availHeight Maximum allowed pixel height
     * @returns {int} fontSize
     */
    computeFontSize(availWidth, availHeight) {
        return this._backend.computeFontSize(availWidth, availHeight);
    }
    computeTileSize(availWidth, availHeight) {
        let width = Math.floor(availWidth / this._options.width);
        let height = Math.floor(availHeight / this._options.height);
        return [width, height];
    }
    /**
     * Convert a DOM event (mouse or touch) to map coordinates. Uses first touch for multi-touch.
     * @param {Event} e event
     * @returns {int[2]} -1 for values outside of the canvas
     */
    eventToPosition(e) {
        let x, y;
        if ("touches" in e) {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        }
        else {
            x = e.clientX;
            y = e.clientY;
        }
        return this._backend.eventToPosition(x, y);
    }
    /**
     * @param {int} x
     * @param {int} y
     * @param {string || string[]} ch One or more chars (will be overlapping themselves)
     * @param {string} [fg] foreground color
     * @param {string} [bg] background color
     */
    draw(x, y, ch, fg, bg) {
        if (!fg) {
            fg = this._options.fg;
        }
        if (!bg) {
            bg = this._options.bg;
        }
        let key = `${x},${y}`;
        this._data[key] = [x, y, ch, fg, bg];
        if (this._dirty === true) {
            return;
        } // will already redraw everything 
        if (!this._dirty) {
            this._dirty = {};
        } // first!
        this._dirty[key] = true;
    }
    /**
     * Draws a text at given position. Optionally wraps at a maximum length. Currently does not work with hex layout.
     * @param {int} x
     * @param {int} y
     * @param {string} text May contain color/background format specifiers, %c{name}/%b{name}, both optional. %c{}/%b{} resets to default.
     * @param {int} [maxWidth] wrap at what width?
     * @returns {int} lines drawn
     */
    drawText(x, y, text, maxWidth) {
        let fg = null;
        let bg = null;
        let cx = x;
        let cy = y;
        let lines = 1;
        if (!maxWidth) {
            maxWidth = this._options.width - x;
        }
        let tokens = tokenize(text, maxWidth);
        while (tokens.length) { // interpret tokenized opcode stream
            let token = tokens.shift();
            switch (token.type) {
                case TYPE_TEXT:
                    let isSpace = false, isPrevSpace = false, isFullWidth = false, isPrevFullWidth = false;
                    for (let i = 0; i < token.value.length; i++) {
                        let cc = token.value.charCodeAt(i);
                        let c = token.value.charAt(i);
                        // Assign to `true` when the current char is full-width.
                        isFullWidth = (cc > 0xff00 && cc < 0xff61) || (cc > 0xffdc && cc < 0xffe8) || cc > 0xffee;
                        // Current char is space, whatever full-width or half-width both are OK.
                        isSpace = (c.charCodeAt(0) == 0x20 || c.charCodeAt(0) == 0x3000);
                        // The previous char is full-width and
                        // current char is nether half-width nor a space.
                        if (isPrevFullWidth && !isFullWidth && !isSpace) {
                            cx++;
                        } // add an extra position
                        // The current char is full-width and
                        // the previous char is not a space.
                        if (isFullWidth && !isPrevSpace) {
                            cx++;
                        } // add an extra position
                        this.draw(cx++, cy, c, fg, bg);
                        isPrevSpace = isSpace;
                        isPrevFullWidth = isFullWidth;
                    }
                    break;
                case TYPE_FG:
                    fg = token.value || null;
                    break;
                case TYPE_BG:
                    bg = token.value || null;
                    break;
                case TYPE_NEWLINE:
                    cx = x;
                    cy++;
                    lines++;
                    break;
            }
        }
        return lines;
    }
    /**
     * Timer tick: update dirty parts
     */
    _tick() {
        this._backend.schedule(this._tick);
        if (!this._dirty) {
            return;
        }
        if (this._dirty === true) { // draw all
            this._backend.clear();
            for (let id in this._data) {
                this._draw(id, false);
            } // redraw cached data 
        }
        else { // draw only dirty 
            for (let key in this._dirty) {
                this._draw(key, true);
            }
        }
        this._dirty = false;
    }
    /**
     * @param {string} key What to draw
     * @param {bool} clearBefore Is it necessary to clean before?
     */
    _draw(key, clearBefore) {
        let data = this._data[key];
        if (data[4] != this._options.bg) {
            clearBefore = true;
        }
        this._backend.draw(data, clearBefore);
    }
}
Display.Rect = Rect;
Display.Hex = Hex;
Display.Tile = Tile;
Display.TileGL = TileGL;
Display.Term = Term;

class Map {
    /**
     * @class Base map generator
     * @param {int} [width=ROT.DEFAULT_WIDTH]
     * @param {int} [height=ROT.DEFAULT_HEIGHT]
     */
    constructor(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
        this._width = width;
        this._height = height;
    }
    ;
    _fillMap(value) {
        let map = [];
        for (let i = 0; i < this._width; i++) {
            map.push([]);
            for (let j = 0; j < this._height; j++) {
                map[i].push(value);
            }
        }
        return map;
    }
}

/**
 * @class Simple empty rectangular room
 * @augments ROT.Map
 */
class Arena extends Map {
    create(callback) {
        let w = this._width - 1;
        let h = this._height - 1;
        for (let i = 0; i <= w; i++) {
            for (let j = 0; j <= h; j++) {
                let empty = (i && j && i < w && j < h);
                callback(i, j, empty ? 0 : 1);
            }
        }
        return this;
    }
}

/**
 * @class Dungeon map: has rooms and corridors
 * @augments ROT.Map
 */
class Dungeon extends Map {
    constructor(width, height) {
        super(width, height);
        this._rooms = [];
        this._corridors = [];
    }
    /**
     * Get all generated rooms
     * @returns {ROT.Map.Feature.Room[]}
     */
    getRooms() { return this._rooms; }
    /**
     * Get all generated corridors
     * @returns {ROT.Map.Feature.Corridor[]}
     */
    getCorridors() { return this._corridors; }
}

/**
 * @class Dungeon feature; has own .create() method
 */
class Feature {
}
/**
 * @class Room
 * @augments ROT.Map.Feature
 * @param {int} x1
 * @param {int} y1
 * @param {int} x2
 * @param {int} y2
 * @param {int} [doorX]
 * @param {int} [doorY]
 */
class Room extends Feature {
    constructor(x1, y1, x2, y2, doorX, doorY) {
        super();
        this._x1 = x1;
        this._y1 = y1;
        this._x2 = x2;
        this._y2 = y2;
        this._doors = {};
        if (doorX !== undefined && doorY !== undefined) {
            this.addDoor(doorX, doorY);
        }
    }
    ;
    /**
     * Room of random size, with a given doors and direction
     */
    static createRandomAt(x, y, dx, dy, options) {
        let min = options.roomWidth[0];
        let max = options.roomWidth[1];
        let width = RNG$1.getUniformInt(min, max);
        min = options.roomHeight[0];
        max = options.roomHeight[1];
        let height = RNG$1.getUniformInt(min, max);
        if (dx == 1) { /* to the right */
            let y2 = y - Math.floor(RNG$1.getUniform() * height);
            return new this(x + 1, y2, x + width, y2 + height - 1, x, y);
        }
        if (dx == -1) { /* to the left */
            let y2 = y - Math.floor(RNG$1.getUniform() * height);
            return new this(x - width, y2, x - 1, y2 + height - 1, x, y);
        }
        if (dy == 1) { /* to the bottom */
            let x2 = x - Math.floor(RNG$1.getUniform() * width);
            return new this(x2, y + 1, x2 + width - 1, y + height, x, y);
        }
        if (dy == -1) { /* to the top */
            let x2 = x - Math.floor(RNG$1.getUniform() * width);
            return new this(x2, y - height, x2 + width - 1, y - 1, x, y);
        }
        throw new Error("dx or dy must be 1 or -1");
    }
    /**
     * Room of random size, positioned around center coords
     */
    static createRandomCenter(cx, cy, options) {
        let min = options.roomWidth[0];
        let max = options.roomWidth[1];
        let width = RNG$1.getUniformInt(min, max);
        min = options.roomHeight[0];
        max = options.roomHeight[1];
        let height = RNG$1.getUniformInt(min, max);
        let x1 = cx - Math.floor(RNG$1.getUniform() * width);
        let y1 = cy - Math.floor(RNG$1.getUniform() * height);
        let x2 = x1 + width - 1;
        let y2 = y1 + height - 1;
        return new this(x1, y1, x2, y2);
    }
    /**
     * Room of random size within a given dimensions
     */
    static createRandom(availWidth, availHeight, options) {
        let min = options.roomWidth[0];
        let max = options.roomWidth[1];
        let width = RNG$1.getUniformInt(min, max);
        min = options.roomHeight[0];
        max = options.roomHeight[1];
        let height = RNG$1.getUniformInt(min, max);
        let left = availWidth - width - 1;
        let top = availHeight - height - 1;
        let x1 = 1 + Math.floor(RNG$1.getUniform() * left);
        let y1 = 1 + Math.floor(RNG$1.getUniform() * top);
        let x2 = x1 + width - 1;
        let y2 = y1 + height - 1;
        return new this(x1, y1, x2, y2);
    }
    addDoor(x, y) {
        this._doors[x + "," + y] = 1;
        return this;
    }
    /**
     * @param {function}
     */
    getDoors(cb) {
        for (let key in this._doors) {
            let parts = key.split(",");
            cb(parseInt(parts[0]), parseInt(parts[1]));
        }
        return this;
    }
    clearDoors() {
        this._doors = {};
        return this;
    }
    addDoors(isWallCallback) {
        let left = this._x1 - 1;
        let right = this._x2 + 1;
        let top = this._y1 - 1;
        let bottom = this._y2 + 1;
        for (let x = left; x <= right; x++) {
            for (let y = top; y <= bottom; y++) {
                if (x != left && x != right && y != top && y != bottom) {
                    continue;
                }
                if (isWallCallback(x, y)) {
                    continue;
                }
                this.addDoor(x, y);
            }
        }
        return this;
    }
    debug() {
        console.log("room", this._x1, this._y1, this._x2, this._y2);
    }
    isValid(isWallCallback, canBeDugCallback) {
        let left = this._x1 - 1;
        let right = this._x2 + 1;
        let top = this._y1 - 1;
        let bottom = this._y2 + 1;
        for (let x = left; x <= right; x++) {
            for (let y = top; y <= bottom; y++) {
                if (x == left || x == right || y == top || y == bottom) {
                    if (!isWallCallback(x, y)) {
                        return false;
                    }
                }
                else {
                    if (!canBeDugCallback(x, y)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    /**
     * @param {function} digCallback Dig callback with a signature (x, y, value). Values: 0 = empty, 1 = wall, 2 = door. Multiple doors are allowed.
     */
    create(digCallback) {
        let left = this._x1 - 1;
        let right = this._x2 + 1;
        let top = this._y1 - 1;
        let bottom = this._y2 + 1;
        let value = 0;
        for (let x = left; x <= right; x++) {
            for (let y = top; y <= bottom; y++) {
                if (x + "," + y in this._doors) {
                    value = 2;
                }
                else if (x == left || x == right || y == top || y == bottom) {
                    value = 1;
                }
                else {
                    value = 0;
                }
                digCallback(x, y, value);
            }
        }
    }
    getCenter() {
        return [Math.round((this._x1 + this._x2) / 2), Math.round((this._y1 + this._y2) / 2)];
    }
    getLeft() { return this._x1; }
    getRight() { return this._x2; }
    getTop() { return this._y1; }
    getBottom() { return this._y2; }
}
/**
 * @class Corridor
 * @augments ROT.Map.Feature
 * @param {int} startX
 * @param {int} startY
 * @param {int} endX
 * @param {int} endY
 */
class Corridor extends Feature {
    constructor(startX, startY, endX, endY) {
        super();
        this._startX = startX;
        this._startY = startY;
        this._endX = endX;
        this._endY = endY;
        this._endsWithAWall = true;
    }
    static createRandomAt(x, y, dx, dy, options) {
        let min = options.corridorLength[0];
        let max = options.corridorLength[1];
        let length = RNG$1.getUniformInt(min, max);
        return new this(x, y, x + dx * length, y + dy * length);
    }
    debug() {
        console.log("corridor", this._startX, this._startY, this._endX, this._endY);
    }
    isValid(isWallCallback, canBeDugCallback) {
        let sx = this._startX;
        let sy = this._startY;
        let dx = this._endX - sx;
        let dy = this._endY - sy;
        let length = 1 + Math.max(Math.abs(dx), Math.abs(dy));
        if (dx) {
            dx = dx / Math.abs(dx);
        }
        if (dy) {
            dy = dy / Math.abs(dy);
        }
        let nx = dy;
        let ny = -dx;
        let ok = true;
        for (let i = 0; i < length; i++) {
            let x = sx + i * dx;
            let y = sy + i * dy;
            if (!canBeDugCallback(x, y)) {
                ok = false;
            }
            if (!isWallCallback(x + nx, y + ny)) {
                ok = false;
            }
            if (!isWallCallback(x - nx, y - ny)) {
                ok = false;
            }
            if (!ok) {
                length = i;
                this._endX = x - dx;
                this._endY = y - dy;
                break;
            }
        }
        /**
         * If the length degenerated, this corridor might be invalid
         */
        /* not supported */
        if (length == 0) {
            return false;
        }
        /* length 1 allowed only if the next space is empty */
        if (length == 1 && isWallCallback(this._endX + dx, this._endY + dy)) {
            return false;
        }
        /**
         * We do not want the corridor to crash into a corner of a room;
         * if any of the ending corners is empty, the N+1th cell of this corridor must be empty too.
         *
         * Situation:
         * #######1
         * .......?
         * #######2
         *
         * The corridor was dug from left to right.
         * 1, 2 - problematic corners, ? = N+1th cell (not dug)
         */
        let firstCornerBad = !isWallCallback(this._endX + dx + nx, this._endY + dy + ny);
        let secondCornerBad = !isWallCallback(this._endX + dx - nx, this._endY + dy - ny);
        this._endsWithAWall = isWallCallback(this._endX + dx, this._endY + dy);
        if ((firstCornerBad || secondCornerBad) && this._endsWithAWall) {
            return false;
        }
        return true;
    }
    /**
     * @param {function} digCallback Dig callback with a signature (x, y, value). Values: 0 = empty.
     */
    create(digCallback) {
        let sx = this._startX;
        let sy = this._startY;
        let dx = this._endX - sx;
        let dy = this._endY - sy;
        let length = 1 + Math.max(Math.abs(dx), Math.abs(dy));
        if (dx) {
            dx = dx / Math.abs(dx);
        }
        if (dy) {
            dy = dy / Math.abs(dy);
        }
        for (let i = 0; i < length; i++) {
            let x = sx + i * dx;
            let y = sy + i * dy;
            digCallback(x, y, 0);
        }
        return true;
    }
    createPriorityWalls(priorityWallCallback) {
        if (!this._endsWithAWall) {
            return;
        }
        let sx = this._startX;
        let sy = this._startY;
        let dx = this._endX - sx;
        let dy = this._endY - sy;
        if (dx) {
            dx = dx / Math.abs(dx);
        }
        if (dy) {
            dy = dy / Math.abs(dy);
        }
        let nx = dy;
        let ny = -dx;
        priorityWallCallback(this._endX + dx, this._endY + dy);
        priorityWallCallback(this._endX + nx, this._endY + ny);
        priorityWallCallback(this._endX - nx, this._endY - ny);
    }
}

/**
 * @class Dungeon generator which tries to fill the space evenly. Generates independent rooms and tries to connect them.
 * @augments ROT.Map.Dungeon
 */
class Uniform extends Dungeon {
    constructor(width, height, options) {
        super(width, height);
        this._options = {
            roomWidth: [3, 9],
            roomHeight: [3, 5],
            roomDugPercentage: 0.1,
            timeLimit: 1000 /* we stop after this much time has passed (msec) */
        };
        Object.assign(this._options, options);
        this._map = [];
        this._dug = 0;
        this._roomAttempts = 20; /* new room is created N-times until is considered as impossible to generate */
        this._corridorAttempts = 20; /* corridors are tried N-times until the level is considered as impossible to connect */
        this._connected = []; /* list of already connected rooms */
        this._unconnected = []; /* list of remaining unconnected rooms */
        this._digCallback = this._digCallback.bind(this);
        this._canBeDugCallback = this._canBeDugCallback.bind(this);
        this._isWallCallback = this._isWallCallback.bind(this);
    }
    /**
     * Create a map. If the time limit has been hit, returns null.
     * @see ROT.Map#create
     */
    create(callback) {
        let t1 = Date.now();
        while (1) {
            let t2 = Date.now();
            if (t2 - t1 > this._options.timeLimit) {
                return null;
            } /* time limit! */
            this._map = this._fillMap(1);
            this._dug = 0;
            this._rooms = [];
            this._unconnected = [];
            this._generateRooms();
            if (this._rooms.length < 2) {
                continue;
            }
            if (this._generateCorridors()) {
                break;
            }
        }
        if (callback) {
            for (let i = 0; i < this._width; i++) {
                for (let j = 0; j < this._height; j++) {
                    callback(i, j, this._map[i][j]);
                }
            }
        }
        return this;
    }
    /**
     * Generates a suitable amount of rooms
     */
    _generateRooms() {
        let w = this._width - 2;
        let h = this._height - 2;
        let room;
        do {
            room = this._generateRoom();
            if (this._dug / (w * h) > this._options.roomDugPercentage) {
                break;
            } /* achieved requested amount of free space */
        } while (room);
        /* either enough rooms, or not able to generate more of them :) */
    }
    /**
     * Try to generate one room
     */
    _generateRoom() {
        let count = 0;
        while (count < this._roomAttempts) {
            count++;
            let room = Room.createRandom(this._width, this._height, this._options);
            if (!room.isValid(this._isWallCallback, this._canBeDugCallback)) {
                continue;
            }
            room.create(this._digCallback);
            this._rooms.push(room);
            return room;
        }
        /* no room was generated in a given number of attempts */
        return null;
    }
    /**
     * Generates connectors beween rooms
     * @returns {bool} success Was this attempt successfull?
     */
    _generateCorridors() {
        let cnt = 0;
        while (cnt < this._corridorAttempts) {
            cnt++;
            this._corridors = [];
            /* dig rooms into a clear map */
            this._map = this._fillMap(1);
            for (let i = 0; i < this._rooms.length; i++) {
                let room = this._rooms[i];
                room.clearDoors();
                room.create(this._digCallback);
            }
            this._unconnected = RNG$1.shuffle(this._rooms.slice());
            this._connected = [];
            if (this._unconnected.length) {
                this._connected.push(this._unconnected.pop());
            } /* first one is always connected */
            while (1) {
                /* 1. pick random connected room */
                let connected = RNG$1.getItem(this._connected);
                if (!connected) {
                    break;
                }
                /* 2. find closest unconnected */
                let room1 = this._closestRoom(this._unconnected, connected);
                if (!room1) {
                    break;
                }
                /* 3. connect it to closest connected */
                let room2 = this._closestRoom(this._connected, room1);
                if (!room2) {
                    break;
                }
                let ok = this._connectRooms(room1, room2);
                if (!ok) {
                    break;
                } /* stop connecting, re-shuffle */
                if (!this._unconnected.length) {
                    return true;
                } /* done; no rooms remain */
            }
        }
        return false;
    }
    ;
    /**
     * For a given room, find the closest one from the list
     */
    _closestRoom(rooms, room) {
        let dist = Infinity;
        let center = room.getCenter();
        let result = null;
        for (let i = 0; i < rooms.length; i++) {
            let r = rooms[i];
            let c = r.getCenter();
            let dx = c[0] - center[0];
            let dy = c[1] - center[1];
            let d = dx * dx + dy * dy;
            if (d < dist) {
                dist = d;
                result = r;
            }
        }
        return result;
    }
    _connectRooms(room1, room2) {
        /*
            room1.debug();
            room2.debug();
        */
        let center1 = room1.getCenter();
        let center2 = room2.getCenter();
        let diffX = center2[0] - center1[0];
        let diffY = center2[1] - center1[1];
        let start;
        let end;
        let dirIndex1, dirIndex2, min, max, index;
        if (Math.abs(diffX) < Math.abs(diffY)) { /* first try connecting north-south walls */
            dirIndex1 = (diffY > 0 ? 2 : 0);
            dirIndex2 = (dirIndex1 + 2) % 4;
            min = room2.getLeft();
            max = room2.getRight();
            index = 0;
        }
        else { /* first try connecting east-west walls */
            dirIndex1 = (diffX > 0 ? 1 : 3);
            dirIndex2 = (dirIndex1 + 2) % 4;
            min = room2.getTop();
            max = room2.getBottom();
            index = 1;
        }
        start = this._placeInWall(room1, dirIndex1); /* corridor will start here */
        if (!start) {
            return false;
        }
        if (start[index] >= min && start[index] <= max) { /* possible to connect with straight line (I-like) */
            end = start.slice();
            let value = 0;
            switch (dirIndex2) {
                case 0:
                    value = room2.getTop() - 1;
                    break;
                case 1:
                    value = room2.getRight() + 1;
                    break;
                case 2:
                    value = room2.getBottom() + 1;
                    break;
                case 3:
                    value = room2.getLeft() - 1;
                    break;
            }
            end[(index + 1) % 2] = value;
            this._digLine([start, end]);
        }
        else if (start[index] < min - 1 || start[index] > max + 1) { /* need to switch target wall (L-like) */
            let diff = start[index] - center2[index];
            let rotation = 0;
            switch (dirIndex2) {
                case 0:
                case 1:
                    rotation = (diff < 0 ? 3 : 1);
                    break;
                case 2:
                case 3:
                    rotation = (diff < 0 ? 1 : 3);
                    break;
            }
            dirIndex2 = (dirIndex2 + rotation) % 4;
            end = this._placeInWall(room2, dirIndex2);
            if (!end) {
                return false;
            }
            let mid = [0, 0];
            mid[index] = start[index];
            let index2 = (index + 1) % 2;
            mid[index2] = end[index2];
            this._digLine([start, mid, end]);
        }
        else { /* use current wall pair, but adjust the line in the middle (S-like) */
            let index2 = (index + 1) % 2;
            end = this._placeInWall(room2, dirIndex2);
            if (!end) {
                return false;
            }
            let mid = Math.round((end[index2] + start[index2]) / 2);
            let mid1 = [0, 0];
            let mid2 = [0, 0];
            mid1[index] = start[index];
            mid1[index2] = mid;
            mid2[index] = end[index];
            mid2[index2] = mid;
            this._digLine([start, mid1, mid2, end]);
        }
        room1.addDoor(start[0], start[1]);
        room2.addDoor(end[0], end[1]);
        index = this._unconnected.indexOf(room1);
        if (index != -1) {
            this._unconnected.splice(index, 1);
            this._connected.push(room1);
        }
        index = this._unconnected.indexOf(room2);
        if (index != -1) {
            this._unconnected.splice(index, 1);
            this._connected.push(room2);
        }
        return true;
    }
    _placeInWall(room, dirIndex) {
        let start = [0, 0];
        let dir = [0, 0];
        let length = 0;
        switch (dirIndex) {
            case 0:
                dir = [1, 0];
                start = [room.getLeft(), room.getTop() - 1];
                length = room.getRight() - room.getLeft() + 1;
                break;
            case 1:
                dir = [0, 1];
                start = [room.getRight() + 1, room.getTop()];
                length = room.getBottom() - room.getTop() + 1;
                break;
            case 2:
                dir = [1, 0];
                start = [room.getLeft(), room.getBottom() + 1];
                length = room.getRight() - room.getLeft() + 1;
                break;
            case 3:
                dir = [0, 1];
                start = [room.getLeft() - 1, room.getTop()];
                length = room.getBottom() - room.getTop() + 1;
                break;
        }
        let avail = [];
        let lastBadIndex = -2;
        for (let i = 0; i < length; i++) {
            let x = start[0] + i * dir[0];
            let y = start[1] + i * dir[1];
            avail.push(null);
            let isWall = (this._map[x][y] == 1);
            if (isWall) {
                if (lastBadIndex != i - 1) {
                    avail[i] = [x, y];
                }
            }
            else {
                lastBadIndex = i;
                if (i) {
                    avail[i - 1] = null;
                }
            }
        }
        for (let i = avail.length - 1; i >= 0; i--) {
            if (!avail[i]) {
                avail.splice(i, 1);
            }
        }
        return (avail.length ? RNG$1.getItem(avail) : null);
    }
    /**
     * Dig a polyline.
     */
    _digLine(points) {
        for (let i = 1; i < points.length; i++) {
            let start = points[i - 1];
            let end = points[i];
            let corridor = new Corridor(start[0], start[1], end[0], end[1]);
            corridor.create(this._digCallback);
            this._corridors.push(corridor);
        }
    }
    _digCallback(x, y, value) {
        this._map[x][y] = value;
        if (value == 0) {
            this._dug++;
        }
    }
    _isWallCallback(x, y) {
        if (x < 0 || y < 0 || x >= this._width || y >= this._height) {
            return false;
        }
        return (this._map[x][y] == 1);
    }
    _canBeDugCallback(x, y) {
        if (x < 1 || y < 1 || x + 1 >= this._width || y + 1 >= this._height) {
            return false;
        }
        return (this._map[x][y] == 1);
    }
}

/**
 * @class Cellular automaton map generator
 * @augments ROT.Map
 * @param {int} [width=ROT.DEFAULT_WIDTH]
 * @param {int} [height=ROT.DEFAULT_HEIGHT]
 * @param {object} [options] Options
 * @param {int[]} [options.born] List of neighbor counts for a new cell to be born in empty space
 * @param {int[]} [options.survive] List of neighbor counts for an existing  cell to survive
 * @param {int} [options.topology] Topology 4 or 6 or 8
 */
class Cellular extends Map {
    constructor(width, height, options = {}) {
        super(width, height);
        this._options = {
            born: [5, 6, 7, 8],
            survive: [4, 5, 6, 7, 8],
            topology: 8
        };
        this.setOptions(options);
        this._dirs = DIRS[this._options.topology];
        this._map = this._fillMap(0);
    }
    /**
     * Fill the map with random values
     * @param {float} probability Probability for a cell to become alive; 0 = all empty, 1 = all full
     */
    randomize(probability) {
        for (let i = 0; i < this._width; i++) {
            for (let j = 0; j < this._height; j++) {
                this._map[i][j] = (RNG$1.getUniform() < probability ? 1 : 0);
            }
        }
        return this;
    }
    /**
     * Change options.
     * @see ROT.Map.Cellular
     */
    setOptions(options) { Object.assign(this._options, options); }
    set(x, y, value) { this._map[x][y] = value; }
    create(callback) {
        let newMap = this._fillMap(0);
        let born = this._options.born;
        let survive = this._options.survive;
        for (let j = 0; j < this._height; j++) {
            let widthStep = 1;
            let widthStart = 0;
            if (this._options.topology == 6) {
                widthStep = 2;
                widthStart = j % 2;
            }
            for (let i = widthStart; i < this._width; i += widthStep) {
                let cur = this._map[i][j];
                let ncount = this._getNeighbors(i, j);
                if (cur && survive.indexOf(ncount) != -1) { /* survive */
                    newMap[i][j] = 1;
                }
                else if (!cur && born.indexOf(ncount) != -1) { /* born */
                    newMap[i][j] = 1;
                }
            }
        }
        this._map = newMap;
        callback && this._serviceCallback(callback);
    }
    _serviceCallback(callback) {
        for (let j = 0; j < this._height; j++) {
            let widthStep = 1;
            let widthStart = 0;
            if (this._options.topology == 6) {
                widthStep = 2;
                widthStart = j % 2;
            }
            for (let i = widthStart; i < this._width; i += widthStep) {
                callback(i, j, this._map[i][j]);
            }
        }
    }
    /**
     * Get neighbor count at [i,j] in this._map
     */
    _getNeighbors(cx, cy) {
        let result = 0;
        for (let i = 0; i < this._dirs.length; i++) {
            let dir = this._dirs[i];
            let x = cx + dir[0];
            let y = cy + dir[1];
            if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
                continue;
            }
            result += (this._map[x][y] == 1 ? 1 : 0);
        }
        return result;
    }
    /**
     * Make sure every non-wall space is accessible.
     * @param {function} callback to call to display map when do
     * @param {int} value to consider empty space - defaults to 0
     * @param {function} callback to call when a new connection is made
     */
    connect(callback, value, connectionCallback) {
        if (!value)
            value = 0;
        let allFreeSpace = [];
        let notConnected = {};
        // find all free space
        let widthStep = 1;
        let widthStarts = [0, 0];
        if (this._options.topology == 6) {
            widthStep = 2;
            widthStarts = [0, 1];
        }
        for (let y = 0; y < this._height; y++) {
            for (let x = widthStarts[y % 2]; x < this._width; x += widthStep) {
                if (this._freeSpace(x, y, value)) {
                    let p = [x, y];
                    notConnected[this._pointKey(p)] = p;
                    allFreeSpace.push([x, y]);
                }
            }
        }
        let start = allFreeSpace[RNG$1.getUniformInt(0, allFreeSpace.length - 1)];
        let key = this._pointKey(start);
        let connected = {};
        connected[key] = start;
        delete notConnected[key];
        // find what's connected to the starting point
        this._findConnected(connected, notConnected, [start], false, value);
        while (Object.keys(notConnected).length > 0) {
            // find two points from notConnected to connected
            let p = this._getFromTo(connected, notConnected);
            let from = p[0]; // notConnected
            let to = p[1]; // connected
            // find everything connected to the starting point
            let local = {};
            local[this._pointKey(from)] = from;
            this._findConnected(local, notConnected, [from], true, value);
            // connect to a connected cell
            let tunnelFn = (this._options.topology == 6 ? this._tunnelToConnected6 : this._tunnelToConnected);
            tunnelFn.call(this, to, from, connected, notConnected, value, connectionCallback);
            // now all of local is connected
            for (let k in local) {
                let pp = local[k];
                this._map[pp[0]][pp[1]] = value;
                connected[k] = pp;
                delete notConnected[k];
            }
        }
        callback && this._serviceCallback(callback);
    }
    /**
     * Find random points to connect. Search for the closest point in the larger space.
     * This is to minimize the length of the passage while maintaining good performance.
     */
    _getFromTo(connected, notConnected) {
        let from = [0, 0], to = [0, 0], d;
        let connectedKeys = Object.keys(connected);
        let notConnectedKeys = Object.keys(notConnected);
        for (let i = 0; i < 5; i++) {
            if (connectedKeys.length < notConnectedKeys.length) {
                let keys = connectedKeys;
                to = connected[keys[RNG$1.getUniformInt(0, keys.length - 1)]];
                from = this._getClosest(to, notConnected);
            }
            else {
                let keys = notConnectedKeys;
                from = notConnected[keys[RNG$1.getUniformInt(0, keys.length - 1)]];
                to = this._getClosest(from, connected);
            }
            d = (from[0] - to[0]) * (from[0] - to[0]) + (from[1] - to[1]) * (from[1] - to[1]);
            if (d < 64) {
                break;
            }
        }
        // console.log(">>> connected=" + to + " notConnected=" + from + " dist=" + d);
        return [from, to];
    }
    _getClosest(point, space) {
        let minPoint = null;
        let minDist = null;
        for (let k in space) {
            let p = space[k];
            let d = (p[0] - point[0]) * (p[0] - point[0]) + (p[1] - point[1]) * (p[1] - point[1]);
            if (minDist == null || d < minDist) {
                minDist = d;
                minPoint = p;
            }
        }
        return minPoint;
    }
    _findConnected(connected, notConnected, stack, keepNotConnected, value) {
        while (stack.length > 0) {
            let p = stack.splice(0, 1)[0];
            let tests;
            if (this._options.topology == 6) {
                tests = [
                    [p[0] + 2, p[1]],
                    [p[0] + 1, p[1] - 1],
                    [p[0] - 1, p[1] - 1],
                    [p[0] - 2, p[1]],
                    [p[0] - 1, p[1] + 1],
                    [p[0] + 1, p[1] + 1],
                ];
            }
            else {
                tests = [
                    [p[0] + 1, p[1]],
                    [p[0] - 1, p[1]],
                    [p[0], p[1] + 1],
                    [p[0], p[1] - 1]
                ];
            }
            for (let i = 0; i < tests.length; i++) {
                let key = this._pointKey(tests[i]);
                if (connected[key] == null && this._freeSpace(tests[i][0], tests[i][1], value)) {
                    connected[key] = tests[i];
                    if (!keepNotConnected) {
                        delete notConnected[key];
                    }
                    stack.push(tests[i]);
                }
            }
        }
    }
    _tunnelToConnected(to, from, connected, notConnected, value, connectionCallback) {
        let a, b;
        if (from[0] < to[0]) {
            a = from;
            b = to;
        }
        else {
            a = to;
            b = from;
        }
        for (let xx = a[0]; xx <= b[0]; xx++) {
            this._map[xx][a[1]] = value;
            let p = [xx, a[1]];
            let pkey = this._pointKey(p);
            connected[pkey] = p;
            delete notConnected[pkey];
        }
        if (connectionCallback && a[0] < b[0]) {
            connectionCallback(a, [b[0], a[1]]);
        }
        // x is now fixed
        let x = b[0];
        if (from[1] < to[1]) {
            a = from;
            b = to;
        }
        else {
            a = to;
            b = from;
        }
        for (let yy = a[1]; yy < b[1]; yy++) {
            this._map[x][yy] = value;
            let p = [x, yy];
            let pkey = this._pointKey(p);
            connected[pkey] = p;
            delete notConnected[pkey];
        }
        if (connectionCallback && a[1] < b[1]) {
            connectionCallback([b[0], a[1]], [b[0], b[1]]);
        }
    }
    _tunnelToConnected6(to, from, connected, notConnected, value, connectionCallback) {
        let a, b;
        if (from[0] < to[0]) {
            a = from;
            b = to;
        }
        else {
            a = to;
            b = from;
        }
        // tunnel diagonally until horizontally level
        let xx = a[0];
        let yy = a[1];
        while (!(xx == b[0] && yy == b[1])) {
            let stepWidth = 2;
            if (yy < b[1]) {
                yy++;
                stepWidth = 1;
            }
            else if (yy > b[1]) {
                yy--;
                stepWidth = 1;
            }
            if (xx < b[0]) {
                xx += stepWidth;
            }
            else if (xx > b[0]) {
                xx -= stepWidth;
            }
            else if (b[1] % 2) {
                // Won't step outside map if destination on is map's right edge
                xx -= stepWidth;
            }
            else {
                // ditto for left edge
                xx += stepWidth;
            }
            this._map[xx][yy] = value;
            let p = [xx, yy];
            let pkey = this._pointKey(p);
            connected[pkey] = p;
            delete notConnected[pkey];
        }
        if (connectionCallback) {
            connectionCallback(from, to);
        }
    }
    _freeSpace(x, y, value) {
        return x >= 0 && x < this._width && y >= 0 && y < this._height && this._map[x][y] == value;
    }
    _pointKey(p) { return p[0] + "." + p[1]; }
}

const FEATURES = {
    "room": Room,
    "corridor": Corridor
};
/**
 * Random dungeon generator using human-like digging patterns.
 * Heavily based on Mike Anderson's ideas from the "Tyrant" algo, mentioned at
 * http://www.roguebasin.roguelikedevelopment.org/index.php?title=Dungeon-Building_Algorithm.
 */
class Digger extends Dungeon {
    constructor(width, height, options = {}) {
        super(width, height);
        this._options = Object.assign({
            roomWidth: [3, 9],
            roomHeight: [3, 5],
            corridorLength: [3, 10],
            dugPercentage: 0.2,
            timeLimit: 1000 /* we stop after this much time has passed (msec) */
        }, options);
        this._features = {
            "room": 4,
            "corridor": 4
        };
        this._map = [];
        this._featureAttempts = 20; /* how many times do we try to create a feature on a suitable wall */
        this._walls = {}; /* these are available for digging */
        this._dug = 0;
        this._digCallback = this._digCallback.bind(this);
        this._canBeDugCallback = this._canBeDugCallback.bind(this);
        this._isWallCallback = this._isWallCallback.bind(this);
        this._priorityWallCallback = this._priorityWallCallback.bind(this);
    }
    create(callback) {
        this._rooms = [];
        this._corridors = [];
        this._map = this._fillMap(1);
        this._walls = {};
        this._dug = 0;
        let area = (this._width - 2) * (this._height - 2);
        this._firstRoom();
        let t1 = Date.now();
        let priorityWalls;
        do {
            priorityWalls = 0;
            let t2 = Date.now();
            if (t2 - t1 > this._options.timeLimit) {
                break;
            }
            /* find a good wall */
            let wall = this._findWall();
            if (!wall) {
                break;
            } /* no more walls */
            let parts = wall.split(",");
            let x = parseInt(parts[0]);
            let y = parseInt(parts[1]);
            let dir = this._getDiggingDirection(x, y);
            if (!dir) {
                continue;
            } /* this wall is not suitable */
            //		console.log("wall", x, y);
            /* try adding a feature */
            let featureAttempts = 0;
            do {
                featureAttempts++;
                if (this._tryFeature(x, y, dir[0], dir[1])) { /* feature added */
                    //if (this._rooms.length + this._corridors.length == 2) { this._rooms[0].addDoor(x, y); } /* first room oficially has doors */
                    this._removeSurroundingWalls(x, y);
                    this._removeSurroundingWalls(x - dir[0], y - dir[1]);
                    break;
                }
            } while (featureAttempts < this._featureAttempts);
            for (let id in this._walls) {
                if (this._walls[id] > 1) {
                    priorityWalls++;
                }
            }
        } while (this._dug / area < this._options.dugPercentage || priorityWalls); /* fixme number of priority walls */
        this._addDoors();
        if (callback) {
            for (let i = 0; i < this._width; i++) {
                for (let j = 0; j < this._height; j++) {
                    callback(i, j, this._map[i][j]);
                }
            }
        }
        this._walls = {};
        this._map = [];
        return this;
    }
    _digCallback(x, y, value) {
        if (value == 0 || value == 2) { /* empty */
            this._map[x][y] = 0;
            this._dug++;
        }
        else { /* wall */
            this._walls[x + "," + y] = 1;
        }
    }
    _isWallCallback(x, y) {
        if (x < 0 || y < 0 || x >= this._width || y >= this._height) {
            return false;
        }
        return (this._map[x][y] == 1);
    }
    _canBeDugCallback(x, y) {
        if (x < 1 || y < 1 || x + 1 >= this._width || y + 1 >= this._height) {
            return false;
        }
        return (this._map[x][y] == 1);
    }
    _priorityWallCallback(x, y) { this._walls[x + "," + y] = 2; }
    ;
    _firstRoom() {
        let cx = Math.floor(this._width / 2);
        let cy = Math.floor(this._height / 2);
        let room = Room.createRandomCenter(cx, cy, this._options);
        this._rooms.push(room);
        room.create(this._digCallback);
    }
    /**
     * Get a suitable wall
     */
    _findWall() {
        let prio1 = [];
        let prio2 = [];
        for (let id in this._walls) {
            let prio = this._walls[id];
            if (prio == 2) {
                prio2.push(id);
            }
            else {
                prio1.push(id);
            }
        }
        let arr = (prio2.length ? prio2 : prio1);
        if (!arr.length) {
            return null;
        } /* no walls :/ */
        let id = RNG$1.getItem(arr.sort()); // sort to make the order deterministic
        delete this._walls[id];
        return id;
    }
    /**
     * Tries adding a feature
     * @returns {bool} was this a successful try?
     */
    _tryFeature(x, y, dx, dy) {
        let featureName = RNG$1.getWeightedValue(this._features);
        let ctor = FEATURES[featureName];
        let feature = ctor.createRandomAt(x, y, dx, dy, this._options);
        if (!feature.isValid(this._isWallCallback, this._canBeDugCallback)) {
            //		console.log("not valid");
            //		feature.debug();
            return false;
        }
        feature.create(this._digCallback);
        //	feature.debug();
        if (feature instanceof Room) {
            this._rooms.push(feature);
        }
        if (feature instanceof Corridor) {
            feature.createPriorityWalls(this._priorityWallCallback);
            this._corridors.push(feature);
        }
        return true;
    }
    _removeSurroundingWalls(cx, cy) {
        let deltas = DIRS[4];
        for (let i = 0; i < deltas.length; i++) {
            let delta = deltas[i];
            let x = cx + delta[0];
            let y = cy + delta[1];
            delete this._walls[x + "," + y];
            x = cx + 2 * delta[0];
            y = cy + 2 * delta[1];
            delete this._walls[x + "," + y];
        }
    }
    /**
     * Returns vector in "digging" direction, or false, if this does not exist (or is not unique)
     */
    _getDiggingDirection(cx, cy) {
        if (cx <= 0 || cy <= 0 || cx >= this._width - 1 || cy >= this._height - 1) {
            return null;
        }
        let result = null;
        let deltas = DIRS[4];
        for (let i = 0; i < deltas.length; i++) {
            let delta = deltas[i];
            let x = cx + delta[0];
            let y = cy + delta[1];
            if (!this._map[x][y]) { /* there already is another empty neighbor! */
                if (result) {
                    return null;
                }
                result = delta;
            }
        }
        /* no empty neighbor */
        if (!result) {
            return null;
        }
        return [-result[0], -result[1]];
    }
    /**
     * Find empty spaces surrounding rooms, and apply doors.
     */
    _addDoors() {
        let data = this._map;
        function isWallCallback(x, y) {
            return (data[x][y] == 1);
        }
        for (let i = 0; i < this._rooms.length; i++) {
            let room = this._rooms[i];
            room.clearDoors();
            room.addDoors(isWallCallback);
        }
    }
}

/**
 * Join lists with "i" and "i+1"
 */
function addToList(i, L, R) {
    R[L[i + 1]] = R[i];
    L[R[i]] = L[i + 1];
    R[i] = i + 1;
    L[i + 1] = i;
}
/**
 * Remove "i" from its list
 */
function removeFromList(i, L, R) {
    R[L[i]] = R[i];
    L[R[i]] = L[i];
    R[i] = i;
    L[i] = i;
}
/**
 * Maze generator - Eller's algorithm
 * See http://homepages.cwi.nl/~tromp/maze.html for explanation
 */
class EllerMaze extends Map {
    create(callback) {
        let map = this._fillMap(1);
        let w = Math.ceil((this._width - 2) / 2);
        let rand = 9 / 24;
        let L = [];
        let R = [];
        for (let i = 0; i < w; i++) {
            L.push(i);
            R.push(i);
        }
        L.push(w - 1); /* fake stop-block at the right side */
        let j;
        for (j = 1; j + 3 < this._height; j += 2) {
            /* one row */
            for (let i = 0; i < w; i++) {
                /* cell coords (will be always empty) */
                let x = 2 * i + 1;
                let y = j;
                map[x][y] = 0;
                /* right connection */
                if (i != L[i + 1] && RNG$1.getUniform() > rand) {
                    addToList(i, L, R);
                    map[x + 1][y] = 0;
                }
                /* bottom connection */
                if (i != L[i] && RNG$1.getUniform() > rand) {
                    /* remove connection */
                    removeFromList(i, L, R);
                }
                else {
                    /* create connection */
                    map[x][y + 1] = 0;
                }
            }
        }
        /* last row */
        for (let i = 0; i < w; i++) {
            /* cell coords (will be always empty) */
            let x = 2 * i + 1;
            let y = j;
            map[x][y] = 0;
            /* right connection */
            if (i != L[i + 1] && (i == L[i] || RNG$1.getUniform() > rand)) {
                /* dig right also if the cell is separated, so it gets connected to the rest of maze */
                addToList(i, L, R);
                map[x + 1][y] = 0;
            }
            removeFromList(i, L, R);
        }
        for (let i = 0; i < this._width; i++) {
            for (let j = 0; j < this._height; j++) {
                callback(i, j, map[i][j]);
            }
        }
        return this;
    }
}

/**
 * @class Recursively divided maze, http://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_division_method
 * @augments ROT.Map
 */
class DividedMaze extends Map {
    constructor() {
        super(...arguments);
        this._stack = [];
        this._map = [];
    }
    create(callback) {
        let w = this._width;
        let h = this._height;
        this._map = [];
        for (let i = 0; i < w; i++) {
            this._map.push([]);
            for (let j = 0; j < h; j++) {
                let border = (i == 0 || j == 0 || i + 1 == w || j + 1 == h);
                this._map[i].push(border ? 1 : 0);
            }
        }
        this._stack = [
            [1, 1, w - 2, h - 2]
        ];
        this._process();
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                callback(i, j, this._map[i][j]);
            }
        }
        this._map = [];
        return this;
    }
    _process() {
        while (this._stack.length) {
            let room = this._stack.shift(); /* [left, top, right, bottom] */
            this._partitionRoom(room);
        }
    }
    _partitionRoom(room) {
        let availX = [];
        let availY = [];
        for (let i = room[0] + 1; i < room[2]; i++) {
            let top = this._map[i][room[1] - 1];
            let bottom = this._map[i][room[3] + 1];
            if (top && bottom && !(i % 2)) {
                availX.push(i);
            }
        }
        for (let j = room[1] + 1; j < room[3]; j++) {
            let left = this._map[room[0] - 1][j];
            let right = this._map[room[2] + 1][j];
            if (left && right && !(j % 2)) {
                availY.push(j);
            }
        }
        if (!availX.length || !availY.length) {
            return;
        }
        let x = RNG$1.getItem(availX);
        let y = RNG$1.getItem(availY);
        this._map[x][y] = 1;
        let walls = [];
        let w = [];
        walls.push(w); /* left part */
        for (let i = room[0]; i < x; i++) {
            this._map[i][y] = 1;
            w.push([i, y]);
        }
        w = [];
        walls.push(w); /* right part */
        for (let i = x + 1; i <= room[2]; i++) {
            this._map[i][y] = 1;
            w.push([i, y]);
        }
        w = [];
        walls.push(w); /* top part */
        for (let j = room[1]; j < y; j++) {
            this._map[x][j] = 1;
            w.push([x, j]);
        }
        w = [];
        walls.push(w); /* bottom part */
        for (let j = y + 1; j <= room[3]; j++) {
            this._map[x][j] = 1;
            w.push([x, j]);
        }
        let solid = RNG$1.getItem(walls);
        for (let i = 0; i < walls.length; i++) {
            let w = walls[i];
            if (w == solid) {
                continue;
            }
            let hole = RNG$1.getItem(w);
            this._map[hole[0]][hole[1]] = 0;
        }
        this._stack.push([room[0], room[1], x - 1, y - 1]); /* left top */
        this._stack.push([x + 1, room[1], room[2], y - 1]); /* right top */
        this._stack.push([room[0], y + 1, x - 1, room[3]]); /* left bottom */
        this._stack.push([x + 1, y + 1, room[2], room[3]]); /* right bottom */
    }
}

/**
 * Icey's Maze generator
 * See http://www.roguebasin.roguelikedevelopment.org/index.php?title=Simple_maze for explanation
 */
class IceyMaze extends Map {
    constructor(width, height, regularity = 0) {
        super(width, height);
        this._regularity = regularity;
        this._map = [];
    }
    create(callback) {
        let width = this._width;
        let height = this._height;
        let map = this._fillMap(1);
        width -= (width % 2 ? 1 : 2);
        height -= (height % 2 ? 1 : 2);
        let cx = 0;
        let cy = 0;
        let nx = 0;
        let ny = 0;
        let done = 0;
        let blocked = false;
        let dirs = [
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0]
        ];
        do {
            cx = 1 + 2 * Math.floor(RNG$1.getUniform() * (width - 1) / 2);
            cy = 1 + 2 * Math.floor(RNG$1.getUniform() * (height - 1) / 2);
            if (!done) {
                map[cx][cy] = 0;
            }
            if (!map[cx][cy]) {
                this._randomize(dirs);
                do {
                    if (Math.floor(RNG$1.getUniform() * (this._regularity + 1)) == 0) {
                        this._randomize(dirs);
                    }
                    blocked = true;
                    for (let i = 0; i < 4; i++) {
                        nx = cx + dirs[i][0] * 2;
                        ny = cy + dirs[i][1] * 2;
                        if (this._isFree(map, nx, ny, width, height)) {
                            map[nx][ny] = 0;
                            map[cx + dirs[i][0]][cy + dirs[i][1]] = 0;
                            cx = nx;
                            cy = ny;
                            blocked = false;
                            done++;
                            break;
                        }
                    }
                } while (!blocked);
            }
        } while (done + 1 < width * height / 4);
        for (let i = 0; i < this._width; i++) {
            for (let j = 0; j < this._height; j++) {
                callback(i, j, map[i][j]);
            }
        }
        this._map = [];
        return this;
    }
    _randomize(dirs) {
        for (let i = 0; i < 4; i++) {
            dirs[i][0] = 0;
            dirs[i][1] = 0;
        }
        switch (Math.floor(RNG$1.getUniform() * 4)) {
            case 0:
                dirs[0][0] = -1;
                dirs[1][0] = 1;
                dirs[2][1] = -1;
                dirs[3][1] = 1;
                break;
            case 1:
                dirs[3][0] = -1;
                dirs[2][0] = 1;
                dirs[1][1] = -1;
                dirs[0][1] = 1;
                break;
            case 2:
                dirs[2][0] = -1;
                dirs[3][0] = 1;
                dirs[0][1] = -1;
                dirs[1][1] = 1;
                break;
            case 3:
                dirs[1][0] = -1;
                dirs[0][0] = 1;
                dirs[3][1] = -1;
                dirs[2][1] = 1;
                break;
        }
    }
    _isFree(map, x, y, width, height) {
        if (x < 1 || y < 1 || x >= width || y >= height) {
            return false;
        }
        return map[x][y];
    }
}

/**
 * Dungeon generator which uses the "orginal" Rogue dungeon generation algorithm. See http://kuoi.com/~kamikaze/GameDesign/art07_rogue_dungeon.php
 * @author hyakugei
 */
class Rogue extends Map {
    constructor(width, height, options) {
        super(width, height);
        this.map = [];
        this.rooms = [];
        this.connectedCells = [];
        options = Object.assign({
            cellWidth: 3,
            cellHeight: 3 //     ie. as an array with min-max values for each direction....
        }, options);
        /*
        Set the room sizes according to the over-all width of the map,
        and the cell sizes.
        */
        if (!options.hasOwnProperty("roomWidth")) {
            options["roomWidth"] = this._calculateRoomSize(this._width, options["cellWidth"]);
        }
        if (!options.hasOwnProperty("roomHeight")) {
            options["roomHeight"] = this._calculateRoomSize(this._height, options["cellHeight"]);
        }
        this._options = options;
    }
    create(callback) {
        this.map = this._fillMap(1);
        this.rooms = [];
        this.connectedCells = [];
        this._initRooms();
        this._connectRooms();
        this._connectUnconnectedRooms();
        this._createRandomRoomConnections();
        this._createRooms();
        this._createCorridors();
        if (callback) {
            for (let i = 0; i < this._width; i++) {
                for (let j = 0; j < this._height; j++) {
                    callback(i, j, this.map[i][j]);
                }
            }
        }
        return this;
    }
    _calculateRoomSize(size, cell) {
        let max = Math.floor((size / cell) * 0.8);
        let min = Math.floor((size / cell) * 0.25);
        if (min < 2) {
            min = 2;
        }
        if (max < 2) {
            max = 2;
        }
        return [min, max];
    }
    _initRooms() {
        // create rooms array. This is the "grid" list from the algo.
        for (let i = 0; i < this._options.cellWidth; i++) {
            this.rooms.push([]);
            for (let j = 0; j < this._options.cellHeight; j++) {
                this.rooms[i].push({ "x": 0, "y": 0, "width": 0, "height": 0, "connections": [], "cellx": i, "celly": j });
            }
        }
    }
    _connectRooms() {
        //pick random starting grid
        let cgx = RNG$1.getUniformInt(0, this._options.cellWidth - 1);
        let cgy = RNG$1.getUniformInt(0, this._options.cellHeight - 1);
        let idx;
        let ncgx;
        let ncgy;
        let found = false;
        let room;
        let otherRoom;
        let dirToCheck;
        // find  unconnected neighbour cells
        do {
            //dirToCheck = [0, 1, 2, 3, 4, 5, 6, 7];
            dirToCheck = [0, 2, 4, 6];
            dirToCheck = RNG$1.shuffle(dirToCheck);
            do {
                found = false;
                idx = dirToCheck.pop();
                ncgx = cgx + DIRS[8][idx][0];
                ncgy = cgy + DIRS[8][idx][1];
                if (ncgx < 0 || ncgx >= this._options.cellWidth) {
                    continue;
                }
                if (ncgy < 0 || ncgy >= this._options.cellHeight) {
                    continue;
                }
                room = this.rooms[cgx][cgy];
                if (room["connections"].length > 0) {
                    // as long as this room doesn't already coonect to me, we are ok with it.
                    if (room["connections"][0][0] == ncgx && room["connections"][0][1] == ncgy) {
                        break;
                    }
                }
                otherRoom = this.rooms[ncgx][ncgy];
                if (otherRoom["connections"].length == 0) {
                    otherRoom["connections"].push([cgx, cgy]);
                    this.connectedCells.push([ncgx, ncgy]);
                    cgx = ncgx;
                    cgy = ncgy;
                    found = true;
                }
            } while (dirToCheck.length > 0 && found == false);
        } while (dirToCheck.length > 0);
    }
    _connectUnconnectedRooms() {
        //While there are unconnected rooms, try to connect them to a random connected neighbor
        //(if a room has no connected neighbors yet, just keep cycling, you'll fill out to it eventually).
        let cw = this._options.cellWidth;
        let ch = this._options.cellHeight;
        this.connectedCells = RNG$1.shuffle(this.connectedCells);
        let room;
        let otherRoom;
        let validRoom;
        for (let i = 0; i < this._options.cellWidth; i++) {
            for (let j = 0; j < this._options.cellHeight; j++) {
                room = this.rooms[i][j];
                if (room["connections"].length == 0) {
                    let directions = [0, 2, 4, 6];
                    directions = RNG$1.shuffle(directions);
                    validRoom = false;
                    do {
                        let dirIdx = directions.pop();
                        let newI = i + DIRS[8][dirIdx][0];
                        let newJ = j + DIRS[8][dirIdx][1];
                        if (newI < 0 || newI >= cw || newJ < 0 || newJ >= ch) {
                            continue;
                        }
                        otherRoom = this.rooms[newI][newJ];
                        validRoom = true;
                        if (otherRoom["connections"].length == 0) {
                            break;
                        }
                        for (let k = 0; k < otherRoom["connections"].length; k++) {
                            if (otherRoom["connections"][k][0] == i && otherRoom["connections"][k][1] == j) {
                                validRoom = false;
                                break;
                            }
                        }
                        if (validRoom) {
                            break;
                        }
                    } while (directions.length);
                    if (validRoom) {
                        room["connections"].push([otherRoom["cellx"], otherRoom["celly"]]);
                    }
                    else {
                        console.log("-- Unable to connect room.");
                    }
                }
            }
        }
    }
    _createRandomRoomConnections() {
        // Empty for now.
    }
    _createRooms() {
        let w = this._width;
        let h = this._height;
        let cw = this._options.cellWidth;
        let ch = this._options.cellHeight;
        let cwp = Math.floor(this._width / cw);
        let chp = Math.floor(this._height / ch);
        let roomw;
        let roomh;
        let roomWidth = this._options["roomWidth"];
        let roomHeight = this._options["roomHeight"];
        let sx;
        let sy;
        let otherRoom;
        for (let i = 0; i < cw; i++) {
            for (let j = 0; j < ch; j++) {
                sx = cwp * i;
                sy = chp * j;
                if (sx == 0) {
                    sx = 1;
                }
                if (sy == 0) {
                    sy = 1;
                }
                roomw = RNG$1.getUniformInt(roomWidth[0], roomWidth[1]);
                roomh = RNG$1.getUniformInt(roomHeight[0], roomHeight[1]);
                if (j > 0) {
                    otherRoom = this.rooms[i][j - 1];
                    while (sy - (otherRoom["y"] + otherRoom["height"]) < 3) {
                        sy++;
                    }
                }
                if (i > 0) {
                    otherRoom = this.rooms[i - 1][j];
                    while (sx - (otherRoom["x"] + otherRoom["width"]) < 3) {
                        sx++;
                    }
                }
                let sxOffset = Math.round(RNG$1.getUniformInt(0, cwp - roomw) / 2);
                let syOffset = Math.round(RNG$1.getUniformInt(0, chp - roomh) / 2);
                while (sx + sxOffset + roomw >= w) {
                    if (sxOffset) {
                        sxOffset--;
                    }
                    else {
                        roomw--;
                    }
                }
                while (sy + syOffset + roomh >= h) {
                    if (syOffset) {
                        syOffset--;
                    }
                    else {
                        roomh--;
                    }
                }
                sx = sx + sxOffset;
                sy = sy + syOffset;
                this.rooms[i][j]["x"] = sx;
                this.rooms[i][j]["y"] = sy;
                this.rooms[i][j]["width"] = roomw;
                this.rooms[i][j]["height"] = roomh;
                for (let ii = sx; ii < sx + roomw; ii++) {
                    for (let jj = sy; jj < sy + roomh; jj++) {
                        this.map[ii][jj] = 0;
                    }
                }
            }
        }
    }
    _getWallPosition(aRoom, aDirection) {
        let rx;
        let ry;
        let door;
        if (aDirection == 1 || aDirection == 3) {
            rx = RNG$1.getUniformInt(aRoom["x"] + 1, aRoom["x"] + aRoom["width"] - 2);
            if (aDirection == 1) {
                ry = aRoom["y"] - 2;
                door = ry + 1;
            }
            else {
                ry = aRoom["y"] + aRoom["height"] + 1;
                door = ry - 1;
            }
            this.map[rx][door] = 0; // i'm not setting a specific 'door' tile value right now, just empty space.
        }
        else {
            ry = RNG$1.getUniformInt(aRoom["y"] + 1, aRoom["y"] + aRoom["height"] - 2);
            if (aDirection == 2) {
                rx = aRoom["x"] + aRoom["width"] + 1;
                door = rx - 1;
            }
            else {
                rx = aRoom["x"] - 2;
                door = rx + 1;
            }
            this.map[door][ry] = 0; // i'm not setting a specific 'door' tile value right now, just empty space.
        }
        return [rx, ry];
    }
    _drawCorridor(startPosition, endPosition) {
        let xOffset = endPosition[0] - startPosition[0];
        let yOffset = endPosition[1] - startPosition[1];
        let xpos = startPosition[0];
        let ypos = startPosition[1];
        let tempDist;
        let xDir;
        let yDir;
        let move; // 2 element array, element 0 is the direction, element 1 is the total value to move.
        let moves = []; // a list of 2 element arrays
        let xAbs = Math.abs(xOffset);
        let yAbs = Math.abs(yOffset);
        let percent = RNG$1.getUniform(); // used to split the move at different places along the long axis
        let firstHalf = percent;
        let secondHalf = 1 - percent;
        xDir = xOffset > 0 ? 2 : 6;
        yDir = yOffset > 0 ? 4 : 0;
        if (xAbs < yAbs) {
            // move firstHalf of the y offset
            tempDist = Math.ceil(yAbs * firstHalf);
            moves.push([yDir, tempDist]);
            // move all the x offset
            moves.push([xDir, xAbs]);
            // move sendHalf of the  y offset
            tempDist = Math.floor(yAbs * secondHalf);
            moves.push([yDir, tempDist]);
        }
        else {
            //  move firstHalf of the x offset
            tempDist = Math.ceil(xAbs * firstHalf);
            moves.push([xDir, tempDist]);
            // move all the y offset
            moves.push([yDir, yAbs]);
            // move secondHalf of the x offset.
            tempDist = Math.floor(xAbs * secondHalf);
            moves.push([xDir, tempDist]);
        }
        this.map[xpos][ypos] = 0;
        while (moves.length > 0) {
            move = moves.pop();
            while (move[1] > 0) {
                xpos += DIRS[8][move[0]][0];
                ypos += DIRS[8][move[0]][1];
                this.map[xpos][ypos] = 0;
                move[1] = move[1] - 1;
            }
        }
    }
    _createCorridors() {
        // Draw Corridors between connected rooms
        let cw = this._options.cellWidth;
        let ch = this._options.cellHeight;
        let room;
        let connection;
        let otherRoom;
        let wall;
        let otherWall;
        for (let i = 0; i < cw; i++) {
            for (let j = 0; j < ch; j++) {
                room = this.rooms[i][j];
                for (let k = 0; k < room["connections"].length; k++) {
                    connection = room["connections"][k];
                    otherRoom = this.rooms[connection[0]][connection[1]];
                    // figure out what wall our corridor will start one.
                    // figure out what wall our corridor will end on.
                    if (otherRoom["cellx"] > room["cellx"]) {
                        wall = 2;
                        otherWall = 4;
                    }
                    else if (otherRoom["cellx"] < room["cellx"]) {
                        wall = 4;
                        otherWall = 2;
                    }
                    else if (otherRoom["celly"] > room["celly"]) {
                        wall = 3;
                        otherWall = 1;
                    }
                    else {
                        wall = 1;
                        otherWall = 3;
                    }
                    this._drawCorridor(this._getWallPosition(room, wall), this._getWallPosition(otherRoom, otherWall));
                }
            }
        }
    }
}

var index = { Arena, Uniform, Cellular, Digger, EllerMaze, DividedMaze, IceyMaze, Rogue };

const Util = util;

var _a;
var W = 25;
var H = 25;
var FONT_SIZE = 16;
var w = ((_a = window.parent) === null || _a === void 0 ? void 0 : _a.window) || window;
var display = new Display({
    width: W,
    height: H,
    fontSize: FONT_SIZE,
    forceSquareRatio: true
});
var text_display = new Display({
    width: W,
    height: 12,
    fontSize: FONT_SIZE
});
var appElem = document.createElement("div");
document.body.appendChild(appElem);
appElem.appendChild(display.getContainer());
appElem.appendChild(text_display.getContainer());
var _b = createLinkGenerator(appElem), textAreaElem = _b[0], btnElem = _b[1], anchorElem = _b[2];
(function (body, el, txt, btn, a, d) {
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
    txt.placeholder = "Put your text here and press \"Generate link\" to... you know... generate link.";
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
    d.style.border = "1px solid white";
    d.style.display = "block";
    d.style.margin = "5px auto";
})(document.body, appElem, textAreaElem, btnElem, anchorElem, display.getContainer());
// Units
var player = {
    id: 0,
    x: 0,
    y: 0,
};
var npc = {
    id: 1,
    x: 20,
    y: 20,
};
// Utils
function drawSolids(s) {
    s.solids.forEach(function (s) {
        display.draw(s.x, s.y, "#", "green", "");
    });
}
function createLogger(l) {
    return function (s) {
        l.addLine(Util.capitalize(s));
    };
}
function createPathCheckFunction(checks) {
    return function (x, y) {
        return checks.map(function (e) { return e(x, y); }).every(function (e) { return e === true; });
    };
}
function getQuery(key) {
    var msgValue = function (s) {
        var keyValue = s.split('=');
        return keyValue[0] === key && keyValue[1];
    };
    return w.location.search
        .replace('?', '')
        .split('&')
        .map(function (s) { return msgValue(s); })
        .filter(function (e) { return e; })[0];
}
function b64EncodeUnicode(s) {
    return btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, function (match, p1) { return String.fromCharCode(Number('0x' + p1)); }));
}
function b64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}
function createLinkGenerator(h) {
    var textarea = document.createElement('textarea');
    var href = document.createElement("a");
    var btn = document.createElement("button");
    btn.innerHTML = "Generate link";
    btn.addEventListener('click', function () {
        game2LinkGenerated(textarea.value);
        function urlGen() {
            if (/\?/.test(window.location.href) && !/msg\=/.test(window.location.href)) {
                return w.location.href + "&msg=" + b64EncodeUnicode(textarea.value);
            }
            else if (/msg\=/.test(window.location.href)) {
                return w.location.href.replace(/msg\=.+?(\&|$)/, "msg=" + b64EncodeUnicode(textarea.value));
            }
            else {
                return w.location.href + "?msg=" + b64EncodeUnicode(textarea.value);
            }
        }
        var url = urlGen();
        href.setAttribute("href", url);
        href.innerHTML = url;
    });
    h.appendChild(textarea);
    h.appendChild(btn);
    h.appendChild(href);
    return [textarea, btn, href];
}
// Analytics
function game2Played(text_value, referrer) {
    fetch('https://maker.ifttt.com/trigger/game2_played/with/key/b-votWvDhYNP9mE7bK2vTk?value1='
        + text_value
        + "&value2="
        + referrer);
}
function game2LinkGenerated(text_value) {
    fetch('https://maker.ifttt.com/trigger/game2_link_generated/with/key/b-votWvDhYNP9mE7bK2vTk?value1=' + text_value);
}
// Creators
var Decoder = /** @class */ (function () {
    function Decoder(s) {
        this.value = "You Win!";
        if (s) {
            this.value = b64DecodeUnicode(s).replace(/\n/g, " ");
        }
    }
    return Decoder;
}());
var Counter = /** @class */ (function () {
    function Counter() {
        this.i = 0;
    }
    Counter.prototype.add = function () {
        this.i = this.i + 1;
    };
    return Counter;
}());
var Console = /** @class */ (function () {
    function Console(d) {
        this.lines = [];
        this.d = d;
    }
    Console.prototype.addLine = function (s) {
        this.lines.push(s);
        this.update();
    };
    Console.prototype.update = function () {
        var _this = this;
        this.d.clear();
        this.lines
            .sort(function (a, b) { return b.length - a.length; })
            .slice(0, 10)
            .forEach(function (s, i) {
            _this.d.drawText(1, 1 + i, s);
        });
    };
    Console.prototype.clear = function () {
        this.lines = [];
    };
    return Console;
}());
function createSolids() {
    return {
        solids: [],
        add: function (x, y) {
            this.solids.push({ x: x, y: y });
        },
        is: function (x, y) {
            return this.solids.filter(function (o) { return o.x === x && o.y === y; }).length > 0;
        },
        not: function (x, y) {
            return this.solids.filter(function (o) { return o.x === x && o.y === y; }).length === 0;
        },
    };
}
function createDrawEvents(d) {
    return {
        events: {},
        add: function (x, y, s, f, b) {
            if (!this.events[x + ',' + y]) {
                this.events[x + ',' + y] = [x, y, [], [], []];
            }
            s && this.events[x + ',' + y][2].push(s);
            f && this.events[x + ',' + y][3].push(f);
            b && this.events[x + ',' + y][4].push(b);
        },
        draw: function () {
            var events = this.events;
            d.clear();
            drawSolids(solids);
            for (var key in events) {
                if (events.hasOwnProperty(key)) {
                    var e = events[key];
                    d.draw(e[0], e[1], e[2], e[3], e[4]);
                }
            }
            this.events = {};
        }
    };
}
function createCharController(d, dEv) {
    return {
        walk: function (dir, pl, canWalkFunc) {
            // Unpure using `nCounter`, `nDecoder`, `npc` variables
            var x = pl.x, y = pl.y;
            var dOptions = {
                "left": [x - 1, y],
                "right": [x + 1, y],
                "up": [x, y - 1],
                "down": [x, y + 1],
            };
            var checks = function (d) {
                return canWalkFunc.apply(void 0, dOptions[d]);
            };
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
                sendLog("" + nDecoder.value.slice(0, nCounter.i));
            }
            // Unpure usage of `npc` variable
            if (pl.x === npc.x && pl.y === npc.y) {
                collidedWithNPC();
            }
            // Unpure usage of `npc` variable
            npcTick(npc);
            dEv.draw();
            if (nDecoder.value.length === nCounter.i) {
                finishGame(log, nDecoder.value);
            }
        }
    };
}
function createEdgeChecker(minx, miny, maxx, maxy) {
    return function (x, y) {
        return x <= maxx - 1
            && x >= minx
            && y <= maxy - 1
            && y >= miny;
    };
}
function finishGame(l, text) {
    l.clear();
    l.addLine("Your message is: \"" + text + "\"");
    display.clear();
}
// Initalization
var log = new Console(text_display);
var sendLog = createLogger(log);
var drawEvents = createDrawEvents(display);
var solids = createSolids();
var char = createCharController(display, drawEvents);
var notEdge = createEdgeChecker(0, 0, W, H);
var isWalkable = createPathCheckFunction([solids.not.bind(solids), notEdge]);
var nCounter = new Counter();
var nDecoder = new Decoder(getQuery('msg'));
game2Played(nDecoder.value, document.referrer);
// Map Generation
function generateMap() {
    var map = new index.Cellular(W, H);
    solids.solids = [];
    map.randomize(0.5);
    map.create();
    map.connect(null, 0);
    map.create();
    map.connect(function (x, y, wall) {
        wall && solids.add(x, y);
    }, 0, null);
}
generateMap();
drawSolids(solids);
// Movement
function npcTick(n) {
    if (isWalkable(n.x, n.y)) {
        drawEvents.add(n.x, n.y, n.icon || nDecoder.value[0] || "N", "yellow", "black");
        // const astar = new ROT.Path.AStar(player.x, player.y, isWalkable, {topology: 4});
        // astar.compute(n.x, n.y, (x, y) => {
        //   drawEvents.add(x, y, "", "", "rgb(133, 133, 133, 0.5)");
        // });
    }
    else {
        npcRandomMove(n);
        npcTick(n);
    }
}
function npcRandomMove(n) {
    n.x = Math.round(RNG$1.getNormal(0, W));
    n.y = Math.round(RNG$1.getNormal(0, H));
}
// Input handling
var move = "";
function step() {
    move && char.walk(move, player, isWalkable);
    setTimeout(function () { return window.requestAnimationFrame(step); }, 50);
}
window.requestAnimationFrame(step);
document.addEventListener("keydown", function (e) {
    var _a = KEYS, VK_W = _a.VK_W, VK_S = _a.VK_S, VK_A = _a.VK_A, VK_D = _a.VK_D;
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
