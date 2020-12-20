import type AgentService from "./AgentService";
import type SignaturesService from "./SignaturesService";

export default interface LanguageContext {
    agent: AgentService;
    IPFS: IPFSNode;
    signatures: SignaturesService;
    storageDirectory: string;
    customSettings: object;
}

export interface IPFSNode {
    add(data: object): Promise<object>
    cat(data: object): Promise<object>
}