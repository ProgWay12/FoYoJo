document.getElementById("reg_form").onsubmit = (e) => {
    e.stopPropagation()
    e.preventDefault()

    var info = JSON.stringify({
        full_name: document.getElementById("reg_form").querySelector("input[name='full_name']").value,
        email: document.getElementById("reg_form").querySelector("input[name='email']").value,
        phone: document.getElementById("reg_form").querySelector("input[name='phone']").value,
        documents: document.getElementById("reg_form").querySelector("select[name='documents']").value,
        speciality: document.getElementById("reg_form").querySelector("select[name='speciality']").value,
        experience: document.getElementById("reg_form").querySelector("input[name='experience']").value,
        language_lvl: document.getElementById("reg_form").querySelector("select[name='language_lvl']").value,
        personal_qualities: document.getElementById("reg_form").querySelector("textarea[name='personal_qualities']").value,
        whatsapp_numb: document.getElementById("reg_form").querySelector("input[name='whatsapp_numb']").value,
        viber_numb: document.getElementById("reg_form").querySelector("input[name='viber_numb']").value,
        telegram_numb: document.getElementById("reg_form").querySelector("input[name='telegram_numb']").value,
        pass: document.getElementById("reg_form").querySelector("input[name='pass']").value
    })

    let req = new XMLHttpRequest();

    req.open("POST", "/registration", true);   
    req.setRequestHeader("Content-Type", "application/json");
    req.addEventListener("load", function (e) {
        let data = JSON.parse(req.response);
        if (data.err == "email") {
            document.getElementById("reg_form").querySelector("input[name='email']").style.border = "1px solid red"
            document.getElementById("reg_form").querySelector("input[name='phone']").style.border = "1px solid black"
        } else if (data.err == "phone") {
            document.getElementById("reg_form").querySelector("input[name='email']").style.border = "1px solid black"
            document.getElementById("reg_form").querySelector("input[name='phone']").style.border = "1px solid red"
        } else {
            window.location.href = `/login`
        }
    });
    req.send(info);
}