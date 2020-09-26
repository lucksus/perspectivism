import type Address from './Address';
import type LanguageRef from './LanguageRef'

// Expression address + unique Language ID = global expression URL
export default class ExpressionRef {
    language: LanguageRef;
    expression: Address;

    constructor(lang: LanguageRef, expr: Address) {
        this.language = lang
        this.expression = expr
    }
}

// Creates unique expression URI like this:
// expr:Qm3490gfwe489hf34:Qm90ghjoaw4iehioefwe4ort
export function exprRef2String(ref: ExpressionRef): string {
    return `expr:${ref.language.address}:${ref.expression}`
}

