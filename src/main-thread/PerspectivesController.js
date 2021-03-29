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
var _perspectives, _rootConfigPath, _pubsub;
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as PubSub from './PubSub';
export default class PerspectivesController {
    constructor(rootConfigPath) {
        _perspectives.set(this, null);
        _rootConfigPath.set(this, void 0);
        _pubsub.set(this, void 0);
        __classPrivateFieldSet(this, _rootConfigPath, rootConfigPath);
        __classPrivateFieldSet(this, _pubsub, PubSub.get());
        const FILENAME = 'perspectives.json';
        const FILEPATH = path.join(rootConfigPath, FILENAME);
        if (fs.existsSync(FILEPATH)) {
            __classPrivateFieldSet(this, _perspectives, JSON.parse(fs.readFileSync(FILEPATH).toString()));
        }
        else {
            __classPrivateFieldSet(this, _perspectives, {});
        }
    }
    save() {
        const FILENAME = 'perspectives.json';
        const FILEPATH = path.join(__classPrivateFieldGet(this, _rootConfigPath), FILENAME);
        fs.writeFileSync(FILEPATH, JSON.stringify(__classPrivateFieldGet(this, _perspectives)));
    }
    get() {
        return __classPrivateFieldGet(this, _perspectives);
    }
    add(perspective) {
        if (!perspective.uuid) {
            perspective.uuid = uuidv4();
        }
        __classPrivateFieldGet(this, _perspectives)[perspective.uuid] = perspective;
        this.save();
        __classPrivateFieldGet(this, _pubsub).publish(PubSub.PERSPECTIVE_ADDED_TOPIC, { perspective });
        return perspective;
    }
    remove(uuid) {
        delete __classPrivateFieldGet(this, _perspectives)[uuid];
        this.save();
        __classPrivateFieldGet(this, _pubsub).publish(PubSub.PERSPECTIVE_REMOVED_TOPIC, { uuid });
    }
    update(perspective) {
        const uuid = perspective.uuid;
        __classPrivateFieldGet(this, _perspectives)[uuid] = perspective;
        this.save();
        __classPrivateFieldGet(this, _pubsub).publish(PubSub.PERSPECTIVE_UPDATED_TOPIC, { perspective });
    }
}
_perspectives = new WeakMap(), _rootConfigPath = new WeakMap(), _pubsub = new WeakMap();
export function init(rootConfigPath) {
    return new PerspectivesController(rootConfigPath);
}
//# sourceMappingURL=PerspectivesController.js.map