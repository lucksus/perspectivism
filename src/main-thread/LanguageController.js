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
var _languages, _languageConstructors, _context, _linkObservers;
import ExpressionRef from '../ad4m/ExpressionRef';
import fs from 'fs';
import path from 'path';
import multihashing from 'multihashing';
import multihashes from 'multihashes';
import 'electron';
import * as Config from './Config';
const builtInLanguages = [
    'note-ipfs',
    'url-iframe',
    'gun-links',
    'ipfs-links'
].map(l => `./src/languages/${l}/build/bundle.js`);
const aliases = {
    'http': 'url-iframe',
    'https': 'url-iframe'
};
export class LanguageController {
    constructor(context) {
        _languages.set(this, void 0);
        _languageConstructors.set(this, void 0);
        _context.set(this, void 0);
        _linkObservers.set(this, void 0);
        __classPrivateFieldSet(this, _context, context);
        __classPrivateFieldSet(this, _languages, new Map());
        __classPrivateFieldSet(this, _languageConstructors, new Map());
        __classPrivateFieldSet(this, _linkObservers, []);
        builtInLanguages.forEach(bundle => {
            const bundleBytes = fs.readFileSync(bundle);
            const hash = multihashes.toHexString(multihashing(bundleBytes, 'sha2-256'));
            const { default: create, name } = require(path.join(process.env.PWD, bundle));
            const customSettings = this.getSettings({ name, address: hash });
            const storageDirectory = Config.getLanguageStoragePath(name);
            const language = create(Object.assign(Object.assign({}, context), { customSettings, storageDirectory }));
            Object.keys(aliases).forEach(alias => {
                if (language.name === aliases[alias]) {
                    aliases[alias] = hash;
                }
            });
            if (language.linksAdapter) {
                language.linksAdapter.addCallback((added, removed) => {
                    __classPrivateFieldGet(this, _linkObservers).forEach(o => {
                        o(added, removed, { name, address: hash });
                    });
                });
            }
            __classPrivateFieldGet(this, _languages).set(hash, language);
            __classPrivateFieldGet(this, _languageConstructors).set(hash, create);
        });
    }
    languageForExpression(e) {
        const address = aliases[e.language.address] ? aliases[e.language.address] : e.language.address;
        const language = __classPrivateFieldGet(this, _languages).get(address);
        if (language) {
            return language;
        }
        else {
            throw new Error("Language for expression not found: " + JSON.stringify(e));
        }
    }
    languageByRef(ref) {
        const address = aliases[ref.address] ? aliases[ref.address] : ref.address;
        const language = __classPrivateFieldGet(this, _languages).get(address);
        if (language) {
            return language;
        }
        else {
            throw new Error("Language not found by reference: " + JSON.stringify(ref));
        }
    }
    filteredLanguageRefs(propertyFilter) {
        const refs = [];
        __classPrivateFieldGet(this, _languages).forEach((language, hash) => {
            if (!propertyFilter || Object.keys(language).includes(propertyFilter)) {
                refs.push({
                    address: hash,
                    name: language.name,
                });
            }
        });
        return refs;
    }
    getInstalledLanguages() {
        return this.filteredLanguageRefs();
    }
    getLanguagesWithExpressionUI() {
        return this.filteredLanguageRefs("expressionUI");
    }
    getLanguagesWithLinksAdapter() {
        return this.filteredLanguageRefs("linksAdapter");
    }
    getConstructorIcon(lang) {
        var _a;
        return (_a = this.languageByRef(lang).expressionUI) === null || _a === void 0 ? void 0 : _a.constructorIcon();
    }
    getSettingsIcon(lang) {
        var _a;
        return (_a = this.languageByRef(lang).settingsUI) === null || _a === void 0 ? void 0 : _a.settingsIcon();
    }
    getIcon(lang) {
        var _a;
        return (_a = this.languageByRef(lang).expressionUI) === null || _a === void 0 ? void 0 : _a.icon();
    }
    getSettings(lang) {
        const FILEPATH = path.join(Config.languagesPath, lang.name, 'settings.json');
        if (fs.existsSync(FILEPATH)) {
            return JSON.parse(fs.readFileSync(FILEPATH).toString());
        }
        else {
            return {};
        }
    }
    putSettings(lang, settings) {
        const directory = path.join(Config.languagesPath, lang.name);
        if (!fs.existsSync(directory))
            fs.mkdirSync(directory);
        const FILEPATH = path.join(directory, 'settings.json');
        fs.writeFileSync(FILEPATH, JSON.stringify(settings));
        __classPrivateFieldGet(this, _languages).set(lang.address, null);
        const create = __classPrivateFieldGet(this, _languageConstructors).get(lang.address);
        const context = __classPrivateFieldGet(this, _context);
        const storageDirectory = Config.getLanguageStoragePath(lang.name);
        const newInstance = create(Object.assign(Object.assign({}, context), { storageDirectory, customSettings: settings }));
        __classPrivateFieldGet(this, _languages).set(lang.address, newInstance);
    }
    async createPublicExpression(lang, content) {
        const putAdapter = this.languageByRef(lang).expressionAdapter.putAdapter;
        let address = null;
        try {
            // Ok, first we assume its a PublicSharing put adapter...
            // @ts-ignore
            address = await putAdapter.createPublic(content);
        }
        catch (e) {
            try {
                // ...and if it's not, let's try to treat it like a
                // ReadOnlyLangauge..
                // @ts-ignore
                address = await putAdapter.addressOf(content);
            }
            catch (e) {
                // If both don't work, we don't know what to do with this put adapter :/
                throw new Error(`Incompatible putAdapter in Languge ${JSON.stringify(lang)}\nPutAdapter: ${Object.keys(putAdapter)}`);
            }
        }
        return new ExpressionRef(lang, address);
    }
    async getExpression(ref) {
        return this.languageForExpression(ref).expressionAdapter.get(ref.expression);
    }
    interact(expression, interaction) {
        console.log("TODO");
    }
    getLinksAdapter(lang) {
        return this.languageByRef(lang).linksAdapter;
    }
    addLinkObserver(observer) {
        __classPrivateFieldGet(this, _linkObservers).push(observer);
    }
}
_languages = new WeakMap(), _languageConstructors = new WeakMap(), _context = new WeakMap(), _linkObservers = new WeakMap();
export function init(context) {
    const languageController = new LanguageController(context);
    return languageController;
}
//# sourceMappingURL=LanguageController.js.map