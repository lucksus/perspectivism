import type Expression from "../acai/Expression"
import type { DIDResolver } from "./DIDs"
import sha256 from 'sha256'
import secp256k1 from 'secp256k1'

export default class Signatures {
    #didResolver: DIDResolver

    constructor(didResolver: DIDResolver) {
        this.#didResolver = didResolver
    }

    async verify(expr: Expression): Promise<boolean> {
        // @ts-ignore
        const { didDocument } = await this.#didResolver.resolve(expr.author.did)
        if(!didDocument) return false


        if(!didDocument.publicKey) {
            console.error("Got weird DID document without 'publicKey':", didDocument)
        }

        const key = didDocument.publicKey.find(key => key.id === expr.proof.key)
        if(!key) return false

        const pubKey = Uint8Array.from(Buffer.from(key.publicKeyHex, "hex"))
        const sigBytes = Uint8Array.from(Buffer.from(expr.proof.signature, "hex"))
        const message = Signatures.buildMessage(expr.data, expr.timestamp)

        return secp256k1.ecdsaVerify(sigBytes, message, pubKey)
    }

    static buildMessage(data: any, timestamp: string): Uint8Array {
        const payload = { data, timestamp}
        const payloadString = JSON.stringify(payload)
        const payloadBuffer = Buffer.from(payloadString)
        const payloadBytes = Uint8Array.from(sha256(Uint8Array.from(payloadBuffer), { asBytes: true }))
        return payloadBytes
    }
}
