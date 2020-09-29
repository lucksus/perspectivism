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

    languageController.getInstalledLanguages().then( installedLanguages => {
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
            customElements.define(lang.name, ConstructorIcon);
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


<div>
    <h1>Perspective {JSON.stringify(perspective)}</h1>
    <h2>Root links: {JSON.stringify(rootLinks)}</h2>

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