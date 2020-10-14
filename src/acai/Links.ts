import type Expression from './Expression';
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

export interface LinkQuery {
    source?: ExpressionRef;
    target?: ExpressionRef;
    predicate?: ExpressionRef;
}

export function linkEqual(l1: Expression, l2: Expression): boolean {
    return JSON.stringify(l1.author) == JSON.stringify(l2.author) &&
        l1.timestamp == l2.timestamp &&
        //@ts-ignore
        l1.data.source == l2.data.source &&
        //@ts-ignore
        l1.data.predicate == l2.data.predicate &&
        //@ts-ignore
        l1.data.target == l2.data.target
}

export function isLink(l: any): boolean {
    return l && l.source && l.target
}

export function hashLinkExpression(link: Expression): number {
    const mash = JSON.stringify(link.data, Object.keys(link.data). sort()) +
                JSON.stringify(link.author) + link.timestamp
    var hash = 0, i, chr;
    for (i = 0; i < mash.length; i++) {
        chr   = mash.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}