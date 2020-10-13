<script lang="ts">
    import type Perspective from '../acai/Perspective'
    import type { LanguageController } from '../main-thread/LanguageController';

    export let perspective: Perspective
    export let languageController: LanguageController
    export let linkRepoController: LinkRepoController
    export let IPFS: object

    import IconButton from '@smui/icon-button';
    import Fab, {Icon, Label} from '@smui/fab';
    import Link from '../acai/Links';
    import { exprRef2String } from '../acai/ExpressionRef';
    import ExpressionIcon from './ExpressionIcon.svelte';
    import iconComponentFromString from './iconComponentFromString';
    import type LinkRepoController from '../main-thread/LinkRepoController';
    import LinksStore from '../stores/LinksStore'
    
    let rootLinks = new LinksStore()
    let rootExpressions = []

    let languages = []
    let languageIcons = {
        'note-ipfs': 'note'
    }
    let constructorIconComponents = {}
    let iconComponents = {}
    let expressions = {}

    let content
    let container
    let zoom = 0
    let translateX = 0
    let translateY = 0
    let isPanning = false
    let isMovingExpression = false
    let movingLink

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
        let factor = 0.05
        const normalized = Math.abs(zoom/10)
        if(zoom < 0 && normalized > 2) {
            factor = 0.1 * Math.log2(normalized)    
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
                movingLink = $rootLinks.find(l => l.id == linkId)
                if(movingLink)
                    isMovingExpression = true
                else
                    console.error("Couldn't find link with ID", linkId)
                
            }
        }
    }

    function handleMouseUp(event) {
        isPanning = false
        isMovingExpression = false
    }

    languageController.getLanguagesWithExpressionUI().then( installedLanguages => {
        console.log("Got installed languages:", JSON.stringify(installedLanguages))
        languages = installedLanguages
    })

    async function loadRootLinks() {
        const rootExpressions = await linkRepoController.getRootLinks(perspective)
        rootExpressions.forEach(e => rootLinks.add(e))
    }

    async function commitExpression(lang, content, container) {
        const expressionRef = await languageController.createPublicExpression(lang, content)
        console.log("Got ExpressionRef:", JSON.stringify(expressionRef))
        const exprURL = exprRef2String(expressionRef)
        console.log("Created new expression:", exprURL)
        
        const link = new Link({source: exprURL, target: exprURL})
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
        languageController.addLinkObserver(perspective.linksSharingLanguage, links => {
            console.log("LINK OBSERVER got links:", links)
            links.forEach(l => {
                rootLinks.add(l)
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

</script>


<div class="perspective-container" 
    on:mousewheel={handleMouseWheel}
    on:mousemove={handleMouseMove}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
    bind:this={container}
>
    <h2 class="debug">Root links: {JSON.stringify(rootLinks)}</h2>
    <div class="perspective-content" bind:this={content}>
        <ul class="inline">
            {#each $rootLinks as link}
                <li class="inline expression-list-container" 
                    style={`position: absolute; transform: translateX(${linkTo2D(link).x}px) translateY(${linkTo2D(link).y}px);`}
                    data-link-id={link.id}
                    >
                    <ExpressionIcon class="inline" expressionURL={link.data.target} {languageController}></ExpressionIcon>
                </li>
            {/each}
        </ul>
        

        <div id="constructor-container"></div>

        {#each languages as lang}
            <Fab extended on:click={() => createExpression(lang)}>
                <Icon class="material-icons">{languageIcons[lang.name]}</Icon>
                <Label>Create {lang.name} expression</Label>
            </Fab>
        {/each}
    </div>
</div>

<style>
    .perspective-container {
        height: 100%;
        perspective: 1000px;
        transform-style: preserve-3d;
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
</style>