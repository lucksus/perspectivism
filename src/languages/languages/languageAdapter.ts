import type Address from '../../acai/Address';
import type { LanguageAdapter as Interface, PublicSharing} from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext';
import type { IPFSNode } from '../../acai/LanguageContext';


const _appendBuffer = (buffer1, buffer2) => {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};

const uint8ArrayConcat = (chunks) => {
    return chunks.reduce(_appendBuffer)
}


export default class LanguageAdapter implements Interface {
    #IPFS: IPFSNode

    putAdapter: PublicSharing

    constructor(context: LanguageContext) {
        this.#IPFS = context.IPFS
    }

    async getLanguageSource(address: Address): Promise<String> {
        const cid = address.toString()

        const chunks = []
        // @ts-ignore
        for await (const chunk of this.#IPFS.cat(cid)) {
            chunks.push(chunk)
        }

        const fileString = uint8ArrayConcat(chunks).toString();
        return fileString

    }
}