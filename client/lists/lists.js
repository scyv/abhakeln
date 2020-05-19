import "./lists.html";

import { Encryption } from "../encryption";
import { masterKey, selectedList, selectedTask } from "../storage";
import { Lists, Tasks } from "../../both/collections";

import { listsHandle, uistate } from "../main";

const crypto = new Encryption();

Template.lists.onRendered(() => {
    const determineWideScreen = () => {
        uistate.isMobile.set(window.innerWidth < 769);
    };
    $(window).on("resize", _.debounce(determineWideScreen, 100));
    determineWideScreen();
});
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
        const now = new Date().toISOString();
        return Tasks.find({ list: this._id })
            .fetch()
            .reduce((prev, cur) => prev + (!cur.done && cur.dueDate < now ? 1 : 0), 0);
    },
    isActive() {
        return selectedList.get() === this._id ? "selected" : "";
    },
    showLists() {
        if (uistate.isMobile.get() && uistate.currentView.get() !== "lists") {
            return false;
        }
        return true;
    },
    showTasks() {
        if (uistate.isMobile.get() && uistate.currentView.get() !== "tasks") {
            return false;
        }
        return selectedList.get() ? true : false;
    },
    showDetails() {
        if (uistate.isMobile.get() && uistate.currentView.get() !== "details") {
            return false;
        }
        return uistate.showDetails.get();
    },
    menuVisible() {
        return uistate.listMenuVisible.get() ? "is-active" : "";
    },
});

Template.lists.events({
    "click #listitems .item"() {
        selectedList.set(this._id);
        uistate.currentView.set(uistate.VIEW_TASKS);
        uistate.showDetails.set(false);
        selectedTask.set(null);
        history.pushState(null, this.name, "/list/" + this._id);
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
    "click #lists .burger-button"() {
        uistate.listMenuVisible.set(!uistate.listMenuVisible.get());
    },
    "click .miImportFromWunderlist"() {
        $("#dlgWunderlistImport").modal("show");
    },
});
