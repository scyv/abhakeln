import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Sortable } from "sortablejs";

import { Tasks, Lists } from "../../both/collections";
import { showDoneTasks, selectedList, masterKey, selectedTask } from "../storage";
import { Encryption } from "../encryption";
import { uistate, tasksHandle, listsHandle, doneTasksHandle } from "../main";
import { virtualLists } from "../lists/lists";

import "./tasks.html";
import "./dlgRenameList";
import "./dlgFolder";
import "./dlgShare";

const crypto = new Encryption();

Template.tasks.onRendered(() => {
    Meteor.setTimeout(() => {
        const els = document.querySelectorAll("#tasklist .sortable");
        for (let i = 0; i < els.length; i++) {
            new Sortable(els[i], {
                group: "tasks",
                // handle: ".right.floated",
                draggable: ".ah-checkbox",
                ghostClass: "sortable-ghost",
                delay: 400,
                delayOnTouchOnly: true,
                onUpdate: function () {
                    const sortOrder = [];
                    $("#opentasks .ah-checkbox").each((_, elem) => {
                        sortOrder.push($(elem).data("id"));
                    });
                    Meteor.call("updateSortOrder", selectedList.get(), sortOrder);
                },
            });
        }
    }, 1000);
});

Template.tasks.events({
    "click .navBack"() {
        uistate.showDetails.set(false);
        uistate.currentView.set(uistate.VIEW_LISTS);
        selectedTask.set(null);
        selectedList.set(null);
        uistate.taskMenuVisible.set(false);
        uistate.detailMenuVisible.set(false);
        history.pushState(null, "", "/");
    },
    "click .compNoTasks"() {
        $(".compCreateTask input").trigger("focus");
    },
    "click #tasks .burger-button"() {
        uistate.taskMenuVisible.set(!uistate.taskMenuVisible.get());
    },
    "click .miRenameList"() {
        $("#dlgRenameList").modal("show");
    },
    "click .miShareList"() {
        Meteor.call("getShareInfo", this._id, (_, info) => {
            Session.set("SHARE_INFO", info);
        });

        $("#dlgShareList")
            .modal({
                allowMultiple: true,
            })
            .modal("show");
    },
    "click .miSetFolder"() {
        $("#dlgFolder").modal("show");
    },
    "click .miLeaveList"() {
        const listId = selectedList.get();
        $("#tasks .navBack").trigger("click");
        Meteor.call("leaveList", listId, (err) => {
            if (!err) {
            } else {
                $("body").toast({
                    title: "Liste verlassen.",
                    class: "green",
                    message: "Sie haben die Liste verlassen.",
                    showProgress: "bottom",
                    position: "bottom right",
                    displayTime: 3000,
                });
            }
        });
    },
    "click .miDeleteList"() {
        const listId = selectedList.get();
        $("#tasks .navBack").trigger("click");
        Meteor.call("deleteList", listId, (err) => {
            if (err) {
                $("body").toast({
                    title: "Liste nicht gelöscht!",
                    class: "red",
                    message: "Die Liste wurde nicht gelöscht: " + err,
                    showProgress: "bottom",
                    position: "bottom right",
                    displayTime: 10000,
                });
            } else {
                $("body").toast({
                    title: "Liste gelöscht.",
                    class: "green",
                    message: "Die Liste wurde gelöscht",
                    showProgress: "bottom",
                    position: "bottom right",
                    displayTime: 3000,
                });
            }
        });
    },
    "click #opentasks .ah-checkbox .ah-checkbox-check, click #donetasks .ah-checkbox .ah-checkbox-check"(evt) {
        window.requestAnimationFrame(() => {
            evt.target.parentElement.classList.add("fadeOut");
            window.setTimeout(() => {
                Meteor.call("toggleTaskDone", this);
            }, 200);
        });
        return false;
    },
    "click #opentasks label.ah-checkbox, click #donetasks label.ah-checkbox"(evt) {
        evt.preventDefault();
        selectedTask.set(this._id);
        uistate.showDetails.set(true);
        uistate.listMenuVisible.set(false);
        uistate.taskMenuVisible.set(false);
        uistate.detailMenuVisible.set(false);
        history.pushState(null, this.task, "/list/" + this.list + "/task/" + this._id);
        uistate.currentView.set(uistate.VIEW_DETAILS);
        return false;
    },
    "input #showDone"() {
        showDoneTasks.set(!showDoneTasks.get());
    },
    "click .compCreateTask .link"() {
        const list = Lists.findOne(selectedList.get());
        const input = $(".compCreateTask input");
        if (!list) return;
        const taskData = {
            task: input.val().trim(),
            list: list._id,
        };
        if (taskData.task === "") {
            return;
        }

        const encryptedTaskData = crypto.encryptItemData(taskData, list, Meteor.userId(), masterKey.get());
        Meteor.call("createTask", encryptedTaskData, (err) => {
            if (err) {
                alert(err);
            } else {
                input.val("");
            }
        });
    },
    "keydown .compCreateTask input"(evt) {
        if (evt.keyCode === 13) {
            $(".compCreateTask .link").click();
        }
    },
    "click .compTasksHeader .listName"() {
        $("#dlgRenameList").modal("show");
    },
});

const decryptTask = (list) => (task) => {
    return crypto.decryptItemData(task, list || Lists.findOne(task.list), Meteor.userId(), masterKey.get());
};

const decryptList = (listId) => {
    const userId = Meteor.userId();
    const key = masterKey.get();

    if (listId.indexOf("v-") >= 0) {
        return virtualLists[listId];
    }
    const list = Lists.findOne(listId);
    if (!list) {
        return null;
    }
    return crypto.decryptListData(list, userId, key);
};

Template.tasks.helpers({
    tasksLoading() {
        return !(listsHandle.ready && tasksHandle.ready);
    },
    list() {
        return decryptList(selectedList.get());
    },
    shared() {
        return this.owners.length > 1;
    },
    showDoneEntries() {
        const showDone = showDoneTasks.get();
        return showDone;
    },
    opentasks() {
        const selectedListId = selectedList.get();
        if (selectedListId.indexOf("v-") >= 0) {
            return Tasks.find(virtualLists[selectedListId].query, {
                sort: { dueDate: 1 },
            }).map(decryptTask());
        }

        return Tasks.find({ done: false, list: selectedListId }, { sort: { sortOrder: 1, createdAt: -1 } }).map(
            decryptTask(this)
        );
    },
    donetasks() {
        return doneTasksHandle.ready() && Tasks.find({ done: true }, { sort: { doneAt: -1 } }).map(decryptTask(this));
    },
    isreminder() {
        return this.reminder < new Date().toISOString() ? "red" : "";
    },
    isdue() {
        return this.dueDate < new Date().toISOString() ? "red" : "";
    },
    hasNotes() {
        return this.notes;
    },
    menuVisible() {
        return uistate.taskMenuVisible.get() ? "is-active" : "";
    },
    listName() {
        return decryptList(this.list).name;
    },
});
