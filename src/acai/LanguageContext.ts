import type AgentService from "./AgentService";

export default interface LanguageContext {
    agent: AgentService;
    IPFS: IPFSNode;
    storageDirectory: string;
    customSettings: object;
}

export interface IPFSNode {
    add(data: object): Promise<object>
    cat(data: object): Promise<object>
}