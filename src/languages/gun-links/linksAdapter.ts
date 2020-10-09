import type Expression from "../../acai/Expression";
import type { LinksAdapter, NewLinksObserver } from "../../acai/Language";
import type Link from "../../acai/Links";
const Gun = require("gun")
require('gun/lib/load.js')
require('gun/lib/nts.js')
import type LanguageContext from "../../acai/LanguageContext";
import { SHA3 } from "sha3";
import type ExpressionRef from "../../acai/ExpressionRef";

export class GunLinksAdapter implements LinksAdapter {
    #callbacks: NewLinksObserver[];
    #gun: any

    constructor(context: LanguageContext) {
        this.#callbacks = []

        const dbPath = context.storageDirectory + "/gun"
        const opts = {
            file: dbPath,
            localStorage: false
        }

        //@ts-ignore
        if(context.customSettings.gunDbPeer) {
            //@ts-ignore
            opts.peers = {} 
            //@ts-ignore
            opts.peers[context.customSettings.gunDbPeer] = {}
        }

        //@ts-ignore
        if(context.customSettings.runServer) {
            //@ts-ignore
            let server = require('http').createServer().listen(context.customSettings.port);
            //@ts-ignore
            opts.web = server
        }
        
        this.#gun = new Gun(opts)

        this.#gun.get('root-links').map().open(links => {
            console.log("GUN-LINKS: Received root links:", links)
            this.#callbacks.forEach(callback => {
                callback([links])
            })
        })

    }

    writable() {
        return true
    }

    public() {
        return true
    }

    others() {
        return []
    }

    async getRootLinks(): Promise<Expression[]> {
        return await new Promise((resolve) => {
            this.#gun
                .get('root-links')
                .load(linksObject => {
                    const links = Object.values(linksObject) as Expression[]
                    console.log("GUN-LINKS: Found root links:", links)
                    resolve(links)
                }, {wait:1})
        })
    }

    addRootLink(link: Expression) {
        console.log("GUN-LINKS| adding root link:", link)
        const linkNode = this.addLink(link)
        this.#gun.get('root-links').set(linkNode)
    }

    addLink(linkExpression: Expression) {
        const hash = new SHA3(256);
        hash.update(JSON.stringify(linkExpression));
        const addr = hash.digest('hex');

        const linkNode = this.#gun.get('links').get(addr).put(linkExpression)

        const link = linkExpression.data as Link

        // store link in both directions:
        // 1. from source to target
        this.#gun.get('sources').get(link.source).set(linkNode)
        // 2. from target to source
        this.#gun.get('targets').get(link.target).set(linkNode)
        // 2. by predicate
        this.#gun.get('predicates').get(link.predicate).set(linkNode)

        return linkNode
    }

    async getLinksFrom(source: ExpressionRef): Promise<Expression[]> {
        return await new Promise((resolve) => {
            this.#gun
                .get('sources')
                .get(source)
                .load()
                .once(links => resolve(links))
        })
    }

    async getLinksTo(target: ExpressionRef): Promise<Expression[]>{
        return await new Promise((resolve) => {
            this.#gun
                .get('sources')
                .get(target)
                .load()
                .once(links => resolve(links))
        })
    }

    addCallback(callback: NewLinksObserver) {
        this.#callbacks.push(callback)
    }
}