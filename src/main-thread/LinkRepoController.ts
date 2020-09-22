import type Link from "../acai/Links";
import type { ExpressionRef } from "../acai/Links";
import type { Perspective } from "../acai/Perspective";
import { ipcMain } from 'electron'
import { SHA3 } from "sha3";


export default class LinkRepoController {
    #root: any;

    constructor(gun: any) {
        this.#root = gun.get('link-repositories')
    }

    private getPerspective(perspective: Perspective): any {
        return this.#root.get(perspective.name)
    }


    async getRootLinks(p: Perspective): Promise<Link[]> {
        console.log("LINK REPO: getRootLinks for ", p.name)
        return await new Promise((resolve) => {
            setTimeout(()=>resolve([]), 200)
            this.getPerspective(p)
                .get('root-links')
                .load(linksObject => {
                    const links = <Link[]>Object.values(linksObject)
                    console.log("LINK REPO: Found root links:", links)
                    resolve(links)
                }, {wait:1})
        })
    }
    addRootLink(p: Perspective, link: Link) {
        console.log("LINK REPO: Adding root link:", link)
        const linkNode = this.addLink(p, link)
        this.getPerspective(p).get('root-links').set(linkNode)
    }
    
    addLink(p: Perspective, link: Link) {
        const hash = new SHA3(256); 
        hash.update(JSON.stringify(link));
        const addr = hash.digest('hex');

        const linkNode = this.getPerspective(p).get('links').get(addr).put(link)
        
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

export function init(gun: any): LinkRepoController {
    const linkRepoController = new LinkRepoController(gun)

    ipcMain.handle('links-getRoot', async (e, p: Perspective) => await linkRepoController.getRootLinks(p))
    ipcMain.handle('links-addRoot', (e, p: Perspective, link: Link) => linkRepoController.addRootLink(p, link))
    ipcMain.handle('links-getFrom', async (e, p: Perspective, source: ExpressionRef) => await linkRepoController.getLinksFrom(p, source))
    ipcMain.handle('links-getTo', async (e, p: Perspective, target: ExpressionRef) => await linkRepoController.getLinksTo(p, target))
    ipcMain.handle('links-add', (e, p: Perspective, link: Link) => linkRepoController.addLink(p, link))
    ipcMain.handle('links-remove', (e, p: Perspective, link: Link) => linkRepoController.removeLink(p, link))

    return linkRepoController
}