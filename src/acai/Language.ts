import type Address from './Address'
import type Agent from './Agent'
import type Expression from './Expression'

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

export interface ExpressionAdapter {
    create_public_expression(content: object): Promise<Address>;
    get_expression_by_address(address: Address): Promise<void | Expression>;

    /// Get expressions authored by a given Agent/Identity
    get_by_author(author: Agent, count: number, page: number): Promise<void | Expression>;

    /// Send an expression to someone privately p2p
    send_private(to: Agent, content: object);
    /// Get private expressions sent to you
    inbox(): Promise<Expression[]>;

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
