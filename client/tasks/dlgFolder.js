import { Lists } from "../../both/collections";
import { selectedList, masterKey } from "../storage";
import { Encryption } from "../encryption";
import { uistate } from "../main";

import "./dlgFolder.html";

const crypto = new Encryption();

Template.dlgFolder.helpers({
    list() {
        const list = Lists.findOne(selectedList.get());
        return list ? crypto.decryptListData(list, Meteor.userId(), masterKey.get()) : "";
    },
});

Template.dlgFolder_folders.helpers({
    folders() {
        const lists = Lists.find();
        const folders = [];
        lists.forEach((list) => {
            const decryptedList = crypto.decryptListData(list, Meteor.userId(), masterKey.get());
            if (decryptedList.folder && !folders.includes(decryptedList.folder)) {
                folders.push(decryptedList.folder);
            }
        });
        folders.sort();
        return folders;
    },
});

Template.dlgFolder_folders.events({
    "click .tag"(evt) {
        $("#newFolder").val(evt.target.textContent);
    },
});

Template.dlgFolder_confirm.events({
    "click .button"() {
        const id = selectedList.get();
        const newFolder = $("#newFolder").val().trim();
        const list = Lists.findOne(selectedList.get());
        list.folder = newFolder;
        const encryptedList = crypto.encryptListData(list, Meteor.userId(), masterKey.get());
        Meteor.call("setFolder", id, encryptedList.folder, (err) => {
            if (err) {
                $("body").toast({
                    title: "Liste nicht gruppiert.",
                    class: "red",
                    message: "Die Liste wurde nicht gruppiert: " + err,
                    showProgress: "bottom",
                    position: "bottom right",
                    displayTime: 10000,
                });
            } else {
                $("body").toast({
                    title: "Liste gruppiert.",
                    class: "green",
                    message: "Die Liste wurde gruppiert in: " + newFolder,
                    showProgress: "bottom",
                    position: "bottom right",
                    displayTime: 3000,
                });
            }
            uistate.taskMenuVisible.set(false);
        });
    },
});
