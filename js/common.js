let btnHome = document.createElement("button");
btnHome.innerHTML = "Home";
btnHome.classList.add("btn-home");
document.getElementsByTagName("main")[0].appendChild(btnHome);
btnHome.addEventListener("click", (e)=>{
    if(window.location.hostname === "pig208.github.io"){
        window.location.href = "/Webdev";
    }
    else{
        window.location.href = "/";
    }
})