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
    #root: any;
    #agent: Agent;
    #languageController: LanguageController
    #pubsub: any

    constructor({gun, languageController, agent}) {
        this.#root = gun.get('link-repositories')
        this.#agent = agent
        this.#languageController = languageController
        this.#pubsub = PubSub.get()
    }

    private getPerspective(perspective: Perspective): any {
        return this.#root.get(perspective.uuid)
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
        const localLinks = await this.getLinksPath(p, 'links')
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

    private async getLinkByAddress(p: Perspective, addr: string): Promise<Expression> {
        return new Promise(resolve => {
            console.debug("getLinkByAddress:", addr)
            this.getPerspective(p).get('links').get(addr).load(link => resolve(link))
        })
    }

    private async getLinksPath(p: Perspective, ...args: string[]): Promise<Expression[]> {
        return new Promise((resolve) => {
            setTimeout(()=>resolve([]), 200)
            let context = this.getPerspective(p)
            for(const arg of args) {
                context = context.get(arg)
            }
            context.load(linksObject => {
                console.debug("linksObject:", linksObject)
                const values = Object.values(linksObject) as string[]
                Promise.all(values.map(value => {
                    if(typeof(value) === 'object') {
                        return Promise.resolve(value)
                    } else {
                        return this.getLinkByAddress(p, value)
                    }
                })).then(links => resolve(links))
            })
        })
    }

    addLink(p: Perspective, link: Link | Expression): Expression {
        const linkExpression = this.ensureLinkExpression(link)
        this.callLinksAdapter(p, 'addLink', linkExpression)
        const hash = new SHA3(256);
        hash.update(JSON.stringify(linkExpression));
        const addr = hash.digest('hex');

        link = linkExpression.data as Link
        this.getPerspective(p).get('links').get(addr).put(linkExpression)

        // store link in both directions:
        // 1. from source to target
        this.getPerspective(p).get('sources').get(link.source).set(addr)
        // 2. from target to source
        this.getPerspective(p).get('targets').get(link.target).set(addr)


        this.#pubsub.publish(PubSub.LINK_ADDED_TOPIC, { perspective: p, linkAdded: linkExpression })

        return linkExpression
    }



    private async findLink(p: Perspective, link: Expression): Promise<string> {
        return new Promise((resolve, reject) => {
            this.getPerspective(p).get('links').load(allLinks => {
                console.log("all links:", allLinks)
                for(const addr in allLinks) {
                    if(linkEqual(allLinks[addr], link)) {
                        resolve(addr)
                        return
                    }
                }
                reject(`Link not found in perspective "${JSON.stringify(p)}": ${JSON.stringify(link)}`)
            })
        })
    }

    async updateLink(p: Perspective, oldLink: Expression, newLink: Expression) {
        console.debug("LINK REPO: updating link:", oldLink, newLink)
        const addr = await this.findLink(p, oldLink)
        console.debug("hash:", addr)
        this.getPerspective(p).get('links').get(addr).put(newLink)
        this.getPerspective(p).get('links').get(addr).load(loaded => console.log("loaded:", loaded))
        this.callLinksAdapter(p, 'updateLink', oldLink, newLink)
        this.#pubsub.publish(PubSub.LINK_ADDED_TOPIC, { perspective: p, link: newLink })
        this.#pubsub.publish(PubSub.LINK_REMOVED_TOPIC, { perspective: p, link: oldLink })
    }

    async removeLink(p: Perspective, linkExpression: Expression) {
        const addr = await this.findLink(p, linkExpression)
        const link = linkExpression.data
        // @ts-ignore
        this.getPerspective(p).get('sources').get(link.sources)?.unset(addr)
        // @ts-ignore
        this.getPerspective(p).get('targets').get(link.target)?.unset(addr)
        this.getPerspective(p).get('root-links').unset(addr)
        this.getPerspective(p).get('links').get(addr)?.put({})
        this.callLinksAdapter(p, 'removeLink', linkExpression)
        this.#pubsub.publish(PubSub.LINK_REMOVED_TOPIC, { perspective: p, link })
    }

    private async getLinksLocal(p: Perspective, query: LinkQuery): Promise<Expression[]> {
        console.debug("getLinks 1")
        if(!query || !query.source && !query.predicate && !query.target) {
            return await this.getLinksPath(p, 'links')
        }

        console.debug("getLinks 2")

        if(query.source) {
            console.debug("query.source", query.source)
            let result = await this.getLinksPath(p, 'sources', query.source)
            // @ts-ignore
            if(query.target) result = result.filter(l => l.data.target === query.target)
            // @ts-ignore


            if(query.predicate) result = result.filter(l => l.data.predicate === query.predicate)
            console.debug("result", result)
            return result
        }

        console.debug("getLinks 3")

        if(query.target) {
            let result = await this.getLinksPath(p, 'targets', query.target)
            // @ts-ignore
            if(query.predicate) result = result.filter(l => l.data.predicate === query.predicate)
            return result
        }

        console.debug("getLinks 4")

        return await this.getLinksPath(p, 'predicates', query.predicate)
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

    async getLinksFrom(p: Perspective, source: string): Promise<Expression[]> {
        console.debug("LinkRepoController.getLinksFrom(",source,")")
        return await this.getLinksPath(p, 'sources', source)
    }

    async getLinksTo(p: Perspective, target: string): Promise<Expression[]>{
        return await this.getLinksPath(p, 'targets', target)
    }


}

export function init(context: any): LinkRepoController {
    const linkRepoController = new LinkRepoController(context)
    return linkRepoController
}