import type Expression from '../acai/Expression';
import ExpressionRef from '../acai/ExpressionRef';
import type Language from '../acai/Language'
import type { InteractionCall } from '../acai/Language'
import type LanguageContext from '../acai/LanguageContext';
import type LanguageRef from '../acai/LanguageRef'
import fs from 'fs'
import path from 'path'
import multihashing from 'multihashing'
import multihashes from 'multihashes'
import { ipcMain } from 'electron'

const builtInLanguages = ['./src/languages/note-ipfs/build/bundle.js' ]

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

            this.#languages.set(hash, language)
        })
    }

    private languageForExpression(e: ExpressionRef): Language {
        const language = this.#languages.get(e.language.address)
        if(language) {
            return language
        } else {
            throw new Error("Language for expression not found: " + JSON.stringify(e))
        }
    }

    private languageByRef(ref: LanguageRef): Language {
        const language = this.#languages.get(ref.address)
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
        return refs
    }

    getConstructorIcon(lang: LanguageRef): string {
        return this.languageByRef(lang).constructorIcon()
    }

    async createPublicExpression(lang: LanguageRef, content: object): Promise<ExpressionRef> {
        const address = await this.languageByRef(lang).expressionAdapter.create_public_expression(content)
        return new ExpressionRef(lang, address)
    }

    getIcon(ref: ExpressionRef): string {
        return this.languageForExpression(ref).iconFor(ref.expression)
    }

    async getExpression(ref: ExpressionRef): Promise<void | Expression> {
        return this.languageForExpression(ref).expressionAdapter.get_expression_by_address(ref.expression)
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