import type Expression from "../../acai/Expression";
import type { LinksAdapter, NewLinksObserver } from "../../acai/Language";
import type { LinkQuery } from "../../acai/Links";
import { parseExprURL } from "../../acai/ExpressionRef";
import Agent from "../../acai/Agent";
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
        //Get members on the first chunk; right now this is returning users as hc-agent://pubaddr. In the future the DNA should resolved
        //agent addresses to did's
        const others = await this.#socialContextDna.call(DNA_NICK, "social_context_link_store", "get_others", {subject: "chunk://hc-agent://hc-agent?chunk=0"});
        others.forEach(function(part, index, array) {
            array[index] = new Agent(array[index]);
        });
        return others
    }

    async addLink(link: Expression) {
        let link_exp = link.data as Link;

        //If link source is root; then turn it into perspectivsm friendly url
        if (link_exp.source == "root") {
            link_exp.source = "root://root";
        };

        //let object_lang = parseExprURL(link_exp.target).language;
        //let object_lang_url = object_lang + "://" + object_lang;
        
        //let author_url = "did://" + link.author;

        //Create link
        await this.#socialContextDna.call(DNA_NICK, "junto_social_context_link_store", "add_link", {source: link_exp.source, object: link_exp.target, predicate: link_exp.predicate});
        
        // //Creating language -> expression
        // this.#socialContextDna.call("junto_social_context_link_store", "add_simple_link", {subject: object_lang_url, object: link_exp.target, predicate: link_exp.predicate})

        // //Creating agent -> expression
        // this.#socialContextDna.call("junto_social_context_link_store", "add_simple_link", {subject: author_url, object: link_exp.target, predicate: link_exp.predicate})

        // //Creating agent -> language
        // this.#socialContextDna.call("junto_social_context_link_store", "add_simple_link", {subject: author_url, object: object_lang_url, predicate: link_exp.predicate})
    }

    async updateLink(oldLinkExpression: Expression, newLinkExpression: Expression) {
    }

    async removeLink(link: Expression) {
    }

    async getLinks(query: LinkQuery): Promise<Expression[]> {
        //TODO; this needs to return creator & timestamp so it can be put into an Expression
        const links = await this.#socialContextDna.call(DNA_NICK, "junto_social_context_link_store", "get_links", {source: query.source, predicate: query.predicate});
        links.forEach(function(part, index, array) {
            array[index] = {
                //Might need to resolve creator to did information
                author: array[index].author,
                timestamp: array[index].timestamp,
                data: {
                    subject: array[index].subject,
                    object: array[index].object,
                    predicate: array[index].predicate
                },
                proof: undefined
            };
        });
        return links
    }

    addCallback(callback: NewLinksObserver) {
        throw Error("No callbacks can be added to this link language")
    }
}