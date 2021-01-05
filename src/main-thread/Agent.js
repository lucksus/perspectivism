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
var _did, _didDocument, _wallet, _file;
import * as path from 'path';
import * as fs from 'fs';
import didWallet from '@transmute/did-wallet';
import { ExpressionProof } from '../acai/Expression';
import secp256k1 from 'secp256k1';
import { Signatures } from './Signatures';
export default class Agent {
    constructor(rootConfigPath) {
        _did.set(this, void 0);
        _didDocument.set(this, void 0);
        _wallet.set(this, void 0);
        _file.set(this, void 0);
        __classPrivateFieldSet(this, _file, path.join(rootConfigPath, "agent.json"));
    }
    get did() {
        return __classPrivateFieldGet(this, _did);
    }
    createSignedExpression(data) {
        if (!this.isUnlocked()) {
            throw "Can't sign with locked keystore";
        }
        const timestamp = new Date().toString();
        const payloadBytes = Signatures.buildMessage(data, timestamp);
        const key = this.getSigningKey();
        const privKey = Uint8Array.from(Buffer.from(key.privateKey, key.encoding));
        const sigObj = secp256k1.ecdsaSign(payloadBytes, privKey);
        const sigBuffer = Buffer.from(sigObj.signature);
        const sigHex = sigBuffer.toString('hex');
        const signedExpresssion = {
            author: { did: __classPrivateFieldGet(this, _did) },
            timestamp,
            data,
            proof: new ExpressionProof(sigHex, `${__classPrivateFieldGet(this, _did)}#primary`)
        };
        console.debug("Signed Expression:", signedExpresssion);
        return signedExpresssion;
    }
    getSigningKey() {
        // @ts-ignore
        const keys = __classPrivateFieldGet(this, _wallet).extractByTags(["#primary"]);
        if (keys.length === 0) {
            throw "No '#primary' key found in keystore. Abort signing.";
        }
        if (keys.length > 1) {
            throw "Multiple '#primary' keys found in keystore. Abort signing.";
        }
        const key = keys[0];
        console.log(key);
        return key;
    }
    initialize(did, didDocument, keystore, password) {
        __classPrivateFieldSet(this, _did, did);
        __classPrivateFieldSet(this, _didDocument, didDocument);
        console.debug("Creating wallet...");
        __classPrivateFieldSet(this, _wallet, didWallet.create(keystore));
        console.debug("done.");
        console.debug("Unlocking wallet...");
        try {
            // @ts-ignore
            __classPrivateFieldGet(this, _wallet).unlock(password);
        }
        catch (e) {
            console.error(e);
            return;
        }
        console.debug("done.");
        console.debug("Saving wallet...");
        this.save(password);
        console.debug("done.");
    }
    isInitialized() {
        return fs.existsSync(__classPrivateFieldGet(this, _file));
    }
    isUnlocked() {
        // @ts-ignore
        const keys = __classPrivateFieldGet(this, _wallet).keys ? true : false;
        return keys;
    }
    unlock(password) {
        // @ts-ignore
        __classPrivateFieldGet(this, _wallet).unlock(password);
    }
    save(password) {
        // @ts-ignore
        __classPrivateFieldGet(this, _wallet).lock(password);
        const dump = {
            did: __classPrivateFieldGet(this, _did),
            didDocument: __classPrivateFieldGet(this, _didDocument),
            // @ts-ignore
            keystore: __classPrivateFieldGet(this, _wallet).export()
        };
        fs.writeFileSync(__classPrivateFieldGet(this, _file), JSON.stringify(dump));
        // @ts-ignore
        __classPrivateFieldGet(this, _wallet).unlock(password);
    }
    load() {
        if (!this.isInitialized())
            return;
        const dump = JSON.parse(fs.readFileSync(__classPrivateFieldGet(this, _file)).toString());
        __classPrivateFieldSet(this, _did, dump.did);
        __classPrivateFieldSet(this, _didDocument, dump.didDocument);
        __classPrivateFieldSet(this, _wallet, didWallet.create(dump.keystore));
    }
    dump() {
        const isInitialized = this.isInitialized();
        // @ts-ignore
        const isUnlocked = __classPrivateFieldGet(this, _wallet).keys ? true : false;
        const dump = {
            isInitialized,
            isUnlocked,
            did: __classPrivateFieldGet(this, _did),
            didDocument: __classPrivateFieldGet(this, _didDocument)
        };
        return dump;
    }
}
_did = new WeakMap(), _didDocument = new WeakMap(), _wallet = new WeakMap(), _file = new WeakMap();
export function init(rootConfigPath) {
    const agent = new Agent(rootConfigPath);
    agent.load();
    return agent;
}
//# sourceMappingURL=Agent.js.map