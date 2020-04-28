import { Meteor } from "meteor/meteor";
import { COLLECTIONS, Lists, Tasks } from "../both/collections";
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

        return Tasks.find({ list: { $in: lists } });
    }

    return [];
});
