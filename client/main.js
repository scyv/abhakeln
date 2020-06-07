import { COLLECTIONS } from "../both/collections";
import { selectedList, selectedTask, showLandingPage } from "./storage";

import "./landing/landing";
import "../both/methods";
import "./login/login";
import "./lists/lists";
import "./tasks/tasks";
import "./details/details";
import "./progressbar/progressbar";
import "./wunderlist/import";

import "./main.html";

export let tasksHandle;
export let doneTasksHandle;
export let listsHandle;

export const uistate = {
    VIEW_LANDING: "landing",
    VIEW_LISTS: "lists",
    VIEW_TASKS: "tasks",
    VIEW_DETAILS: "details",
    isMobile: new ReactiveVar(false),
    showDetails: new ReactiveVar(false),
    currentView: new ReactiveVar(this.VIEW_LANDING),
    listMenuVisible: new ReactiveVar(false),
    taskMenuVisible: new ReactiveVar(false),
    detailMenuVisible: new ReactiveVar(false),
    progressbarVisible: new ReactiveVar(false),
    progressbarPercent: new ReactiveVar(0),
    progressbarLabel: new ReactiveVar(""),
};
window.uistate = uistate;

Tracker.autorun(() => {
    listsHandle = Meteor.subscribe(COLLECTIONS.LISTS);
    tasksHandle = Meteor.subscribe(COLLECTIONS.TASKS);
    doneTasksHandle = Meteor.subscribe(COLLECTIONS.DONE_TASKS, selectedList.get());
});

const route = () => {
    const path = document.location.pathname;
    const listRoute = path.match(/\/list\/([A-Z0-9]+)\/?$/i);
    if (listRoute) {
        selectedList.set(listRoute[1]);
        selectedTask.set(null);
        uistate.showDetails.set(false);
        uistate.currentView.set(uistate.VIEW_TASKS);
        return;
    }

    const taskRoute = path.match(/\/list\/([A-Z0-9]+)\/task\/([A-Z0-9]+)/i);
    if (taskRoute) {
        selectedList.set(taskRoute[1]);
        selectedTask.set(taskRoute[2]);
        uistate.showDetails.set(true);
        uistate.currentView.set(uistate.VIEW_DETAILS);
        return;
    }

    selectedList.set(null);
    selectedTask.set(null);
    uistate.showDetails.set(false);
    if (showLandingPage.get()) {
        uistate.currentView.set(uistate.VIEW_LANDING);
    } else {
        uistate.currentView.set(uistate.VIEW_LISTS);
    }
};

window.onpopstate = function (evt) {
    route();
};
route();

Template.main.helpers({
    showLanding() {
        return showLandingPage.get() && uistate.currentView.get() === uistate.VIEW_LANDING;
    },
});
