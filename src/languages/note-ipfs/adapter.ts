import Agent from '../../acai/Agent'
import type Expression from '../../acai/Expression'
import type { ExpressionAdapter } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { IPFSNode } from '../../acai/LanguageContext'
import IpfsAddress from './address'

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
    #agent: Agent
    #IPFS: IPFSNode

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        this.#IPFS = context.IPFS
    }

    async create_public_expression(note: object): Promise<IpfsAddress> {
        const expression = {
            author: this.#agent.did,
            timestamp: new Date().toString(),
            data: note,
        }

        const content = JSON.stringify(expression)
        const result = await this.#IPFS.add({content})
        // @ts-ignore
        return new IpfsAddress(result.cid)
    }

    async get_expression_by_address(address: IpfsAddress): Promise<void | Expression> {
        const cid = address.toString()

        const chunks = []
        // @ts-ignore
        for await (const chunk of this.#IPFS.cat(cid)) {
            chunks.push(chunk)
        }

        const fileString = uint8ArrayConcat(chunks).toString();
        const fileJson = JSON.parse(fileString)
        const expression = {
            author: new Agent(fileJson.agent),
            timestamp: fileJson.timestamp,
            data: fileJson.data
        };

        return expression

    }

    /// Get expressions authored by a given Agent/Identity
    get_by_author(author: Agent, count: number, page: number): Promise<void | Expression> {
        console.log("get_by_author not implemented for note-ipfs")
        return null
    }

    /// Send an expression to someone privately p2p
    send_private(to: Agent, content: object) {
        console.log("send_private not implemented for note-ipfs")
    }

    /// Get private expressions sent to you
    async inbox(): Promise<Expression[]> {
        return []
    }
}