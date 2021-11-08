import {nouns, verbs, adjectives, adverbs, prepositions} from "../js/data.js";

const px = v => `${Number.parseFloat(v)}px`;
const pn = v => Number.parseFloat(v);
const cap = s => s[0].toUpperCase() + s.slice(1);
const revCoord = coord => ({x: -coord.x, y: -coord.y});
const containerPadding = "4px";
const convertDir = dir => `${dir.y === 0 ? "" : dir.y > 0 ? "s" : "n"}${dir.x === 0 ? "" : dir.x > 0 ? "e" : "w"}`;

let dragLock = {element: undefined};
let dragOffset = {x: 0, y: 0};
let resizeLock = {element: undefined, resizeDir: {x: 0, y: 0}};


function calRelativeCorner(coord, newspaperElement, corner) {
    const {x, y} = newspaperElement.getOffsetPosition();
    const {width, height} = newspaperElement.getClientSize();
    return {
        x: coord.x - x + (corner.x - 1) * width / 2 ,
        y: coord.y - y + (corner.y - 1) * height / 2
    }
}

/**
 * Calculate mouse's relative position to the center of an element
 * @param mouseEvent The MouseEvent object
 */
 function calRelativeCenter(coord, newspaperElement) {
    return calRelativeCorner(coord, newspaperElement, {x: 0, y: 0});
}

/**
 * Check if a point is within a circle
 * They should be under the same coordinate system
 */
function checkCircle(boundCoord, boundRadius, testPoint) {
    return Math.abs(boundCoord.x - testPoint.x) < boundRadius && Math.abs(boundCoord.y - testPoint.y) < boundRadius;
}

/**
 * Calculate which corner a point is located at
 */
function checkAtCorners(testPoint, newspaperElement, horizontal, vertical) {
    const {width, height} = newspaperElement.getClientSize();
    let relativeCoord = calRelativeCenter(testPoint, newspaperElement);

    for(let i = -1; i <= 1; i++) {
        for(let j = -1; j <= 1; j++) {
            let corner = {x:  width * i / 2, y: height * j / 2};
            // indicate corners by -1 and 1
            if(checkCircle(corner, (width + height) / 16, relativeCoord)) return {
                x: horizontal ? i : 0,
                y: vertical ? j : 0
            };
        }
    }
    return {
        x: 0,
        y: 0
    }
}

function createElement(className) {
    let element = document.createElement("div");
    element.classList.add(className);
    return element;
}

function pickOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function optional(cb, prob) {
    return (prob < Math.random()) ? cb() + " " : "";
}

function generateSentence() {
    return cap(`${optional(()=>pickOne(adjectives), 0.5)}${pickOne(nouns)} ${optional(()=>pickOne(adverbs), 0.5)}${pickOne(verbs)} ${optional(()=>pickOne(adjectives), 0.5)}${pickOne(nouns)}. `);
}

function makeDraggable(newspaperElement) {
    newspaperElement.container.classList.add("draggable");

    newspaperElement.container.addEventListener("mousedown", (e) => {
        dragOffset = revCoord(calRelativeCenter({x: e.pageX, y: e.pageY}, newspaperElement));
        dragLock.element = newspaperElement;
    });
}

function makeResizable(newspaperElement, horizontal = true, vertical = true) {
    let element = newspaperElement.el();

    newspaperElement.container.addEventListener("mousemove", (e) => {
        let corner = checkAtCorners({x: e.pageX, y: e.pageY}, newspaperElement, horizontal, vertical);
        newspaperElement.container.style.cursor = (corner.x | corner.y !== 0) ? `${convertDir(corner)}-resize` : "";
    });

    element.addEventListener("mousedown", (e) => {
        let corner = checkAtCorners({x: e.pageX, y: e.pageY}, newspaperElement, horizontal, vertical);
        if(corner.x | corner.y) {
            console.log("trig");
            // If we are not at the origin
            resizeLock.element = newspaperElement;
            resizeLock.resizeDir = corner;
            newspaperElement.container.style.width = "1px";
            newspaperElement.container.style.height = "1px";
        }
    });

    return newspaperElement;
}

document.addEventListener("mousemove", (e) => {
    const coord = {x: e.pageX, y: e.pageY};

    if(resizeLock.element) {
        let relPos = calRelativeCorner(
            coord, resizeLock.element, resizeLock.resizeDir
        );
        resizeLock.element.setSize({
            width: resizeLock.resizeDir.x !== 0 ? relPos.x : undefined,
            height: resizeLock.resizeDir.y !== 0 ? relPos.y : undefined
        });
    }
    // We prioritize resize to drag
    else if(dragLock.element){
        let {width, height} = dragLock.element.getClientSize();
        dragLock.element.move({
            x: coord.x - width / 2 + dragOffset.x,
            y: coord.y - height / 2 + dragOffset.y,
        });
    }
});

document.addEventListener("mouseup", (e) => {
    if(dragLock.element) {
        dragLock.element = undefined;
    }
    if(resizeLock.element) {
        resizeLock.element.fitContainer();
        resizeLock.element = undefined;
    }
});

function makeDeletable(newspaperElement) {
    
}

class NewspaperElement {
    constructor(className, parent, drag = true) {
        this.anchor = {fromRight: false, fromBot: false};
        this.element = createElement(className);
        this.container = createElement("container");
        this.container.appendChild(this.element);
        parent.appendChild(this.container);
        drag && makeDraggable(this);
    }

    el() {
        return this.element;
    }

    move(coord) {
        if(coord.x !== undefined) this.container.style.left = px(coord.x);
        if(coord.y !== undefined) this.container.style.top = px(coord.y);
        return this;
    }

    relmove(coord) {
        const {x, y} = this.getPosition();
        return this.move({
            x: (coord.x !== undefined) ? px(x  + coord.x) : undefined,
            y: (coord.y !== undefined) ? px(y  + coord.y) : undefined
        });
    }

    getSize() {
        return {
            width: Number.parseInt(this.el().style.width) || 0,
            height: Number.parseInt(this.el().style.height) || 0,
        }
    }

    getClientSize() {
        return {
            width: pn(this.el().clientWidth),
            height: pn(this.el().clientHeight)
        }
    }

    getPosition() {
        return {
            x: pn(this.container.style.left),
            y: pn(this.container.style.top)
        }
    }

    getOffsetPosition() {
        return {
            x: this.container.offsetLeft,
            y: this.container.offsetTop
        };
    }

    setSize(size) {
        size.width !== undefined && this.setWidth(size.width);
        size.height !== undefined && this.setHeight(size.height);
        return this;
    }

    setWidth(width) {
        this.reanchor({fromRight: (width < 0)});
        this.element.style.width = px(Math.abs(width));
        return this;
    }

    setHeight(height) {
        this.reanchor({fromBot: (height < 0)});
        this.element.style.height = px(Math.abs(height));
        return this;
    }

    fitContainer() {
        let {width, height} = this.getClientSize();
        if(this.anchor.fromRight) {
            this.relmove({x: -width});
        };
        if(this.anchor.fromBot) {
            this.relmove({y: -height});
        };
        this.container.style.width = px(width);
        this.container.style.height = px(height);
        this.reanchor({fromRight: false, fromBot: false});

        return this;
    }

    reanchor(anchor) {
        if(anchor.fromRight !== undefined && anchor.fromRight !== this.anchor.fromRight) {
            this.element.style.left = anchor.fromRight ? "" : containerPadding;
            this.element.style.right = anchor.fromRight ? containerPadding : "";
        }
        if(anchor.fromBot !== undefined && anchor.fromBot !== this.anchor.fromBot) {
            this.element.style.top = anchor.fromBot ? "" : containerPadding;
            this.element.style.bottom = anchor.fromBot ? containerPadding : "";
        }
        this.anchor = anchor;
        return this;
    }

    remove() {
        this.container.remove();
    }
}

function bindClick(btn, cb) {
    document.getElementById(btn).addEventListener("click", cb);
}

function setupDrawline(btn, isHorizontal) {
    const container = document.getElementById("container");
    const cutoff = 20;

    let origPos, line;
    let isDrawing = false;
    let enableDrawing = false;

    bindClick(btn, () => {
        enableDrawing = !enableDrawing;
        if(!enableDrawing && isDrawing) {
            isDrawing = false;
            line && line.remove();
        }
    });

    document.addEventListener("mousedown", (e) => {
        if(enableDrawing) {
            isDrawing = true;
            origPos = {x: e.pageX, y: e.pageY};
            line = new NewspaperElement("line", container, false);
            line.move(origPos);
        }
    });

    document.addEventListener("mousemove", (e) => {
        if(enableDrawing && isDrawing) {
            let length = isHorizontal ? e.pageX - origPos.x : (e.pageY - origPos.y);
            line.setSize(isHorizontal ? {width: length} : {height: length});
            line.el().style.border = `0.5px ${Math.abs(length) < cutoff ? "red" : "black"} solid`;
        }
    });

    document.addEventListener("mouseup", (e) => {
        if(enableDrawing && isDrawing) {
            let size = line.getSize();
            if((isHorizontal && size.width < cutoff) || (!isHorizontal && size.height < cutoff)) {
                line.remove();
            }
            else {
                line.fitContainer();
                makeDraggable(line);
                makeResizable(line, isHorizontal, !isHorizontal);
            }
            isDrawing = false;
        }
    });
}

function setup() {
    const container = document.getElementById("container");

    bindClick("btn-textbox", () => {
        makeResizable(new NewspaperElement("textbox", container).fitContainer());
    });

    bindClick("btn-imgbox", () => {
        makeResizable(new NewspaperElement("imgbox", container).fitContainer());
    });

    setupDrawline("btn-drawline-vert", false);
    setupDrawline("btn-drawline-hor", true);
}

function draw() {
    const duration = 1000;
    const msInterval = 10;

    let timeElapsed = 0;
    let textBoxes = document.getElementsByClassName("textbox");
    let imgBoxes = document.getElementsByClassName("imgbox");

    let interval = setInterval(() => {
        try {
            for(let ele of textBoxes){
                ele.innerHTML += generateSentence();
            }
        }
        finally {
            timeElapsed+=msInterval;
            if(timeElapsed >= duration) clearInterval(interval);
        }
    }, msInterval);
}

setup();
