const dittoString = "Printing, a ditto device"
const container = document.getElementById("container")

document.addEventListener("click", e => {
    if(e.target.classList[0] === "ditto") {
        let ditto = document.createElement("p")
        ditto.innerText = dittoString
        ditto.classList.add("ditto")
        container.appendChild(ditto)
    }
})