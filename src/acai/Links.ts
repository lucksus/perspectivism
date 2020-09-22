import type { Hash, LanguageRef } from './Language'

// Expression address + unique Language ID = global expression URL
export class ExpressionRef {
    language: LanguageRef;
    expression: Hash;
    
    // Creates unique expression URI like this:
    // expr:[holo]Qm3490gfwe489hf34:Qm90ghjoaw4iehioefwe4ort
    toString() {
        return `expr:${this.language.language_type?'['+this.language.language_type+']':''}:${this.language}:${this.expression}`
    }
}

export default class Link {
    source: ExpressionRef;
    target: ExpressionRef;
    predicate: void | ExpressionRef;
}


