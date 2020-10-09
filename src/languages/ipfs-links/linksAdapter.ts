import type Expression from "../../acai/Expression";
import type { LinksAdapter, NewLinksObserver } from "../../acai/Language";
import type Link from "../../acai/Links";
import type LanguageContext from "../../acai/LanguageContext";
import { SHA3 } from "sha3";
import type ExpressionRef from "../../acai/ExpressionRef";
import Room from 'ipfs-pubsub-room'
import path from 'path'
import fs from 'fs'

const _appendBuffer = (buffer1, buffer2) => {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};

const uint8ArrayConcat = (chunks) => {
    return chunks.reduce(_appendBuffer)
}


const example = {
    links: [{author:"", ts: "", data: {source:""}}],
    rootLinks: [1, 5]
}

export class IpfsLinksAdapter implements LinksAdapter {
    #callbacks: NewLinksObserver[];
    #IPFS: any
    #storage: string
    #roomName: string
    #key: any
    #initialized: boolean
    #room: any
    #peerList: object

    constructor(context: LanguageContext) {
        this.#callbacks = []
        this.#IPFS = context.IPFS
        this.#storage = context.storageDirectory
        //@ts-ignore
        this.#roomName = context.customSettings.roomName ? context.customSettings.roomName : 'acai-ipfs-links-default-room'
        this.#initialized = false
        this.#room = new Room(this.#IPFS, this.#roomName)
        this.#room.on('message', this.handlePubSubMessage)
        this.init()
        
    }

    async init() {
        // Get/initialize IPNS key
        const keys = await this.#IPFS.key.list()
        this.#key = keys.find(e => e.name == this.#roomName)
        if(!this.#key) {
            this.#key = await this.#IPFS.gen(this.#roomName)
        }

        // Read/initialized peer list
        this.#peerList = []
        if(fs.existsSync(this.paths().peers)) {
            this.#peerList = JSON.parse(fs.readFileSync(this.paths().peers).toString())
        }

        this.#initialized = true
    }

    private async getLinksOfPeer(peer, ipns): Promise<void | object> {
        let result = undefined
        try {        
            const cid = ipns.toString()

            const chunks = []
            // @ts-ignore
            for await (const chunk of this.#IPFS.cat(cid)) {
                chunks.push(chunk)
            }
            result = JSON.parse(uint8ArrayConcat(chunks).toString());
        } catch(e) {
            console.error("IPFS LINKS| Error while retrieving links of peer", peer, " via IPNS CID", ipns,":\n", e)
        }

        return result
    }

    private rememberPeer(peer, ipns) {
        if(!this.#peerList[peer.toString()] == ipns) {
            this.#peerList[peer.toString()] = ipns
            fs.writeFileSync(this.paths().peers, JSON.stringify(this.#peerList))
        }
    }

    private paths() {
        return {
            peers: path.join(this.#storage, 'peers.json'),
            myLinks: path.join(this.#storage, 'myLinks.json')
        }
    }

    private handlePubSubMessage(message) {
        const { from, data } = message
        const ipnsCid = data.toString()
        this.rememberPeer(from, ipnsCid)
        //this.checkUpdateLinksOfPeer(from, ipnsCid)
        this.notify(from)
    }

    private async notify(peer) {
        const linksOfPeer = await this.getLinksOfPeer(peer, this.#peerList[peer])
        if(linksOfPeer) {
            //@ts-ignore
            this.#callbacks.forEach(cb => cb(linksOfPeer.links))
        }
    }

    private publish(links: object) {
        const content = JSON.stringify(links)
        const result = this.#IPFS.add({content})
        this.#IPFS.name.publish(result.cid, {key: this.#key})
        this.#room.broadcast(this.#key)
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
        let requestList = [{peer: 'me', ipns: this.#key}]
        Object.keys(this.#peerList).forEach(peer => {
            requestList.push({peer, ipns: this.#peerList[peer]})
        })
            
        const allLinksOfallPeers = await Promise.all(
            requestList.map(r => {
                this.getLinksOfPeer(r.peer, r.ipns)
            })
        )

        //@ts-ignore
        const merged = [].concat.apply([], allLinksOfallPeers.map(e => e.links))
        return merged
    }

    async addRootLink(link: Expression) {
        this._addLink(link, true)
    }

    addLink(link: Expression) {
        this._addLink(link, false)
    }

    private async _addLink(link: Expression, root: boolean) {
        let linksObject = await this.getLinksOfPeer("me", this.#key)
        //@ts-ignore
        if(!linksObject || !linksObject.links || !linksObject.rootLinks) {
            linksObject = {
                links: [],
                rootLinks: []
            }
        }
        //@ts-ignore
        linksObject.links.push(link)
        if(root) {
            //@ts-ignore
            linksObject.rootLinks.push(linksObject.links.length - 1)
        }
        this.publish(linksObject)
    }

    async getLinksFrom(source: ExpressionRef): Promise<Expression[]> {
        return []
    }

    async getLinksTo(target: ExpressionRef): Promise<Expression[]>{
        return []
    }

    addCallback(callback: NewLinksObserver) {
        this.#callbacks.push(callback)
    }
}