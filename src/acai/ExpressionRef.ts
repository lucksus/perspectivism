import type { Address } from './Language';
import type LanguageRef from './LanguageRef'

// Expression address + unique Language ID = global expression URL
export default class ExpressionRef {
    language: LanguageRef;
    expression: Address;

    constructor(lang: LanguageRef, expr: Address) {
        this.language = lang
        this.expression = expr
    }

    // Creates unique expression URI like this:
    // expr:[holo]Qm3490gfwe489hf34:Qm90ghjoaw4iehioefwe4ort
    toString() {
        return `expr:${this.language.languageType?'['+this.language.languageType+']':''}:${this.language}:${this.expression}`
    }
}
