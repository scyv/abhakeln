import { Lists } from "../../both/collections";
import "./dlgRenameList.html";
import { selectedList } from "../storage";

Template.dlgRenameList.helpers({
    listName() {
        const list = Lists.findOne(selectedList.get());

        return list ? list.name : "";
    },
});

Template.dlgRenameList_confirm.events({
    "click .button"() {},
});
