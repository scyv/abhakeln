import { Lists } from "../../both/collections";
import { selectedList, masterKey } from "../storage";
import { Encryption } from "../encryption";
import { uistate } from "../main";

import "./dlgFolder.html";

const crypto = new Encryption();

Template.dlgFolder.helpers({
    listFolder() {
        const list = Lists.findOne(selectedList.get());
        return list ? crypto.decryptListData(list, Meteor.userId(), masterKey.get()).folder : "";
    },
});

Template.dlgFolder_confirm.events({
    "click .button"() {
        const id = selectedList.get();
        const newFolder = $("#newFolder").val().trim();
        const list = Lists.findOne(selectedList.get());
        list.folder = newFolder;
        const encryptedList = crypto.encryptListData(list, Meteor.userId(), masterKey.get());
        Meteor.call("setFolder", id, encryptedList.folder, () => {
            uistate.taskMenuVisible.set(false);
        });
    },
});
