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
        Meteor.call("renameTask", id, encryptedTask.task, (err) => {
            if (err) {
                $("body").toast({
                    title: "Aufgabe nicht umbenannt!",
                    class: "red",
                    message: "Die Aufgabe wurde nicht umbenannt: " + err,
                    showProgress: "bottom",
                    position: "bottom right",
                    displayTime: 10000,
                });
            } else {
                $("body").toast({
                    title: "Aufgabe umbenannt.",
                    class: "green",
                    message: "Die Aufgabe wurde umbenannt in: " + newName,
                    showProgress: "bottom",
                    position: "bottom right",
                    displayTime: 3000,
                });
            }

            uistate.detailMenuVisible.set(false);
        });
    },
});
