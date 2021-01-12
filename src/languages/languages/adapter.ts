import type Address from '../../acai/Address'
import type Expression from '../../acai/Expression'
import type { ExpressionAdapter, PublicSharing } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type HolochainLanguageDelegate from '../../core/storage-services/Holochain/HolochainLanguageDelegate'
import { IpfsPutAdapter } from './putAdapter'
import { DNA_NICK } from './dna'

const _appendBuffer = (buffer1, buffer2) => {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};

const uint8ArrayConcat = (chunks) => {
    return chunks.reduce(_appendBuffer)
}



export default class Adapter implements ExpressionAdapter {
    #holochain: HolochainLanguageDelegate

    putAdapter: PublicSharing

    constructor(context: LanguageContext) {
        this.#holochain = context.Holochain as HolochainLanguageDelegate
        this.putAdapter = new IpfsPutAdapter(context)
    }

    async get(address: Address): Promise<void | Expression> {

        const { expressions } = await this.#holochain.call(DNA_NICK, "anchored-expression", "get_expressions", { key: address });

        if(expressions.length === 0)
            return null

        const expression = expressions.pop()
        expressions.data = JSON.parse(Buffer.from(expression.data).toString())
        return expression

    }
}