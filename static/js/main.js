function choose_favorites(heart, vacancy_id) {
    if (heart.classList.contains("unactive")) {
        var info = JSON.stringify({
            vacancy_id: vacancy_id
        })
    
        let req = new XMLHttpRequest();
    
        req.open("POST", "/add_to_favorites", true);   
        req.setRequestHeader("Content-Type", "application/json");
        req.addEventListener("load", function () {
            heart.children[0].src = "/static/img/active_heart.png"
            heart.classList.remove("unactive")
            heart.classList.add("active")
        });
        req.send(info);
    } else {
        var info = JSON.stringify({
            vacancy_id: vacancy_id
        })
    
        let req = new XMLHttpRequest();
    
        req.open("POST", "/delete_from_favorites", true);   
        req.setRequestHeader("Content-Type", "application/json");
        req.addEventListener("load", function () {
            heart.children[0].src = "/static/img/unactive_heart.png"
            heart.classList.add("unactive")
            heart.classList.remove("active")
        });
        req.send(info);
    }
}

function create_response(heart, vacancy_id) {
    var info = JSON.stringify({
        vacancy_id: vacancy_id
    })

    let req = new XMLHttpRequest();

    req.open("POST", "/create_response", true);   
    req.setRequestHeader("Content-Type", "application/json");
    req.addEventListener("load", function () {
        window.location.href = "/"
    });
    req.send(info);
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

function delete_vacancy(id) {  
    var info = JSON.stringify({
        id: id
    })

    let req = new XMLHttpRequest();

    req.open("POST", "/delete_vacancy", true);   
    req.setRequestHeader("Content-Type", "application/json");
    req.addEventListener("load", function () {
        window.location.reload()
    });
    req.send(info);
}

function edit_vacancy(id) {
    window.location.href = `/edit_vacancy/${id}`
}

function upload_avatar() {
    document.getElementById("avatar_uploader").click()
}

function showFile(e) {
    var files = e.target.files;
    for (var i = 0, f; f = files[i]; i++) {
        if (!f.type.match('image.*')) continue;
        var fr = new FileReader();
        fr.onload = (function(theFile) {
            return function(e) {
                document.getElementById("avatar").src = e.target.result
            };
        })(f);

        fr.readAsDataURL(f);
    }
}

document.getElementById('avatar_uploader').addEventListener('change', showFile, false);
