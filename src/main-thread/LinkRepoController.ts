import Link, { hashLinkExpression, linkEqual, LinkQuery } from "../acai/Links";
import type Perspective from "../acai/Perspective";
import { ipcMain } from 'electron'
import { SHA3 } from "sha3";
import type Expression from "../acai/Expression";
import type Agent from "../acai/Agent";
import type { LanguageController } from "./LanguageController";
import type LanguageRef from "../acai/LanguageRef";
import * as PubSub from './PubSub'

export default class LinkRepoController {
    #db: any;
    #agent: Agent;
    #languageController: LanguageController
    #pubsub: any

    constructor({db, languageController, agent}) {
        this.#db = db
        this.#agent = agent
        this.#languageController = languageController
        this.#pubsub = PubSub.get()
    }

    linkToExpression(link: Link): Expression {
        return {
            author: this.#agent,
            timestamp: new Date().toString(),
            data: link
        }
    }

    ensureLinkExpression(maybeLink: any): Expression {
        if(maybeLink.author && maybeLink.timestamp && maybeLink.data) {
            return maybeLink as Expression
        }

        if(maybeLink.target) {
            return this.linkToExpression(maybeLink)
        }

        throw new Error("Object is neither Link nor Expression: " + JSON.stringify(maybeLink))
    }

    private callLinksAdapter(p: Perspective, functionName: string, ...args): Promise<any> {
        if(p.linksSharingLanguage && p.linksSharingLanguage !== "") {
            return new Promise(async (resolve, reject) => {
                setTimeout(() => resolve([]), 2000)
                try {
                    const langRef = {address: p.linksSharingLanguage, name: ''} as LanguageRef
                    const linksAdapter = this.#languageController.getLinksAdapter(langRef)
                    if(linksAdapter) {
                        console.debug(`Calling linksAdapter.${functionName}(${args})`)
                        const result = await linksAdapter[functionName](...args)
                        console.debug("Got result:", result)
                        resolve(result)
                    } else {
                        throw new Error("LinksSharingLanguage '"+p.linksSharingLanguage+"' set in perspective '"+p.name+"' not installed!")
                    }
                } catch(e) {
                    console.error("Error while trying to call links adapter:", e)
                    reject(e)
                }
            })
        } else {
            return Promise.resolve([])
        }
    }

    async syncWithSharingAdapter(p: Perspective) {
        const localLinks = this.#db.getAllLinks(p.uuid)
        const remoteLinks = await this.callLinksAdapter(p, 'getLinks')
        const includes = (link, list) => {
            return undefined !== list.find(e =>
                JSON.stringify(e.author) === JSON.stringify(link.author) &&
                e.timestamp === link.timestamp &&
                e.source === link.data.source &&
                e.target === link.data.target &&
                e.predicate === link.data.predicate
                )
        }
        for(const l of localLinks) {
            if(!includes(l, remoteLinks)) {
                await this.callLinksAdapter(p, "addLink", l)
            }
        }

    }

    addLink(p: Perspective, link: Link | Expression): Expression {
        const linkExpression = this.ensureLinkExpression(link)
        this.callLinksAdapter(p, 'addLink', linkExpression)
        const hash = new SHA3(256);
        hash.update(JSON.stringify(linkExpression));
        const addr = hash.digest('hex');

        link = linkExpression.data as Link

        this.#db.storeLink(p.uuid, linkExpression, addr)
        this.#db.attachSource(p.uuid, link.source, addr)
        this.#db.attachTarget(p.uuid, link.target, addr)

        this.#pubsub.publish(PubSub.LINK_ADDED_TOPIC, { perspective: p, linkAdded: linkExpression })

        return linkExpression
    }



    private findLink(p: Perspective, linkToFind: Expression): string {
        const allLinks = this.#db.getAllLinks(p.uuid)
        for(const {name, link} of allLinks) {
            if(linkEqual(linkToFind, link)) {
                return name
            }
        }
        throw `Link not found in perspective "${JSON.stringify(p)}": ${JSON.stringify(linkToFind)}`
    }

    async updateLink(p: Perspective, oldLink: Expression, newLink: Expression) {
        console.debug("LINK REPO: updating link:", oldLink, newLink)
        const addr = this.findLink(p, oldLink)
        console.debug("hash:", addr)

        const _old = oldLink.data as Link
        const _new = newLink.data as Link

        this.#db.updateLink(p.uuid, newLink, addr)
        if(_old.source !== _new.source){
            this.#db.removeSource(p.uuid, _old.source, addr)
            this.#db.attachSource(p.uuid, _new.source, addr)
        }
        if(_old.target !== _new.target){
            this.#db.removeTarget(p.uuid, _old.target, addr)
            this.#db.attachTarget(p.uuid, _new.target, addr)
        }

        this.callLinksAdapter(p, 'updateLink', oldLink, newLink)
        this.#pubsub.publish(PubSub.LINK_ADDED_TOPIC, { perspective: p, link: newLink })
        this.#pubsub.publish(PubSub.LINK_REMOVED_TOPIC, { perspective: p, link: oldLink })
    }

    async removeLink(p: Perspective, linkExpression: Expression) {
        const addr = this.findLink(p, linkExpression)
        const link = linkExpression.data as Link

        this.#db.removeSource(p.uuid, link.source, addr)
        this.#db.removeTarget(p.uuid, link.target, addr)

        this.callLinksAdapter(p, 'removeLink', linkExpression)
        this.#pubsub.publish(PubSub.LINK_REMOVED_TOPIC, { perspective: p, link })
    }

    private getLinksLocal(p: Perspective, query: LinkQuery): Expression[] {
        console.debug("getLinks 1")
        if(!query || !query.source && !query.predicate && !query.target) {
            return this.#db.getAllLinks(p.uuid).map(e => e.link)
        }

        console.debug("getLinks 2")

        if(query.source) {
            console.debug("query.source", query.source)
            let result = this.#db.getLinksBySource(p.uuid, query.source).map(e => e.link)
            // @ts-ignore
            if(query.target) result = result.filter(l => l.data.target === query.target)
            // @ts-ignore


            if(query.predicate) result = result.filter(l => l.data.predicate === query.predicate)
            console.debug("result", result)
            return result
        }

        console.debug("getLinks 3")

        if(query.target) {
            let result = this.#db.getLinksByTarget(p.uuid, query.target).map(e => e.link)
            // @ts-ignore
            if(query.predicate) result = result.filter(l => l.data.predicate === query.predicate)
            return result
        }

        console.debug("getLinks 4")

        return this.#db.getAllLinks(p.uuid).map(e => e.link).filter(link => link.data.predicate === query.predicate)
    }

    async getLinks(p: Perspective, query: LinkQuery): Promise<Expression[]> {
        console.debug("getLinks local...")
        const localLinks = await this.getLinksLocal(p, query)
        console.debug("getLinks local", localLinks)
        console.debug("getLinks remote...")
        const remoteLinks = await this.callLinksAdapter(p, 'getLinks', query)
        console.debug("getLinks remote", remoteLinks)
        const mergedLinks = {}
        localLinks.forEach(l => mergedLinks[hashLinkExpression(l)] = l)
        remoteLinks.forEach(l => mergedLinks[hashLinkExpression(l)] = l)

        return Object.values(mergedLinks)
    }
}

export function init(context: any): LinkRepoController {
    const linkRepoController = new LinkRepoController(context)
    return linkRepoController
}