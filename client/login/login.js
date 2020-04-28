import { Meteor } from "meteor/meteor";
import { Encryption } from "../encryption";
import { masterKey } from "../storage";

import "./login.html";

const crypto = new Encryption();

function login() {
    const username = $("#inpUsername").val();
    var password = $("#inpPassword").val();

    Meteor.loginWithPassword({ username: username }, password, (err) => {
        if (err) {
            alert("Fehler: " + err.reason, "ERROR");
        } else {
            masterKey.set(crypto.hash(password));
        }
    });
}

Template.login.events({
    "keydown #inpPassword": (evt) => {
        if (evt.keyCode === 13) {
            login();
        }
    },
    "click .btnLogin": () => {
        login();
    },
    "click .btnCreateAccount": () => {
        var password = $("#inpPassword").val();
        var username = $("#inpUsername").val();

        var user = {
            username: username,
            password: password,
            profile: {
                settings: {},
            },
        };

        Accounts.createUser(user, (err) => {
            if (err) {
                alert("Fehler: " + err.reason, "ERROR");
            } else {
                masterKey.set(crypto.hash(password));
            }
        });
    },
});
