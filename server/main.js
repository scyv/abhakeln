import { Meteor } from "meteor/meteor";
import { COLLECTIONS, Lists, Tasks, Shares } from "../both/collections";
import "../both/methods";

Meteor.startup(() => {
    // code to run on server at startup
});

Meteor.publish(COLLECTIONS.LISTS, function () {
    if (this.userId) {
        return Lists.find({ "owners.userId": this.userId });
    }

    return [];
});

Meteor.publish(COLLECTIONS.TASKS, function () {
    if (this.userId) {
        const lists = Lists.find({ "owners.userId": this.userId }).map((list) => list._id);

        return Tasks.find({ done: false, list: { $in: lists } });
    }
    return [];
});

Meteor.publish(COLLECTIONS.DONE_TASKS, function (listId) {
    if (this.userId && listId) {
        const list = Lists.findOne({ "owners.userId": this.userId, _id: listId });
        if (!list) {
            return [];
        }
        return Tasks.find({ done: true, list: list._id });
    }
    return [];
});

Meteor.publish(COLLECTIONS.SHARES, function () {
    if (this.userId) {
        return Shares.find({ shareWith: this.userId });
    }
    return [];
});
