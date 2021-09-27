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

let components = [fadeAltBoxes];

function loadComponents(){
    components.forEach(item=>item());
}

loadComponents();