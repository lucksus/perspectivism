import type Agent from './Agent'

export type Hash = string;

// Unique Language ID with option type
export class LanguageRef {
    // Optional type of ExpressionAdapter which enables generic
    // language adapters like for Holochain where the same
    // ExpressionAdapter implementation can be used with any
    // DNA implementing the Expression trait.
    language_type: void | string;
    language_hash: Hash;
    name: string;
}

export default interface Language {
    readonly name: string;

    // Unique identifier of language (in case of Holochain DNA = DNA hash)
    readonly hash: string;
    
    // Adapter implementation:
    readonly expressionAdapter: ExpressionAdapter;
    
    // UI factories returning web components:
    iconFor(expression: Address): string; // returns JS code that implements this Language's web component
    constructorIcon(): string;
    
    // All available interactions agent 'a' could execute on given expression
    interactions(a: Agent, expression: Address): Interaction[];
}

export interface Address {
    toString(): string;
}

export interface ExpressionAdapter {
    readonly id: string;
    
    create_public_expression(content: object): Address;
    get_expression_by_address(address: Address): void | Expression;
    
    /// Get expressions authored by a given Agent/Identity
    get_by_author(author: Agent, count: number, page: number): void | Expression;
    
    /// Send an expression to someone privately p2p
    send_private(to: Agent, content: object);
    /// Get private expressions sent to you
    inbox(): Expression[];
    
}

export interface Interaction {
    readonly label: string;
    readonly name: string;
    readonly parameters: [string, string][];
    execute(parameters: object);
}

export class InteractionCall {
    name: string;
    parameters: object;
}

export class Expression {
    author: Agent;
    timestamp: string;
    data: object;

    constructor() {
        this.author = {did: "anonymous"}
        this.timestamp = "never"
        this.data = {}
    }
}