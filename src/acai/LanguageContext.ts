import type Agent from "./Agent";

export default interface LanguageContext {
    agent: Agent;
    IPFS: IPFSNode;
    storageDirectory: string;
    customSettings: object;
}

export interface IPFSNode {
    add(data: object): Promise<object>
    cat(data: object): Promise<object>
}