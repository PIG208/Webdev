import { nouns, verbs, adjectives, adverbs, prepositions, ratioToImages, imagePathPrefix } from "../js/data.js";

const gridSize = 10;
const px = (v) =>
  `${Number.parseFloat(v) - (Number.parseFloat(v) % gridSize)}px`;
const pn = (v) => Number.parseFloat(v);
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const revCoord = (coord) => ({ x: -coord.x, y: -coord.y });
const absCoord = (coord) => ({ x: Math.abs(coord.x), y: Math.abs(coord.y) });
const coordBothLarger = (coordA, coordB) =>
  coordA.x > coordB.x && coordA.y > coordB.y;
const containerPadding = "4px";
const convertDir = (dir) =>
  `${dir.y === 0 ? "" : dir.y > 0 ? "s" : "n"}${
    dir.x === 0 ? "" : dir.x > 0 ? "e" : "w"
  }`;
const deletionZone = document.getElementById("deletion");
const mainContainer = document.getElementById("container");

let isDrawing = false;
let dragLock = { element: undefined, canDelete: false };
let dragOffset = { x: 0, y: 0 };
let resizeLock = { element: undefined, resizeDir: { x: 0, y: 0 } };
let elements = [];

function canDone() {
  return elements.length > 0 && elements.find(ele => !ele.generated) === undefined;
}

function calRelativeCorner(coord, newspaperElement, corner) {
  const { x, y } = newspaperElement.getOffsetPosition();
  const { width, height } = newspaperElement.getClientSize();
  return {
    x: coord.x - x + ((corner.x - 1) * width) / 2,
    y: coord.y - y + ((corner.y - 1) * height) / 2,
  };
}

/**
 * Calculate mouse's relative position to the center of an element
 * @param mouseEvent The MouseEvent object
 */
function calRelativeCenter(coord, newspaperElement) {
  return calRelativeCorner(coord, newspaperElement, { x: 0, y: 0 });
}

/**
 * Check the relative position of a point
 * They should be under the same coordinate system
 * ==  ==================  ==
 * | (-1, -1)               | (1, -1)
 *
 * |                        |
 * |                        |
 * | (-1,  0)   (0,  0)     | (1,  0)
 * |                        |
 *
 * | (-1,  1)               | (1,  1)
 * ==  ==================  ==
 */
function checkRect(checkPoint, rect) {
  return (
    coordBothLarger(rect.rightBot, checkPoint) &&
    coordBothLarger(checkPoint, rect.leftTop)
  );
}

/**
 * Calculate which corner a point is located at
 */
function checkAtCorners(testPoint, newspaperElement, horizontal, vertical) {
  const { width, height } = newspaperElement.getClientSize();
  const [cornerWidth, cornerHeight] = [Math.max(width / 16, 5), Math.max(height / 16, 5)];
  const criticalX = [
    -(width / 2) - cornerWidth,
    -(width / 2) + cornerWidth,
    width / 2 - cornerWidth,
    width / 2 + cornerWidth,
  ];

  const criticalY = [
    -(height / 2) - cornerHeight,
    -(height / 2) + cornerHeight,
    height / 2 - cornerHeight,
    height / 2 + cornerHeight,
  ];

  let relativeCoord = calRelativeCenter(testPoint, newspaperElement);

  for (let i = 0; i <= 2; i++) {
    for (let j = 0; j <= 2; j++) {
      if (i == 1 && j == 1) continue;
      // indicate corners by -1 and 1
      if (
        checkRect(relativeCoord, {
          leftTop: { x: criticalX[i], y: criticalY[j] },
          rightBot: { x: criticalX[i + 1], y: criticalY[j + 1] },
        })
      )
        return {
          x: horizontal ? i - 1 : 0,
          y: vertical ? j - 1 : 0,
        };
    }
  }
  return {
    x: 0,
    y: 0,
  };
}

function createElement(className) {
  let element = document.createElement("div");
  element.classList.add(className);
  return element;
}

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickOneWeighted(arr, lotteryTotal) {
  let i = 0, result = Math.random() * lotteryTotal;
  for(i = 0; i < arr.length; i++) {
    result -= arr[i].lottery;
    if(result <= 0) return arr[i];
  }
  return arr[i - 1];
}

function optional(cb, prob) {
  return prob < Math.random() ? cb() + " " : "";
}

function generateSentence() {
  return cap(
    `${optional(() => pickOne(adjectives), 0.5)}${pickOne(nouns)} ${optional(
      () => pickOne(adverbs),
      0.5
    )}${pickOne(verbs)} ${optional(() => pickOne(adjectives), 0.5)}${pickOne(
      nouns
    )}. `
  );
}

// dimensions = {width: number, height: number}
function selectImage(dimensions) {
  let ratio = pn(dimensions.width) / pn(dimensions.height);
  // Give a weight to each ratio
  let totalLotteries = 0;
  let candidates = Object.entries(ratioToImages).map(([key, images])=>{
    let diff = Math.abs(1 - key / ratio);
    let lottery = 200 / (diff > 0.7 ? 200 : diff > 0.1 ? diff : 0.01);
    totalLotteries += lottery;
    return {lottery: lottery, images: images};
  });
  return `${imagePathPrefix}${pickOne(pickOneWeighted(candidates, totalLotteries).images)}`;
}

function makeDraggable(newspaperElement) {
  newspaperElement.container.classList.add("draggable");

  newspaperElement.container.addEventListener("mousedown", (e) => {
    if(isDrawing) return;
    deletionZone.classList = ["deletion-active"];
    dragOffset = revCoord(
      calRelativeCenter({ x: e.clientX, y: e.clientY }, newspaperElement)
    );
    dragLock.element = newspaperElement;
  });
}

function handleResize(coord) {
  let relPos = calRelativeCorner(
    coord,
    resizeLock.element,
    resizeLock.resizeDir
  );
  resizeLock.element.setSize({
    width: resizeLock.resizeDir.x !== 0 ? relPos.x : undefined,
    height: resizeLock.resizeDir.y !== 0 ? relPos.y : undefined,
  });
}

function makeResizable(newspaperElement, horizontal = true, vertical = true) {
  newspaperElement.container.addEventListener("mousemove", (e) => {
    let corner = checkAtCorners(
      { x: e.clientX + mainContainer.scrollLeft, y: e.clientY + mainContainer.scrollTop },
      newspaperElement,
      horizontal,
      vertical
    );
    newspaperElement.container.style.cursor =
      corner.x | (corner.y !== 0) ? `${convertDir(corner)}-resize` : "";
  });

  newspaperElement.container.addEventListener("mousedown", (e) => {
    if(isDrawing) return;
    const size = newspaperElement.getClientSize();
    let corner = checkAtCorners(
      { x: e.clientX + mainContainer.scrollLeft, y: e.clientY + mainContainer.scrollTop },
      newspaperElement,
      horizontal,
      vertical
    );
    if (corner.x | corner.y) {
      // If we are not at the origin
      resizeLock.element = newspaperElement;
      resizeLock.element.relmove({
        x: corner.x < 0 ? size.width : undefined,
        y: corner.y < 0 ? size.height : undefined,
      });
      resizeLock.resizeDir = absCoord(corner);
      handleResize({ x: e.clientX + mainContainer.scrollLeft, y: e.clientY + mainContainer.scrollTop });
      newspaperElement.container.style.width = "1px";
      newspaperElement.container.style.height = "1px";
    }
  });

  return newspaperElement;
}

document.addEventListener("mousemove", (e) => {
  if(isDrawing) return;
  const coord = { x: e.pageX, y: e.pageY };

  if (resizeLock.element) {
    handleResize({x: coord.x + mainContainer.scrollLeft, y: coord.y + mainContainer.scrollTop});
  }
  // We prioritize resize to drag
  else if (dragLock.element) {
    let { width, height } = dragLock.element.getClientSize();
    dragLock.element.move({
      x: coord.x - width / 2 + dragOffset.x,
      y: coord.y - height / 2 + dragOffset.y,
    });
    // Check if we can delete it
    dragLock.canDelete = checkRect(coord, {
      leftTop: {x: deletionZone.offsetLeft, y: deletionZone.offsetTop},
      rightBot: {x: deletionZone.offsetLeft + deletionZone.offsetWidth, y: deletionZone.offsetTop + deletionZone.offsetHeight}
    });
    if(dragLock.canDelete) {
      deletionZone.classList.add("deletion-hover");
    }
    else {
      deletionZone.classList.remove("deletion-hover");
    }
  }
});

document.addEventListener("mouseup", (e) => {
  if (dragLock.element) {
    deletionZone.classList = ["deletion-inactive"];
    if(dragLock.canDelete) {
      dragLock.element.remove();
    }
    dragLock.element = undefined;
    dragLock.canDelete = false;
  }
  if (resizeLock.element) {
    resizeLock.element.fitContainer();
    resizeLock.element = undefined;
  }
});

function makeDeletable(newspaperElement) {}

class NewspaperElement {
  constructor(className, parent, drag = true) {
    this.anchor = { fromRight: false, fromBot: false };
    this.element = createElement(className);
    this.container = createElement("container");
    this.container.appendChild(this.element);
    this.generated = false;
    parent.appendChild(this.container);
    drag && makeDraggable(this);
    elements.push(this);
    document.getElementById("btn-done").classList.add("disable");
  }

  el() {
    return this.element;
  }

  move(coord) {
    if (coord.x !== undefined) this.container.style.left = px(coord.x);
    if (coord.y !== undefined) this.container.style.top = px(coord.y);
    return this;
  }

  relmove(coord) {
    const { x, y } = this.getPosition();
    return this.move({
      x: coord.x !== undefined ? px(x + coord.x) : undefined,
      y: coord.y !== undefined ? px(y + coord.y) : undefined,
    });
  }

  centralize() {
    let { width, height } = this.getClientSize();
    return this.move({
      x: (document.body.clientWidth - width) / 2,
      y: (document.body.clientHeight - height) / 2,
    });
  }

  getSize() {
    return {
      width: Number.parseInt(this.el().style.width) || 0,
      height: Number.parseInt(this.el().style.height) || 0,
    };
  }

  getClientSize() {
    return {
      width: pn(this.el().clientWidth),
      height: pn(this.el().clientHeight),
    };
  }

  getPosition() {
    return {
      x: pn(this.container.style.left),
      y: pn(this.container.style.top),
    };
  }

  getOffsetPosition() {
    return {
      x: this.container.offsetLeft,
      y: this.container.offsetTop,
    };
  }

  setSize(size) {
    size.width !== undefined && this.setWidth(size.width);
    size.height !== undefined && this.setHeight(size.height);
    return this;
  }

  setWidth(width) {
    this.reanchor({ fromRight: width < 0 });
    this.element.style.width = px(Math.abs(width));
    return this;
  }

  setHeight(height) {
    this.reanchor({ fromBot: height < 0 });
    this.element.style.height = px(Math.abs(height));
    return this;
  }

  fitContainer() {
    let { width, height } = this.getClientSize();
    if (this.anchor.fromRight) {
      this.relmove({ x: -width });
    }
    if (this.anchor.fromBot) {
      this.relmove({ y: -height });
    }
    this.container.style.width = px(width);
    this.container.style.height = px(height);
    this.reanchor({ fromRight: false, fromBot: false });

    return this;
  }

  reanchor(anchor) {
    if (
      anchor.fromRight !== undefined &&
      anchor.fromRight !== this.anchor.fromRight
    ) {
      this.element.style.left = anchor.fromRight ? "" : containerPadding;
      this.element.style.right = anchor.fromRight ? containerPadding : "";
    }
    if (
      anchor.fromBot !== undefined &&
      anchor.fromBot !== this.anchor.fromBot
    ) {
      this.element.style.top = anchor.fromBot ? "" : containerPadding;
      this.element.style.bottom = anchor.fromBot ? containerPadding : "";
    }
    if (anchor.fromBot !== undefined) this.anchor.fromBot = anchor.fromBot;
    if (anchor.fromRight !== undefined)
      this.anchor.fromRight = anchor.fromRight;
    return this;
  }

  clean() {
    this.container.classList.remove("draggable");
    this.container.style.removeProperty("cursor");
    let freshNode = this.container.cloneNode(true);
    this.container.parentNode.replaceChild(freshNode, this.container);
    this.container = freshNode;
  }

  remove() {
    this.container.remove();
    elements.splice(elements.indexOf(this), 1);
    if(canDone()) document.getElementById("btn-done").classList.remove("disable");
  }
}

function bindClick(btn, cb) {
  document.getElementById(btn).addEventListener("click", cb);
}

function setupDrawline(btn, isHorizontal) {
  const container = document.getElementById("container");
  const cutoff = 20;

  let origPos, line;
  let enableDrawing = false;

  bindClick(btn, () => {
    enableDrawing = !enableDrawing;
    if (!enableDrawing && isDrawing) {
      isDrawing = false;
      line && line.remove();
    }
  });

  function handleStartDrawing(e) {
    if (enableDrawing) {
      isDrawing = true;
      origPos = { x: e.clientX + mainContainer.scrollLeft, y: e.clientY + mainContainer.scrollTop };
      line = new NewspaperElement("line", container, false);
      line.move(origPos);
    }
  }

  function handleMoveDrawing(e) {
    if (enableDrawing && isDrawing) {
      let length = isHorizontal ? e.clientX + mainContainer.scrollLeft - origPos.x : e.clientY + mainContainer.scrollTop - origPos.y;
      line.setSize(isHorizontal ? { width: length } : { height: length });
      line.el().style.border = `0.5px ${
        Math.abs(length) < cutoff ? "red" : "black"
      } solid`;
    }
  }

  function handleStopDrawing(e) {
    if (enableDrawing && isDrawing) {
      let size = line.getSize();
      if (
        (isHorizontal && size.width < cutoff) ||
        (!isHorizontal && size.height < cutoff)
      ) {
        line.remove();
      } else {
        line.fitContainer();
        makeDraggable(line);
        makeResizable(line, isHorizontal, !isHorizontal);
      }
      enableDrawing = false;
      isDrawing = false;
    }
  }

  document.addEventListener("mousedown", handleStartDrawing);
  document.addEventListener("touchstart", handleStartDrawing);

  document.addEventListener("mousemove", handleMoveDrawing);
  document.addEventListener("touchmove", handleMoveDrawing);

  document.addEventListener("mouseup", handleStopDrawing);
  document.addEventListener("touchend", handleStopDrawing);
}

function setup() {
  const container = document.getElementById("container");
  document.getElementById("btn-done").classList.add("disable");
  document.getElementById("btn-back").style.display = "none";

  bindClick("btn-titlebox", () => {
    makeResizable(
      new NewspaperElement("titlebox", container).fitContainer()
    ).centralize();
  });

  bindClick("btn-textbox", () => {
    makeResizable(
      new NewspaperElement("textbox", container).fitContainer()
    ).centralize();
  });

  bindClick("btn-imgbox", () => {
    makeResizable(
      new NewspaperElement("imgbox", container).fitContainer()
    ).centralize();
  });

  setupDrawline("btn-drawline-vert", false);
  setupDrawline("btn-drawline-hor", true);

  bindClick("btn-draw", draw);

  bindClick("btn-done", () => {
    if(!canDone()) return;
    document.getElementById("toolbar").classList.add("transparent");
    elements.forEach(element => {
      element.clean();
    });
    document.getElementById("btn-back").style.display = "";
  });

  bindClick("btn-back", () => {
    document.location = "newspaper-intro.html";
  });
}

function draw() {
  const duration = 1000;
  const msInterval = 10;

  let timeElapsed = 0;

  let titleBoxes = document.getElementsByClassName("titlebox");
  let textBoxes = document.getElementsByClassName("textbox");
  let imgBoxes = document.getElementsByClassName("imgbox");

  for (let ele of titleBoxes) {
    ele.innerHTML = "";
    ele.style.border = "none";
    let h1 = document.createElement("h1");
    h1.innerText = generateSentence();
    ele.appendChild(h1);
  }

  for (let ele of textBoxes) {
    ele.innerHTML = "";
    ele.style.border = "none";
  }

  for (let ele of imgBoxes) {
    let img = document.createElement("img");
    img.setAttribute("src", selectImage({width: ele.clientWidth, height: ele.clientHeight}));
    img.setAttribute("draggable", false);
    ele.replaceChildren(img);
  }

  let interval = setInterval(() => {
    try {
      for (let ele of textBoxes) {
        ele.innerHTML += generateSentence();
      }
    } finally {
      timeElapsed += msInterval;
      if (timeElapsed >= duration) clearInterval(interval);
    }
  }, msInterval);

  for(let ele of elements) {
    ele.generated = true;
  }
  if(canDone()) document.getElementById("btn-done").classList.remove("disable");
}

setup();
