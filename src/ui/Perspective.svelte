<script lang="ts">
    import type Perspective from '../acai/Perspective'
    import type { LanguageController } from '../main-thread/LanguageController';

    export let perspective: Perspective
    export let languageController: LanguageController
    export let linkRepoController: object
    export let IPFS: object

    import IconButton from '@smui/icon-button';
    import Fab, {Icon, Label} from '@smui/fab';
    import Link from '../acai/Links';
    import { exprRef2String } from '../acai/ExpressionRef';
    import ExpressionIcon from './ExpressionIcon.svelte';
    import iconComponentFromString from './iconComponentFromString';
    
    let rootLinks = []
    let rootExpressions = []

    let languages = []
    let languageIcons = {
        'note-ipfs': 'note'
    }
    let constructorIconComponents = {}
    let iconComponents = {}
    let expressions = {}

    let content
    let zoom = 0
    let translateX = 0
    let translateY = 0
    let mousedown = false

    $: if(content && zoom!=undefined && translateX!=undefined && translateY!=undefined) {
        console.debug("SET TRANSFORM:", zoom)
        content.setAttribute("style", `transform: translateX(${translateX}px) translateY(${translateY}px) translateZ(${zoom}px);`)
    }

    function handleMouseWheel(event) {
        zoom += event.deltaY * 0.05
        console.log("zoom:", zoom)
    }

    function handleMouseMove(event) {
        if(mousedown) {
            translateX += event.movementX
            translateY += event.movementY
        }
    }

    function handleMouseDown(event) {
        mousedown = true
    }

    function handleMouseUp(event) {
        mousedown = false
    }

    languageController.getLanguagesWithExpressionUI().then( installedLanguages => {
        console.log("Got installed languages:", JSON.stringify(installedLanguages))
        languages = installedLanguages
    })

    async function loadRootLinks() {
        rootLinks = await linkRepoController.getRootLinks(perspective)
    }

    async function commitExpression(lang, content, container) {
        const expressionRef = await languageController.createPublicExpression(lang, content)
        console.log("Got ExpressionRef:", JSON.stringify(expressionRef))
        const exprURL = exprRef2String(expressionRef)
        console.log("Created new expression:", exprURL)
        
        const link = new Link({source: exprURL, target: exprURL})
        rootLinks = [...rootLinks, link]
        linkRepoController.addRootLink(perspective, link)

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

    $: if(perspective) loadRootLinks()

</script>


<div class="perspective-container" 
    on:mousewheel={handleMouseWheel}
    on:mousemove={handleMouseMove}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
>
    <h2 class="debug">Root links: {JSON.stringify(rootLinks)}</h2>
    <div class="perspective-content" bind:this={content}>
        <ul>
            {#each rootLinks as link}
                <ExpressionIcon expressionURL={link.target} {languageController}></ExpressionIcon>
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
        perspective: 100px;
    }

    .debug {
        position: fixed;
        width: 100%;
        z-index: -10;
    }
</style>