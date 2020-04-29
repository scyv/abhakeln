import { Template } from "meteor/templating";
import { Tasks, Lists } from "../../both/collections";
import { showDoneTasks, selectedList, masterKey, selectedTask } from "../storage";
import { Encryption } from "../encryption";
import { uistate, tasksHandle, listsHandle } from "../main";

import "./tasks.html";

const crypto = new Encryption();

Template.tasks.events({
    "click #opentasks .ah-checkbox .ah-checkbox-check, click #donetasks .ah-checkbox .ah-checkbox-check"() {
        Meteor.call("toggleTaskDone", this);
        return false;
    },
    "click #opentasks label.ah-checkbox, click #donetasks label.ah-checkbox"() {
        selectedTask.set(this._id);
        uistate.showDetails.set(true);
        history.pushState(null, this.task, "/list/" + this.list + "/task/" + this._id);
        uistate.currentView.set("details");
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
        return !listsHandle.ready || !tasksHandle.ready;
    },
    showDoneEntries() {
        return showDoneTasks.get();
    },
    opentasks() {
        return Tasks.find({ done: false, list: selectedList.get() }).map(decryptTask);
    },
    donetasks() {
        return Tasks.find({ done: true, list: selectedList.get() }).map(decryptTask);
    },
});
