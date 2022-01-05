const express = require('express')
const hbs = require('hbs')
const { engine } = require("express-handlebars");
var bodyParser = require('body-parser');
const mysql = require('mysql2');
var session = require('cookie-session');
const multer  = require("multer");
const e = require('express');

const app = express()

const jsonParser = express.json();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000
app.set('port', PORT);
app.use('/static', express.static(__dirname + '/static'));

app.set("view engine", "hbs");

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        if (file.fieldname == "avatar") {
            cb(null, "./static/img/avatars"); 
        } else if (file.fieldname == "company_logo") {
            cb(null, "./static/img/company_logo"); 
        } else if (file.fieldname == "work_place_imgs") {
            cb(null, "./static/img/work_place_imgs"); 
        }
    },
    filename: (req, file, cb) =>{
        cb(null, file.originalname);
    }
});
 
app.use(express.static(__dirname));

app.use(multer({storage:storageConfig}).fields([{
    name: "avatar",
    maxCount: 1
},
{
    name: "company_logo",
    maxCount: 1
},
{
    name: "work_place_imgs",
    maxCount: 1000
}]));
/*
db
Username: p4caLCC1oc

Database name: p4caLCC1oc

Password: lAr3BmacL0

Server: remotemysql.com

Port: 3306

tables:
users (email (longtext), pass (longtext), )
admins
vacancies
favorites (user_id (int), vacancy_id (int) )
responses (user_id (int), vacancy_id (int) )
*/

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

const pool = mysql.createPool({
    host: "remotemysql.com",
    port: 3306,
    user: "p4caLCC1oc",
    database: "p4caLCC1oc",
    password: "lAr3BmacL0"   
});

app.get("/", (req, res) => {
    pool.query("select * from vacancies", (err, result) => {
        if (err) {
            res.sendStatus(502)
            console.log(err)
        } else {
            if (req.session.logged_in) {
                pool.query("select * from responses where user_id = ?", [req.session.user_id], (err2, responses) => {
                    if (err2) {
                        console.log(err2)
                        res.sendStatus(502)
                    } else {
                        var is_responses_ids = []
                        responses.forEach((elem, i) => {
                            is_responses_ids.push(elem.vacancy_id)
                        })

                        var cleared_result = []
                        result.forEach((elem, i) => {
                            if (!is_responses_ids.includes(elem.id)) {
                                cleared_result.push(elem)
                            }
                        })

                        result = cleared_result

                        pool.query("select * from favorites where user_id = ?", [req.session.user_id], (err1, result1) => {
                            if (err1) {
                                console.log(err1)
                                res.sendStatus(502)
                            } else {
                                var in_fav_id = []
                                result1.forEach((elem, i) => {
                                    in_fav_id.push(elem.vacancy_id)
                                })
                                var vacancies = []
        
                                result.forEach((elem, i) => {
                                    if (in_fav_id.includes(elem.id)) {
                                        vacancies.push({
                                            vacancies_info: elem,
                                            is_fav: true
                                        })
                                    } else {
                                        vacancies.push({
                                            vacancies_info: elem,
                                            is_fav: false
                                        })
                                    }
                                })
        
                                res.render("main.hbs", {
                                    layout: "layout_login",
                                    user_name: req.session.username,
                                    user_id: req.session.user_id,
                                    vacancies: vacancies.reverse()
                                })
                            }
                        })
                    }
                })
                
                
            } else {
                var vacancies = []

                result.forEach((elem, i) => {
                    vacancies.push({
                        vacancies_info: elem,
                        is_fav: false
                    })
                })

                res.render("main.hbs", {
                    layout: "layout_not_login",
                    vacancies: vacancies.reverse()
                })
            } 
        }
    })
})

app.get("/login", (req, res) => {
    res.render("login.hbs", {
        layout: "layout_forms"
    })
})

app.post("/login", jsonParser, (req, res) => {
    const email = req.body.email
    const password = req.body.password
    pool.query("select * from users where email = ?", [email], (err, results) => {
        if (err) {
            console.log(err)
            res.sendStatus(502)
        } else {
            if (typeof(results[0]) != "undefined") {
                if (password == results[0].pass) {
                    req.session.logged_in = true
                    req.session.username = results[0].full_name
                    req.session.user_id = results[0].id
                    res.redirect("/")
                }
            } else {
                res.redirect("/login")
            }
            
        }
    })
})

app.get("/registration", jsonParser, (req, res) => {
    res.render("register.hbs", {
        layout: "layout_forms"
    })
})

app.post("/registration", (req, res) => {
    const email = req.body.email
    const password = req.body.pass
    const full_name = req.body.full_name
    const phone = req.body.phone
    const documents = req.body.documents
    const speciality = req.body.speciality
    const experience = req.body.experience
    const language_lvl = req.body.language_lvl
    const personal_qualities = req.body.personal_qualities
    const whatsapp_numb = req.body.whatsapp_numb
    const viber_numb = req.body.viber_numb
    const telegram_numb = req.body.telegram_numb
    pool.query("insert into users (email, pass, full_name, phone, documents, speciality, experience, language_lvl, personal_qualities, whatsapp_numb, viber_numb, telegram_numb) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [email, password, full_name, phone, documents, speciality, experience, language_lvl, personal_qualities, whatsapp_numb, viber_numb, telegram_numb], (err, results) => {
                if (err) {
                    console.log(err)
                    res.sendStatus(502)
                } else {
                    res.redirect("/login")
                }
            })
})

app.get("/vacancy/:id", (req, res) => {
    pool.query("select * from vacancies where id = ?", [req.params.id], (err, result) => {
        if (err) {
            console.log(err)
            res.sendStatus(502)
        } else {
            if (result[0].company_logo == null) {
                var is_null_logo = true
            } else {
                var is_null_logo = false
            }

            if (result[0].work_place_imgs_paths == null) {
                var is_null_work_place_imgs = true
            } else {
                var is_null_work_place_imgs = false
                result[0].work_place_imgs_paths = String(result[0].work_place_imgs_paths).split("|")
                var count_6 = false
                var count_5 = false
                var count_4 = false
                var count_3 = false
                var count_2 = false
                var count_1 = false
                if (result[0].work_place_imgs_paths.length >= 6) {
                    count_6 = true
                    var img_block = {
                        main_img: result[0].work_place_imgs_paths[0],
                        sec_block: [result[0].work_place_imgs_paths[1], result[0].work_place_imgs_paths[2]],
                        thid_block: result[0].work_place_imgs_paths.slice(3, result[0].work_place_imgs_paths.length - 1)
                    }
                } else if (result[0].work_place_imgs_paths.length == 5) {
                    count_5 = true
                    var img_block = {
                        sec_block: [result[0].work_place_imgs_paths[0], result[0].work_place_imgs_paths[1]],
                        thid_block: [result[0].work_place_imgs_paths[2], result[0].work_place_imgs_paths[3], result[0].work_place_imgs_paths[4] ]
                    }
                } else if (result[0].work_place_imgs_paths.length == 4) {
                    count_4 = true
                    var img_block = {
                        main_img: result[0].work_place_imgs_paths[0],
                        thid_block: [result[0].work_place_imgs_paths[1], result[0].work_place_imgs_paths[2], result[0].work_place_imgs_paths[3] ]
                    }
                } else if (result[0].work_place_imgs_paths.length == 3) {
                    count_3 = true
                    var img_block = {
                        main_img: result[0].work_place_imgs_paths[0],
                        sec_block: [result[0].work_place_imgs_paths[1], result[0].work_place_imgs_paths[2]]
                    }
                } else if (result[0].work_place_imgs_paths.length == 2) {
                    count_2 = true
                    
                    var img_block = {
                        thid_block: [result[0].work_place_imgs_paths[0], result[0].work_place_imgs_paths[1]]
                    }
                } else if (result[0].work_place_imgs_paths.length == 1) {
                    count_1 = true
                    var img_block = {
                        main_img: result[0].work_place_imgs_paths[0]
                    }
                }
            }

            result[0].vacancy_description = String(result[0].vacancy_description).split("|")
            if (req.session.logged_in) {
                pool.query("select * from favorites where user_id = ? and vacancy_id = ?", [req.session.user_id, req.params.id], (err, is_fav_result) => {
                    if (err) {
                        console.log(err)
                        res.sendStatus(502)
                    } else {
                        pool.query("select * from responses where user_id = ? and vacancy_id = ?", [req.session.user_id, req.params.id], (err, is_responses_result) => {
                            if (err) {
                                console.log(err)
                                res.sendStatus(502)
                            } else {
                                if (typeof(is_responses_result[0]) != "undefined") {
                                    var is_responsed = true
                                } else {
                                    var is_responsed = false
                                }
                                if (typeof(is_fav_result[0]) != "undefined") {
                                    var is_fav = true
                                } else {
                                    var is_fav = false
                                }
                                res.render("vacancy.hbs", {
                                    layout: "layout_login",
                                    user_name: req.session.username,
                                    user_id: req.session.user_id,
                                    vacancy_info: result[0],
                                    is_null_logo: is_null_logo,
                                    is_null_work_place_imgs: is_null_work_place_imgs,
                                    count_1: count_1,
                                    count_2: count_2,
                                    count_3: count_3,
                                    count_4: count_4,
                                    count_5: count_5,
                                    count_6: count_6,
                                    img_block: img_block,
                                    is_fav: is_fav,
                                    is_responsed: is_responsed
                                })
                            }
                        })
                        
                    }
                })
                
            } else {
                res.render("vacancy.hbs", {
                    layout: "layout_not_login",
                    vacancy_info: result[0],
                    is_null_logo: is_null_logo,
                    is_null_work_place_imgs: is_null_work_place_imgs,
                    count_1: count_1,
                    count_2: count_2,
                    count_3: count_3,
                    count_4: count_4,
                    count_5: count_5,
                    count_6: count_6,
                    img_block: img_block,
                    is_fav: false,
                    is_responsed: false
                })
            }
        }
    })
    
})

app.get("/profile_personal_data/:id", (req, res) => {
    if (req.session.logged_in) {
        pool.query("select * from users where id = ?", [req.params.id], (err, result) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                if (typeof(result[0]) != "undefined") {
                    if (String(result[0].avatar_path).length == 0 || result[0].avatar_path == null) {
                        result[0].avatar_path = "/static/img/test_avatar.png"
                    }
                    res.render("profile_personal_data.hbs", {
                        layout: "layout_login",
                        user_name: req.session.username,
                        user_id: req.session.user_id,
                        user_info: result[0]
                    })
                } else {
                    res.redirect("/login")
                }
            }
        })
    } else {
        res.redirect("/login")
    }
})

app.post("/profile_personal_data_edit/:id", jsonParser, (req, res) => {
    var file = req.files.avatar[0].path
    var avatar_path = "/" + file
    const email = req.body.email
    const documents = req.body.documents
    const speciality = req.body.speciality
    const experience = req.body.experience
    const language_lvl = req.body.language_lvl
    const personal_qualities = req.body.personal_qualities
    pool.query("update users set email = ?, documents = ?, speciality = ?, experience = ?, language_lvl = ?, personal_qualities = ?, avatar_path = ? where id = ?", [email, documents, speciality, experience, language_lvl, personal_qualities, avatar_path, req.params.id], (err, result) => {
        if (err) {
            console.log(err)
            res.sendStatus(502)
        } else {
            res.redirect(`/profile_personal_data/${req.params.id}`)
        }
    })
})

app.get("/profile_contacts/:id", (req, res) => {
    if (req.session.logged_in) {
        pool.query("select * from users where id = ?", [req.params.id], (err, result) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                if (typeof(result[0]) != "undefined") {
                    res.render("profile_contacts.hbs", {
                        layout: "layout_login",
                        user_name: req.session.username,
                        user_id: req.session.user_id,
                        user_info: result[0]
                    })
                } else {
                    res.redirect("/login")
                }
            }
        })
    } else {
        res.redirect("/login")
    }    
})

app.post("/profile_contacts_edit/:id", jsonParser, (req, res) => {
    const phone = req.body.phone
    const whatsapp_numb = req.body.whatsapp_numb
    const viber_numb = req.body.viber_numb
    const telegram_numb = req.body.telegram_numb
    pool.query("update users set phone = ?, whatsapp_numb = ?, viber_numb = ?, telegram_numb = ? where id = ?", [phone, whatsapp_numb, viber_numb, telegram_numb, req.params.id], (err, result) => {
        if (err) {
            console.log(err)
            res.sendStatus(502)
        } else {
            res.redirect(`/profile_contacts/${req.params.id}`)
        }
    })
})

app.get("/profile_favorites/:id", (req, res) => {
    if (req.session.logged_in) {
        pool.query("select * from favorites where user_id = ?", [req.session.user_id], (err, result) => {
            if (err) {
                res.sendStatus(502)
                console.log(err)
            } else {
                var ids = []
                result.forEach((elem, i) => {
                    ids.push(elem.vacancy_id)
                })
                var pool_string = 'select * from vacancies where '
                for (var i = 0; i < ids.length; i++) {
                    if (i != ids.length - 1) {
                        pool_string += `id = ${ids[i]} or `
                    } else {
                        pool_string += `id = ${ids[i]}`
                    }
                }

                pool.query(pool_string, (err1, result1) => {
                    if (err1) {
                        res.sendStatus(502)
                        console.log(err1)
                    } else {
                        res.render("profile_favorites.hbs", {
                            layout: "layout_login",
                            user_name: req.session.username,
                            user_id: req.session.user_id,
                            vacancies: result1.reverse()
                        })
                    }
                })
            }
        })
        
    } else {
        res.redirect("/login")
    }  
    
})

app.get("/profile_answers/:id", (req, res) => {
    if (req.session.logged_in) {
        pool.query("select * from responses where user_id = ?", [req.session.user_id], (err, result) => {
            if (err) {
                res.sendStatus(502)
                console.log(err)
            } else {
                var ids = []
                result.forEach((elem, i) => {
                    ids.push(elem.vacancy_id)
                })
                var pool_string = 'select * from vacancies where '
                for (var i = 0; i < ids.length; i++) {
                    if (i != ids.length - 1) {
                        pool_string += `id = ${ids[i]} or `
                    } else {
                        pool_string += `id = ${ids[i]}`
                    }
                }

                pool.query(pool_string, (err1, result1) => {
                    if (err1) {
                        res.sendStatus(502)
                        console.log(err1)
                    } else {
                        res.render("profile_answers.hbs", {
                            layout: "layout_login",
                            user_name: req.session.username,
                            user_id: req.session.user_id,
                            vacancies: result1.reverse()
                        })
                    }
                })
            }
        })
        
    } else {
        res.redirect("/login")
    }
})

app.post("/add_to_favorites", jsonParser, (req, res) => {
    if (req.session.logged_in) {
        pool.query("insert into favorites (user_id, vacancy_id) values (?, ?)", [req.session.user_id, req.body.vacancy_id], (err, result) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                res.send()
            }
        })
    } else {
        res.redirect("/login")
    }
})

app.post("/delete_from_favorites", jsonParser, (req, res) => {
    if (req.session.logged_in) {
        pool.query("delete from favorites where user_id = ? and vacancy_id = ?", [req.session.user_id, req.body.vacancy_id], (err, result) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                res.send()
            }
        })
    } else {
        res.redirect("/login")
    }
})

app.post("/create_response", jsonParser, (req, res) => {
    if (req.session.logged_in) {
        pool.query("insert into responses (user_id, vacancy_id) values (?, ?)", [req.session.user_id, req.body.vacancy_id], (err, result) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                res.send()
            }
        })
    } else {
        res.redirect("/login")
    }
})

app.post("/show_filtred", jsonParser, (req, res) => {
    res.redirect(`/filtred/${req.body.speciality}/${req.body.voivodeship}/${req.body.city}/${req.body.vacancy_price}/${req.body.work_type}/${req.body.country}`)
})

app.get("/filtred/:speciality/:voivodeship/:city/:vacancy_price/:work_type/:country", (req, res) => {
    var pool_vac_str = `select * from vacancies where`
    var params_arr = []
    if (req.params.speciality != 'all') {
        if (pool_vac_str != "select * from vacancies where") {
            pool_vac_str += ` and speciality = ?`
        } else {
            pool_vac_str += ` speciality = ?`
        }
        params_arr.push(req.params.speciality)
    }
    if (req.params.voivodeship != 'all') {
        if (pool_vac_str != "select * from vacancies where") {
            pool_vac_str += ` and voivodeship = ?`
        } else {
            pool_vac_str += ` voivodeship = ?`
        }
        params_arr.push(req.params.voivodeship)
    }
    if (req.params.city != 'all') {
        if (pool_vac_str != "select * from vacancies where") {
            pool_vac_str += ` and city = ?`
        } else {
            pool_vac_str += ` city = ?`
        }
        params_arr.push(req.params.city)
    }
    if (req.params.work_type != 'all') {
        if (pool_vac_str != "select * from vacancies where") {
            pool_vac_str += ` and work_type = ?`
        } else {
            pool_vac_str += ` work_type = ?`
        }
        params_arr.push(req.params.work_type)
    }
    if (req.params.country != 'all') {
        if (pool_vac_str != "select * from vacancies where") {
            pool_vac_str += ` and country = ?`
        } else {
            pool_vac_str += ` country = ?`
        }
        params_arr.push(req.params.country)
    }

    if (params_arr.length < 1) {
        pool_vac_str = "select * from vacancies"
    }
    pool.query(pool_vac_str, params_arr, (err, result) => {
        if (err) {
            res.sendStatus(502)
            console.log(err)
        } else {
            
            var filtred_arr = []

            if (req.params.vacancy_price != 'all') {
                var min = parseInt(String(req.params.vacancy_price).split("-")[0].trim())
                var max = parseInt(String(req.params.vacancy_price).split("-")[1].trim())

                result.forEach((elem, i) => {
                    if (String(req.params.vacancy_price).split("-")[1].trim() == 'x') {
                        if (parseInt(elem.vacancy_price) >= min) {
                            filtred_arr.push(elem)
                        }
                    } else {
                        if (parseInt(elem.vacancy_price) >= min && parseInt(elem.vacancy_price) <= max) {
                            filtred_arr.push(elem)
                        }
                    }
                    
                })
                result = filtred_arr
            }

            if (req.session.logged_in) {
                pool.query("select * from responses where user_id = ?", [req.session.user_id], (err2, responses) => {
                    if (err2) {
                        console.log(err2)
                        res.sendStatus(502)
                    } else {
                        var is_responses_ids = []
                        responses.forEach((elem, i) => {
                            is_responses_ids.push(elem.vacancy_id)
                        })

                        var cleared_result = []
                        result.forEach((elem, i) => {
                            if (!is_responses_ids.includes(elem.id)) {
                                cleared_result.push(elem)
                            }
                        })

                        result = cleared_result

                        pool.query("select * from favorites where user_id = ?", [req.session.user_id], (err1, result1) => {
                            if (err1) {
                                console.log(err1)
                                res.sendStatus(502)
                            } else {
                                var in_fav_id = []
                                result1.forEach((elem, i) => {
                                    in_fav_id.push(elem.vacancy_id)
                                })
                                var vacancies = []
        
                                result.forEach((elem, i) => {
                                    if (in_fav_id.includes(elem.id)) {
                                        vacancies.push({
                                            vacancies_info: elem,
                                            is_fav: true
                                        })
                                    } else {
                                        vacancies.push({
                                            vacancies_info: elem,
                                            is_fav: false
                                        })
                                    }
                                })

                                res.render("main.hbs", {
                                    layout: "layout_login",
                                    user_name: req.session.username,
                                    user_id: req.session.user_id,
                                    vacancies: vacancies.reverse()
                                })
                            }
                        })
                    }
                })
                
                
            } else {
                var vacancies = []

                result.forEach((elem, i) => {
                    vacancies.push({
                        vacancies_info: elem,
                        is_fav: false
                    })
                })

                res.render("main.hbs", {
                    layout: "layout_not_login",
                    vacancies: vacancies.reverse()
                })
            } 
        }
    })
})

//* adminboard

app.get("/admin_login", (req, res) => {
    res.render("login_admin.hbs", {
        layout: "layout_forms"
    })
})

app.post("/admin_login", jsonParser, (req, res) => {
    const email = req.body.email
    const password = req.body.password
    pool.query("select * from admins where email = ?", [email], (err, results) => {
        if (err) {
            console.log(err)
            res.sendStatus(502)
        } else {
            if (typeof(results[0]) != "undefined") {
                if (password == results[0].pass) {
                    req.session.admin_logged_in = true
                    res.redirect("/admin")
                }
            } else {
                res.redirect("/admin_login")
            }
        }
    })
})

app.get("/admin", (req, res) => {
    pool.query("select * from vacancies", (err, result) => {
        if (err) {
            res.sendStatus(502)
            console.log(err)
        } else {
            if (req.session.admin_logged_in) {
                res.render("admin_main.hbs", {
                    layout: "layout_admin",
                    vacancies: result.reverse()
                })
            } else {
                res.redirect("/admin_login")
            }
        }
    })
})

app.get("/admin_add_vacancy", (req, res) => {
    if (req.session.admin_logged_in) {
        res.render("admin_add_vacancy.hbs", {
            layout: "layout_admin"
        })
    } else {
        res.redirect("/admin_login")
    }
})

app.post("/admin_add_vacancy", jsonParser, (req, res) => {
    if (String(req.body.vacancy_description).includes("\r\n")) {
        var mid_desc = ``
        for (var i = 0; i < String(req.body.vacancy_description).split("\r\n").length; i++) {
            if (String(req.body.vacancy_description).split("\r\n")[i].length > 0) {
                if (i != String(req.body.vacancy_description).split("\r\n").length - 1) {
                    mid_desc += String(req.body.vacancy_description).split("\r\n")[i] + "|"
                } else {
                    mid_desc += String(req.body.vacancy_description).split("\r\n")[i]
                }
            }
        }
        var vacancy_description = mid_desc
    } else if (String(req.body.vacancy_description).includes("\n")) {
        var mid_desc = ``
        for (var i = 0; i < String(req.body.vacancy_description).split("\n").length; i++) {
            if (String(req.body.vacancy_description).split("\r\n")[i].length > 0) {
                if (i != String(req.body.vacancy_description).split("\n").length - 1) {
                    mid_desc += String(req.body.vacancy_description).split("\n")[i] + "|"
                } else {
                    mid_desc += String(req.body.vacancy_description).split("\n")[i]
                }    
            }
        }
        var vacancy_description = mid_desc
    } else if (String(req.body.vacancy_description).includes("\r")) {
        var mid_desc = ``
        for (var i = 0; i < String(req.body.vacancy_description).split("\r").length; i++) {
            if (String(req.body.vacancy_description).split("\r\n")[i].length > 0) {
                if (i != String(req.body.vacancy_description).split("\r").length - 1) {
                    mid_desc += String(req.body.vacancy_description).split("\r")[i] + "|"
                } else {
                    mid_desc += String(req.body.vacancy_description).split("\r")[i]
                }
            }
        }
        var vacancy_description = mid_desc
    } else {
        var vacancy_description = req.body.vacancy_description
    }

    var short_decription = ''
    for (var i = 0; i < vacancy_description.split("|").length; i++) {
        for (var j = 0; j < vacancy_description.split("|")[i].split(" ").length; j++) {
            short_decription += String(vacancy_description.split("|")[i].split(" ")[j]) + " "
            if (short_decription.length > 300) {
                break
            }
        }
        if (short_decription.length > 300) {
            break
        }
    }
    const vacancy_title = req.body.vacancy_title
    const vacancy_price = req.body.vacancy_price
    const voivodeship = req.body.voivodeship
    const city = req.body.city
    const work_type = req.body.work_type
    const speciality = req.body.speciality
    var country = req.body.country
    var date = `${new Date().getDate()}.${new Date().getMonth()}.${new Date().getFullYear()}`

    if (typeof(req.files.company_logo) != "undefined") {
        var company_logo = '/' + req.files.company_logo[0].path
    } else {
        var company_logo = ''
    }

    if (typeof(req.files.work_place_imgs) != "undefined") {
        var work_place_imgs_paths = ''
        for (var i = 0; i < req.files.work_place_imgs.length; i++) {
            if (i == req.files.work_place_imgs.length - 1) {
                work_place_imgs_paths += `/${req.files.work_place_imgs[i].path}`
            } else {
                work_place_imgs_paths += `/${req.files.work_place_imgs[i].path}|`
            }
        }
    } else {
        var work_place_imgs_paths = ''
    }
    pool.query("insert into vacancies (vacancy_title, vacancy_price, vacancy_description, voivodeship, city, work_type, speciality, short_decription, _date, country, company_logo, work_place_imgs_paths) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [vacancy_title, vacancy_price, vacancy_description, voivodeship, city, work_type, speciality, short_decription, date, country, company_logo, work_place_imgs_paths], (err, results) => {
                if (err) {
                    console.log(err)
                    res.sendStatus(502)
                } else {
                    res.redirect("/admin")
                }
            })
})

app.post("/delete_vacancy", jsonParser, (req, res) => {
    pool.query("delete from vacancies where id = ?", [req.body.id], (err, result) => {
        if (err) {
            res.sendStatus(err)
            console.log(err)
        } else {
            res.send()
        }
    })
})

app.get("/edit_vacancy/:id", (req, res) => {
    if (req.session.admin_logged_in) {
        pool.query("select * from vacancies where id = ?", [req.params.id], (err, result) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                res.render("admin_edit_vacancy.hbs", {
                    layout: "layout_admin",
                    vacancy: result[0]
                })
            }
        })
    } else {
        res.redirect("/admin_login")
    }
})

app.post("/edit_vacancy/:id", jsonParser, (req, res) => {
    if (String(req.body.vacancy_description).includes("\r\n")) {
        var mid_desc = ``
        for (var i = 0; i < String(req.body.vacancy_description).split("\r\n").length; i++) {
            if (String(req.body.vacancy_description).split("\r\n")[i].length > 0) {
                if (i != String(req.body.vacancy_description).split("\r\n").length - 1) {
                    mid_desc += String(req.body.vacancy_description).split("\r\n")[i] + "|"
                } else {
                    mid_desc += String(req.body.vacancy_description).split("\r\n")[i]
                }
            }
        }
        var vacancy_description = mid_desc
    } else if (String(req.body.vacancy_description).includes("\n")) {
        var mid_desc = ``
        for (var i = 0; i < String(req.body.vacancy_description).split("\n").length; i++) {
            if (String(req.body.vacancy_description).split("\r\n")[i].length > 0) {
                if (i != String(req.body.vacancy_description).split("\n").length - 1) {
                    mid_desc += String(req.body.vacancy_description).split("\n")[i] + "|"
                } else {
                    mid_desc += String(req.body.vacancy_description).split("\n")[i]
                }    
            }
        }
        var vacancy_description = mid_desc
    } else if (String(req.body.vacancy_description).includes("\r")) {
        var mid_desc = ``
        for (var i = 0; i < String(req.body.vacancy_description).split("\r").length; i++) {
            if (String(req.body.vacancy_description).split("\r\n")[i].length > 0) {
                if (i != String(req.body.vacancy_description).split("\r").length - 1) {
                    mid_desc += String(req.body.vacancy_description).split("\r")[i] + "|"
                } else {
                    mid_desc += String(req.body.vacancy_description).split("\r")[i]
                }
            }
        }
        var vacancy_description = mid_desc
    } else {
        var vacancy_description = req.body.vacancy_description
    }

    var short_decription = ''
    console.log(vacancy_description.split("|"))
    for (var i = 0; i < vacancy_description.split("|").length; i++) {
        for (var j = 0; j < vacancy_description.split("|")[i].split(" ").length; j++) {
            short_decription += String(vacancy_description.split("|")[i].split(" ")[j]) + " "
            if (short_decription.length > 300) {
                break
            }
        }
        if (short_decription.length > 300) {
            break
        }
    }
    const vacancy_title = req.body.vacancy_title
    const vacancy_price = req.body.vacancy_price
    const voivodeship = req.body.voivodeship
    const city = req.body.city
    const work_type = req.body.work_type
    const speciality = req.body.speciality
    const country = req.body.country
    pool.query("update vacancies set vacancy_title = ?, vacancy_price = ?, vacancy_description = ?, voivodeship = ?, city = ?, work_type = ?, speciality = ?, short_decription = ?, country = ? where id = ?",
            [vacancy_title, vacancy_price, vacancy_description, voivodeship, city, work_type, speciality, short_decription, country, req.params.id], (err, results) => {
                if (err) {
                    console.log(err)
                    res.sendStatus(502)
                } else {
                    res.redirect("/admin")
                }
            })
})

app.get("/vacancy_responses/:id", (req, res) => {
    if (req.session.admin_logged_in) {
        pool.query("select * from responses where vacancy_id = ?", [req.params.id], (err, result) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                var ids = []
                result.forEach((elem, i) => {
                    ids.push(elem.user_id)
                })
                var pool_string = 'select * from users where '
                for (var i = 0; i < ids.length; i++) {
                    if (i != ids.length - 1) {
                        pool_string += `id = ${ids[i]} or `
                    } else {
                        pool_string += `id = ${ids[i]}`
                    }
                }
                
                if (ids.length > 0) {
                    pool.query(pool_string, (err1, users) => {
                        if (err1) {
                            console.log(err1)
                            res.sendStatus(502)
                        } else {
                            res.render("admin_vacancy_responses.hbs", {
                                layout: "layout_admin",
                                users: users
                            })
                        }
                    })
                } else {
                    res.render("admin_vacancy_responses.hbs", {
                        layout: "layout_admin",
                        users: []
                    })
                }
            }
        })
    } else {
        res.redirect("/admin_login")
    }
})

app.get("/response/:id", (req, res) => {
    if (req.session.admin_logged_in) {
        pool.query("select * from users where id = ?", [req.params.id], (err, result) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                res.render("response.hbs", {
                    layout: "layout_admin",
                    user_info: result[0]
                })
            }
        })
    } else {
        res.redirect("/admin_login")
    }
})

app.post("/show_filtred_admin", jsonParser, (req, res) => {
    res.redirect(`/admin_filtred/${req.body.speciality}/${req.body.voivodeship}/${req.body.city}/${req.body.vacancy_price}/${req.body.work_type}/${req.body.country}`)
})

app.get("/admin_filtred/:speciality/:voivodeship/:city/:vacancy_price/:work_type/:country", (req, res) => {
    if (req.session.admin_logged_in) {
        var pool_vac_str = `select * from vacancies where`
        var params_arr = []
        if (req.params.speciality != 'all') {
            if (pool_vac_str != "select * from vacancies where") {
                pool_vac_str += ` and speciality = ?`
            } else {
                pool_vac_str += ` speciality = ?`
            }
            params_arr.push(req.params.speciality)
        }
        if (req.params.voivodeship != 'all') {
            if (pool_vac_str != "select * from vacancies where") {
                pool_vac_str += ` and voivodeship = ?`
            } else {
                pool_vac_str += ` voivodeship = ?`
            }
            params_arr.push(req.params.voivodeship)
        }
        if (req.params.city != 'all') {
            if (pool_vac_str != "select * from vacancies where") {
                pool_vac_str += ` and city = ?`
            } else {
                pool_vac_str += ` city = ?`
            }
            params_arr.push(req.params.city)
        }
        if (req.params.work_type != 'all') {
            if (pool_vac_str != "select * from vacancies where") {
                pool_vac_str += ` and work_type = ?`
            } else {
                pool_vac_str += ` work_type = ?`
            }
            params_arr.push(req.params.work_type)
        }
        if (req.params.country != 'all') {
            if (pool_vac_str != "select * from vacancies where") {
                pool_vac_str += ` and country = ?`
            } else {
                pool_vac_str += ` country = ?`
            }
            params_arr.push(req.params.country)
        }

        if (params_arr.length < 1) {
            pool_vac_str = "select * from vacancies"
        }
        pool.query(pool_vac_str, params_arr, (err, result) => {
            if (err) {
                res.sendStatus(502)
                console.log(err)
            } else {

                var filtred_arr = []

                if (req.params.vacancy_price != 'all') {
                    var min = parseInt(String(req.params.vacancy_price).split("-")[0].trim())
                    var max = parseInt(String(req.params.vacancy_price).split("-")[1].trim())
                
                    result.forEach((elem, i) => {
                        if (String(req.params.vacancy_price).split("-")[1].trim() == 'x') {
                            if (parseInt(elem.vacancy_price) >= min) {
                                filtred_arr.push(elem)
                            }
                        } else {
                            if (parseInt(elem.vacancy_price) >= min && parseInt(elem.vacancy_price) <= max) {
                                filtred_arr.push(elem)
                            }
                        }
                        
                    })
                    result = filtred_arr
                }

                res.render("admin_main.hbs", {
                    layout: "layout_admin",
                    vacancies: result.reverse()
                })
            }
        })
    } else {
        res.redirect("/admin_login")
    }
})

app.listen(PORT, () => {
    console.log(PORT)
})