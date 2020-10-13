import { writable } from 'svelte/store'
import type Expression from '../acai/Expression';

function isExpression(e: any): boolean {
    return e && e.author && e.timestamp && e.data
}

function isLink(l: any): boolean {
    return l && l.source && l.target
}

function equal(l1: Expression, l2: Expression): boolean {
    return JSON.stringify(l1.author) == JSON.stringify(l2.author) &&
        l1.timestamp == l2.timestamp &&
        //@ts-ignore
        l1.data.source == l2.data.source &&
        //@ts-ignore
        l1.data.predicate == l2.data.predicate &&
        //@ts-ignore
        l1.data.target == l2.data.target
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
                    //@ts-ignore
                    if(!link.id) {
                        //@ts-ignore
                        link.id = storedLinks.length
                    }
                    storedLinks.push(link)
                }
                return storedLinks
            })
        }
    }

    update(link: Expression) {
        //@ts-ignore
        if(isExpression(link) && isLink(link.data) && link.id != undefined) {
            this.#update(storedLinks => {
                //@ts-ignore
                const index = storedLinks.findIndex(l => l.id == link.id)
                if(index != -1) {
                    storedLinks[index] = link
                } else {
                    //@ts-ignore
                    console.error("LinsStore| Couldn't find link with ID", link.id)
                }
                return storedLinks
            })
        } else {
            console.error("LinsStore| Can't update link without ID:", JSON.stringify(link))
        }
    }
}