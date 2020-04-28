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
        const list = {
            name: listData.name,
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
            done: false,
            createdAt: new Date(),
        };

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
});
