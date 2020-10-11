import type Link from "../acai/Links";
import type ExpressionRef from "../acai/ExpressionRef";
import type Perspective from "../acai/Perspective";
import { ipcMain } from 'electron'
import { SHA3 } from "sha3";
import type Expression from "../acai/Expression";
import type Agent from "../acai/Agent";
import type { LanguageController } from "./LanguageController";
import type LanguageRef from "../acai/LanguageRef";


export default class LinkRepoController {
    #root: any;
    #agent: Agent;
    #languageController: LanguageController

    constructor({gun, languageController, agent}) {
        this.#root = gun.get('link-repositories')
        this.#agent = agent
        this.#languageController = languageController
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
        const [localLinks, remoteLinks] = await this.getRootLinksLocalAndRemote(p)
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
                await this.callLinksAdapter(p, "addRootLink", l)
            }
        }

    }

    private getRootLinksLocalAndRemote(p: Perspective): Promise<Expression[][]> {
        const localLinks = new Promise((resolve) => {
            setTimeout(()=>resolve([]), 200)
            this.getPerspective(p)
                .get('root-links')
                .load(linksObject => {
                    const links = Object.values(linksObject) as Link[]
                    console.log("LINK REPO: Found root links:", links)
                    resolve(links)
                }, {wait:1})
        })

        const remoteLinks = this.callLinksAdapter(p, 'getRootLinks')

        return Promise.all([localLinks, remoteLinks])
    } 

    async getRootLinks(p: Perspective): Promise<Expression[]> {
        const both = await this.getRootLinksLocalAndRemote(p)
        const merged = [].concat.apply([], both)

        console.log("MERGED LINKS:", merged)

        return merged

    }
    addRootLink(p: Perspective, link: Link) {
        console.log("LINK REPO: Adding root link:", link)
        const expression = this.linkToExpression(link)
        this.callLinksAdapter(p, 'addRootLink', expression)
        const linkNode = this.addLink(p, expression)
        this.getPerspective(p).get('root-links').set(linkNode)
    }

    addLink(p: Perspective, link: Link | Expression) {
        const linkExpression = this.ensureLinkExpression(link)
        this.callLinksAdapter(p, 'addLink', linkExpression)
        const hash = new SHA3(256);
        hash.update(JSON.stringify(linkExpression));
        const addr = hash.digest('hex');

        link = linkExpression.data as Link
        const linkNode = this.getPerspective(p).get('links').get(addr).put(linkExpression)

        // store link in both directions:
        // 1. from source to target
        this.getPerspective(p).get('sources').get(link.source).set(linkNode)
        // 2. from target to source
        this.getPerspective(p).get('targets').get(link.target).set(linkNode)

        return linkNode
    }

    removeLink(p: Perspective, link: Link) {
        this.getPerspective(p).get('sources').get(link.source).unset(link)
        this.getPerspective(p).get('targets').get(link.target).unset(link)
    }

    async getLinksFrom(p: Perspective, source: ExpressionRef): Promise<Link[]> {
        return await new Promise((resolve) => {
            this.getPerspective(p)
                .get('sources')
                .get(source)
                .load()
                .once(links => resolve(links))
        })
    }

    async getLinksTo(p: Perspective, target: ExpressionRef): Promise<Link[]>{
        return await new Promise((resolve) => {
            this.getPerspective(p)
                .get('sources')
                .get(target)
                .load()
                .once(links => resolve(links))
        })
    }


}

export function init(context: any): LinkRepoController {
    const linkRepoController = new LinkRepoController(context)

    ipcMain.handle('links-getRoot', async (e, p: Perspective) => await linkRepoController.getRootLinks(p))
    ipcMain.handle('links-addRoot', (e, p: Perspective, link: Link) => linkRepoController.addRootLink(p, link))
    ipcMain.handle('links-getFrom', async (e, p: Perspective, source: ExpressionRef) => await linkRepoController.getLinksFrom(p, source))
    ipcMain.handle('links-getTo', async (e, p: Perspective, target: ExpressionRef) => await linkRepoController.getLinksTo(p, target))
    ipcMain.handle('links-add', (e, p: Perspective, link: Link) => linkRepoController.addLink(p, link))
    ipcMain.handle('links-remove', (e, p: Perspective, link: Link) => linkRepoController.removeLink(p, link))
    ipcMain.handle('links-sync', (e, p: Perspective) => linkRepoController.syncWithSharingAdapter(p))

    return linkRepoController
}