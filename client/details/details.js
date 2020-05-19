import { Tasks, Lists } from "../../both/collections";
import { selectedTask, masterKey, selectedList } from "../storage";
import { Encryption } from "../encryption";

import "./details.html";
import { uistate } from "../main";

const crypto = new Encryption();

const noteEditMode = new ReactiveVar(false);

const germanCalendar = {
    text: {
        days: ["M", "D", "M", "D", "F", "S", "S"],
        months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
        monthsShort: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    },
    formatter: {
        date: function (date, settings) {
            if (!date) return "";
            const day = date.getDate() + "";
            const month = date.getMonth() + 1 + "";
            const year = date.getFullYear() + "";
            return day.padStart(2, "0") + "." + month.padStart(2, "0") + "." + year.padStart(4, "0");
        },
        time: function (date) {
            const hour = date.getHours() + "";
            const minute = date.getMinutes() + "";
            return hour.padStart(2, "0") + ":" + minute.padStart(2, "0") + "Uhr";
        },
    },
};

Template.details.onRendered(() => {
    Tracker.autorun(() => {
        noteEditMode.set(false);
        const task = Tasks.findOne({ _id: selectedTask.get() });
        if (!task) {
            return;
        }
        const reminder = task.reminder ? new Date(task.reminder) : null;
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        $("#notification_calendar").calendar("clear");
        $("#duedate_calendar").calendar("clear");
        $("#notification_calendar").calendar({
            ampm: false,
            initialDate: reminder,
            eventDates: reminder ? [{ date: reminder, class: "green" }] : [],
            ...germanCalendar,
        });
        $("#duedate_calendar").calendar({
            type: "date",
            initialDate: dueDate,
            eventDates: dueDate ? [{ date: dueDate, class: "green" }] : [],
            ...germanCalendar,
        });
    });
});

Template.details.helpers({
    task() {
        const task = Tasks.findOne(selectedTask.get());
        if (!task) {
            return {};
        }
        return crypto.decryptItemData(task, Lists.findOne(task.list), Meteor.userId(), masterKey.get());
    },
    noteEditMode(task) {
        return noteEditMode.get() || !task.notes;
    },
});

Template.details.events({
    "click .navBack"() {
        uistate.showDetails.set(false);
        uistate.currentView.set(uistate.VIEW_TASKS);
        selectedTask.set(null);
        history.pushState(null, "", "/list/" + selectedList.get());
    },
    "blur #notification_calendar input"() {
        const selectedDate = $("#notification_calendar").calendar("get date");
        Meteor.call("setReminder", selectedTask.get(), selectedDate.toISOString());
    },
    "blur #duedate_calendar input"() {
        const selectedDate = $("#duedate_calendar").calendar("get date");
        selectedDate.setHours(0);
        selectedDate.setMinutes(0);
        selectedDate.setSeconds(0);
        Meteor.call("setDuedate", selectedTask.get(), selectedDate.toISOString());
    },
    "click .notes"() {
        noteEditMode.set(true);
    },
    "blur #notesInput"() {
        const notes = $("#notesInput").val();
        const task = Tasks.findOne(selectedTask.get());
        task.notes = notes;
        const list = Lists.findOne(selectedList.get());
        const encryptedTaskData = crypto.encryptItemData(task, list, Meteor.userId(), masterKey.get());
        Meteor.call("setNotes", task._id, encryptedTaskData.notes);
    },
});
