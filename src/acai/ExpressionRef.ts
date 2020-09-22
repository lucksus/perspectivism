import type LanguageRef from './LanguageRef'
import type { Hash } from './LanguageRef'

// Expression address + unique Language ID = global expression URL
export default class ExpressionRef {
    language: LanguageRef;
    expression: Hash;

    // Creates unique expression URI like this:
    // expr:[holo]Qm3490gfwe489hf34:Qm90ghjoaw4iehioefwe4ort
    toString() {
        return `expr:${this.language.languageType?'['+this.language.languageType+']':''}:${this.language}:${this.expression}`
    }
}
