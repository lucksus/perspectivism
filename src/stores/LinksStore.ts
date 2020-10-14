import { writable } from 'svelte/store'
import type Expression from '../acai/Expression';
import { isExpression } from '../acai/Expression';
import { linkEqual as equal, isLink, hashLinkExpression } from '../acai/Links'

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
                        link.id = hashLinkExpression(link)
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
            console.log("links store updating link:", link)
            this.#update(storedLinks => {
                //@ts-ignore
                const index = storedLinks.findIndex(l => l.id == link.id)
                if(index != -1) {
                    //@ts-ignore
                    link.id = hashLinkExpression(link)
                    storedLinks[index] = link
                } else {
                    //@ts-ignore
                    console.error("LinksStore| Couldn't find link with ID", link.id)
                    console.error("LinksStore| have links:", storedLinks)
                }
                return storedLinks
            })
        } else {
            console.error("LinsStore| Can't update link without ID:", JSON.stringify(link))
        }
    }
}