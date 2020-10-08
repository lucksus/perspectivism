import { writable } from 'svelte/store'
import type Expression from '../acai/Expression';

function isExpression(e: any): boolean {
    return e && e.author && e.timestamp && e.data
}

function isLink(l: any): boolean {
    return l && l.source && l.target
}

function equal(l1: Expression, l2: Expression): boolean {
    return JSON.stringify(l1) === JSON.stringify(l2)
}

export default class LinksStore {
    #subscribe
    #update

    constructor() {
        const { subscribe, update } = writable([]);
        this.#subscribe = subscribe
        this.#update = update
    }

    subscribe(...args) {
        return this.#subscribe(...args)
    }

    add(link: Expression) {
        if(isExpression(link) && isLink(link.data)) {
            this.#update(storedLinks => {
                if(!storedLinks.find(l => equal(l, link))) {
                    storedLinks.push(link)
                }
                return storedLinks
            })
        }
    }
}