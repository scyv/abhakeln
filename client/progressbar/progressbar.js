import { uistate } from "../main";

import "./progressbar.html";

Template.progressBar.onRendered(() => {
    $(".compProgressbar .ui.progress")?.progress();
});

Template.progressBar.helpers({
    visible() {
        return uistate.progressbarVisible.get();
    },
    percent() {
        $(".compProgressbar .ui.progress").progress({
            percent: uistate.progressbarPercent.get(),
        });
        return uistate.progressbarPercent.get();
    },
    label() {
        return uistate.progressbarLabel.get();
    },
});
