import Link, { hashLinkExpression, linkEqual, LinkQuery } from "../acai/Links";
import ExpressionRef, { parseExprURL } from "../acai/ExpressionRef";
import type Perspective from "../acai/Perspective";
import { ipcMain } from 'electron'
import { SHA3 } from "sha3";
import type Expression from "../acai/Expression";
import type Agent from "../acai/Agent";
import type { LanguageController } from "./LanguageController";
import type LanguageRef from "../acai/LanguageRef";
import { createGraphQLExecutor } from 'electron-graphql'
import { buildSchema } from 'graphql'
import { loadSchema } from '@graphql-tools/load'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'

const schemaPromise = loadSchema('./src/main-thread/schema.graphql', {
    loaders: [ new GraphQLFileLoader ]
})


var rootValue = { hello: () => 'Hello world!' };


export default class LinkRepoController {
    #root: any;
    #agent: Agent;
    #languageController: LanguageController

    constructor({gun, languageController, agent}) {
        this.#root = gun.get('link-repositories')
        this.#agent = agent
        this.#languageController = languageController

        schemaPromise.then(schema => {
            // create GraphQL executor
            const gqlExecutor = createGraphQLExecutor({
                // electron IPC channel (base name)
                channel: 'graphql-electron',
                schema,
                rootValue: this.graphQlResolver(),
                contextValue: {}
            })
            
            // init GraphQL executor
            gqlExecutor.init()
        })
    }

    private graphQlResolver(): object {
        return {
            hello: () => 'Hello world!',
            links: async (params) => {
                const { perspectiveUUID, query } = params
                const perspective = { uuid: perspectiveUUID } as Perspective
                const result = await this.getLinks(perspective, query)
                return result
            },
            expression: (url: String) => {
                const ref = parseExprURL(url.toString())
                return this.#languageController.getExpression(ref)
            },
            addLink: (params) => {
                const { perspectiveUUID, link } = params
                const perspective = { uuid: perspectiveUUID } as Perspective
                return this.addLink(perspective, link)
            },
            updateLink: (params) => {
                const { perspectiveUUID, oldLink, newLink } = params
                const perspective = { uuid: perspectiveUUID } as Perspective
                console.log("GQL| updateLink:", perspective, oldLink, newLink)
                this.updateLink(perspective, oldLink, newLink)
                return newLink
            },
            removeLink: (params) => {
                const { perspectiveUUID, link } = params
                const perspective = { uuid: perspectiveUUID } as Perspective
                this.removeLink(perspective, link)
                return true
            }
        }
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
        if(p.linksSharingLanguage && p.linksSharingLanguage!="") {
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
            return undefined != list.find(e => 
                JSON.stringify(e.author) == JSON.stringify(link.author) &&
                e.timestamp == link.timestamp &&
                e.source == link.data.source &&
                e.target == link.data.target &&
                e.predicate == link.data.predicate
                )
        }
        for(const i in localLinks) {
            const l = localLinks[i]
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
            for(const i in args) {
                context = context.get(args[i])
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
                reject(`Link not found in perspective "${p.name}": ${JSON.stringify(link)}`)
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
    }

    async removeLink(p: Perspective, linkExpression: Expression) {
        const addr = await this.findLink(p, linkExpression)
        const link = linkExpression.data
        //@ts-ignore
        this.getPerspective(p).get('sources').get(link.sources)?.unset(addr)
        //@ts-ignore
        this.getPerspective(p).get('targets').get(link.target)?.unset(addr)
        this.getPerspective(p).get('root-links').unset(addr)
        this.getPerspective(p).get('links').get(addr)?.put({})
        this.callLinksAdapter(p, 'removeLink', linkExpression)
    }

    private async getLinksLocal(p: Perspective, query: LinkQuery): Promise<Expression[]> {
        console.debug("getLinks 1")
        if(!query || !query.source && !query.predicate && !query.target) {
            return await this.getLinksPath(p, 'links')
        }

        console.debug("getLinks 2")

        if(query.source) {
            let result = await this.getLinksPath(p, 'sources', query.source)
            //@ts-ignore
            if(query.target) result = result.filter(l => l.data.target === query.target)
            //@ts-ignore
            if(query.predicate) result = result.filter(l => l.data.predicate === query.predicate)
            return result
        }

        console.debug("getLinks 3")

        if(query.target) {
            let result = await this.getLinksPath(p, 'targets', query.target)
            //@ts-ignore
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

    ipcMain.handle('links-get', async (e, p: Perspective, query: LinkQuery) => await linkRepoController.getLinks(p, query))
    ipcMain.handle('links-getFrom', async (e, p: Perspective, source: string) => await linkRepoController.getLinksFrom(p, source))
    ipcMain.handle('links-getTo', async (e, p: Perspective, target: string) => await linkRepoController.getLinksTo(p, target))
    ipcMain.handle('links-add', (e, p: Perspective, link: Expression) => linkRepoController.addLink(p, link))
    ipcMain.handle('links-remove', (e, p: Perspective, link: Expression) => linkRepoController.removeLink(p, link))
    ipcMain.handle('links-sync', (e, p: Perspective) => linkRepoController.syncWithSharingAdapter(p))
    ipcMain.handle('links-update', (e, p: Perspective, oldLink: Expression, newLink: Expression) => linkRepoController.updateLink(p, oldLink, newLink))

    return linkRepoController
}