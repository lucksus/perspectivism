<script lang="ts">
    import type Perspective from '../acai/Perspective'
    import type { LanguageController } from '../main-thread/LanguageController';

    export let perspective: Perspective
    export let languageController: LanguageController
    export let linkRepoController: LinkRepoController
    export let IPFS: object

    import IconButton from '@smui/icon-button';
    import Fab, {Icon, Label} from '@smui/fab';
    import Link, { linkEqual } from '../acai/Links';
    import { exprRef2String } from '../acai/ExpressionRef';
    import ExpressionIcon from './ExpressionIcon.svelte';
    import iconComponentFromString from './iconComponentFromString';
    import type LinkRepoController from '../main-thread/LinkRepoController';
    import LinksStore from '../stores/LinksStore'
    import ConstructionMenu from './ConstructionMenu.svelte'
    import PerspectiveSettings from './PerspectiveSettings.svelte';
    import ExpressionContextMenu from "./ExpressionContextMenu.svelte";
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    
    let rootLinks = new LinksStore()
    let rootExpressions = []

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

    let showSettings = false

    $: if(content && zoom!=undefined && translateX!=undefined && translateY!=undefined) {
        console.debug("SET TRANSFORM:", zoom)
        content.setAttribute("style", calcPerspectiveContentStyle())
    }

    function calcPerspectiveContentStyle() {
        return `
            position: absolute; 
            width: 100%; height: 100%; 
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

    function zoomNormalizedMouseMove(event) {
        let factor
        if(zoom < 0) {
            const dist = -zoom
            factor = 1 + (dist/1000)
        } else {
            const dist = zoom
            factor = 1 - (dist/1000)
        }

        return {
            x: event.movementX * factor,
            y: event.movementY * factor,
        }
    }

    function handleMouseMove(event) {
        const d = zoomNormalizedMouseMove(event)
        if(isPanning) {
            translateX += d.x
            translateY += d.y
        }

        if(isMovingExpression) {
            let point = linkTo2D(movingLink)
            point.x += d.x
            point.y += d.y
            movingLink.data.predicate = coordToPredicate(point)
            rootLinks.update(movingLink)
        }

        if(isLinking) {
            linkingCursor = {
                x: event.offsetX,
                y: event.offsetY
            }
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
        console.log(event.target)
        if(event.target == content || event.target == container)
            isPanning = true
        else {
            console.log("clicked something else:", event.path)
            const linkId = getLinkIdFromPath(event)
            console.log("link id:", linkId)
            if(linkId) {
                const hoveredLink = $rootLinks.find(l => l.id == linkId)
                if(isLinking) {
                    const newLink = {
                        source: linkingSource,
                        target: hoveredLink.data.target,
                    }
                    linkRepoController.addLink(perspective, newLink)
                } else {
                    movingLink = hoveredLink
                    if(movingLink) {
                        movingLinkOriginal = JSON.parse(JSON.stringify(movingLink))
                        isMovingExpression = true
                    }
                    else {
                        console.error("Couldn't find link with ID", linkId)
                        console.error("have linkd", $rootLinks)
                    }
                }
                
                
            }
        }
    }

    function handleMouseUp(event) {
        if(isMovingExpression && !linkEqual(movingLink, movingLinkOriginal)) {
            const newLinkObject = JSON.parse(JSON.stringify(movingLink))
            delete newLinkObject.id
            console.debug("Updating link:", movingLinkOriginal, newLinkObject)
            linkRepoController.updateLink(perspective, movingLinkOriginal, newLinkObject)
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

    languageController.getLanguagesWithExpressionUI().then( installedLanguages => {
        console.log("Got installed languages:", JSON.stringify(installedLanguages))
        languages = installedLanguages
    })

    async function loadRootLinks() {
        const rootExpressions = await linkRepoController.getLinksFrom(perspective, 'root')
        console.debug("rootExpressions:", rootExpressions)
        rootExpressions.forEach(e => rootLinks.add(e))
    }

    async function commitExpression(lang, content, container) {
        const expressionRef = await languageController.createPublicExpression(lang, content)
        console.log("Got ExpressionRef:", JSON.stringify(expressionRef))
        const exprURL = exprRef2String(expressionRef)
        console.log("Created new expression:", exprURL)
        
        const link = new Link({source: 'root', target: exprURL})
        linkRepoController.addRootLink(perspective, link)
        loadRootLinks()

        container.innerHTML = ''
    }

    async function createExpression(lang) {
        console.log("Create expression:", lang, JSON.stringify(lang))
        if(!constructorIconComponents[lang.name]) {
            const code = await languageController.getConstructorIcon(lang)
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
        rootLinks = new LinksStore()
        loadRootLinks()
    }
    $: if(perspective && perspective.linksSharingLanguage && perspective.linksSharingLanguage != "") {
        languageController.addLinkObserver(perspective.linksSharingLanguage, (added, removed) => {
            console.log("LINK OBSERVER got links to add:", added)
            console.log("LINK OBSERVER got links to remove:", removed)
            added?.forEach(l => {
                rootLinks.add(l)
            })
            removed?.forEach(l => {
                rootLinks.remove(l)
            })
        })
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
        const { expressionURL, mouseEvent } = event.detail
        expressionContextMenu.open(mouseEvent.clientX, mouseEvent.clientY, expressionURL)
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
        $rootLinks.forEach(l => {
            if(l.data.target === expression) {
                rootLinks.remove(l)
                linkRepoController.removeLink(perspective, l)
            }
        })
    }

    function onLinkExpression(event) {
        const expression = event.detail
        isLinking = true
        linkingSource = expression
    }

</script>


<div class="perspective-container" 
    on:mousewheel={handleMouseWheel}
    on:mousemove={handleMouseMove}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
    on:contextmenu={contextMenu}
    bind:this={container}
>
    {#if isLinking && linkingCursor.x && linkingCursor.y}
        <svg class="link-path" width="1000" height="1000">
            <path d={`M0,0 C100,100 400,100 ${linkingCursor.x-5},${linkingCursor.y-5}`} stroke="red" stroke-width="3" fill="none"/>
        </svg>
    {/if}
    <div class="perspective-content" bind:this={content}>
        <ul class="inline">
            {#each $rootLinks as link}
                <li class="inline expression-list-container" 
                    style={`position: absolute; transform: translateX(${linkTo2D(link).x}px) translateY(${linkTo2D(link).y}px);`}
                    data-link-id={link.id}
                    >
                    <ExpressionIcon class="inline" 
                        expressionURL={link.data.target} 
                        on:context-menu={onExpressionContextMenu} 
                        rotated={iconStates[link.data.target] === 'rotated'}
                        selected={linkingSource === link.data.target}
                        {languageController}>
                    </ExpressionIcon>
                </li>
            {/each}
        <div id="constructor-container"></div>
        </ul>        
    </div>
</div>

<div id="side-bar-container">
    <div id="settings-panel" style={`transform: rotateY(${showSettings? '90deg' : '0' })`}>
        <div class="button" on:click={() => showSettings = !showSettings}>
            <span class="float-right"><Icon class="material-icons">settings</Icon></span>
            <Label>Perspective Settings</Label>
        </div>
        <div id="settings">
            <PerspectiveSettings perspective={perspective} 
                languageController={languageController}
                on:submit={()=> {
                    console.log(perspective)
                    dispatch('settings-changed', perspective.uuid)
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
>
</ExpressionContextMenu>



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
    }
</style>