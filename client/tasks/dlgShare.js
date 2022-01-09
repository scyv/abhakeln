import { Lists } from "../../both/collections";
import { selectedList, masterKey } from "../storage";
import { Encryption } from "../encryption";
import { Session } from "meteor/session";

import "./dlgShare.html";

const crypto = new Encryption();

Template.dlgShareList.helpers({
    list() {
        const list = Lists.findOne(selectedList.get());
        return list ? crypto.decryptListData(list, Meteor.userId(), masterKey.get()) : "";
    },
    sharedInfo() {
        return Session.get("SHARE_INFO");
    },
});

Template.dlgShare_userNameWithX.events({
    "click .btnRemoveShare"() {
        const userId = this._id;
        const userName = this.username;
        const listId = selectedList.get();
        $("#dlgConfirmRemoveShare")
            .modal({
                allowMultiple: true,
                closable: false,
                onApprove: function () {
                    Meteor.call("removeFromList", listId, userId, (err) => {
                        Meteor.call("getShareInfo", listId, (_, info) => {
                            Session.set("SHARE_INFO", info);
                        });
                        if (!err) {
                            $("body").toast({
                                title: "Liste nicht mehr geteilt.",
                                class: "green",
                                message: "Die Liste ist nun nicht mehr mit " + userName + " geteilt",
                                showProgress: "bottom",
                                position: "bottom right",
                                displayTime: 3000,
                            });
                        }
                    });
                },
            })
            .modal("show");
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
