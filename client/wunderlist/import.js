import { Template } from "meteor/templating";
import { Encryption } from "../encryption";
import { masterKey } from "../storage";
import { Lists, COLLECTIONS } from "../../both/collections";

import "./import.html";
import { uistate } from "../main";

const toImport = new ReactiveVar([]);
const crypto = new Encryption();

Template.wunderlistImport.helpers({
    listsAvailable() {
        return toImport.get().length > 0;
    },
    lists() {
        return toImport.get();
    },
});

Template.wunderlistImport_fileupload.events({
    "change #wunderlistFileInput"(evt) {
        toImport.set([]);
        if (evt.target.files.length > 0) {
            const file = evt.target.files[0];
            const reader = new FileReader();
            reader.onloadend = function (evt) {
                const data = JSON.parse(evt.target.result);
                if (data.length > 0) {
                    data.forEach((list) => {
                        list.import = true;
                        list.importdone = false;
                        toImport.set(toImport.get().concat(list));
                    });
                }
            };
            reader.readAsText(file);
        }
    },
});

Template.wunderlistImport_selectForImport.events({
    "change input"(evt) {
        const checked = $(evt.target).prop("checked");
        toImport.set(
            toImport.get().map((list) => {
                if (list.id + "" === evt.target.id) {
                    list.import = checked;
                }
                return list;
            })
        );
    },
});

Template.wunderlistImport_startimport.events({
    "click .button"() {
        const data = toImport.get().filter((list) => list.import);
        const listsCount = data.length;
        let importedCount = 0;
        let tasksCount = 0;
        uistate.listMenuVisible.set(false);
        uistate.progressbarVisible.set(true);
        uistate.progressbarLabel.set(`Importiere ${listsCount} Listen...`);
        uistate.progressbarPercent.set(0);
        if (listsCount > 0) {
            window.setTimeout(() => {
                data.forEach((list) => {
                    const encryptedListData = crypto.encryptListData(
                        {
                            name: list.title,
                            folder: list.folder ? list.folder.title : null,
                            importId: list.id,
                        },
                        Meteor.userId(),
                        masterKey.get(),
                        true
                    );
                    tasksCount += list.tasks.length;
                    uistate.progressbarPercent.set(Math.floor((20 * importedCount++) / listsCount));
                    Meteor.call("createList", encryptedListData);
                });
                uistate.progressbarLabel.set(`Importiere ${tasksCount} Aufgaben...`);
            }, 0);
            const checkListsInterval = window.setInterval(() => {
                if (importedCount < listsCount) {
                    return;
                }
                if (data.length === 0) {
                    window.clearInterval(checkListsInterval);
                    uistate.progressbarVisible.set(false);
                    Meteor.subscribe(COLLECTIONS.LISTS);
                    Meteor.subscribe(COLLECTIONS.TASKS);
                    return;
                }
                const importedList = Lists.findOne({ importId: data[0].id });

                if (importedList) {
                    importedCount++;
                    data[0].tasks.forEach((task) => {
                        const encryptedTaskData = crypto.encryptItemData(
                            {
                                task: task.title,
                                list: importedList._id,
                                done: task.completed,
                                notes: task.notes.length > 0 ? task.notes[0].content : null,
                                createdAt: new Date(task.createdAt),
                                doneAt: task.completedAt,
                                dueDate: task.dueDate,
                                reminder: task.reminders.length > 0 ? task.reminders[0].remindAt : null,
                                importId: task.id,
                                subtasks: task.subtasks.map((task) => ({
                                    task: task.title,
                                    done: task.completed,
                                })),
                            },
                            importedList,
                            Meteor.userId(),
                            masterKey.get()
                        );
                        Meteor.call("createTask", encryptedTaskData);
                    });
                    uistate.progressbarPercent.set(20 + Math.floor((70 * (importedCount - listsCount)) / listsCount));

                    data[0].importdone = true;
                    data[0].import = false;
                    data.shift();
                }
            }, 1000);
        }
    },
});
