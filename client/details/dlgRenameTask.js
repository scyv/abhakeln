import { Lists, Tasks } from "../../both/collections";
import { masterKey, selectedTask } from "../storage";
import { Encryption } from "../encryption";
import { uistate } from "../main";

import "./dlgRenameTask.html";

const crypto = new Encryption();

Template.dlgRenameTask.helpers({
    taskName() {
        const task = Tasks.findOne(selectedTask.get());
        if (!task) {
            return "";
        }
        const list = Lists.findOne(task.list);
        return task ? crypto.decryptItemData(task, list, Meteor.userId(), masterKey.get()).task : "";
    },
});

Template.dlgRenameTask_confirm.events({
    "click .button"() {
        const id = selectedTask.get();
        const newName = $("#newTaskName").val().trim();
        const task = Tasks.findOne(id);
        const list = Lists.findOne(task.list);
        task.task = newName;
        const encryptedTask = crypto.encryptItemData(task, list, Meteor.userId(), masterKey.get());
        Meteor.call("renameTask", id, encryptedTask.task, () => {
            uistate.detailMenuVisible.set(false);
        });
    },
});
