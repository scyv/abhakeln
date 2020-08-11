import "./lists.html";

import { Encryption } from "../encryption";
import { masterKey, selectedList, selectedTask, resetStorage, showLandingPage } from "../storage";
import { Lists, Tasks, COLLECTIONS } from "../../both/collections";

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
    listTree() {
        const userId = Meteor.userId();
        const key = masterKey.get();
        const folders = {};
        const tree = [];
        Lists.find().forEach((encryptedList) => {
            const list = crypto.decryptListData(encryptedList, userId, key);
            if (list.folder) {
                let folder = folders[list.folder];
                if (!folder) {
                    folder = { folder: list.folder, lists: [] };
                    folders[list.folder] = folder;
                    tree.push(folder);
                }
                folder.lists.push(list);
                folder.lists.sort((a, b) => {
                    return a.name < b.name ? -1 : a.name === b.name ? 0 : 1;
                });
            } else {
                tree.push(list);
            }
        });
        tree.sort((a, b) => {
            if (a.folder && b.folder) {
                // both are folder
                return a.folder < b.folder ? -1 : a.folder === b.folder ? 0 : 1;
            } else if (a.folder) {
                // only a is folder
                return 1;
            } else if (b.folder) {
                // only b is folder
                return -1;
            }

            // no folder
            return a.name < b.name ? -1 : a.name === b.name ? 0 : 1;
        });
        return tree;
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

Template.list.helpers({
    dueItems() {
        const now = new Date().toISOString();
        return Tasks.find({ list: this._id })
            .fetch()
            .reduce((prev, cur) => prev + (!cur.done && cur.dueDate < now ? 1 : 0), 0);
    },
    isActive() {
        return selectedList.get() === this._id ? "selected" : "";
    },
});

Template.lists.events({
    "click #listitems .item"() {
        selectedList.set(this._id);
        uistate.currentView.set(uistate.VIEW_TASKS);
        uistate.showDetails.set(false);
        uistate.listMenuVisible.set(false);
        uistate.taskMenuVisible.set(false);
        uistate.detailMenuVisible.set(false);
        selectedTask.set(null);
        history.pushState(null, this.name, "/list/" + this._id);
    },
    "click .compCreateList .link"() {
        const input = $(".compCreateList input");
        const listData = {
            name: input.val().trim(),
        };
        if (listData.name === "") {
            return;
        }
        const encryptedListData = crypto.encryptListData(listData, Meteor.userId(), masterKey.get(), true);
        Meteor.call("createList", encryptedListData, (err, listId) => {
            if (err) {
                alert(err);
            } else {
                input.val("");
                selectedList.set(listId);
                window.setTimeout(() => {
                    $(`.id-${listId}`)[0].scrollIntoView();
                }, 500);
                Meteor.subscribe(COLLECTIONS.LISTS);
                Meteor.subscribe(COLLECTIONS.TASKS);
            }
        });
    },
    "keydown .compCreateList input"(evt) {
        if (evt.keyCode === 13) {
            $(".compCreateList .link").click();
        }
    },
    "click #lists .burger-button"() {
        uistate.listMenuVisible.set(!uistate.listMenuVisible.get());
    },
    "click .miImportFromWunderlist"() {
        $("#dlgWunderlistImport").modal("show");
    },
    "click .miLogout"() {
        resetStorage();
        uistate.listMenuVisible.set(false);
        history.replaceState(null, "/", "/");
        Accounts.logout();
    },
    "click .clickableTitle"() {
        history.pushState(null, "/", "/");
        uistate.currentView.set(uistate.VIEW_LANDING);
        showLandingPage.set(true);
    },
});
