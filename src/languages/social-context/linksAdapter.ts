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
        let data = prepareExpressionLink(link);
        console.debug("Holochain Social Context: ADDING LINK!: ", data);
        await this.#socialContextDna.call(DNA_NICK, "social_context_acai", "add_link", data)
    }

    async updateLink(oldLinkExpression: Expression, newLinkExpression: Expression) {
        let source_link = prepareExpressionLink(oldLinkExpression);
        let target_link = prepareExpressionLink(newLinkExpression);
        await this.#socialContextDna.call(DNA_NICK, "social_context_acai", "update_link", {source: source_link, target: target_link})
    }

    async removeLink(link: Expression) {
        let data = prepareExpressionLink(link);
        await this.#socialContextDna.call(DNA_NICK, "social_context_acai", "remove_link", data)
    }

    async getLinks(query: LinkQuery): Promise<Expression[]> {
        let link_query = Object.assign(query);  
        if (!link_query.source) {
            link_query.source = "root";
        };
        console.debug("Holochain Social Context: Getting Links With: ", link_query); 
        let links = await this.#socialContextDna.call(DNA_NICK, "social_context_acai", "get_links", link_query)
        console.debug("Holchain Social Context: Got Links", links);
        return links
    }

    addCallback(callback: NewLinksObserver) {
        console.error("No callbacks can be added to this link language");
        return 0
    }
}

function prepareExpressionLink(link: Expression): object {
    let data = Object.assign(link);
    if (data.data.subject == '') {
        data.data.subject = null;
    };
    if (data.data.target == '') {
        data.data.target = null;
    };
    if (data.data.predicate == '') {
        data.data.predicate = null;
    };
    return data
}