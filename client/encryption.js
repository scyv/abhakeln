import * as sjcl from "sjcl";

const listKeyCache = {};

export class Encryption {
    hash(content) {
        return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(content));
    }

    createKey() {
        return sjcl.codec.hex.fromBits(sjcl.random.randomWords(100));
    }

    encrypt(message, password) {
        return sjcl.encrypt(password, message, { iter: 2500, ts: 128, ks: 256 });
    }

    decrypt(ciphertext, password) {
        return sjcl.decrypt(password, ciphertext);
    }

    encryptListData(listData, userId, masterKey, generateKey = false) {
        const listKey = generateKey ? this.createKey() : this.decryptListKey(listData, userId, masterKey);
        if (generateKey) {
            listData.key = this.encrypt(listKey, masterKey);
        }
        const copy = Object.assign({}, listData);
        copy.name = this.encrypt(copy.name, listKey);
        if (copy.folder) {
            copy.folder = this.encrypt(copy.folder, listKey);
        }
        return copy;
    }

    encryptItemData(itemData, listData, userId, masterKey) {
        const copy = Object.assign({}, itemData);
        const listKey = this.decryptListKey(listData, userId, masterKey);
        if (copy.task) {
            copy.task = this.encrypt(copy.task, listKey);
        }
        if (copy.notes) {
            copy.notes = this.encrypt(copy.notes, listKey);
        }
        if (copy.subtasks) {
            copy.subtasks = copy.subtasks.map((subtask) => {
                const copysubtask = Object.assign({}, subtask);
                copysubtask.task = this.encrypt(subtask.task, listKey);
                return copysubtask;
            });
        }
        return copy;
    }

    decryptListData(listData, userId, masterKey) {
        const ownerData = this.findOwnerInfo(listData, userId);
        const listKey = this.decryptListKey(listData, userId, masterKey, ownerData);
        const copy = Object.assign({}, listData);
        if (listKey) {
            copy.name = this.decrypt(listData.name, listKey);
            if (ownerData.folder) {
                copy.folder = this.decrypt(ownerData.folder, listKey);
            } else if (listData.folder) {
                // listData.folder is used, when there is no user override
                copy.folder = this.decrypt(listData.folder, listKey);
            }
        } else {
            copy.nokey = true;
            copy.name = ownerData.listName + " von " + ownerData.sharedBy;
        }
        return copy;
    }

    decryptItemData(itemData, listData, userId, masterKey) {
        const copy = Object.assign({}, itemData);
        const listKey = this.decryptListKey(listData, userId, masterKey);
        copy.task = this.decrypt(itemData.task, listKey);
        if (copy.notes) {
            copy.notes = this.decrypt(itemData.notes, listKey);
        }
        if (copy.subtasks) {
            copy.subtasks = itemData.subtasks.map((subtask) => {
                const stCopy = Object.assign({}, subtask);
                stCopy.task = this.decrypt(stCopy.task, listKey);
                return stCopy;
            });
        }
        return copy;
    }

    decryptListKey(listData, userId, masterKey, ownerInfo = null) {
        const cachedKey = listKeyCache[listData._id];
        if (cachedKey) {
            return cachedKey;
        }
        const listKey = (ownerInfo || this.findOwnerInfo(listData, userId)).key;
        if (!listKey) {
            return undefined;
        }
        const decrypted = this.decrypt(listKey, masterKey);
        listKeyCache[listData._id] = decrypted;
        return decrypted;
    }

    findOwnerInfo(list, userId) {
        return list.owners.filter((o) => o.userId === userId)[0];
    }
}
