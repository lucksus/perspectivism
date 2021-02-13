import type Address from '../../acai/Address'
import type Expression from '../../acai/Expression'
import type { OnlineAgent, TelepresenceAdapter, TelepresenceRpcCall } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type HolochainLanguageDelegate from '../../core/storage-services/Holochain/HolochainLanguageDelegate'
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



export default class Adapter implements TelepresenceAdapter {
    #holochain: HolochainLanguageDelegate

    constructor(context: LanguageContext) {
        this.#holochain = context.Holochain as HolochainLanguageDelegate
    }

    setOnlineStatus(status: string) {

    }

    getOnlineAgents(): [OnlineAgent] {
        return [] as [OnlineAgent]
    }

    rpcCall(remoteAgentDid: string, call: TelepresenceRpcCall): object {

    }

    registerRpcCallback(callback: TelepresenceRpcCall) {

    }
}