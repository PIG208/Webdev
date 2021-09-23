function setActivePage(element) {
    element.classList.add("active-page");
}

function removeActivePage(element) {
    element.classList.remove("active-page");
}

function loadNext() {
    let pages = document.getElementsByClassName("page");
    let i = 0;
    for(; i < pages.length && !pages[i].classList.contains("active-page"); i++);
    if(i < pages.length) {
        removeActivePage(pages[i]);
        setActivePage(pages[(i + 1) % pages.length]);
    }
    else {
        if (pages.length > 0){
            setActivePage(pages[0]);
        }
    }
}