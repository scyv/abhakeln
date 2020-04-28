import { Template } from "meteor/templating";
import { Tasks, Lists } from "../../both/collections";
import { showDoneTasks, selectedList, masterKey } from "../storage";
import { Encryption } from "../encryption";

import "./tasks.html";

const crypto = new Encryption();

Template.tasks.events({
    "change #opentasks .ah-checkbox input"() {
        Meteor.call("toggleTaskDone", this);
    },
    "input #donetasks .ah-checkbox input"() {
        Meteor.call("toggleTaskDone", this);
    },
    "input #showDone"() {
        showDoneTasks.set(!showDoneTasks.get());
    },
    "keydown .compCreateTask input"(evt) {
        if (evt.keyCode === 13) {
            const list = Lists.findOne(selectedList.get());
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
