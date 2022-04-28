const fs = require("fs");
const path = require("path");
const url = require("url");
const express = require("express");
const app = express();
const hljs = require("highlight.js");
const bparse = require("body-parser");

//let text = "//#define IMGUI_DISABLE_DEFAULT_FORMAT_FUNCTIONS            // Don't implement ImFormatString/ImFormatStringV so you can implement them yourself (e.g. if you don't want to link with vsnprintf)";
//console.log(highlightContent(text, "c"));

let totalContents = "";
let shouldBuffer = false;
let shouldReturn = false;
let counter = 0;
let lang = "";

function highlightContent(code, language) {
    if (!shouldBuffer) {
        //console.log(code);
        let part = code.split("\n");
        let returnString = "<ol>\n";
        part.forEach(line => {
            if (language == "NONE" || !language) {
                returnString += "<li class=\"lineNum\">"
                hljs.highlight(line, {language: "plaintext"}).value + "\n" + "</li>\n";
            } else {
                returnString += "<li class=\"lineNum\">" +
                hljs.highlight(line, {language: language}).value + "\n"+ "</li>\n";
            }
        });
        let out = returnString.slice(0, -1);
        out += "</ol>\n";
        totalContents = out;
        shouldReturn = true;
        //return "yes";
    }
    else {
        totalContents += code;
    }
}

function getHighlighted() {
    let p = new Promise((res, rej) => {
        let id = counter;
        counter++;
        while (!shouldReturn) {}
        let regStr = ".{0,"+Math.ceil(totalContents.length/counter)+"}";
        let reg = new RegExp(regStr, "gs");
        let parts = totalContents.match(reg);
        //console.log(parts[id]);
        res(parts[id]);
    });
    return p;
}

const fileAssociations = JSON.parse(fs.readFileSync("data/fileAssociations.json"));

app.use("/libs", express.static("libs"));
app.use("/data", express.static("data"));
app.use("/public", express.static("public"));

app.use(bparse.urlencoded({type: "*/*", extended: true, limit: "10mb"}));

app.get("/", (req, res) => {
    let html = fs.readFileSync(__dirname + "/index.html");
    //let page = html.toString().split("\n");
    let page = html.toString().split("<pre><code");
    let returnText = "";
    page.forEach(line => {
        let stripped = line.split("</code></pre>");
        if (stripped.length == 2) {
            let s = stripped[0].split(">", 2);
            //highlightContent(s[1], "python")
            returnText += "<pre><code" +
            s[0] +
            " class=\"hljs\">" +
            s[1] +
            "</code></pre>" +
            stripped[1];
        } else {
            stripped.forEach(e => returnText += e);
        }
    });
    res.send(returnText);
});

app.get("/ext", (req, res) => {
    var filename = url.parse(req.url, true).query["f"];
    var extension = path.extname(filename);
    if (!extension) {res.send("NONE");}
    else {res.send(fileAssociations[extension]);}
    res.status(200).end();
});

app.post("/test", (req, res) => {
    let contents = req.body.contents;
    console.log(contents);
});

app.post("/highlight", (req, res) => { 
    let contents = req.body.contents;
    if (req.body.lang == "START") {
        totalContents = "";
        shouldBuffer = true;
        shouldReturn = false;
        counter = 0;
        res.send("");
    }
    else if (req.body.lang == "NONE" || !req.body.lang) {
        lang = "plaintext";
        highlightContent(contents, "plaintext");
        getHighlighted()
        .then(code => res.send(code));
    } else if (req.body.lang == "END") {
        //we know all the code has been sent if end has been
        //so we can stop buffering, highlight the code, and
        //fulfill the Promises
        shouldBuffer = false;
        highlightContent(totalContents, lang);
        //shouldReturn = true;
        res.send("");
    } else {
        lang = req.body.lang;
        highlightContent(contents, lang);
        getHighlighted()
        .then(code => res.send(code));
    }
});

app.listen(80, () => {
    console.log("Listening...");
})