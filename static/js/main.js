function choose_favorites(heart) {
    if (heart.classList.contains("unactive")) {
        heart.children[0].src = "/static/img/active_heart.png"
        heart.classList.remove("unactive")
        heart.classList.add("active")
    } else {
        heart.children[0].src = "/static/img/unactive_heart.png"
        heart.classList.add("unactive")
        heart.classList.remove("active")
    }
}

function change_main_img(img) {
    var img_src = img.src
    var old_src = document.getElementById("main_img").src
    document.getElementById("main_img").src = img_src
    img.src = old_src
}

function show_menu() {
    if (document.querySelector(".adaptive_menu_info").classList.contains("element-show")) {
        document.querySelector(".adaptive_menu_info").classList.remove("element-show")
        document.querySelector(".adaptive_menu_info").classList.add("element-hiden")
    } else {
        document.querySelector(".adaptive_menu_info").classList.remove("element-hiden")
        document.querySelector(".adaptive_menu_info").classList.add("element-show")
    }
}