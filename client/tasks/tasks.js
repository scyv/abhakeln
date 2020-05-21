import { Template } from "meteor/templating";
import { Tasks, Lists } from "../../both/collections";
import { showDoneTasks, selectedList, masterKey, selectedTask } from "../storage";
import { Encryption } from "../encryption";
import { uistate, tasksHandle, listsHandle, doneTasksHandle } from "../main";

import "./tasks.html";
import "./dlgRenameList";

const crypto = new Encryption();
Template.tasks.events({
    "click .navBack"() {
        uistate.showDetails.set(false);
        uistate.currentView.set(uistate.VIEW_LISTS);
        selectedTask.set(null);
        selectedList.set(null);
        history.pushState(null, "", "/");
    },
    "click #tasks .burger-button"() {
        uistate.taskMenuVisible.set(!uistate.taskMenuVisible.get());
    },
    "click .miRenameList"() {
        $("#dlgRenameList").modal("show");
    },

    "click #opentasks .ah-checkbox .ah-checkbox-check, click #donetasks .ah-checkbox .ah-checkbox-check"() {
        Meteor.call("toggleTaskDone", this);
        return false;
    },
    "click #opentasks label.ah-checkbox, click #donetasks label.ah-checkbox"() {
        selectedTask.set(this._id);
        uistate.showDetails.set(true);
        history.pushState(null, this.task, "/list/" + this.list + "/task/" + this._id);
        uistate.currentView.set(uistate.VIEW_DETAILS);
        return false;
    },
    "input #showDone"() {
        showDoneTasks.set(!showDoneTasks.get());
    },
    "keydown .compCreateTask input"(evt) {
        if (evt.keyCode === 13) {
            const list = Lists.findOne(selectedList.get());
            if (!list) return;
            const taskData = {
                task: evt.target.value.trim(),
                list: list._id,
            };
            if (taskData.task === "") {
                return;
            }

            const encryptedTaskData = crypto.encryptItemData(taskData, list, Meteor.userId(), masterKey.get());
            Meteor.call("createTask", encryptedTaskData, (err, taskId) => {
                if (err) {
                    alert(err);
                } else {
                    evt.target.value = "";
                }
            });
        }
    },
});

const decryptTask = (task) => {
    return crypto.decryptItemData(task, Lists.findOne(task.list), Meteor.userId(), masterKey.get());
};

Template.tasks.helpers({
    tasksLoading() {
        return !(listsHandle.ready && tasksHandle.ready);
    },
    listname() {
        const userId = Meteor.userId();
        const key = masterKey.get();
        const list = Lists.findOne(selectedList.get());
        if (!list) {
            return "";
        }
        return crypto.decryptListData(list, userId, key).name;
    },
    showDoneEntries() {
        const showDone = showDoneTasks.get();
        return showDone;
    },
    dueDate() {
        if (!this.dueDate) {
            return null;
        }
        const date = new Date(this.dueDate);
        const day = date.getDate() + "";
        const month = date.getMonth() + 1 + "";
        const year = date.getFullYear() + "";
        return day.padStart(2, "0") + "." + month.padStart(2, "0") + "." + year.padStart(4, "0");
    },
    opentasks() {
        return Tasks.find({ done: false, list: selectedList.get() }, { sort: { createdAt: -1 } }).map(decryptTask);
    },
    donetasks() {
        return doneTasksHandle.ready() && Tasks.find({ done: true }, { sort: { doneAt: -1 } }).map(decryptTask);
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
});
