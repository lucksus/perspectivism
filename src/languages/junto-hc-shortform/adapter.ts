import type Address from '../../acai/Address'
import Agent from '../../acai/Agent'
import type Expression from '../../acai/Expression'
import type { ExpressionAdapter, GetByAuthorAdapter, PublicSharing } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { default as HolochainLanguageDelegate, HolochainService } from "../../main-thread/Holochain";
import { DNA_NICK } from './dna'
import blake2b from 'blake2b'

class ShortFormPutAdapter implements PublicSharing {
    #shortFormDNA: HolochainLanguageDelegate

    constructor(context: LanguageContext) {
        this.#shortFormDNA = context.Holochain as HolochainLanguageDelegate
    }

    async createPublic(shortForm: object): Promise<Address> {
        //@ts-ignore
        let obj = JSON.parse(shortForm)

        let res = await this.#shortFormDNA.call(DNA_NICK, "shortform", "create_public_expression", {content: JSON.stringify(obj)});
        return res.expression.signed_header.header.hash.toString('hex');
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
        console.log("Getting at address", address);
        var output = new Uint8Array(35)
        let hash = blake2b(output.length).update(address).digest();
        console.log("Getting hash", hash);
        console.log("Hash to string", hash.toString('hex'));
        let expression = await this.#shortFormDNA.call(DNA_NICK, "shortform", "get_expression_by_address", { address });

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

        this.#shortFormDNA.call(DNA_NICK, "shortform", "send_private", {to: to, content: JSON.stringify(obj)});
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