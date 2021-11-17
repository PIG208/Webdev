import {nouns} from "../js/data.js";

const rand = (max, min = 0) => Math.random() * (max - min) + min;
const randColor = () => {
    const [r,g,b] = [rand(255), rand(255), rand(255)];
    return [
        `rgb(${r}, ${g}, ${b})`,
        `rgb(${255 - r}, ${255 - g}, ${255 - b})`
    ];
};
const container = document.getElementById("container");
let btns = [];
appendBtn();

function changeStyles(lastIndex) {
    for(let i = 0; i < lastIndex && i < btns.length; i++) {
        const [bgColor, color] = randColor();
        btns[i].style.backgroundColor = bgColor;
        btns[i].style.color = color;
        btns[i].style.padding = `${rand(0, 20)}px`;
    }
}

function appendBtn() {
    let newBtn = document.createElement("button");
    newBtn.classList.add("btn");
    newBtn.innerText = nouns[Math.floor(rand(nouns.length))];
    newBtn.index = btns.length + 1;

    const [bgColor, color] = randColor();
    newBtn.style.backgroundColor = bgColor;
    newBtn.style.color = color;

    btns.push(newBtn);
    container.appendChild(newBtn);
}

document.addEventListener("click", (e) => {
    if(e.target.classList[0] === "btn") {
        if(rand(1) < 0.1) {
            if(rand(1) <= 0.5) {
                for(let i = 0; i <= e.target.index; i++) appendBtn();
            }
            else {
                for(let i = 0; i <= e.target.index && btns.length > 0; i++) {
                    let curBtn = btns.pop();
                    container.removeChild(curBtn);
                }
            }
        }

        appendBtn();
        changeStyles(e.target.index);
    }
});