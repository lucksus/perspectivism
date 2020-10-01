import type Expression from '../acai/Expression';
import ExpressionRef from '../acai/ExpressionRef';
import type Language from '../acai/Language'
import type { InteractionCall, PublicSharing } from '../acai/Language'
import type LanguageContext from '../acai/LanguageContext';
import type LanguageRef from '../acai/LanguageRef'
import fs from 'fs'
import path from 'path'
import multihashing from 'multihashing'
import multihashes from 'multihashes'
import { ipcMain } from 'electron'

const builtInLanguages = [
    'note-ipfs',
    'url-iframe'
].map(l => `./src/languages/${l}/build/bundle.js`)

const aliases = {
    'http': 'url-iframe',
    'https': 'url-iframe'
}

export class LanguageController {
    #languages: Map<string, Language>
    #context: LanguageContext;


    constructor(context: LanguageContext) {
        this.#context = context
        this.#languages = new Map()

        builtInLanguages.forEach( bundle => {
            const bundleBytes = fs.readFileSync(bundle)
            const hash = multihashes.toHexString(multihashing(bundleBytes, 'sha2-256'))
            const create = require(path.join(process.env.PWD, bundle))
            const language = create(context)

            Object.keys(aliases).forEach(alias => {
                if(language.name == aliases[alias]) {
                    aliases[alias] = hash
                }
            })

            this.#languages.set(hash, language)
        })
    }

    private languageForExpression(e: ExpressionRef): Language {
        let address = aliases[e.language.address] ? aliases[e.language.address] : e.language.address
        const language = this.#languages.get(address)
        if(language) {
            return language
        } else {
            throw new Error("Language for expression not found: " + JSON.stringify(e))
        }
    }

    private languageByRef(ref: LanguageRef): Language {
        let address = aliases[ref.address] ? aliases[ref.address] : ref.address
        let language = this.#languages.get(address)
        if(language) {
            return language
        } else {
            throw new Error("Language not found by reference: " + JSON.stringify(ref))
        }
    }

    getInstalledLanguages(): LanguageRef[] {
        let refs: LanguageRef[] = []
        this.#languages.forEach((language, hash) => {
            refs.push({
                address: hash,
                name: language.name,
            })
        })
        Object.keys(aliases).forEach(alias => {
            refs.push({
                address: alias,
                name: alias,
            })
        })
        return refs
    }

    getConstructorIcon(lang: LanguageRef): string {
        return this.languageByRef(lang).constructorIcon()
    }

    async createPublicExpression(lang: LanguageRef, content: object): Promise<ExpressionRef> {
        const putAdapter = this.languageByRef(lang).expressionAdapter.putAdapter
        let address = null

        try {
            // Ok, first we assume its a PublicSharing put adapter...
            //@ts-ignore
            address = await putAdapter.createPublic(content)
        } catch(e) {
            try {
                // ...and if it's not, let's try to treat it like a
                // ReadOnlyLangauge..
                //@ts-ignore
                address = await putAdapter.addressOf(content)
            } catch(e) {
                // If both don't work, we don't know what to do with this put adapter :/
                throw new Error(`Incompatible putAdapter in Languge ${JSON.stringify(lang)}\nPutAdapter: ${Object.keys(putAdapter)}`)
            }
        }

        return new ExpressionRef(lang, address)
    }

    getIcon(lang: LanguageRef): string {
        return  this.languageByRef(lang).icon()
    }

    async getExpression(ref: ExpressionRef): Promise<void | Expression> {
        return this.languageForExpression(ref).expressionAdapter.get(ref.expression)
    }

    interact(expression: ExpressionRef, interaction: InteractionCall) {
        console.log("TODO")
    }
}

export function init(context: LanguageContext): LanguageController {
    const languageController = new LanguageController(context)

    ipcMain.handle('languages-getInstalled', (e) => languageController.getInstalledLanguages())
    ipcMain.handle('languages-getConstructorIcon', (e, languageRef) => languageController.getConstructorIcon(languageRef))
    ipcMain.handle('languages-getIcon', async (e, expressionRef) => {
        let result
        try {
            result = await languageController.getIcon(expressionRef)
        } catch(e) {
            console.error("ERROR: exception during languageController.getIcon(expressionRef):", e)
            result = null
        }
        return result
    })
    ipcMain.handle('languages-createPublicExpression', async (e, languageRef, content) => await languageController.createPublicExpression(languageRef, content))
    ipcMain.handle('languages-getExpression', async (event, expressionRef) => await languageController.getExpression(expressionRef))
    ipcMain.handle('languages-interact', async (event, expressionRef, interaction) => await languageController.interact(expressionRef, interaction))

    return languageController
}