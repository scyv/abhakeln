import { COLLECTIONS } from "../both/collections";

import "../both/methods";
import "./login/login";
import "./lists/lists";
import "./tasks/tasks";
import "./details/details";

import "./main.html";
import { selectedList, selectedTask } from "./storage";

export let tasksHandle;
export let listsHandle;

export const uistate = {
    isMobile: new ReactiveVar(false),
    showDetails: new ReactiveVar(false),
    currentView: new ReactiveVar("lists"),
};

Tracker.autorun(() => {
    listsHandle = Meteor.subscribe(COLLECTIONS.LISTS);
    tasksHandle = Meteor.subscribe(COLLECTIONS.TASKS);
});

const route = () => {
    const path = document.location.pathname;
    const listRoute = path.match(/\/list\/([A-Z0-9]+)\/?$/i);
    if (listRoute) {
        selectedList.set(listRoute[1]);
        selectedTask.set(null);
        uistate.showDetails.set(false);
        uistate.currentView.set("tasks");
        return;
    }

    const taskRoute = path.match(/\/list\/([A-Z0-9]+)\/task\/([A-Z0-9]+)/i);
    if (taskRoute) {
        selectedList.set(taskRoute[1]);
        selectedTask.set(taskRoute[2]);
        uistate.showDetails.set(true);
        uistate.currentView.set("details");
        return;
    }

    selectedList.set(null);
    selectedTask.set(null);
    uistate.showDetails.set(false);
    uistate.currentView.set("lists");
};

window.onpopstate = function (evt) {
    route();
};
route();
