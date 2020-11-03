import type Address from './Address';
import LanguageRef from './LanguageRef'

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
    return `${ref.language.address}://${ref.expression}`
}

export function parseExprURL(url: string): ExpressionRef {
    const re = /^([^:^\s]+):\/\/([^\s]+)$/
    const matches = re.exec(url)

    if(!matches || matches.length != 3) {
        throw new Error("Couldn't parse string as expression URL: " + url)
    }

    const language = matches[1]
    const expression = matches[2]

    const languageRef = new LanguageRef()
    languageRef.address = language

    const ref = new ExpressionRef(languageRef, expression)
    console.debug(`Parsed ${url} to ${JSON.stringify(ref)}`)
    return ref
}