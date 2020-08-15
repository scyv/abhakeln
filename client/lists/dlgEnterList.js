import { Shares } from "../../both/collections";
import { selectedList, masterKey } from "../storage";
import { Encryption } from "../encryption";

import "./dlgEnterList.html";

const crypto = new Encryption();

Template.dlgEnterList.helpers({
    share() {
        return Shares.findOne();
    },
});

Template.dlgEnterList_confirm.events({
    "click .button"() {
        const key = crypto.decrypt(this.listKey, $("#listPassword").val());
        const encryptedListKey = crypto.encrypt(key, masterKey.get());
        Meteor.call("enterList", this.listId, encryptedListKey, (err) => {
            if (err) {
                $("body").toast({
                    title: "Liste NICHT beigetreten.",
                    class: "red",
                    message: err.error,
                    showProgress: "bottom",
                    position: "bottom right",
                    displayTime: 10000,
                });
            } else {
                $("body").toast({
                    title: "Liste geteilt.",
                    class: "green",
                    message: "Liste beigetreten.",
                    showProgress: "bottom",
                    position: "bottom right",
                    displayTime: 3000,
                });
            }
        });
    },
});
