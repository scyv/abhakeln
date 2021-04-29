import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Lists, Tasks, Shares } from "./collections";

function checkUserLoggedIn(ctx) {
    if (!ctx.userId) {
        throw new Meteor.Error("Unauthorized", "User is not logged in");
    }
}

function checkUserOwnsList(ctx, listId) {
    const list = Lists.findOne({ _id: listId, "owners.userId": ctx.userId });
    if (!list) {
        throw new Meteor.Error("Unauthorized", "User does not own the list: " + listId);
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
    renameList(listId, newName) {
        check(listId, String);
        check(newName, String);

        checkUserOwnsList(this, listId);
        Lists.update({ _id: listId }, { $set: { name: newName } });
    },
    setFolder(listId, newFolder) {
        check(listId, String);
        check(newFolder, String);

        checkUserOwnsList(this, listId);
        if (this.isSimulation) {
            Lists.update(
                { _id: listId },
                {
                    $set: { folder: newFolder },
                }
            );
        } else {
            Lists.update(
                { _id: listId },
                {
                    $set: { "owners.$[forUser].folder": newFolder },
                },
                { arrayFilters: [{ "forUser.userId": { $eq: this.userId } }] }
            );
        }
    },
    deleteList(listId) {
        check(listId, String);

        checkUserOwnsList(this, listId);
        Lists.remove(listId);
        Tasks.remove({ list: listId });
        Shares.remove({ listId: listId });
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
            check(taskData.importId, Number);
            task.importId = taskData.importId;
        }
        if (taskData.subtasks) {
            task.subtasks = taskData.subtasks;
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
    taskReminded(taskId) {
        checkUserLoggedIn(this);
        const task = Tasks.findOne(taskId);
        checkUserOwnsList(this, task.list);
        Tasks.update({ _id: taskId }, { $set: { remindedAt: new Date().toISOString() } });
    },
    renameTask(taskId, newName) {
        check(taskId, String);
        check(newName, String);

        const task = Tasks.findOne(taskId);
        checkUserOwnsList(this, task.list);
        Tasks.update({ _id: task._id }, { $set: { task: newName } });
    },
    deleteTask(taskId) {
        check(taskId, String);

        const task = Tasks.findOne(taskId);
        checkUserOwnsList(this, task.list);
        Tasks.remove(taskId);
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
    setNotes(taskId, notes) {
        checkUserLoggedIn(this);
        const task = Tasks.findOne(taskId);
        checkUserOwnsList(this, task.list);
        Tasks.update({ _id: task._id }, { $set: { notes: notes } });
    },
    shareList(listId, listKey, shareWith) {
        check(listId, String);
        check(shareWith, String);
        checkUserLoggedIn(this);
        checkUserOwnsList(this, listId);
        if (this.isSimulation) {
            return;
        }
        const user = Meteor.users.findOne({ username: shareWith });
        if (!user) {
            throw new Meteor.Error("Benutzer " + shareWith + " nicht gefunden.");
        }
        const shareWithUserId = user._id;
        Shares.remove({
            listId: listId,
            shareWith: shareWithUserId,
        });
        Shares.insert({
            listId: listId,
            shareWith: shareWithUserId,
            listKey: listKey,
        });
    },
    enterList(listId, listKey) {
        check(listId, String);
        checkUserLoggedIn(this);
        const ownerData = {
            userId: this.userId,
            key: listKey,
        };
        Lists.update(
            { _id: listId },
            {
                $push: { owners: ownerData },
            }
        );

        Shares.remove({
            listId: listId,
            shareWith: this.userId,
        });
    },
    leaveList(listId) {
        check(listId, String);
        checkUserLoggedIn(this);
        checkUserOwnsList(this, listId);
        Lists.update(
            { _id: listId },
            {
                $pull: { owners: { userId: this.userId } },
            }
        );
    },
    updateSortOrder(listId, tasks) {
        check(listId, String);
        checkUserLoggedIn(this);
        checkUserOwnsList(this, listId);
        let sortOrder = 0;
        tasks
            .map((id) => Tasks.findOne(id))
            .forEach((task) => {
                Tasks.update(task._id, { $set: { sortOrder: sortOrder++ } });
            });
    },
});
