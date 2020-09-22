import type ExpressionRef from './ExpressionRef'

export default class Link {
    source: ExpressionRef;
    target: ExpressionRef;
    predicate: void | ExpressionRef;
}


