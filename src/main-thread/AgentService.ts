import * as path from 'path';
import * as fs from 'fs';
import didWallet from '@transmute/did-wallet'
import Expression, { ExpressionProof } from '../acai/Expression';
import secp256k1 from 'secp256k1'

import { Signatures } from './Signatures';
import Agent from '../acai/Agent';
import type Language from '../acai/Language';


export default class AgentService {
    #did: string
    #didDocument: object
    #wallet: object
    #file: string
    #fileProfile: string
    #agent: Agent
    #agentLanguage: Language

    constructor(rootConfigPath: string) {
        this.#file = path.join(rootConfigPath, "agent.json")
        this.#fileProfile = path.join(rootConfigPath, "agentProfile.json")
    }

    get did() {
        return this.#did
    }

    get agent() {
        return this.#agent
    }

    createSignedExpression(data: any): Expression {
        if(!this.isUnlocked()) {
            throw "Can't sign with locked keystore"
        }

        const timestamp = new Date().toString()
        const payloadBytes = Signatures.buildMessage(data, timestamp)
        
        const key = this.getSigningKey()
        const privKey = Uint8Array.from(Buffer.from(key.privateKey, key.encoding))
        
        const sigObj = secp256k1.ecdsaSign(payloadBytes, privKey)
        const sigBuffer = Buffer.from(sigObj.signature)
        const sigHex = sigBuffer.toString('hex')

        const signedExpresssion = {
            author: { did: this.#did },
            timestamp,
            data,
            proof: new ExpressionProof(sigHex, `${this.#did}#primary`)
        } as Expression

        console.debug("Signed Expression:", signedExpresssion)
        return signedExpresssion
    }

    updateAgent(a: Agent) {
        this.#agent = a
        this.storeAgentProfile()
    }

    setAgentLanguage(lang: Language) {
        if(!lang?.agentAdapter) {
            console.error("AgentService ERROR: Not an AgentLanguage:", lang)
            return
        }

        this.#agentLanguage = lang
    }

    storeAgentProfile() {
        fs.writeFileSync(this.#fileProfile, JSON.stringify(this.#agent))

        if(!this.#agentLanguage) {
            console.error("AgentService ERROR: Can't store Agent profile. No AgentLanguage installed.")
            return
        }

        if(this.#agent?.did)
            this.#agentLanguage.agentAdapter.setProfile(this.#agent)
    }

    private getSigningKey() {
        // @ts-ignore
        const keys = this.#wallet.extractByTags(["#primary"])
        if(keys.length === 0) {
            throw "No '#primary' key found in keystore. Abort signing."
        }
        if(keys.length > 1) {
            throw "Multiple '#primary' keys found in keystore. Abort signing."
        }

        const key = keys[0]
        console.log(key)
        return key
    }

    initialize(did, didDocument, keystore, password) {
        this.#did = did
        this.#didDocument = didDocument
        this.#agent = new Agent(did)

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
        this.storeAgentProfile()
    }

    save(password) {
        // @ts-ignore
        this.#wallet.lock(password)

        const dump = {
            did: this.#did,
            didDocument: this.#didDocument,
            // @ts-ignore
            keystore: this.#wallet.export(),
            agent: this.#agent
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
        if(fs.existsSync(this.#fileProfile))
            this.#agent = JSON.parse(fs.readFileSync(this.#fileProfile).toString())
        else {
            this.#agent = new Agent(this.#did)
        }
    }

    dump() {
        const isInitialized = this.isInitialized()
        // @ts-ignore
        const isUnlocked = this.#wallet.keys ? true : false
        const dump = {
            agent: this.#agent,
            isInitialized,
            isUnlocked,
            did: this.#did,
            didDocument: this.#didDocument
        }
        return dump
    }
}

export function init(rootConfigPath: string): AgentService {
    const agent = new AgentService(rootConfigPath)
    agent.load()
    return agent
}