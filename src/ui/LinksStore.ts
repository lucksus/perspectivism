import { Ad4mClient, linkEqual, LinkQuery, PerspectiveHandle } from "@perspect3vism/ad4m";
import { readable } from 'svelte/store'

export function linksStoreForPerspective(ad4m: Ad4mClient, perspective: PerspectiveHandle) {
    return readable([], set => {

        let allLinks = []
        set(allLinks)

        ad4m.perspective.addPerspectiveLinkAddedListener(perspective.uuid, newLink => {
            allLinks = [...allLinks, newLink]
            set(allLinks)
            return null
        })


        ad4m.perspective.addPerspectiveLinkRemovedListener(perspective.uuid, removedLink => {
            allLinks = allLinks.filter(l => !linkEqual(l, removedLink))
            set(allLinks)
            return null
        })


        async function init() {
            let links
            links = await ad4m.perspective.queryLinks(perspective.uuid, new LinkQuery({}))
            allLinks = links
            set(allLinks)
        }

        init()
    })
}