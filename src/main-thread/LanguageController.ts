import type Expression from '../acai/Expression';
import type ExpressionRef from '../acai/ExpressionRef';
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
        const language = this.#languages[e.language.languageHash]
        if(language) {
            return language.iconFor(e.expression)
        } else {
            throw new Error("Language for expression not found: " + e)
        }
    }

    getInstalledLanguages(): LanguageRef[] {
        let refs: LanguageRef[] = []
        this.#languages.forEach((language, hash) => {
            refs.push({
                languageHash: hash,
                languageType: null,
                name: language.name,
            })
        })
        return refs
    }

    getConstructorIcon(language: LanguageRef): string {
        return this.#languages.get(language.languageHash).constructorIcon()
    }

    getIcon(expression: ExpressionRef): string {
        return this.languageForExpression(expression).iconFor(expression)
    }

    async getExpression(expression: ExpressionRef): Promise<void | Expression> {
        return this.languageForExpression(expression).expressionAdapter.get_expression_by_address(expression)
    }

    interact(expression: ExpressionRef, interaction: InteractionCall) {
        console.log("TODO")
    }
}

export function init(context: LanguageContext): LanguageController {
    const languageController = new LanguageController(context)

    ipcMain.handle('languages-getInstalled', (e) => languageController.getInstalledLanguages())
    ipcMain.handle('languages-getConstructorIcon', (e, languageRef) => languageController.getConstructorIcon(languageRef))
    ipcMain.handle('languages-getExpression', async (event, expressionRef) => await languageController.getExpression(expressionRef))
    ipcMain.handle('languages-interact', async (event, expressionRef, interaction) => await languageController.interact(expressionRef, interaction))

    return languageController
}