import type { Address } from "../../acai/Language";

export default class IpfsAddress implements Address {
    hash: string;

    constructor(hash: string) {
        this.hash = hash
    }

    toString(): string {
        return this.hash
    }
}