import "./landing.html";
import { showLandingPage, cookieBannerShowed } from "../storage";

Template.landing.onRendered(() => {
    window.setTimeout(() => {
        $(".masthead").visibility({
            once: false,
            onBottomPassed: function () {
                $(".fixed.menu").transition("fade in");
            },
            onBottomPassedReverse: function () {
                $(".fixed.menu").transition("fade out");
            },
        });

        // create sidebar and attach to menu open
        $(".ui.sidebar").sidebar("attach events", ".toc.item");
    }, 1000);

    if (!cookieBannerShowed.get()) {
        window.setTimeout(() => {
            $("body").toast({
                title: "Hallo!",
                class: "blue",
                message:
                    "Diese Seite verwendet KEINE Cookies. Es werden keine Nutzungsprofile und keine Nutzungsanalysen erstellt. Es werden auch keine Zugriffe Serverseitig geloggt. Klicken Sie hier, falls das für Sie OK ist.",
                showProgress: "bottom",
                position: "bottom right",
                displayTime: 60000,
            });
            cookieBannerShowed.set(true);
        }, 2000);
    }
});

Template.landing.helpers({
    loginText() {
        if (Meteor.userId()) {
            return "Zur App";
        } else {
            return "Einloggen";
        }
    },
});

Template.landing.events({
    "click .lmiLogin"() {
        showLandingPage.set(false);
    },
});
