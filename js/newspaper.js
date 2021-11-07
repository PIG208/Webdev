const px = v => `${Number.parseFloat(v)}px`;
const pn = v => Number.parseFloat(v);
const containerPadding = "5px";

let dragLock = undefined;
let dragOffset = {x: 0, y: 0};

function createElement(className) {
    let element = document.createElement("div");
    element.classList.add(className);
    return element;
}

function makeDraggable(newspaperElement) {
    const dragBg = "rgba(100, 100, 100, 0.5)";

    let dragging = false;
    let element = newspaperElement.el();
    let elementBg = element.style.background;
    newspaperElement.container.classList.add("draggable");

    newspaperElement.container.addEventListener("mousedown", (e) => {
        dragOffset.x = newspaperElement.container.offsetLeft  + Number.parseInt(element.clientWidth) / 2 - e.pageX;
        dragOffset.y = newspaperElement.container.offsetTop + Number.parseInt(element.clientHeight) / 2 - e.pageY;
        dragging = true;
        dragLock = newspaperElement;

        element.style.zIndex = 100;
        element.style.background = dragBg;
    });

    newspaperElement.container.addEventListener("mouseup", () => {
        if(dragLock === newspaperElement) dragLock = undefined;
        dragging = false;

        element.style.zIndex = 0;
        element.style.background = elementBg;
    });

    newspaperElement.container.addEventListener("mousemove", (e) => {
        if(dragging && dragLock !== element) {
            dragging = false;
            element.style.zIndex = 0;
            return;
        }
    });
}

document.addEventListener("mousemove", (e) => {
    if(dragLock){
        dragLock.move({
            x: e.pageX - Number.parseInt(dragLock.element.clientWidth) / 2 + dragOffset.x,
            y: e.pageY - Number.parseInt(dragLock.element.clientHeight) / 2 + dragOffset.y,
        });
    }
});

function makeResizable(newspaperElement) {

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

    getPosition() {
        return {
            x: pn(this.container.style.left),
            y: pn(this.container.style.top)
        }
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
        let {width, height} = this.getSize();
        if(this.anchor.fromRight) {
            this.relmove({x: -width});
            this.anchor.fromRight = false;
        };
        if(this.anchor.fromBot) {
            this.relmove({y: -height});
            this.anchor.fromBot = false;
        };
        this.container.style.width = this.element.style.width;
        this.container.style.height = this.element.style.height;
        //this.reanchor(this.anchor);
    }

    reanchor(anchor) {
        this.anchor = anchor;
        if(anchor.fromRight !== undefined) {
            this.element.style.left = anchor.fromRight ? "" : containerPadding;
            this.element.style.right = anchor.fromRight ? containerPadding : "";
        }
        if(anchor.fromBot !== undefined) {
            this.element.style.top = anchor.fromBot ? "" : containerPadding;
            this.element.style.bottom = anchor.fromBot ? containerPadding : "";
        }
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
        if(!enableDrawing && isDrawing) isDrawing = false;
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
            }
            isDrawing = false;
        }
    });
}

function setup() {
    const container = document.getElementById("container");

    bindClick("btn-textbox", () => {
        new NewspaperElement("textbox", container).fitContainer();
    });

    bindClick("btn-imgbox", () => {
        new NewspaperElement("imgbox", container).fitContainer();
    });

    setupDrawline("btn-drawline-vert", false);
    setupDrawline("btn-drawline-hor", true);
}

setup();
