var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _db, _env;
import lmdb from 'node-lmdb';
import 'ts-jest/dist/ts-jest-transformer';
export class PerspectivismDb {
    constructor(dbFilePath) {
        _db.set(this, void 0);
        _env.set(this, void 0);
        const env = new lmdb.Env();
        env.open({
            path: dbFilePath,
            mapSize: 2 * 1024 * 1024 * 1024,
            maxDbs: 1
        });
        const db = env.openDbi({
            name: "perspectivism",
            create: true // will create if database did not exist
        });
        __classPrivateFieldSet(this, _env, env);
        __classPrivateFieldSet(this, _db, db);
    }
    linkKey(pUUID, linkName) {
        return `${pUUID}-link-${linkName}`;
    }
    allLinksKey(pUUID) {
        return `${pUUID}-all_links`;
    }
    sourceKey(pUUID, source) {
        return `${pUUID}-from_source-${source}`;
    }
    targetKey(pUUID, target) {
        return `${pUUID}-to_target-${target}`;
    }
    storeLink(pUUID, link, linkName) {
        let txn = __classPrivateFieldGet(this, _env).beginTxn();
        txn.putString(__classPrivateFieldGet(this, _db), this.linkKey(pUUID, linkName), JSON.stringify([link]));
        const allLinksRaw = txn.getString(__classPrivateFieldGet(this, _db), this.allLinksKey(pUUID));
        let allLinks = allLinksRaw ? JSON.parse(allLinksRaw) : [];
        allLinks.push(linkName);
        txn.putString(__classPrivateFieldGet(this, _db), this.allLinksKey(pUUID), JSON.stringify(allLinks));
        txn.commit();
    }
    updateLink(pUUID, link, linkName) {
        const key = this.linkKey(pUUID, linkName);
        let txn = __classPrivateFieldGet(this, _env).beginTxn();
        const linkStatesRaw = txn.getString(__classPrivateFieldGet(this, _db), key);
        let linkStates = linkStatesRaw ? JSON.parse(linkStatesRaw) : [];
        linkStates.push(link);
        txn.putString(__classPrivateFieldGet(this, _db), key, JSON.stringify(linkStates));
        txn.commit();
    }
    getLink(pUUID, linkName) {
        let txn = __classPrivateFieldGet(this, _env).beginTxn();
        const linkStatesRaw = txn.getString(__classPrivateFieldGet(this, _db), this.linkKey(pUUID, linkName));
        txn.abort();
        let linkStates = linkStatesRaw ? JSON.parse(linkStatesRaw) : [];
        return linkStates.pop();
    }
    getAllLinks(pUUID) {
        return this.getLinksByKey(pUUID, this.allLinksKey(pUUID));
    }
    getLinksBySource(pUUID, source) {
        const key = this.sourceKey(pUUID, source);
        return this.getLinksByKey(pUUID, key);
    }
    getLinksByTarget(pUUID, target) {
        const key = this.targetKey(pUUID, target);
        return this.getLinksByKey(pUUID, key);
    }
    getLinksByKey(pUUID, key) {
        let txn = __classPrivateFieldGet(this, _env).beginTxn();
        const allLinkNamesRaw = txn.getString(__classPrivateFieldGet(this, _db), key);
        const allLinkNames = allLinkNamesRaw ? JSON.parse(allLinkNamesRaw) : [];
        txn.abort();
        let allLinks = [];
        for (const linkName of allLinkNames) {
            allLinks.push({
                name: linkName,
                link: this.getLink(pUUID, linkName)
            });
        }
        return allLinks;
    }
    attachSource(pUUID, source, linkName) {
        const key = this.sourceKey(pUUID, source);
        this.attach(key, linkName);
    }
    attachTarget(pUUID, target, linkName) {
        const key = this.targetKey(pUUID, target);
        this.attach(key, linkName);
    }
    attach(key, linkName) {
        let txn = __classPrivateFieldGet(this, _env).beginTxn();
        const sourceLinkNamesRaw = txn.getString(__classPrivateFieldGet(this, _db), key);
        let sourceLinkNames = sourceLinkNamesRaw ? JSON.parse(sourceLinkNamesRaw) : [];
        if (!sourceLinkNames.includes(linkName)) {
            sourceLinkNames.push(linkName);
            txn.putString(__classPrivateFieldGet(this, _db), key, JSON.stringify(sourceLinkNames));
            txn.commit();
        }
        else {
            txn.abort();
        }
    }
    removeSource(pUUID, source, linkName) {
        const key = this.sourceKey(pUUID, source);
        this.remove(key, linkName);
    }
    removeTarget(pUUID, target, linkName) {
        const key = this.targetKey(pUUID, target);
        this.remove(key, linkName);
    }
    remove(key, linkName) {
        let txn = __classPrivateFieldGet(this, _env).beginTxn();
        const sourceLinkNamesRaw = txn.getString(__classPrivateFieldGet(this, _db), key);
        let sourceLinkNames = sourceLinkNamesRaw ? JSON.parse(sourceLinkNamesRaw) : [];
        if (sourceLinkNames.include(linkName)) {
            sourceLinkNames = sourceLinkNames.filter((element) => element !== linkName);
            txn.putString(__classPrivateFieldGet(this, _db), key, JSON.stringify(sourceLinkNames));
            txn.commit();
        }
        else {
            txn.abort();
        }
    }
}
_db = new WeakMap(), _env = new WeakMap();
export function init(dbFilePath) {
    return new PerspectivismDb(dbFilePath);
}
//# sourceMappingURL=db.js.map