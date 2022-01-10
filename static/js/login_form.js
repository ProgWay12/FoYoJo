document.getElementById("login_form").onsubmit = (e) => {
    e.stopPropagation()
    e.preventDefault()

    var info = JSON.stringify({
        email: document.getElementById("login_form").querySelector("input[name='email']").value,
        password: document.getElementById("login_form").querySelector("input[name='password']").value
    })

    let req = new XMLHttpRequest();

    req.open("POST", "/login", true);   
    req.setRequestHeader("Content-Type", "application/json");
    req.addEventListener("load", function (e) {
        let data = JSON.parse(req.response);
        if (data.err == "login") {
            document.getElementById("login_form").querySelector("input[name='email']").style.border = "1px solid red"
            document.getElementById("login_form").querySelector("input[name='password']").style.border = "1px solid black"
        } else if (data.err == "pass") {
            document.getElementById("login_form").querySelector("input[name='email']").style.border = "1px solid black"
            document.getElementById("login_form").querySelector("input[name='password']").style.border = "1px solid red"
        } else {
            window.location.href = `/`
        }
    });
    req.send(info);
}