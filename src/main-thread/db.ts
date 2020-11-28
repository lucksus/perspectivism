import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'

export class PerspectivismDb {
    #db: any

    constructor(adapter) {
        const db = low(adapter)
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
        this.#db.set(this.linkKey(pUUID, linkName), [link])

        const key = this.allLinksKey(pUUID)
        if(!this.#db.has(key).value()) {
            this.#db.set(key, []).write()
        }

        this.#db.get(key)
            .push(linkName)
            .write()
    }

    updateLink(pUUID: String, link: object, linkName: String) {
        const key = this.linkKey(pUUID, linkName)

        if(!this.#db.has(key).value()) {
            this.storeLink(pUUID, link, linkName)
            return
        }

        this.#db.get(key)
            .push(link)
            .write()
    }

    getLink(pUUID: String, linkName: String): object|void {
        const key = this.linkKey(pUUID, linkName)
        return this.#db.get(key).pop()
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
        let allLinkNames = this.#db.get(key).value()
        if(!allLinkNames) {
            allLinkNames = []
        }

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
        if(!this.#db.has(key)) {
            this.#db.set(key, []).write()
        }

        if(!this.#db.get(key).includes(linkName)) {
            this.#db.get(key)
                .push(linkName)
                .write()
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
        this.#db.get(key).remove(linkName).write()
    }
    
}

export function init(dbFilePath): PerspectivismDb {
    const adapter = new FileSync(path.join(dbFilePath, 'db.json'))
    return new PerspectivismDb(adapter)
}

