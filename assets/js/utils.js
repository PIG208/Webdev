function fadeAltBoxes() {
    let items = document.getElementsByClassName("fade-alt-box");
    let handler = () => {
        for(let i = 0; i < items.length; i++) {
            let children = items[i].getElementsByTagName("div");
            let centerRelativeFactor = ((children[0].getBoundingClientRect().top + children[0].offsetHeight / 2) - window.innerHeight / 2) / (window.innerHeight / 2);
            if(children.length == 2){
                if (centerRelativeFactor > 1) {
                    children[0].style.opacity = 1;
                    children[1].style.opacity = 0;
                }
                else if (centerRelativeFactor < -1) {
                    children[0].style.opacity = 0;
                    children[1].style.opacity = 1;
                }
                else {
                    children[0].style.opacity = centerRelativeFactor > -0.25 ? (1 - centerRelativeFactor + 0.25) / 1.25 : 0;
                    children[1].style.opacity = centerRelativeFactor < 0.25 ? (-centerRelativeFactor + 0.25) / 1.25 : 0;
                }
            }
        }
    };
    document.addEventListener("scroll", handler);
    handler();
}

function multiSelect() {
    let items = document.getElementsByClassName("multi-select");
    for(let i = 0; i < items.length; i++) {
        items[i].setAttribute("data-selected", "")
        let options = items[i].getElementsByTagName("button");
        for(let n = 0; n < options.length; n++) {
            options[n].addEventListener("click", (e) => {
                let value = e.target.getAttribute("data-value");
                if(!!!value) {
                    value = e.target.textContent;
                }
                items[i].setAttribute("data-selected", value);
                let selected = items[i].getElementsByClassName("selected");
                if(selected.length > 0 && !!selected[0]){
                    selected[0].classList.remove("selected");
                }
                e.target.classList.add("selected");
            });
        }
    }
}

let components = [fadeAltBoxes, multiSelect];

export default function loadComponents(){
    components.forEach(item=>item());
}