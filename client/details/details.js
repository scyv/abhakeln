import { Tasks, Lists } from "../../both/collections";
import { selectedTask, masterKey } from "../storage";
import { Encryption } from "../encryption";

import "./details.html";

const crypto = new Encryption();

Template.details.helpers({
    task() {
        const task = Tasks.findOne(selectedTask.get());
        if (!task) {
            return {};
        }
        return crypto.decryptItemData(task, Lists.findOne(task.list), Meteor.userId(), masterKey.get());
    },
});
