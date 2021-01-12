import type Expression from "../../acai/Expression";
import type { LinksAdapter, NewLinksObserver } from "../../acai/Language";
import type { LinkQuery } from "../../acai/Links";
import { parseExprURL } from "../../acai/ExpressionRef";
import type Agent from "../../acai/Agent";
import type Link from "../../acai/Links";
import type LanguageContext from "../../acai/LanguageContext";
import type ExpressionRef from "../../acai/ExpressionRef";
import type { default as HolochainLanguageDelegate, HolochainService } from "../../main-thread/Holochain";
import { DNA_NICK } from './dna'

export class JuntoSocialContextLinkAdapter implements LinksAdapter {
    #socialContextDna: HolochainLanguageDelegate

    constructor(context: LanguageContext) {
        //@ts-ignore
        this.#socialContextDna = context.Holochain as HolochainLanguageDelegate
    }

    writable() {
        return true
    }

    public() {
        return false
    }

    async others(): Promise<Agent[]> {
        return await this.#socialContextDna.call(DNA_NICK, "social_context_acai", "get_others", {})
    }

    async addLink(link: Expression) {
        await this.#socialContextDna.call(DNA_NICK, "social_context_acai", "add_link", link)
    }

    async updateLink(oldLinkExpression: Expression, newLinkExpression: Expression) {
    }

    async removeLink(link: Expression) {
    }

    async getLinks(query: LinkQuery): Promise<Expression[]> {   
        let links = await this.#socialContextDna.call(DNA_NICK, "social_context_acai", query)
        return links
    }

    addCallback(callback: NewLinksObserver) {
        throw Error("No callbacks can be added to this link language")
    }
}