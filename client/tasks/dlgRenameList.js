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
        Meteor.call("renameList", id, encryptedList.name, () => {
            uistate.taskMenuVisible.set(false);
        });
    },
});
