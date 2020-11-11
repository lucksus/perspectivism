import lmdb from 'node-lmdb'
import { TsJestTransformer } from 'ts-jest/dist/ts-jest-transformer';

export class PerspectivismDb {
    #db: any
    #env: any

    constructor(dbFilePath) {
        const env = new lmdb.Env();
        env.open({
            path: dbFilePath,
            mapSize: 2*1024*1024*1024, // maximum database size
            maxDbs: 1
        });
        const db = env.openDbi({
          name: "perspectivism",
          create: true // will create if database did not exist
        })
    
        this.#env = env
        this.#db = db
    }

    linkKey(pUUID: String, linkName: String) {
        return `${pUUID}-link-${linkName}`
    }

    allLinksKey(pUUID: String) {
        return `${pUUID}-all_links`
    }

    sourceKey(pUUID: String, source: String) {
        return `${pUUID}-from_source-${source}`
    }

    targetKey(pUUID: String, target: String) {
        return `${pUUID}-to_target-${target}`
    }

    storeLink(pUUID: String, link: object, linkName: String) {
        let txn = this.#env.beginTxn()
        txn.putString(this.#db, this.linkKey(pUUID, linkName), JSON.stringify([link]))
        const allLinksRaw = txn.getString(this.#db, this.allLinksKey(pUUID))
        let allLinks = allLinksRaw ? JSON.parse(allLinksRaw) : []
        allLinks.push(linkName)
        txn.putString(this.#db, this.allLinksKey(pUUID), JSON.stringify(allLinks))
        txn.commit()
    }

    updateLink(pUUID: String, link: object, linkName: String) {
        const key = this.linkKey(pUUID, linkName)
        let txn = this.#env.beginTxn()
        const linkStatesRaw = txn.getString(this.#db, key)
        let linkStates = linkStatesRaw ? JSON.parse(linkStatesRaw) : []
        linkStates.push(link)
        txn.putString(this.#db, key, JSON.stringify(linkStates))
        txn.commit()
    }

    getLink(pUUID: String, linkName: String): object|void {
        let txn = this.#env.beginTxn()
        const linkStatesRaw = txn.getString(this.#db, this.linkKey(pUUID, linkName))
        txn.abort()
        let linkStates = linkStatesRaw ? JSON.parse(linkStatesRaw) : []
        return linkStates.pop()
    }

    getAllLinks(pUUID: String): any[] {
        return this.getLinksByKey(pUUID, this.allLinksKey(pUUID))
    }

    getLinksBySource(pUUID: String, source: String): any[] {
        const key = this.sourceKey(pUUID, source)
        return this.getLinksByKey(pUUID, key)
    }

    getLinksByTarget(pUUID: String, target: String): any[] {
        const key = this.targetKey(pUUID, target)
        return this.getLinksByKey(pUUID, key)
    }

    getLinksByKey(pUUID: String, key: String): any[] {
        let txn = this.#env.beginTxn()
        const allLinkNamesRaw = txn.getString(this.#db, key)
        const allLinkNames = allLinkNamesRaw ? JSON.parse(allLinkNamesRaw) : []
        txn.abort()

        let allLinks = []
        for(const linkName of allLinkNames) {
            allLinks.push({
                name: linkName,
                link: this.getLink(pUUID, linkName)
            })
        }
        return allLinks
    }

    attachSource(pUUID: String, source: String, linkName: String) {
        const key = this.sourceKey(pUUID, source)
        this.attach(key, linkName)
    }

    attachTarget(pUUID: String, target: String, linkName: String) {
        const key = this.targetKey(pUUID, target)
        this.attach(key, linkName)
    }

    attach(key: String, linkName: String) {
        let txn = this.#env.beginTxn()
        const sourceLinkNamesRaw = txn.getString(this.#db, key)
        let sourceLinkNames = sourceLinkNamesRaw ? JSON.parse(sourceLinkNamesRaw) : []
        if(!sourceLinkNames.includes(linkName)) {
            sourceLinkNames.push(linkName)
            txn.putString(this.#db, key, JSON.stringify(sourceLinkNames))
            txn.commit()
        } else {
            txn.abort()
        }
    }

    removeSource(pUUID: String, source: String, linkName: String) {
        const key = this.sourceKey(pUUID, source)
        this.remove(key, linkName)
    }

    removeTarget(pUUID: String, target: String, linkName: String) {
        const key = this.targetKey(pUUID, target)
        this.remove(key, linkName)
    }


    remove(key: String, linkName: String) {
        let txn = this.#env.beginTxn()
        const sourceLinkNamesRaw = txn.getString(this.#db, key)
        let sourceLinkNames = sourceLinkNamesRaw ? JSON.parse(sourceLinkNamesRaw) : []
        if(sourceLinkNames.include(linkName)) {
            sourceLinkNames = sourceLinkNames.filter((element)=> element !== linkName)
            txn.putString(this.#db, key, JSON.stringify(sourceLinkNames))
            txn.commit()
        } else {
            txn.abort()
        }
    }
    
}

export function init(dbFilePath): PerspectivismDb {
    return new PerspectivismDb(dbFilePath)
}

