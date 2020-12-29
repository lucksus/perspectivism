import type Address from '../../acai/Address'
import Agent from '../../acai/Agent'
import type Expression from '../../acai/Expression'
import type { ExpressionAdapter, GetByAuthorAdapter, PublicSharing } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { default as HolochainLanguageDelegate, HolochainService } from "../../main-thread/Holochain";
import DNA from './dna'

const DNA_NICK = "junto-shortform"

class ShortFormPutAdapter implements PublicSharing {
    #shortFormDNA: HolochainLanguageDelegate

    constructor(context: LanguageContext) {
        //@ts-ignore
        this.#shortFormDNA = context.customSettings.shortFormDNA ? context.customSettings.shortFormDNA : undefined;
    }

    async createPublic(shortForm: object): Promise<Address> {
        //@ts-ignore
        let obj = JSON.parse(shortForm)

        let res = this.#shortFormDNA.call("shortform", "create_public_expression", {content: obj});
        return res.expression.signed_header.header;
    }
}

export default class ShortFormAdapter implements ExpressionAdapter {
    #shortFormDNA: HolochainLanguageDelegate

    putAdapter: PublicSharing

    constructor(context: LanguageContext) {
        const Holochain = context.Holochain as HolochainLanguageDelegate
        Holochain.registerDNA(DNA, DNA_NICK)
        this.#shortFormDNA = Holochain
        this.putAdapter = new ShortFormPutAdapter(context)
    }

    async get(address: Address): Promise<void | Expression> {
        let expression = this.#shortFormDNA.call("shortform", "get_expression_by_address", { address });

        if (expression.entry.Present != undefined) {
            return {
                //Might need to resolve creator to did information
                author: new Agent(expression.creator),
                timestamp: expression.created_at,
                data: JSON.parse(expression),
                proof: undefined
            }
        } else {
            return null
        }
    }

    /// Send an expression to someone privately p2p
    send_private(to: Agent, content: object) {
        //@ts-ignore
        let obj = JSON.parse(content)

        this.#shortFormDNA.call("shortform", "send_private", {to: to, content: obj});
    }

    /// Get private expressions sent to you
    async inbox(filterFrom: void | Agent[]): Promise<Expression[]> {
        //TODO: add from & pages to inbox
        if (filterFrom != null) {
            filterFrom = filterFrom[0]
        };
        let res = this.#shortFormDNA.call("shortform", "get_inbox", {from: filterFrom, page_size: 0, page_number: 0})
        let out = [];
        res.forEach(expression => {
            out.push({
                //Might need to resolve creator to did information
                author: new Agent(expression.creator),
                timestamp: expression.created_at,
                data: JSON.parse(expression),
                proof: undefined
            });
        });
        return out;
    }
}