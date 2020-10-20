import { Encryption } from "../encryption";
import { masterKey, selectedList, selectedTask, resetStorage, showLandingPage } from "../storage";
import { Lists, Tasks, COLLECTIONS, Shares } from "../../both/collections";
import { WebNotifications } from "../notifications/web-notifications";

import { listsHandle, sharesHandle, uistate } from "../main";

import "./lists.html";
import "./dlgEnterList";

const now = new Date();
const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const startOfWeek = new Date();
startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() == 0 ? -6 : 1));
startOfWeek.setHours(0, 0, 0, 0);

const endOfWeek = new Date();
endOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay() + (endOfWeek.getDay() == 0 ? 0 : 7));
endOfWeek.setHours(23, 59, 59, 999);

const virtualListOverdue = {
    _id: "v-overdue",
    virtual: 1,
    name: "Überfällig",
    icon: "bell",
    owners: [],
    query: { done: false, dueDate: { $lte: now.toISOString() } },
};
const virtualListToday = {
    _id: "v-today",
    virtual: 2,
    name: "Heute",
    icon: "clock",
    owners: [],
    query: { done: false, $and: [{ dueDate: { $lte: endOfDay.toISOString() } }, { dueDate: { $gte: startOfDay.toISOString() } }] },
};
const virtualListThisWeek = {
    _id: "v-thisweek",
    virtual: 3,
    name: "Diese Woche",
    icon: "calendar alternate",
    owners: [],
    query: { done: false, $and: [{ dueDate: { $lte: endOfWeek.toISOString() } }, { dueDate: { $gte: startOfWeek.toISOString() } }] },
};
export const virtualLists = {
    "v-overdue": virtualListOverdue,
    "v-today": virtualListToday,
    "v-thisweek": virtualListThisWeek,
};

const crypto = new Encryption();

Template.lists.onRendered(() => {
    const determineWideScreen = () => {
        uistate.isMobile.set(window.innerWidth < 769);
    };
    $(window).on("resize", _.debounce(determineWideScreen, 100));
    determineWideScreen();

    Meteor.setInterval(() => {
        const now = new Date().toISOString();
        const oneHourPast = new Date(new Date() - 60000 * 60).toISOString();
        Tasks.find({ done: false, reminder: { $lte: now }, $or: [{ remindedAt: null }, { remindedAt: { $lte: oneHourPast } }] }).forEach((task) => {
            const send = () => {
                const decryptedTask = crypto.decryptItemData(task, Lists.findOne(task.list), Meteor.userId(), masterKey.get());
                WebNotifications.notify("Erinnerung", decryptedTask.task);
                Meteor.call("taskReminded", task._id);
            };
            _.debounce(send, 500)();
        });
    }, 60000);
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

        tree.push(virtualListOverdue);
        tree.push(virtualListToday);
        tree.push(virtualListThisWeek);

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
        sortListTree(tree);
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
    sharedLists() {
        return sharesHandle.ready() && Shares.find().count();
    },
    blinkOrNot() {
        return sharesHandle.ready() && Shares.find().count() ? "blinking" : "";
    },
});

Template.list.helpers({
    dueItems() {
        if (this.virtual) {
            return Tasks.find(this.query).count();
        }
        const now = new Date().toISOString();
        return Tasks.find({ list: this._id })
            .fetch()
            .reduce((prev, cur) => prev + (!cur.done && cur.dueDate < now ? 1 : 0), 0);
    },
    isActive() {
        return selectedList.get() === this._id ? "selected" : "";
    },
    isVirtual() {
        return this.virtual ? "virtual" : "";
    },
    isShared() {
        return this.owners.length > 1;
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
    "click .miSharedLists"() {
        $("#dlgEnterList").modal("show");
    },
});

function sortListTree(tree) {
    tree.sort((a, b) => {
        if (a.virtual && b.virtual) {
            a.virtual < b.virtual ? -1 : a.virtual === b.virtual ? 0 : 1;
        } else if (a.virtual) {
            return -1;
        } else if (b.virtual) {
            return 1;
        }
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
}
