import type ExpressionRef from './ExpressionRef'

export default class Link {
    source: ExpressionRef;
    target: ExpressionRef;
    predicate?: ExpressionRef;

    constructor(obj) {
        this.source = obj.source ? obj.source : ''
        this.target = obj.target ? obj.target : ''
        this.predicate = obj.predicate ? obj.predicate : ''
    }
}
