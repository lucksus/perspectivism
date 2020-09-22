import type Agent from './Agent'

export default class Expression {
    author: Agent;
    timestamp: string;
    data: object;

    constructor() {
        this.author = {did: "anonymous"}
        this.timestamp = "never"
        this.data = {}
    }
}