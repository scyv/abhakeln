import { Mongo } from "meteor/mongo";

export const COLLECTIONS = {
    TASKS: "tasks",
    DONE_TASKS: "doneTasks",
    LISTS: "lists",
    SHARES: "shares",
};

/**
 * _id: the id
 * task: the task name
 * notes: Notes of the task
 * assignees: The assignees (potentially more)
 * list: The containing list
 * done: done?
 * createdAt: creation datetime
 * doneAt: donedatetime
 * recurringInterval: interval of recurring (if applicable)
 * reminderAt: datetime of the reminder
 * dueAt: due date (no time)
 * sortOrder: sort order within a list
 */
export const Tasks = new Mongo.Collection(COLLECTIONS.TASKS);

/**
 * _id: the id
 * name: The name of the list
 * owners: [{
 *      userId: id of the owning user
 *      listKey: encrypted decryption key
 * }]
 */
export const Lists = new Mongo.Collection(COLLECTIONS.LISTS);

/**
 * _id: the id
 * listId: the listId
 * shareWith: the user to share the list with
 * listKey: the encrypted list key
 */
export const Shares = new Mongo.Collection(COLLECTIONS.SHARES);
