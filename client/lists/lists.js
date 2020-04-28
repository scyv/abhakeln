import "./lists.html";
import { Encryption } from "../encryption";
import { masterKey, selectedList } from "../storage";
import { Lists } from "../../both/collections";

import { listsHandle } from "../main";

const crypto = new Encryption();

Template.lists.helpers({
    listsLoading() {
        return !listsHandle.ready();
    },
    lists() {
        const userId = Meteor.userId();
        const key = masterKey.get();
        return Lists.find().map((encryptedList) => {
            return crypto.decryptListData(encryptedList, userId, key);
        });
    },
    dueItems() {
        return 0;
    },
    isActive() {
        return selectedList.get() === this._id ? "selected" : "";
    },
});

Template.lists.events({
    "click #listitems .item"() {
        selectedList.set(this._id);
    },
    "keydown .compCreateList input"(evt) {
        if (evt.keyCode === 13) {
            const listData = {
                name: evt.target.value.trim(),
            };
            if (listData.name === "") {
                return;
            }
            const encryptedListData = crypto.encryptListData(listData, Meteor.userId(), masterKey.get(), true);
            Meteor.call("createList", encryptedListData, (err, listId) => {
                if (err) {
                    alert(err);
                } else {
                    evt.target.value = "";
                    selectedList.set(listId);
                }
            });
        }
    },
});
