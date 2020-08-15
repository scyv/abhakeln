import { Lists } from "../../both/collections";
import { selectedList, masterKey } from "../storage";
import { Encryption } from "../encryption";

import "./dlgShare.html";

const crypto = new Encryption();

Template.dlgShareList.helpers({
    list() {
        const list = Lists.findOne(selectedList.get());
        return list ? crypto.decryptListData(list, Meteor.userId(), masterKey.get()) : "";
    },
});

Template.dlgShare_confirm.events({
    "click .button"() {
        const shareWith = $("#shareWith").val();
        const listId = selectedList.get();
        const listKey = crypto.decryptListKey({ _id: listId });
        const encryptedListKey = crypto.encrypt(listKey, $("#tmpListPassword").val());

        Meteor.call("shareList", listId, encryptedListKey, shareWith, (err) => {
            if (err) {
                $("body").toast({
                    title: "Liste NICHT geteilt.",
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
                    message: "Die Liste wurde mit " + shareWith + " geteilt. ",
                    showProgress: "bottom",
                    position: "bottom right",
                    displayTime: 3000,
                });
            }
        });
    },
});
