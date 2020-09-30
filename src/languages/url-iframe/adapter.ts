import type Address from '../../acai/Address'
import Agent from '../../acai/Agent'
import type Expression from '../../acai/Expression'
import type { ExpressionAdapter } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'

export default class Adapter implements ExpressionAdapter {

    constructor(context: LanguageContext) {
    }

    async create_public_expression(data: object): Promise<Address> {
        // making sure it's a well formatted URL
        // @ts-ignore
        const url = new URL(data.url)
        const address = url.toString()
        // @ts-ignore
        return address as Address
    }

    async get_expression_by_address(address: Address): Promise<void | Expression> {
        const data = { url: address }

        const url = new URL(address)

        const expression = {
            author: new Agent(url.hostname),
            timestamp: 'unknown',
            data,
        };

        return expression

    }

    /// Get expressions authored by a given Agent/Identity
    get_by_author(author: Agent, count: number, page: number): Promise<void | Expression> {
        console.log("get_by_author not implemented for note-ipfs")
        return null
    }

    /// Send an expression to someone privately p2p
    send_private(to: Agent, content: object) {
        console.log("send_private not implemented for note-ipfs")
    }

    /// Get private expressions sent to you
    async inbox(): Promise<Expression[]> {
        return []
    }
}