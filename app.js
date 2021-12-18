const express = require('express')
const hbs = require('hbs')
const { engine } = require("express-handlebars");
var bodyParser = require('body-parser');

const app = express()

const jsonParser = express.json();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000
app.set('port', PORT);
app.use('/static', express.static(__dirname + '/static'));

app.set("view engine", "hbs");

app.get("/", (req, res) => {
    res.render("main.hbs", {
        layout: "layout_not_login"
    })
})

app.get("/logged_in", (req, res) => {
    res.render("main.hbs", {
        layout: "layout_login"
    })
})

app.get("/login", (req, res) => {
    res.render("login.hbs", {
        layout: "layout_forms"
    })
})

app.get("/registration", (req, res) => {
    res.render("register.hbs", {
        layout: "layout_forms"
    })
})

app.get("/vacancy", (req, res) => {
    res.render("vacancy.hbs", {
        layout: "layout_login"
    })
})

app.get("/profile_personal_data", (req, res) => {
    res.render("profile_personal_data.hbs", {
        layout: "layout_login"
    })
})

app.get("/profile_contacts", (req, res) => {
    res.render("profile_contacts.hbs", {
        layout: "layout_login"
    })
})

app.get("/profile_favorites", (req, res) => {
    res.render("profile_favorites.hbs", {
        layout: "layout_login"
    })
})

app.get("/profile_answers", (req, res) => {
    res.render("profile_answers.hbs", {
        layout: "layout_login"
    })
})

app.listen(PORT, () => {
    console.log(PORT)
})