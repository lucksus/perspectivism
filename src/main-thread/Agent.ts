import * as path from 'path';
import * as fs from 'fs';
import didWallet from '@transmute/did-wallet'

export class Agent {
    #did: string
    #didDocument: object
    #wallet: object
    #file: string

    constructor(rootConfigPath: string) {
        this.#file = path.join(rootConfigPath, "agent.json")
    }

    initialize(did, didDocument, keystore, password) {
        this.#did = did
        this.#didDocument = didDocument

        console.debug("Creating wallet...")
        this.#wallet = didWallet.create(keystore)
        console.debug("done.")

        console.debug("Unlocking wallet...")
        try {
            // @ts-ignore
            this.#wallet.unlock(password)
        } catch(e) {
            console.error(e)
            return
        }
        
        console.debug("done.")

        console.debug("Saving wallet...")
        this.save(password)
        console.debug("done.")
    }

    isInitialized() {
        return fs.existsSync(this.#file)
    }

    isUnlocked() {
        // @ts-ignore
        const keys = this.#wallet.keys ? true : false
        return keys
    }

    unlock(password) {
        // @ts-ignore
        this.#wallet.unlock(password)
    }

    save(password) {
        // @ts-ignore
        this.#wallet.lock(password)

        const dump = {
            did: this.#did,
            didDocument: this.#didDocument,
            // @ts-ignore
            keystore: this.#wallet.export()
        }

        fs.writeFileSync(this.#file, JSON.stringify(dump))

        // @ts-ignore
        this.#wallet.unlock(password)
    }

    load() {
        if(!this.isInitialized()) return

        const dump = JSON.parse(fs.readFileSync(this.#file).toString())

        this.#did = dump.did
        this.#didDocument = dump.didDocument
        this.#wallet = didWallet.create(dump.keystore)
    }

    dump() {
        const isInitialized = this.isInitialized()
        // @ts-ignore
        const isUnlocked = this.#wallet.keys ? true : false
        const dump = {
            isInitialized,
            isUnlocked,
            did: this.#did,
            didDocument: this.#didDocument
        }
        return dump
    }
}

export function init(rootConfigPath: string): Agent {
    const agent = new Agent(rootConfigPath)
    agent.load()
    return agent
}