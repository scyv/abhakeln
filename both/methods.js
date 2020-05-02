import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Lists, Tasks } from "./collections";

function checkUserLoggedIn(ctx) {
    if (!ctx.userId) {
        throw new Meteor.Error("Unauthorized", "User is not logged in");
    }
}

function checkUserOwnsList(ctx, listId) {
    const list = Lists.findOne({ _id: listId, "owners.userId": ctx.userId });
    if (!list) {
        throw new Meteor.Error("Unauthorized", "User does not own the list");
    }
}

Meteor.methods({
    createList(listData) {
        checkUserLoggedIn(this);
        check(listData.name, String);
        check(listData.key, String);
        if (listData.folder) {
            check(listData.folder, String);
        }
        if (listData.importId) {
            check(listData.importId, Number);
        }

        const list = {
            name: listData.name,
            folder: listData.folder,
            importId: listData.importId,
            owners: [
                {
                    userId: this.userId,
                    key: listData.key,
                },
            ],
        };
        return Lists.insert(list);
    },
    createTask(taskData) {
        checkUserLoggedIn(this);
        check(taskData.task, String);
        check(taskData.list, String);

        checkUserOwnsList(this, taskData.list);

        const task = {
            task: taskData.task,
            list: taskData.list,
            done: taskData.done || false,
            notes: taskData.notes,
            createdAt: taskData.createdAt || new Date(),
            doneAt: taskData.doneAt,
            dueDate: taskData.dueDate,
            reminder: taskData.reminder,
        };

        if (taskData.importId) {
            task.importId = taskData.importId;
        }

        return Tasks.insert(task);
    },
    toggleTaskDone(taskData) {
        checkUserLoggedIn(this);
        checkUserOwnsList(this, taskData.list);
        if (taskData.done) {
            Tasks.update({ _id: taskData._id }, { $set: { done: false } });
        } else {
            Tasks.update({ _id: taskData._id }, { $set: { done: true, doneAt: new Date() } });
        }
    },
    setReminder(taskId, reminder) {
        checkUserLoggedIn(this);
        const task = Tasks.findOne(taskId);
        checkUserOwnsList(this, task.list);
        Tasks.update({ _id: task._id }, { $set: { reminder: reminder } });
    },
    setDuedate(taskId, dueDate) {
        checkUserLoggedIn(this);
        const task = Tasks.findOne(taskId);
        checkUserOwnsList(this, task.list);
        Tasks.update({ _id: task._id }, { $set: { dueDate: dueDate } });
    },
});
