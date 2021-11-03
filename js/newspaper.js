const px = (v) => `${v}px`;

let dragLock = null;

function createElement(className) {
    let element = document.createElement("div");
    element.classList.add(className);
    return element;
}

function makeDraggable(newspaperElement) {
    const dragBg = "rgba(100, 100, 100, 0.5)";

    let dragging = false;
    let offset = {x: 0, y: 0};
    let element = newspaperElement.el();
    let elementBg = element.style.background;

    element.addEventListener("mousedown", (e) => {
        offset.x = element.offsetLeft  + Number.parseInt(element.clientWidth) / 2 - e.pageX;
        offset.y = element.offsetTop + Number.parseInt(element.clientHeight) / 2 - e.pageY;
        dragging = true;
        dragLock = element;

        element.style.zIndex = 100;
        element.style.background = dragBg;
    });

    element.addEventListener("mouseup", () => {
        dragging = false;

        element.style.zIndex = 0;
        element.style.background = elementBg;
    });

    element.addEventListener("mousemove", (e) => {
        if(dragging && dragLock !== element) {
            dragging = false;
            element.style.zIndex = 0;
            return;
        }

        if(dragging){
            newspaperElement.move({
                x: e.pageX - Number.parseInt(element.clientWidth) / 2 + offset.x,
                y: e.pageY - Number.parseInt(element.clientHeight) / 2 + offset.y,
            });
        }
    });
}

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

    getSize() {
        return {
            width: Number.parseInt(this.el().style.width),
            height: Number.parseInt(this.el().style.height),
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

    reanchor(anchor) {
        if(anchor.fromRight !== undefined) {
            this.element.style.left = anchor.fromRight ? "" : 0;
            this.element.style.right = anchor.fromRight ? 0 : "";
        }
        if(anchor.fromBot !== undefined) {
            this.element.style.top = anchor.fromBot ? "" : 0;
            this.element.style.bottom = anchor.fromBot ? 0 : "";
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
            line = new NewspaperElement("line", container);
            line.move(origPos);
        }
    });

    document.addEventListener("mousemove", (e) => {
        if(enableDrawing && isDrawing) {
            let length = isHorizontal ? e.pageX - origPos.x : (e.pageY - origPos.y);
            line.setSize(isHorizontal ? {width: length} : {height: length});
            line.el().style.border = `0.5px ${length < cutoff ? "red" : "black"} solid`;
        }
    });

    document.addEventListener("mouseup", (e) => {
        if(enableDrawing && isDrawing) {
            let size = line.getSize();
            if((isHorizontal && size.width < cutoff) || (!isHorizontal && size.height < cutoff)) {
                line.remove();
            }
            isDrawing = false;
        }
    });
}

function setup() {
    const container = document.getElementById("container");

    bindClick("btn-textbox", () => {
        container.appendChild(createElement("textbox"));
    });

    bindClick("btn-imgbox", () => {
        container.appendChild(createElement("imgbox"));
    });

    setupDrawline("btn-drawline-vert", false);
    setupDrawline("btn-drawline-hor", true);
}

setup();
