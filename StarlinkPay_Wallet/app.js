window.addEventListener("load", () => {
    const loaderContainer = document.getElementById("loader")
    const mainContainer = document.getElementById("main-content")
    setTimeout(()=> {
        loaderContainer.style.display = 'none'
        mainContainer.style.display = 'flex'
    }, 1000)
})