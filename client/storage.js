import { ReactiveVar } from "meteor/reactive-var";
import { ClientStorage } from "meteor/ostrio:cstorage";

export class ReactiveStorage {
    handle(name, initial = false) {
        let reactive;
        if (ClientStorage.has(name)) {
            reactive = new ReactiveVar(ClientStorage.get(name));
        } else {
            ClientStorage.set(name, initial);
            reactive = new ReactiveVar(initial);
        }

        reactive.set = function (newValue) {
            let oldValue = reactive.curValue;
            if ((reactive.equalsFunc || ReactiveVar._isEqual)(oldValue, newValue)) {
                return;
            }
            reactive.curValue = newValue;
            ClientStorage.set(name, newValue);
            reactive.dep.changed();
        };

        return reactive;
    }
}

const storage = new ReactiveStorage();
export const masterKey = storage.handle("masterKey", "");
export const selectedList = storage.handle("selectedList", "");
export const showDoneTasks = storage.handle("showDoneTasks", false);