<script lang="ts">
    import type Perspective from '../acai/Perspective'

    export let perspective: Perspective

    import IconButton from '@smui/icon-button';
    import Fab, {Icon, Label} from '@smui/fab';
    import Link, { hashLinkExpression, linkEqual } from '../acai/Links';
    import { exprRef2String } from '../acai/ExpressionRef';
    import ExpressionIcon from './ExpressionIcon.svelte';
    import iconComponentFromString from './iconComponentFromString';
    import ConstructionMenu from './ConstructionMenu.svelte'
    import PerspectiveSettings from './PerspectiveSettings.svelte';
    import ExpressionContextMenu from "./ExpressionContextMenu.svelte";
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    import { query, mutation, getClient } from "svelte-apollo";
    import { gql } from '@apollo/client';
    import { LANGUAGES } from './graphql_queries'

    $: if(perspective) {
        getClient().subscribe({
        query: gql`
            subscription {
                linkAdded(perspectiveUUID: "${perspective.uuid}") {
                    timestamp
                }
            }   
        `}).subscribe({
            next: () => linksStore.fetchMore({}),
            error: (e) => console.error(e)
        })

        getClient().subscribe({
        query: gql`
            subscription {
                linkRemoved(perspectiveUUID: "${perspective.uuid}") {
                    timestamp
                }
            }   
        `}).subscribe({
            next: () => linksStore.refetch({}),
            error: (e) => console.error(e)
        })
    }

    $: ALL_LINKS_QUERY = gql`{ 
        links(perspectiveUUID: "${perspective.uuid}", query: { }) {
            author { did }
            timestamp
            data {
                source
                predicate
                target
            }
        }
    }`

    $: ADD_LINK = mutation(gql`
        mutation AddLink($link: String){
            addLink(input: { perspectiveUUID: "${perspective.uuid}", link: $link }) {
                author { did }
                timestamp
                data {
                    source
                    predicate
                    target
                }
            }
        }
    `)

    $: UPDATE_LINK = mutation(gql`
        mutation UpdateLink($oldLink: String, $newLink: String){
            updateLink(input: { perspectiveUUID: "${perspective.uuid}", oldLink: $oldLink, newLink: $newLink }) {
                timestamp
            }
        }
    `)

    $: REMOVE_LINK = mutation(gql`
        mutation RemoveLink($link: String){
            removeLink(input: { perspectiveUUID: "${perspective.uuid}", link: $link }) 
        }
    `)

    $: CREATE_EXPRESSION = mutation(gql`
        mutation CreateExpression($languageAddress: String, $content: String) {
            createExpression(input: { languageAddress: $languageAddress, content: $content})
        }
    `)

    let linksStore
    let constructionMenu
    let languages = []
    let languageIcons = {
        'note-ipfs': 'note',
        'url-iframe': 'link'
    }
    let constructorIconComponents = {}
    let iconStates = {}

    let content
    let container
    let zoom = 0
    let translateX = 0
    let translateY = 0
    let isPanning = false
    let isMovingExpression = false
    let movingLink
    let movingLinkOriginal
    let isLinking = false
    let linkingSource
    let linkingCursor = {}
    let dropMove = false

    let showSettings = false

    $: if(content && zoom!=undefined && translateX!=undefined && translateY!=undefined) {
        console.debug("SET TRANSFORM:", zoom)
        content.setAttribute("style", calcPerspectiveContentStyle())
    }

    function calcPerspectiveContentStyle() {
        return `
            position: absolute; 
            width: 100%; height: 100%; 
            top: 0; left: 0;
            transform: translateX(${translateX}px) translateY(${translateY}px) translateZ(${zoom}px);
            transform-style: preserve-3d;
        `
    }

    function handleMouseWheel(event) {
        let factor = 0.3
        const normalized = Math.abs(zoom/3)
        if(zoom < 0 && normalized > 2) {
            factor = 0.3 * Math.log2(normalized)    
        } 

        zoom -= event.deltaY * factor

        if(zoom > 45) zoom = 45
        console.log("zoom:", zoom)
    }

    function zoomNormalizedMouseMove(coords) {
        let factor
        if(zoom < 0) {
            const dist = -zoom
            factor = 1 + (dist/1000)
        } else {
            const dist = zoom
            factor = 1 - (dist/1000)
        }

        return {
            x: coords.x * factor,
            y: coords.y * factor,
        }
    }

    function dist(c1, c2) {
        const x = c1.x - c2.x
        const y = c1.y - c2.y
        return Math.sqrt(x*x + y*y)
    }

    function hoveredLink(coords, moving) {
        for(const i in $linksStore.data.links) {
            const link = $linksStore.data.links[i]
            if(link.data.source === "root" && link.data.predicate?.startsWith("coord2d://") && link.data.target != moving.target) {
                const linkCoords = linkTo2D(link)
                const d = dist(coords, linkCoords)
                if(d < 300) return link
            }
        }
        return null
    }

    function handleMouseMove(event) {
        const d = zoomNormalizedMouseMove({x: event.movementX, y: event.movementY })
        if(isPanning) {
            translateX += d.x
            translateY += d.y
        }

        if(isMovingExpression) {
            let point = linkTo2D(movingLink)
            point.x += d.x
            point.y += d.y
            movingLink.data.predicate = coordToPredicate(point)
            if(hoveredLink(point, movingLink.data)) {
                dropMove = true
                console.log("drop move!")
            } else {
                dropMove = false
            }
            //linksStore.update(movingLink)
        }

        if(isLinking) {
            linkingCursor = zoomNormalizedMouseMove({
                x: event.clientX,
                y: event.clientY
            })
            console.log("linking cursor:", JSON.stringify(linkingCursor))
        }
    }

    function getLinkIdFromPath(event) {
        for(const i in event.path) {
            console.log(event.path[i])
            if(event.path[i].dataset && event.path[i].dataset.linkId !== undefined)
                return event.path[i].dataset.linkId
        }
        return undefined
    }

    function handleMouseDown(event) {
        if(event.button === 2) return
        if(event.target == content || event.target == container)
            isPanning = true
        else {
            console.log("clicked something else:", event.path)
            const linkId = getLinkIdFromPath(event)
            console.log("link id:", linkId)
            if(linkId) {
                const hoveredLink = $linksStore.data.links.find(l => hashLinkExpression(l) == linkId)
                if(isLinking) {
                    const newLink = {
                        source: linkingSource.data.target,
                        target: hoveredLink.data.target,
                    }
                    ADD_LINK({
                        variables: {
                            link: JSON.stringify(newLink)
                        }
                    })
                } else {
                    if(hoveredLink) {
                        movingLink = {
                            author: { did: hoveredLink.author.did },
                            timestamp: hoveredLink.timestamp,
                            data: {
                                source: hoveredLink.data.source,
                                predicate: hoveredLink.data.predicate,
                                target: hoveredLink.data.target,
                            }
                        }
                        movingLinkOriginal = JSON.parse(JSON.stringify(movingLink))
                        isMovingExpression = true
                        console.log("MOVING")
                    }
                    else {
                        console.error("Couldn't find link with ID", linkId)
                        console.error("have links", $linksStore)
                    }
                }
                
                
            }
        }
    }

    function handleMouseUp(event) {
        console.debug(isMovingExpression, movingLink, movingLinkOriginal)
        if(isMovingExpression && !linkEqual(movingLink, movingLinkOriginal)) {
            const newLinkObject = JSON.parse(JSON.stringify(movingLink))
            delete newLinkObject.id
            console.debug("Updating link:", JSON.stringify(movingLinkOriginal), JSON.stringify(movingLinkOriginal))
            UPDATE_LINK({
                variables: {
                    oldLink: JSON.stringify(movingLinkOriginal), 
                    newLink: JSON.stringify(newLinkObject)
                }
            })
        }

        isPanning = false
        isMovingExpression = false
        isLinking = false
        linkingSource = false
    }

    function contextMenu(event) {
        isPanning = false
        isMovingExpression = false
        constructionMenu.open(event.clientX, event.clientY)
    }

    getClient().query({
        query: LANGUAGES,
        variables: { filter: "expressionUI" }
    }).then( expressionUILanguages => {
        console.log("Got installed languages:", JSON.stringify(expressionUILanguages))
        languages = expressionUILanguages.data.languages
    })


    async function commitExpression(lang, content, container) {
        const creationResult = await CREATE_EXPRESSION({
            variables: {
                languageAddress: lang.address,
                content
            }
        })

        const exprURL = creationResult.data.createExpression
        console.log("Created new expression:", exprURL)
        
        ADD_LINK({
            variables: {
                link: JSON.stringify(new Link({source: 'root', target: exprURL}))
            }
        })

        container.innerHTML = ''
    }

    async function createExpression(lang) {
        console.log("Create expression:", lang, JSON.stringify(lang))
        if(!constructorIconComponents[lang.name]) {
            const { data } = await getClient().query({
                query: gql`
                { 
                    language(address: "${lang.address}") {
                        constructorIcon {
                            code
                        }
                    }
                }
                `
            })
            const code = data.language.constructorIcon.code
            const ConstructorIcon = iconComponentFromString(code, lang.name)
            constructorIconComponents[lang.name] = ConstructorIcon
            customElements.define(lang.name+"-constructor", ConstructorIcon);
        }

        const container = document.getElementById("constructor-container")

        container.innerHTML = ''
        const constructorIcon = new constructorIconComponents[lang.name]()
        constructorIcon.commitExpression = async (content) => {
            commitExpression(lang, content, container)
        }
        constructorIcon.discard = () => {
            container.innerHTML = ''
        }
        
        container.appendChild(constructorIcon)
    }

    $: if(perspective) {
        linksStore = query(ALL_LINKS_QUERY)
    }

    function linkTo2D(link) {
        const origin = {x: 0, y: 0}
        if(!link.data.predicate)
            return origin
        const pred = link.data.predicate
        if(!pred.startsWith("coord2d://"))
            return origin
        
        const [x,y] = pred.substr(10).split('_').map(s => parseInt(s))
        return {x,y}
    }

    function coordToPredicate(coords) {
        return `coord2d://${coords.x}_${coords.y}`
    }

    let expressionContextMenu

    function onExpressionContextMenu(event) {
        const { expressionURL, mouseEvent, parentLink } = event.detail
        expressionContextMenu.open(mouseEvent.clientX, mouseEvent.clientY, expressionURL, parentLink)
        isPanning = false
        isMovingExpression = false
    }

    function onExpressionSwitchHeaderContent(event) {
        const expression = event.detail
        if(iconStates[expression] != 'rotated') {
            iconStates[expression] = 'rotated'
        } else {
            iconStates[expression] = ''
        }
        isPanning = false
        isMovingExpression = false
    }

    function onDeleteExpression(event) {
        const expression = event.detail
        $linksStore.data.links.forEach(l => {
            if(l.data.target === expression) {
                REMOVE_LINK({
                    variables: {
                        link: JSON.stringify(l)
                    }
                })
            }
        })
    }

    function onLinkExpression(event) {
        const link = event.detail
        isLinking = true
        linkingSource = link
    }

</script>

<h1>${perspective.uuid}</h1>

<div class="perspective-container" 
    on:mousewheel={handleMouseWheel}
    on:mousemove={handleMouseMove}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
    on:contextmenu={contextMenu}
    bind:this={container}
    >
    <div class="perspective-content" bind:this={content}>
        <ul class="inline">
            {#if $linksStore.loading}
                <li>Loading...</li>
            {:else if $linksStore.error}
                <li>ERROR: {$linksStore.error.message}</li>
            {:else}
                {#each $linksStore.data.links as link}
                    {#if link.data.source === 'root'}
                        {#if isMovingExpression && movingLink && linkEqual(link, movingLinkOriginal)}
                        <li class="inline expression-list-container" 
                            style={`position: absolute; transform: translateX(${linkTo2D(movingLink).x}px) translateY(${linkTo2D(movingLink).y}px);`}
                            data-link-id={hashLinkExpression(link)}
                            >
                            <div class="drop-move-container" style={`transform: translateZ(${dropMove ? -2000 : 0}px);`}>
                                <ExpressionIcon expressionURL={link.data.target}/>
                            </div>
                        </li>
                        {:else}
                        <li class="inline expression-list-container" 
                            style={`position: absolute; transform: translateX(${linkTo2D(link).x}px) translateY(${linkTo2D(link).y}px);`}
                            data-link-id={hashLinkExpression(link)}
                            >
                            <ExpressionIcon
                                expressionURL={link.data.target}
                                parentLink={link}
                                on:context-menu={onExpressionContextMenu} 
                                rotated={iconStates[link.data.target] === 'rotated'}
                                selected={linkingSource?.data?.target === link.data.target}>
                            </ExpressionIcon>
                        </li>
                        {/if}
                    {/if}
                {/each}
            {/if}
        </ul>        
        <div id="constructor-container"></div>

        {#if isLinking && linkingSource && linkingCursor.x && linkingCursor.y}
            <svg class="link-path" width="100000" height="100000">
                <path d={`M${linkTo2D(linkingSource).x+10000+400},${linkTo2D(linkingSource).y+10000} L${linkingCursor.x-5+10000},${linkingCursor.y-5+10000} Z`} stroke="red" stroke-width="3" fill="none"/>
            </svg>
        {/if}
    </div>
</div>

<div id="side-bar-container">
    <div id="settings-panel" style={`transform: rotateY(${showSettings? '90deg' : '0' })`}>
        <div class="button" on:click={() => showSettings = !showSettings}>
            <span class="float-right"><Icon class="material-icons">settings</Icon></span>
            <Label>Perspective Settings</Label>
        </div>
        <div id="settings">
            <PerspectiveSettings perspective={JSON.parse(JSON.stringify(perspective))} 
                on:submit={()=> {
                    showSettings = false
                }}
                on:cancel={()=> {
                    showSettings = false
                }}>
            </PerspectiveSettings>
        </div>
    </div>
</div>



<ConstructionMenu bind:this={constructionMenu} 
    languages={languages} 
    languageIcons={languageIcons}
    on:language-clicked={({detail: lang}) => createExpression(lang)}
></ConstructionMenu>
<ExpressionContextMenu bind:this={expressionContextMenu}
    on:switch-header-content={onExpressionSwitchHeaderContent}
    on:delete={onDeleteExpression}
    on:link={onLinkExpression}
></ExpressionContextMenu>



<style>
    .perspective-container {
        height: 100%;
        perspective: 1000px;
        transform-style: preserve-3d;
    }

    #side-bar-container {
        position: absolute;
        right: 0;
        top: 0;
        perspective: 100px;
        perspective-origin: rightpo;
    }

    #settings-panel {
        position: absolute;
        right: 0;
        top: 100px;
        transform-style: preserve-3d;
        transition: transform 0.5s;
    }

    .button {
        position: absolute;
        width: 230px;
        height: 45px;
        padding: 10px 50px 0 25px;
        transform-origin: right bottom;
        transform: rotate(-90deg) translateX(115px);
        right: 0;
        background-color: white;
        border: 1px solid rgb(127, 129, 255);
        color:   rgb(127, 129, 255);
        cursor: pointer;
    }

    .float-right {
        float: right;
    }

    #settings {
        position: absolute;
        transform: rotateY(-90deg) translateX(-300px) translateZ(255px);
        padding: 40px;
        border: 1px solid rgb(127, 129, 255);
        background-color: white;
    }

    .debug {
        position: fixed;
        width: 100%;
        z-index: -10;
    }

    .inline {
        display: inline;
        transform-style: preserve-3d;
    }

    .link-path {
        position: absolute;
        top: 0;
        left: 0;
        transform: translateX(-10000px) translateY(-10000px);
    }

    .drop-move-container {
        transition: transform 0.5s;
    }
</style>