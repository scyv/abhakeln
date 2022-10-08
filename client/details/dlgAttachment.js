import { Lists, Tasks } from "../../both/collections";
import { masterKey, selectedTask } from "../storage";
import { Encryption } from "../encryption";

import "./dlgAttachment.html";

const crypto = new Encryption();

Template.dlgAttachment_fileinput.events({
    "change .uploadInput"(evt) {
        const preview = $("#filePreview");
        const noImgPreview = $("#noImgPreview");
        const fileInput = evt.currentTarget;

        const maxAllowed = Math.max(0, Math.min(fileInput.files.length, 5 - preview.children.length));

        for (let i = 0; i < maxAllowed; i++) {
            const file = fileInput.files[i];
            if (!file.type.startsWith("image/")) {
                const noImg = $("<span>" + file.name + "</span>");
                const reader = new FileReader();
                reader.onload = (e) => {
                    noImgPreview.append(noImg);
                    noImg.data("name", file.name);
                    noImg.data("src", e.target.result);
                    noImg.data("type", file.type);
                };
                reader.readAsDataURL(file);

                continue;
            }
            generateThumbnail(file, [1024, 1024]).then((url) => {
                const img = $("<img/>");
                img.addClass("ui rounded image");
                img.attr("alt", file.name);
                img.attr("src", url);
                preview.append(img);
            });
        }
    },
    "click .btn-removethumbnail"(evt) {
        $(evt.currentTarget.parentElement).remove();
    },
});

Template.dlgAttachment_confirm.events({
    "click .button"() {
        const id = selectedTask.get();
        const task = Tasks.findOne(id);
        const list = Lists.findOne(task.list);
        const attachments = $("#filePreview img")
            .get()
            .map((img) => ({
                src: crypto.encryptForList(img.src, list, Meteor.userId(), masterKey.get()),
                name: crypto.encryptForList(img.alt, list, Meteor.userId(), masterKey.get()),
                type: "image",
            }));

        $("#noImgPreview span").each(function () {
            const el = $(this);
            attachments.push({
                src: crypto.encryptForList(el.data("src"), list, Meteor.userId(), masterKey.get()),
                name: crypto.encryptForList(el.data("name"), list, Meteor.userId(), masterKey.get()),
                type: el.data("type"),
            });
        });

        Meteor.call("addAttachments", id, attachments);
    },
});

function generateThumbnail(file, boundBox) {
    const reader = new FileReader();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    return new Promise((resolve) => {
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const scaleRatio = Math.min(...boundBox) / Math.max(img.width, img.height);
                const w = img.width * scaleRatio;
                const h = img.height * scaleRatio;
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);
                return resolve(canvas.toDataURL(file.type));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}
