import type Address from '../../ad4m/Address'
import Agent from '../../ad4m/Agent'
import type Expression from '../../ad4m/Expression'
import type { ExpressionAdapter, GetByAuthorAdapter, PublicSharing } from '../../ad4m/Language'
import type LanguageContext from '../../ad4m/LanguageContext'
import type { default as HolochainLanguageDelegate, HolochainService } from "../../core/Holochain";
import { DNA_NICK } from './dna'
import blake2b from 'blake2b'

class ShortFormPutAdapter implements PublicSharing {
    #agent: AgentService
    #shortFormDNA: HolochainLanguageDelegate

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        this.#shortFormDNA = context.Holochain as HolochainLanguageDelegate
    }

    async createPublic(shortForm: object): Promise<Address> {
        //@ts-ignore
        let obj = JSON.parse(shortForm)
        const expression = this.#agent.createSignedExpression(shortForm)

        let res = await this.#shortFormDNA.call(DNA_NICK, "shortform", "create_public_expression", expression);
        return res.holochain_data.element.signed_header.header.hash.toString('hex');
    }
}

export default class ShortFormAdapter implements ExpressionAdapter {
    #shortFormDNA: HolochainLanguageDelegate

    putAdapter: PublicSharing

    constructor(context: LanguageContext) {
        this.#shortFormDNA = context.Holochain as HolochainLanguageDelegate
        this.putAdapter = new ShortFormPutAdapter(context)
    }

    async get(address: Address): Promise<void | Expression> {
        let hash = Buffer.from(address, 'hex');
        let expression = await this.#shortFormDNA.call(DNA_NICK, "shortform", "get_expression_by_address", hash);
        if (expression != null) {
            console.log("Got expression====", expression);
            let acai_expression: Expression = Object.assign(expression.expression_data)
            return acai_expression
        } else {
            return null
        }
    }

    /// Send an expression to someone privately p2p
    send_private(to: Agent, content: object) {
        //@ts-ignore
        let obj = JSON.parse(content)

        this.#shortFormDNA.call(DNA_NICK, "shortform", "send_private", {to: to, data: JSON.stringify(obj)});
    }

    /// Get private expressions sent to you
    async inbox(filterFrom: void | Agent[]): Promise<Expression[]> {
        //TODO: add from & pages to inbox
        if (filterFrom != null) {
            filterFrom = filterFrom[0]
        };
        let res = await this.#shortFormDNA.call(DNA_NICK, "shortform", "get_inbox", {from: filterFrom, page_size: 0, page_number: 0})
        let out = [];
        res.forEach(expression => {
            out.push({
                author: new Agent(expression.creator),
                timestamp: expression.created_at,
                data: JSON.parse(expression),
                proof: undefined
            });
        });
        return out;
    }
}