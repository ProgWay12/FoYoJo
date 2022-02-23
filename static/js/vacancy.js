window.onload = () => {
    document.querySelector(".sliger_body").children[0].classList.add("showed")
    document.querySelector(".sliger_body").children[1].classList.add("showed")

    document.querySelector(".modal_sliger_body").children[0].classList.add("showed")


    document.querySelectorAll(".arrow").forEach((elem, i) => {
        var par_h = elem.clientHeight
        var img_h = elem.children[0].clientHeight

        elem.children[0].style.paddingTop = String((par_h - img_h) / 2) + "px"
    })
}

document.getElementById("modal_img_player").onclick = (e) => {
    if (e.target.classList == "modal_img_player") {
        document.getElementById("modal_img_player").classList.add("hiden")
    }
}

document.getElementById("modal_img_player").onmouseover = (e) => {
    if (e.target != document.querySelector(".modal_img_slider")) {
        document.getElementById("modal_img_player").style.cursor = "pointer"
    }
}

function show_prev_modal() {
    if (document.querySelector(".modal_sliger_body").getElementsByClassName("showed")[0].previousElementSibling == null || typeof(document.querySelector(".modal_sliger_body").getElementsByClassName("showed")[0].previousElementSibling) == "undefined") {
        document.querySelector(".modal_sliger_body").getElementsByClassName("showed")[0].classList.remove("showed")
        document.querySelector(".modal_sliger_body").children[document.querySelector(".modal_sliger_body").children.length - 1].classList.add("showed")
    } else {
        document.querySelector(".modal_sliger_body").getElementsByClassName("showed")[0].previousElementSibling.classList.add("showed")
        document.querySelector(".modal_sliger_body").getElementsByClassName("showed")[1].classList.remove("showed")
    }
}

function show_next_modal() {
    if (document.querySelector(".modal_sliger_body").getElementsByClassName("showed")[0].nextElementSibling == null || typeof(document.querySelector(".modal_sliger_body").getElementsByClassName("showed")[0].nextElementSibling) == "undefined") {
        document.querySelector(".modal_sliger_body").getElementsByClassName("showed")[0].classList.remove("showed")
        document.querySelector(".modal_sliger_body").children[0].classList.add("showed")
    } else {
        document.querySelector(".modal_sliger_body").getElementsByClassName("showed")[0].nextElementSibling.classList.add("showed")
        document.querySelector(".modal_sliger_body").getElementsByClassName("showed")[0].classList.remove("showed")
    }
}

function show_prev() {
    if (document.querySelector(".sliger_body").getElementsByClassName("showed")[0].previousElementSibling == null || typeof(document.querySelector(".sliger_body").getElementsByClassName("showed")[0].previousElementSibling) == "undefined") {
        if (document.querySelector(".sliger_body").children[document.querySelector(".sliger_body").children.length - 1].classList.contains("showed")) {
            document.querySelector(".sliger_body").getElementsByClassName("showed")[0].classList.remove("showed")
            document.querySelector(".sliger_body").children[document.querySelector(".sliger_body").children.length - 2].classList.add("showed")
        } else {
            document.querySelector(".sliger_body").getElementsByClassName("showed")[0].nextElementSibling.classList.remove("showed")
            document.querySelector(".sliger_body").children[document.querySelector(".sliger_body").children.length - 1].classList.add("showed")
        }
        
    } else {
        document.querySelector(".sliger_body").getElementsByClassName("showed")[0].nextElementSibling.classList.remove("showed")
        document.querySelector(".sliger_body").getElementsByClassName("showed")[0].previousElementSibling.classList.add("showed")
    }
}

function show_next() {
    if (document.querySelector(".sliger_body").getElementsByClassName("showed")[1].nextElementSibling == null || typeof(document.querySelector(".sliger_body").getElementsByClassName("showed")[1].nextElementSibling) == "undefined") {
        if (document.querySelector(".sliger_body").children[0].classList.contains("showed")) {
            document.querySelector(".sliger_body").getElementsByClassName("showed")[1].classList.remove("showed")
            document.querySelector(".sliger_body").children[1].classList.add("showed")
        } else {
            document.querySelector(".sliger_body").getElementsByClassName("showed")[1].previousElementSibling.classList.remove("showed")
            document.querySelector(".sliger_body").children[0].classList.add("showed")
        }
        
    } else {
        document.querySelector(".sliger_body").getElementsByClassName("showed")[1].previousElementSibling.classList.remove("showed")
        document.querySelector(".sliger_body").getElementsByClassName("showed")[0].nextElementSibling.classList.add("showed")
    }
}

function show_img(img) {
    var img_path = img.src

    document.querySelector(".modal_sliger_body").querySelectorAll("img").forEach((elem, i) => {
        if (elem.src != img_path) {
            elem.classList.remove("showed")
        } else {
            elem.classList.add("showed")
        }
    })

    document.getElementById("modal_img_player").classList.remove("hiden")

    document.querySelectorAll(".arrow").forEach((elem, i) => {
        var par_h = elem.clientHeight
        var img_h = elem.children[0].clientHeight

        if (elem.children[0].style.paddingTop == "0px") {
            elem.children[0].style.paddingTop = String((par_h - img_h) / 2) + "px"
        }
    })
}