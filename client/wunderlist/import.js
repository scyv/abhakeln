import { Template } from "meteor/templating";
import { Encryption } from "../encryption";
import { masterKey } from "../storage";
import { Lists } from "../../both/collections";

import "./import.html";

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

        if (data.length > 0) {
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

                Meteor.call("createList", encryptedListData);
            });
            const checkListsInterval = window.setInterval(() => {
                if (data.length === 0) {
                    window.clearInterval(checkListsInterval);
                    return;
                }
                const importedList = Lists.findOne({ importId: data[0].id });

                if (importedList) {
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
                    data[0].importdone = true;
                    data[0].import = false;
                    data.shift();
                }
            }, 1000);
        }
    },
});
