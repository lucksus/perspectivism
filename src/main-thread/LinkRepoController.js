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
var _db, _agent, _languageController, _pubsub;
import { hashLinkExpression, linkEqual } from "../ad4m/Links";
import 'electron';
import { SHA3 } from "sha3";
import * as PubSub from './PubSub';
export default class LinkRepoController {
    constructor({ db, languageController, agent }) {
        _db.set(this, void 0);
        _agent.set(this, void 0);
        _languageController.set(this, void 0);
        _pubsub.set(this, void 0);
        __classPrivateFieldSet(this, _db, db);
        __classPrivateFieldSet(this, _agent, agent);
        __classPrivateFieldSet(this, _languageController, languageController);
        __classPrivateFieldSet(this, _pubsub, PubSub.get());
    }
    linkToExpression(link) {
        return {
            author: __classPrivateFieldGet(this, _agent),
            timestamp: new Date().toString(),
            data: link
        };
    }
    ensureLinkExpression(maybeLink) {
        if (maybeLink.author && maybeLink.timestamp && maybeLink.data) {
            return maybeLink;
        }
        if (maybeLink.target) {
            return this.linkToExpression(maybeLink);
        }
        throw new Error("Object is neither Link nor Expression: " + JSON.stringify(maybeLink));
    }
    callLinksAdapter(p, functionName, ...args) {
        if (p.linksSharingLanguage && p.linksSharingLanguage !== "") {
            return new Promise(async (resolve, reject) => {
                setTimeout(() => resolve([]), 2000);
                try {
                    const langRef = { address: p.linksSharingLanguage, name: '' };
                    const linksAdapter = __classPrivateFieldGet(this, _languageController).getLinksAdapter(langRef);
                    if (linksAdapter) {
                        console.debug(`Calling linksAdapter.${functionName}(${args})`);
                        const result = await linksAdapter[functionName](...args);
                        console.debug("Got result:", result);
                        resolve(result);
                    }
                    else {
                        throw new Error("LinksSharingLanguage '" + p.linksSharingLanguage + "' set in perspective '" + p.name + "' not installed!");
                    }
                }
                catch (e) {
                    console.error("Error while trying to call links adapter:", e);
                    reject(e);
                }
            });
        }
        else {
            return Promise.resolve([]);
        }
    }
    async syncWithSharingAdapter(p) {
        const localLinks = __classPrivateFieldGet(this, _db).getAllLinks(p.uuid);
        const remoteLinks = await this.callLinksAdapter(p, 'getLinks');
        const includes = (link, list) => {
            return undefined !== list.find(e => JSON.stringify(e.author) === JSON.stringify(link.author) &&
                e.timestamp === link.timestamp &&
                e.source === link.data.source &&
                e.target === link.data.target &&
                e.predicate === link.data.predicate);
        };
        for (const l of localLinks) {
            if (!includes(l, remoteLinks)) {
                await this.callLinksAdapter(p, "addLink", l);
            }
        }
    }
    addLink(p, link) {
        const linkExpression = this.ensureLinkExpression(link);
        this.callLinksAdapter(p, 'addLink', linkExpression);
        const hash = new SHA3(256);
        hash.update(JSON.stringify(linkExpression));
        const addr = hash.digest('hex');
        link = linkExpression.data;
        __classPrivateFieldGet(this, _db).storeLink(p.uuid, linkExpression, addr);
        __classPrivateFieldGet(this, _db).attachSource(p.uuid, link.source, addr);
        __classPrivateFieldGet(this, _db).attachTarget(p.uuid, link.target, addr);
        __classPrivateFieldGet(this, _pubsub).publish(PubSub.LINK_ADDED_TOPIC, { perspective: p, linkAdded: linkExpression });
        return linkExpression;
    }
    findLink(p, linkToFind) {
        const allLinks = __classPrivateFieldGet(this, _db).getAllLinks(p.uuid);
        for (const { name, link } of allLinks) {
            if (linkEqual(linkToFind, link)) {
                return name;
            }
        }
        throw `Link not found in perspective "${JSON.stringify(p)}": ${JSON.stringify(linkToFind)}`;
    }
    async updateLink(p, oldLink, newLink) {
        console.debug("LINK REPO: updating link:", oldLink, newLink);
        const addr = this.findLink(p, oldLink);
        console.debug("hash:", addr);
        const _old = oldLink.data;
        const _new = newLink.data;
        __classPrivateFieldGet(this, _db).updateLink(p.uuid, newLink, addr);
        if (_old.source !== _new.source) {
            __classPrivateFieldGet(this, _db).removeSource(p.uuid, _old.source, addr);
            __classPrivateFieldGet(this, _db).attachSource(p.uuid, _new.source, addr);
        }
        if (_old.target !== _new.target) {
            __classPrivateFieldGet(this, _db).removeTarget(p.uuid, _old.target, addr);
            __classPrivateFieldGet(this, _db).attachTarget(p.uuid, _new.target, addr);
        }
        this.callLinksAdapter(p, 'updateLink', oldLink, newLink);
        __classPrivateFieldGet(this, _pubsub).publish(PubSub.LINK_ADDED_TOPIC, { perspective: p, link: newLink });
        __classPrivateFieldGet(this, _pubsub).publish(PubSub.LINK_REMOVED_TOPIC, { perspective: p, link: oldLink });
    }
    async removeLink(p, linkExpression) {
        const addr = this.findLink(p, linkExpression);
        const link = linkExpression.data;
        __classPrivateFieldGet(this, _db).removeSource(p.uuid, link.source, addr);
        __classPrivateFieldGet(this, _db).removeTarget(p.uuid, link.target, addr);
        this.callLinksAdapter(p, 'removeLink', linkExpression);
        __classPrivateFieldGet(this, _pubsub).publish(PubSub.LINK_REMOVED_TOPIC, { perspective: p, link });
    }
    getLinksLocal(p, query) {
        console.debug("getLinks 1");
        if (!query || !query.source && !query.predicate && !query.target) {
            return __classPrivateFieldGet(this, _db).getAllLinks(p.uuid).map(e => e.link);
        }
        console.debug("getLinks 2");
        if (query.source) {
            console.debug("query.source", query.source);
            let result = __classPrivateFieldGet(this, _db).getLinksBySource(p.uuid, query.source);
            // @ts-ignore
            if (query.target)
                result = result.filter(l => l.data.target === query.target);
            // @ts-ignore
            if (query.predicate)
                result = result.filter(l => l.data.predicate === query.predicate);
            console.debug("result", result);
            return result;
        }
        console.debug("getLinks 3");
        if (query.target) {
            let result = __classPrivateFieldGet(this, _db).getLinksByTarget(p.uuid, query.target);
            // @ts-ignore
            if (query.predicate)
                result = result.filter(l => l.data.predicate === query.predicate);
            return result;
        }
        console.debug("getLinks 4");
        return __classPrivateFieldGet(this, _db).getAllLinks(p.uuid).map(e => e.link).filter(link => link.data.predicate === query.predicate);
    }
    async getLinks(p, query) {
        console.debug("getLinks local...");
        const localLinks = await this.getLinksLocal(p, query);
        console.debug("getLinks local", localLinks);
        console.debug("getLinks remote...");
        const remoteLinks = await this.callLinksAdapter(p, 'getLinks', query);
        console.debug("getLinks remote", remoteLinks);
        const mergedLinks = {};
        localLinks.forEach(l => mergedLinks[hashLinkExpression(l)] = l);
        remoteLinks.forEach(l => mergedLinks[hashLinkExpression(l)] = l);
        return Object.values(mergedLinks);
    }
}
_db = new WeakMap(), _agent = new WeakMap(), _languageController = new WeakMap(), _pubsub = new WeakMap();
export function init(context) {
    const linkRepoController = new LinkRepoController(context);
    return linkRepoController;
}
//# sourceMappingURL=LinkRepoController.js.map