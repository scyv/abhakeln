import { Lists } from "../../both/collections";
import { selectedList, masterKey } from "../storage";
import { Encryption } from "../encryption";
import { uistate } from "../main";

import "./dlgRenameList.html";

const crypto = new Encryption();

Template.dlgRenameList.helpers({
    listName() {
        const list = Lists.findOne(selectedList.get());
        return list ? crypto.decryptListData(list, Meteor.userId(), masterKey.get()).name : "";
    },
});

Template.dlgRenameList_confirm.events({
    "click .button"() {
        const id = selectedList.get();
        const newName = $("#newListName").val().trim();
        const list = Lists.findOne(selectedList.get());
        list.name = newName;
        const encryptedList = crypto.encryptListData(list, Meteor.userId(), masterKey.get());
        Meteor.call("renameList", id, encryptedList.name, (err) => {
            if (err) {
                $("body").toast({
                    title: "Liste nicht umbenannt!",
                    class: "red",
                    message: "Die Liste wurde nicht umbenannt: " + err,
                    showProgress: "bottom",
                    position: "bottom right",
                    displayTime: 10000,
                });
            } else {
                $("body").toast({
                    title: "Liste umbenannt.",
                    class: "green",
                    message: "Die Liste wurde umbenannt in: " + newName,
                    showProgress: "bottom",
                    position: "bottom right",
                    displayTime: 3000,
                });
            }

            uistate.taskMenuVisible.set(false);
        });
    },
});
