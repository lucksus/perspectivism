import type Agent from "./Agent";

export default interface LanguageContext {
    agent: Agent;
    IPFS: IPFSNode;
}

export interface IPFSNode {
    add(data: object): Promise<object>
    cat(data: object): Promise<object>
}