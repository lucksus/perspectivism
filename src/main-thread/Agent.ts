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

    did() {
        return this.#did
    }

    didDocument() {
        return this.#didDocument
    }

    initialize(did, didDocument, keystore, password) {
        this.#did = did
        this.#didDocument = didDocument
        this.#wallet = didWallet.create(keystore)
        // @ts-ignore
        this.#wallet.unlock(password)
        this.save(password)
    }

    isInitialized() {
        if(!fs.existsSync(this.#file))
            return false

        this.load()

        return true
    }

    isUnlocked() {
        // @ts-ignore
        return this.#wallet?.keys
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
        const dump = JSON.parse(fs.readFileSync(this.#file).toString())

        this.#did = dump.did
        this.#didDocument = dump.didDocument
        this.#wallet = didWallet.create(dump.keystore)
    }
}

export function init(rootConfigPath: string): Agent {
    const agent = new Agent(rootConfigPath)
    return agent
}