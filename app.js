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
        } else if (file.fieldname == "imgs_paths") {
            cb(null, "./static/img/news_imgs"); 
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
},
{
    name: "imgs_paths",
    maxCount: 1000
}]));

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
    password: "ys3fXpumpL"   
});

app.get("/", (req, res) => {
    pool.query("select * from news", (err, news) => {
        if (err) {
            console.log(err)
            res.sendStatus(502)
        } else {
            pool.query("select * from vacancies", (err_v, vacancies) => {
                if (err_v) {
                    console.log(err_v)
                    res.sendStatus(502)
                } else {
                    vacancies = vacancies.reverse()
                    var is_more = true
                    if (vacancies.length >= 4) {
                        var main_vacancy = {
                            id: vacancies[0].id,
                            vacancy_title: vacancies[0].vacancy_title,
                            vacancy_price: vacancies[0].vacancy_price,
                            short_decription: vacancies[0].short_decription,
                            _date: vacancies[0]._date,
                            preview_img: String(vacancies[0].work_place_imgs_paths).split("|")[0]
                        }
    
                        var sub_vacancies = [
                            {
                                id: vacancies[1].id,
                                vacancy_title: vacancies[1].vacancy_title,
                                vacancy_price: vacancies[1].vacancy_price,
                                short_decription: vacancies[1].short_decription,
                                _date: vacancies[1]._date,
                                preview_img: String(vacancies[1].work_place_imgs_paths).split("|")[0]
                            },
                            {
                                id: vacancies[2].id,
                                vacancy_title: vacancies[2].vacancy_title,
                                vacancy_price: vacancies[2].vacancy_price,
                                short_decription: vacancies[2].short_decription,
                                _date: vacancies[2]._date,
                                preview_img: String(vacancies[2].work_place_imgs_paths).split("|")[0]
                            },
                            {
                                id: vacancies[3].id,
                                vacancy_title: vacancies[3].vacancy_title,
                                vacancy_price: vacancies[3].vacancy_price,
                                short_decription: vacancies[3].short_decription,
                                _date: vacancies[3]._date,
                                preview_img: String(vacancies[3].work_place_imgs_paths).split("|")[0]
                            }
                        ]
                    } else {
                        is_more = false
                    }
                    

                    if (req.session.logged_in) {
                        res.render("main_page.hbs", {
                            layout: "layout_login",
                            user_name: req.session.username,
                            user_id: req.session.user_id,
                            main_page: true,
                            news: news.reverse(),
                            main_vacancy: main_vacancy,
                            sub_vacancies: sub_vacancies,
                            vacancies: vacancies,
                            is_more: is_more
                        })
                    } else {
                        res.render("main_page.hbs", {
                            layout: "layout_not_login",
                            main_page: true,
                            news: news.reverse(),
                            main_vacancy: main_vacancy,
                            sub_vacancies: sub_vacancies,
                            vacancies: vacancies,
                            is_more: is_more
                        })
                    }
                }
            })
        }
    })
})

app.get("/vacancies", (req, res) => {
    pool.query("select * from vacancies", (err, result) => {
        if (err) {
            res.sendStatus(502)
            console.log(err)
        } else {
            var previews = []
            result.forEach((elem, i) => {
                previews.push({
                    id: elem.id,
                    vacancy_title: elem.vacancy_title,
                    vacancy_price: elem.vacancy_price,
                    vacancy_description: elem.vacancy_description,
                    voivodeship: elem.voivodeship,
                    city: elem.city,
                    speciality: elem.speciality,
                    work_type: elem.work_type,
                    short_decription: elem.short_decription,
                    _date: elem._date,
                    country: elem.country,
                    company_logo: elem.company_logo,
                    work_place_imgs_paths: elem.work_place_imgs_paths,
                    preview_img: String(elem.work_place_imgs_paths).split("|")[0]
                })
            })
            result = previews
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
                                
                                pool.query("select * from cities", (err_cities, cities) => {
                                    if (err_cities) {
                                        console.log(err_cities)
                                        res.sendStatus(502)
                                    } else{
                                        pool.query("select * from countries", (err1, countries) => {
                                            if (err1) {
                                                console.log(err1)
                                                res.sendStatus(502)
                                            } else {
                                                pool.query("select * from specialities", (err2, specialities) => {
                                                    if (err2) {
                                                        console.log(err2)
                                                        res.sendStatus(502)
                                                    } else {
                                                        pool.query("select * from schedules", (err3, schedules) => {
                                                            if (err3) {
                                                                console.log(err3)
                                                                res.sendStatus(502)
                                                            } else {
                                                                res.render("main.hbs", {
                                                                    layout: "layout_login",
                                                                    user_name: req.session.username,
                                                                    user_id: req.session.user_id,
                                                                    vacancies: vacancies.reverse(),
                                                                    cities: cities,
                                                                    countries: countries,
                                                                    specialities: specialities,
                                                                    schedules: schedules
                                                                })
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
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

                pool.query("select * from cities", (err_cities, cities) => {
                    if (err_cities) {
                        console.log(err_cities)
                        res.sendStatus(502)
                    } else {
                        pool.query("select * from countries", (err1, countries) => {
                            if (err1) {
                                console.log(err1)
                                res.sendStatus(502)
                            } else {
                                pool.query("select * from specialities", (err2, specialities) => {
                                    if (err2) {
                                        console.log(err2)
                                        res.sendStatus(502)
                                    } else {
                                        pool.query("select * from schedules", (err3, schedules) => {
                                            if (err3) {
                                                console.log(err3)
                                                res.sendStatus(502)
                                            } else {
                                                res.render("main.hbs", {
                                                    layout: "layout_not_login",
                                                    vacancies: vacancies.reverse(),
                                                    cities: cities,
                                                    countries: countries,
                                                    specialities: specialities,
                                                    schedules: schedules
                                                }) 
                                            }
                                        })
                                    }
                                })
                            }
                        })
                         
                    }
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
                    res.json({
                        err: 'none'
                    })
                } else {
                    res.json({
                        err: 'pass'
                    })
                }
            } else {
                res.json({
                    err: 'login'
                })
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
    const birthday = req.body.birthday
    pool.query("select * from users where email = ?", [email] , (email_test_err, email_test) => {
        if (email_test_err) {
            console.log(email_test_err)
            res.sendStatus(502)
        } else {
            if (typeof(email_test[0]) == "undefined") {
                pool.query("select * from users where phone = ?", [phone], (phone_test_err, phone_test) => {
                    if (phone_test_err) {
                        console.log(phone_test_err)
                        res.sendStatus(502)
                    } else {
                        if (typeof(phone_test[0]) == "undefined") {
                            pool.query("insert into users (email, pass, full_name, phone, documents, speciality, experience, language_lvl, personal_qualities, whatsapp_numb, viber_numb, telegram_numb, birthday) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                [email, password, full_name, phone, documents, speciality, experience, language_lvl, personal_qualities, whatsapp_numb, viber_numb, telegram_numb, birthday], (err, results) => {
                                    if (err) {
                                        console.log(err)
                                        res.sendStatus(502)
                                    } else {
                                        res.json({
                                            err: "none"
                                        })
                                    }
                                })

                        } else {
                            res.json({
                                err: 'phone'
                            })
                        }
                    }
                })
            } else {
                res.json({
                    err: 'email'
                })
            }
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
                /*
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
                */

                if (result[0].work_place_imgs_paths.length == 1) {
                    count_1 = true
                    var img_block = {
                        main_img: result[0].work_place_imgs_paths[0]
                    }
                } else if (result[0].work_place_imgs_paths.length == 2) {
                    count_2 = true

                    var imgs = []

                    result[0].work_place_imgs_paths.forEach((elem, i) => {
                        imgs.push(elem)
                    })

                    var img_block = {
                        imgs: imgs
                    }
                } else {
                    count_3 = true

                    var imgs = []

                    result[0].work_place_imgs_paths.forEach((elem, i) => {
                        imgs.push(elem)
                    })

                    var img_block = {
                        imgs: imgs
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

app.get("/news/:id", (req, res) => {
    pool.query("select * from news where id = ?", [req.params.id], (err, result) => {
        if (err) {
            console.log(err)
            res.sendStatus(502)
        } else {
            if (result[0].imgs_paths == null) {
                var is_null_imgs_paths = true
            } else {
                var is_null_imgs_paths = false
                result[0].imgs_paths = String(result[0].imgs_paths).split("|")
                var count_6 = false
                var count_5 = false
                var count_4 = false
                var count_3 = false
                var count_2 = false
                var count_1 = false

                if (result[0].imgs_paths.length == 1) {
                    count_1 = true
                    var img_block = {
                        main_img: result[0].imgs_paths[0]
                    }
                } else if (result[0].imgs_paths.length == 2) {
                    count_2 = true

                    var imgs = []

                    result[0].imgs_paths.forEach((elem, i) => {
                        imgs.push(elem)
                    })

                    var img_block = {
                        imgs: imgs
                    }
                } else {
                    count_3 = true

                    var imgs = []

                    result[0].imgs_paths.forEach((elem, i) => {
                        imgs.push(elem)
                    })

                    var img_block = {
                        imgs: imgs
                    }
                }
            }

            result[0].news_description = String(result[0].news_description).split("|")
            if (req.session.logged_in) {
                res.render("news.hbs", {
                    layout: "layout_login",
                    user_name: req.session.username,
                    user_id: req.session.user_id,
                    news_info: result[0],
                    is_null_imgs_paths: is_null_imgs_paths,
                    count_1: count_1,
                    count_2: count_2,
                    count_3: count_3,
                    count_4: count_4,
                    count_5: count_5,
                    count_6: count_6,
                    img_block: img_block
                })
                
            } else {
                res.render("news.hbs", {
                    layout: "layout_not_login",
                    news_info: result[0],
                    is_null_imgs_paths: is_null_imgs_paths,
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
                    pool.query("select * from specialities", (err1, specialities) => {
                        if (err1) {
                            console.log(err1)
                            res.sendStatus(502)
                        } else {
                            res.render("profile_personal_data.hbs", {
                                layout: "layout_login",
                                user_name: req.session.username,
                                user_id: req.session.user_id,
                                user_info: result[0],
                                specialities: specialities
                            })
                        }
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
    const email = req.body.email
    const documents = req.body.documents
    const speciality = req.body.speciality
    const experience = req.body.experience
    const language_lvl = req.body.language_lvl
    const personal_qualities = req.body.personal_qualities
    if (typeof(req.files.avatar) != "undefined") {
        var file = req.files.avatar[0].path
        var avatar_path = "/" + file
        pool.query("update users set email = ?, documents = ?, speciality = ?, experience = ?, language_lvl = ?, personal_qualities = ?, avatar_path = ? where id = ?", [email, documents, speciality, experience, language_lvl, personal_qualities, avatar_path, req.params.id], (err, result) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                res.redirect(`/profile_personal_data/${req.params.id}`)
            }
        })
    } else {
        pool.query("update users set email = ?, documents = ?, speciality = ?, experience = ?, language_lvl = ?, personal_qualities = ? where id = ?", [email, documents, speciality, experience, language_lvl, personal_qualities, req.params.id], (err, result) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                res.redirect(`/profile_personal_data/${req.params.id}`)
            }
        })
    }
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

                if (ids.length > 0) {
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
                } else {
                    res.render("profile_favorites.hbs", {
                        layout: "layout_login",
                        user_name: req.session.username,
                        user_id: req.session.user_id,
                        vacancies: []
                    })
                }
                
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

                if (ids.length > 0) {
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
                } else {
                    res.render("profile_answers.hbs", {
                        layout: "layout_login",
                        user_name: req.session.username,
                        user_id: req.session.user_id,
                        vacancies: []
                    })
                }
                
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
    res.redirect(`/vacancies/filtred/${req.body.speciality}/${req.body.voivodeship}/${req.body.city}/${req.body.vacancy_price}/${req.body.work_type}/${req.body.country}`)
})

app.get("/vacancies/filtred/:speciality/:voivodeship/:city/:vacancy_price/:work_type/:country", (req, res) => {
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
            var previews = []
            result.forEach((elem, i) => {
                previews.push({
                    id: elem.id,
                    vacancy_title: elem.vacancy_title,
                    vacancy_price: elem.vacancy_price,
                    vacancy_description: elem.vacancy_description,
                    voivodeship: elem.voivodeship,
                    city: elem.city,
                    speciality: elem.speciality,
                    work_type: elem.work_type,
                    short_decription: elem.short_decription,
                    _date: elem._date,
                    country: elem.country,
                    company_logo: elem.company_logo,
                    work_place_imgs_paths: elem.work_place_imgs_paths,
                    preview_img: String(elem.work_place_imgs_paths).split("|")[0]
                })
            })
            result = previews


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
                                
                                pool.query("select * from cities", (err_cities, cities) => {
                                    if (err_cities) {
                                        console.log(err_cities)
                                        res.sendStatus(502)
                                    } else {
                                        pool.query("select * from countries", (err1, countries) => {
                                            if (err1) {
                                                console.log(err1)
                                                res.sendStatus(502)
                                            } else {
                                                pool.query("select * from specialities", (err2, specialities) => {
                                                    if (err2) {
                                                        console.log(err2)
                                                        res.sendStatus(502)
                                                    } else {
                                                        pool.query("select * from schedules", (err3, schedules) => {
                                                            if (err3) {
                                                                console.log(err3)
                                                                res.sendStatus(502)
                                                            } else {
                                                                res.render("main.hbs", {
                                                                    layout: "layout_login",
                                                                    user_name: req.session.username,
                                                                    user_id: req.session.user_id,
                                                                    vacancies: vacancies.reverse(),
                                                                    cities: cities,
                                                                    countries: countries,
                                                                    specialities: specialities,
                                                                    schedules: schedules
                                                                })
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
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

                pool.query("select * from cities", (err_cities, cities) => {
                    if (err_cities) {
                        console.log(err_cities)
                        res.sendStatus(502)
                    } else {
                        pool.query("select * from countries", (err1, countries) => {
                            if (err1) {
                                console.log(err1)
                                res.sendStatus(502)
                            } else {
                                pool.query("select * from specialities", (err2, specialities) => {
                                    if (err2) {
                                        console.log(err2)
                                        res.sendStatus(502)
                                    } else {
                                        pool.query("select * from schedules", (err3, schedules) => {
                                            if (err3) {
                                                console.log(err3)
                                                res.sendStatus(502)
                                            } else {
                                                res.render("main.hbs", {
                                                    layout: "layout_not_login",
                                                    vacancies: vacancies.reverse(),
                                                    cities: cities,
                                                    countries: countries,
                                                    specialities: specialities,
                                                    schedules: schedules
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })

                
            } 
        }
    })
})

app.get("/logout", (req, res) => {
    req.session.logged_in = false
    res.redirect("/login")
})

app.get("/send_application", (req, res) => {
    if (req.session.logged_in) {
        res.render("send_application.hbs", {
            layout: "layout_login"
        })
    } else {
        res.render("send_application.hbs", {
            layout: "layout_not_login"
        })
    }
})

app.post("/send_application", jsonParser, (req, res) => {
    pool.query("insert into applications (user_name, email, phone) values (?, ?, ?)", [req.body.full_name, req.body.email, req.body.phone], (err, result) => {
        if (err) {
            console.log(err)
            res.sendStatus(502)
        } else {
            res.redirect("/")
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
                    req.session.admin_id = results[0].id
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
    if (req.session.admin_logged_in) {
        var month = String(new Date().getMonth() + 1)
        if (month.length == 1) {
            var month = "0" + String(new Date().getMonth() + 1)
        }

        var date = String(new Date().getDate())
        if (date.length == 1) {
            var date = "0" + String(new Date().getDate())
        }

        var date = `${new Date().getFullYear()}-${month}-${date}`
        pool.query("select * from users where birthday = ?", [date], (err, users) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                var is_birthday = false
                if (users.length > 0) {
                    is_birthday = true
                }

                res.render("admin_menu.hbs", {
                    layout: "layout_admin",
                    menu: true,
                    is_birthday: is_birthday
                })
            }
        })
    } else {
        res.redirect("/admin_login")
    }
})

app.get("/admin_vacancies", (req, res) => {
    pool.query("select * from vacancies", (err, result) => {
        if (err) {
            res.sendStatus(502)
            console.log(err)
        } else {
            if (req.session.admin_logged_in) {
                pool.query("select * from cities", (err_cities, cities) => {
                    pool.query("select * from countries", (err1, countries) => {
                        if (err1) {
                            console.log(err1)
                            res.sendStatus(502)
                        } else {
                            pool.query("select * from specialities", (err2, specialities) => {
                                if (err2) {
                                    console.log(err2)
                                    res.sendStatus(502)
                                } else {
                                    pool.query("select * from schedules", (err3, schedules) => {
                                        if (err3) {
                                            console.log(err3)
                                            res.sendStatus(502)
                                        } else {
                                            res.render("admin_main.hbs", {
                                                layout: "layout_admin",
                                                vacancies: result.reverse(),
                                                cities: cities,
                                                countries: countries,
                                                specialities: specialities,
                                                schedules: schedules
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                })
            } else {
                res.redirect("/admin_login")
            }
        }
    })
})

app.get("/admin_add_vacancy", (req, res) => {
    if (req.session.admin_logged_in) {
        pool.query("select * from cities", (err, cities) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                pool.query("select * from countries", (err1, countries) => {
                    if (err1) {
                        console.log(err1)
                        res.sendStatus(502)
                    } else {
                        pool.query("select * from specialities", (err2, specialities) => {
                            if (err2) {
                                console.log(err2)
                                res.sendStatus(502)
                            } else {
                                pool.query("select * from schedules", (err3, schedules) => {
                                    if (err3) {
                                        console.log(err3)
                                        res.sendStatus(502)
                                    } else {
                                        res.render("admin_add_vacancy.hbs", {
                                            layout: "layout_admin",
                                            cities: cities,
                                            countries: countries,
                                            specialities: specialities,
                                            schedules: schedules
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
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

    if (String(new Date().getDate()).length == 1) {
        var date = `0${String(new Date().getDate())}`
    } else {
        var date = `${String(new Date().getDate())}`
    }

    if (String(new Date().getMonth() + 1).length == 1) {
        var month = `0${String(new Date().getMonth() + 1)}`
    } else {
        var month = `${String(new Date().getMonth() + 1)}`
    }

    var date = `${date}.${month}.${new Date().getFullYear()}`

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

    if (req.body.city == "new") {
        var city = `${String(req.body.new_city)[0].toLocaleUpperCase()}${String(req.body.new_city).slice(1).toLocaleLowerCase()}`
        pool.query("select * from cities where city = ?", [city], (err_check_city, check_city) => {
            if (err_check_city) {
                console.log(err_check_city)
                res.sendStatus(502)
            } else {
                if (typeof(check_city[0]) == "undefined") {
                    pool.query("insert into cities (city) values (?)", [city], (err_adding, adding) => {
                        if (err_adding) {
                            console.log(err_adding)
                            res.sendStatus(502)
                        }
                    })
                }
            }
        })
    } else {
        var city = req.body.city
    }

    if (req.body.work_type == "new") {
        var schedule = `${String(req.body.new_schedule)[0].toLocaleUpperCase()}${String(req.body.new_schedule).slice(1).toLocaleLowerCase()}`
        pool.query("select * from schedules where schedule_type = ?", [schedule], (err_check_city, check_city) => {
            if (err_check_city) {
                console.log(err_check_city)
                res.sendStatus(502)
            } else {
                if (typeof(check_city[0]) == "undefined") {
                    pool.query("insert into schedules (schedule_type) values (?)", [schedule], (err_adding, adding) => {
                        if (err_adding) {
                            console.log(err_adding)
                            res.sendStatus(502)
                        }
                    })
                }
            }
        })
    } else {
        var schedule = req.body.work_type
    }

    if (req.body.speciality == "new") {
        var speciality = `${String(req.body.new_speciality)[0].toLocaleUpperCase()}${String(req.body.new_speciality).slice(1).toLocaleLowerCase()}`
        pool.query("select * from specialities where speciality = ?", [speciality], (err_check_city, check_city) => {
            if (err_check_city) {
                console.log(err_check_city)
                res.sendStatus(502)
            } else {
                if (typeof(check_city[0]) == "undefined") {
                    pool.query("insert into specialities (speciality) values (?)", [speciality], (err_adding, adding) => {
                        if (err_adding) {
                            console.log(err_adding)
                            res.sendStatus(502)
                        }
                    })
                }
            }
        })
    } else {
        var speciality = req.body.speciality
    }

    if (req.body.country == "new") {
        var country = `${String(req.body.new_country)[0].toLocaleUpperCase()}${String(req.body.new_country).slice(1).toLocaleLowerCase()}`
        pool.query("select * from countries where country = ?", [country], (err_check_city, check_city) => {
            if (err_check_city) {
                console.log(err_check_city)
                res.sendStatus(502)
            } else {
                if (typeof(check_city[0]) == "undefined") {
                    pool.query("insert into countries (country) values (?)", [country], (err_adding, adding) => {
                        if (err_adding) {
                            console.log(err_adding)
                            res.sendStatus(502)
                        }
                    })
                }
            }
        })
    } else {
        var country = req.body.country
    }

    pool.query("insert into vacancies (vacancy_title, vacancy_price, vacancy_description, voivodeship, city, work_type, speciality, short_decription, _date, country, company_logo, work_place_imgs_paths) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [vacancy_title, vacancy_price, vacancy_description, voivodeship, city, schedule, speciality, short_decription, date, country, company_logo, work_place_imgs_paths], (err, results) => {
                if (err) {
                    console.log(err)
                    res.sendStatus(502)
                } else {
                    res.redirect("/admin")
                }
            })

})

app.get("/admin_add_news", (req, res) => {
    if (req.session.admin_logged_in) {
        res.render("admin_add_news.hbs", {
            layout: "layout_admin"
        })
    } else {
        res.redirect("/admin_login")
    }
})

app.post("/admin_add_news", jsonParser, (req, res) => {

    if (String(req.body.news_description).includes("\r\n")) {
        var mid_desc = ``
        for (var i = 0; i < String(req.body.news_description).split("\r\n").length; i++) {
            if (String(req.body.news_description).split("\r\n")[i].length > 0) {
                if (i != String(req.body.news_description).split("\r\n").length - 1) {
                    mid_desc += String(req.body.news_description).split("\r\n")[i] + "|"
                } else {
                    mid_desc += String(req.body.news_description).split("\r\n")[i]
                }
            }
        }
        var news_description = mid_desc
    } else if (String(req.body.news_description).includes("\n")) {
        var mid_desc = ``
        for (var i = 0; i < String(req.body.news_description).split("\n").length; i++) {
            if (String(req.body.news_description).split("\r\n")[i].length > 0) {
                if (i != String(req.body.news_description).split("\n").length - 1) {
                    mid_desc += String(req.body.news_description).split("\n")[i] + "|"
                } else {
                    mid_desc += String(req.body.news_description).split("\n")[i]
                }    
            }
        }
        var news_description = mid_desc
    } else if (String(req.body.news_description).includes("\r")) {
        var mid_desc = ``
        for (var i = 0; i < String(req.body.news_description).split("\r").length; i++) {
            if (String(req.body.news_description).split("\r\n")[i].length > 0) {
                if (i != String(req.body.news_description).split("\r").length - 1) {
                    mid_desc += String(req.body.news_description).split("\r")[i] + "|"
                } else {
                    mid_desc += String(req.body.news_description).split("\r")[i]
                }
            }
        }
        var news_description = mid_desc
    } else {
        var news_description = req.body.news_description
    }

    var short_news_description = ''
    for (var i = 0; i < news_description.split("|").length; i++) {
        for (var j = 0; j < news_description.split("|")[i].split(" ").length; j++) {
            short_news_description += String(news_description.split("|")[i].split(" ")[j]) + " "
            if (short_news_description.length > 300) {
                break
            }
        }
        if (short_news_description.length > 300) {
            break
        }
    }

    if (String(new Date().getDate()).length == 1) {
        var date = `0${String(new Date().getDate())}`
    } else {
        var date = `${String(new Date().getDate())}`
    }

    if (String(new Date().getMonth() + 1).length == 1) {
        var month = `0${String(new Date().getMonth() + 1)}`
    } else {
        var month = `${String(new Date().getMonth() + 1)}`
    }

    var date = `${date}.${month}.${new Date().getFullYear()}`

    if (typeof(req.files.imgs_paths) != "undefined") {
        var imgs_paths = ''
        for (var i = 0; i < req.files.imgs_paths.length; i++) {
            if (i == req.files.imgs_paths.length - 1) {
                imgs_paths += `/${req.files.imgs_paths[i].path}`
            } else {
                imgs_paths += `/${req.files.imgs_paths[i].path}|`
            }
        }
    } else {
        var imgs_paths = ''
    }

    var title = req.body.news_title

    pool.query("insert into news (title, news_description, imgs_paths, _date, short_news_description) values (?, ?, ?, ?, ?)",
            [title, news_description, imgs_paths, date, short_news_description], (err, results) => {
                if (err) {
                    console.log(err)
                    res.sendStatus(502)
                } else {
                    res.redirect("/admin_news")
                }
            })
})

app.get("/admin_news", (req, res) => {
    if (req.session.admin_logged_in) {
        pool.query("select * from news", (err, result) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                res.render("admin_news.hbs", {
                    layout: "layout_admin",
                    news: result.reverse()
                })
            }
        })
    } else {
        res.redirect("/admin_login")
    }
})

app.post("/delete_news", jsonParser, (req, res) => {
    pool.query("delete from news where id = ?", [req.body.id], (err, result) => {
        if (err) {
            res.sendStatus(err)
            console.log(err)
        } else {
            res.send()
        }
    })
})

app.get("/edit_news/:id", (req, res) => {
    if (req.session.admin_logged_in) {
        pool.query("select * from news where id = ?", [req.params.id], (err, result) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                res.render("admin_edit_news.hbs", {
                    layout: "layout_admin",
                    new: result[0]
                })
            }
        })
    } else {
        res.redirect("/admin_login")
    }
})

app.post("/admin_edit_news/:id", jsonParser, (req, res) => {
    if (String(req.body.news_description).includes("\r\n")) {
        var mid_desc = ``
        for (var i = 0; i < String(req.body.news_description).split("\r\n").length; i++) {
            if (String(req.body.news_description).split("\r\n")[i].length > 0) {
                if (i != String(req.body.news_description).split("\r\n").length - 1) {
                    mid_desc += String(req.body.news_description).split("\r\n")[i] + "|"
                } else {
                    mid_desc += String(req.body.news_description).split("\r\n")[i]
                }
            }
        }
        var news_description = mid_desc
    } else if (String(req.body.news_description).includes("\n")) {
        var mid_desc = ``
        for (var i = 0; i < String(req.body.news_description).split("\n").length; i++) {
            if (String(req.body.news_description).split("\r\n")[i].length > 0) {
                if (i != String(req.body.news_description).split("\n").length - 1) {
                    mid_desc += String(req.body.news_description).split("\n")[i] + "|"
                } else {
                    mid_desc += String(req.body.news_description).split("\n")[i]
                }    
            }
        }
        var news_description = mid_desc
    } else if (String(req.body.news_description).includes("\r")) {
        var mid_desc = ``
        for (var i = 0; i < String(req.body.news_description).split("\r").length; i++) {
            if (String(req.body.news_description).split("\r\n")[i].length > 0) {
                if (i != String(req.body.news_description).split("\r").length - 1) {
                    mid_desc += String(req.body.news_description).split("\r")[i] + "|"
                } else {
                    mid_desc += String(req.body.news_description).split("\r")[i]
                }
            }
        }
        var news_description = mid_desc
    } else {
        var news_description = req.body.news_description
    }

    var short_news_description = ''
    for (var i = 0; i < news_description.split("|").length; i++) {
        for (var j = 0; j < news_description.split("|")[i].split(" ").length; j++) {
            short_news_description += String(news_description.split("|")[i].split(" ")[j]) + " "
            if (short_news_description.length > 300) {
                break
            }
        }
        if (short_news_description.length > 300) {
            break
        }
    }
    var title = req.body.news_title
    pool.query("update news set news_description = ?, title = ?, short_news_description = ? where id = ?", [news_description, title, short_news_description, req.params.id], (err, result) => {
        if (err) {
            console.log(err)
            res.sendStatus(502)
        } else {
            res.redirect("/admin_news")
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
                pool.query("select * from cities", (err_cities, cities) => {
                    if (err_cities) {
                        console.log(err_cities)
                        res.sendStatus(502)
                    } else{
                        pool.query("select * from countries", (err1, countries) => {
                            if (err1) {
                                console.log(err1)
                                res.sendStatus(502)
                            } else {
                                pool.query("select * from specialities", (err2, specialities) => {
                                    if (err2) {
                                        console.log(err2)
                                        res.sendStatus(502)
                                    } else {
                                        pool.query("select * from schedules", (err3, schedules) => {
                                            if (err3) {
                                                console.log(err3)
                                                res.sendStatus(502)
                                            } else {
                                                res.render("admin_edit_vacancy.hbs", {
                                                    layout: "layout_admin",
                                                    vacancy: result[0],
                                                    cities: cities,
                                                    countries: countries,
                                                    specialities: specialities,
                                                    schedules: schedules
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
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

                pool.query("select * from cities", (cities_err, cities) => {
                    if (cities_err) {
                        console.log(cities_err)
                        res.sendStatus(502)
                    } else {
                        pool.query("select * from countries", (err1, countries) => {
                            if (err1) {
                                console.log(err1)
                                res.sendStatus(502)
                            } else {
                                pool.query("select * from specialities", (err2, specialities) => {
                                    if (err2) {
                                        console.log(err2)
                                        res.sendStatus(502)
                                    } else {
                                        pool.query("select * from schedules", (err3, schedules) => {
                                            if (err3) {
                                                console.log(err3)
                                                res.sendStatus(502)
                                            } else {
                                                res.render("admin_main.hbs", {
                                                    layout: "layout_admin",
                                                    vacancies: result.reverse(),
                                                    cities: cities,
                                                    countries: countries,
                                                    specialities: specialities,
                                                    schedules: schedules
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                        
                    }
                })
                
            }
        })
    } else {
        res.redirect("/admin_login")
    }
})

app.get("/update_admin", (req, res) => {
    if (req.session.admin_logged_in) {
        pool.query("select * from admins where id = ?", [req.session.admin_id], (err, admin) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                res.render("change_admin_info.hbs", {
                    layout: 'layout_admin',
                    admin: admin[0]
                })
            }
        })
    } else {
        res.redirect("/admin_login")
    }
})

app.post("/update_admin", jsonParser, (req, res) => {
    pool.query("update admins set email = ?, pass = ? where id = ?", [req.body.email, req.body.password, req.session.admin_id], (err, result) => {
        if (err) {
            console.log(err)
            res.sendStatus(502)
        } else {
            res.redirect("/update_admin")
        }
    })
})

app.get("/admin_usersapplications", jsonParser, (req, res) => {
    if (req.session.admin_logged_in) {
        pool.query("select * from applications", (err, applications) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                res.render("admin_usersapplications.hbs", {
                    layout: 'layout_admin',
                    applications: applications.reverse()
                })
            }
        })
    } else {
        res.redirect("/admin_login")
    }
})

app.get("/admin_birthdays", (req, res) => {
    if (req.session.admin_logged_in) {
        var month = String(new Date().getMonth() + 1)
        if (month.length == 1) {
            var month = "0" + String(new Date().getMonth() + 1)
        }

        var date = String(new Date().getDate())
        if (date.length == 1) {
            var date = "0" + String(new Date().getDate())
        }

        var date = `${new Date().getFullYear()}-${month}-${date}`
        pool.query("select * from users where birthday = ?", [date], (err, users) => {
            if (err) {
                console.log(err)
                res.sendStatus(502)
            } else {
                res.render("admin_birthdays.hbs", {
                    layout: "layout_admin",
                    menu: true,
                    users: users
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