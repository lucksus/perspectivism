<script lang="ts">
    import type Perspective from '../acai/Perspective'
    import type { LanguageController } from '../main-thread/LanguageController';

    export let perspective: Perspective
    export let languageController: LanguageController
    export let linkRepoController: object
    export let IPFS: object

    //console.log(perspectiveName)
    //let perspective = null
    //$: perspective = $perspectiveStore[perspectiveName]
    //console.log(JSON.stringify(perspective))

    import IconButton from '@smui/icon-button';
    import Fab, {Icon, Label} from '@smui/fab';
    import Link from '../acai/Links';
    import { exprRef2String } from '../acai/ExpressionRef';
    
    let fileObject = null
    let downloaded = null
    let rootLinks = []

    let languages = []
    let languageIcons = {
        'note-ipfs': 'note'
    }
    let constructorIconComponents = {}

    languageController.getInstalledLanguages().then( installedLanguages => {
        console.log("Got installed languages:", JSON.stringify(installedLanguages))
        languages = installedLanguages
    })

    async function saveIPFS() {
        fileObject = await IPFS.add({content: perspective})
        console.log("fileObject in UI:", fileObject)
    }

    async function loadIPFS() {
        downloaded = await IPFS.cat("QmdLiaDBWdxfHMWMyeSeUR25Cg6jH9x9iJTH1L34JnP5RZ")
        console.log("downloed in UI:", downloaded)
    }

    async function loadRootLinks() {
        rootLinks = await linkRepoController.getRootLinks(perspective)
    }

    async function createLink() {
        const link = {
            source: 'source1',
            target: 'target1',
            perdicate: 'wurst',
        }

        linkRepoController.addRootLink(perspective, link)
        await new Promise((resolve)=>setTimeout(resolve, 10))
        await loadRootLinks()
    }

    async function createLink2() {
        const link = {
            source: 'source2',
            target: 'target2',
            perdicate: 'wurst',
        }

        linkRepoController.addRootLink(perspective, link)
        await new Promise((resolve)=>setTimeout(resolve, 10))
        await loadRootLinks()
    }

    function moduleFromString(src, filename) {
        const Module = module.constructor;
        const m = new Module();
        m._compile(src, filename);
        return m.exports;
    }

    async function createExpression(lang) {
        console.log("Create expression:", lang, JSON.stringify(lang))
        if(!constructorIconComponents[lang.name]) {
            const code = await languageController.getConstructorIcon(lang)
            console.log("EVALUATING CODE: ", code)
            const ConstructorIcon = moduleFromString(code, lang.name)
            constructorIconComponents[lang.name] = ConstructorIcon
            customElements.define(lang.name, ConstructorIcon);
        }

        const container = document.getElementById("constructor-container")

        const constructorIcon = new constructorIconComponents[lang.name]()
        constructorIcon.commitExpression = async (content) => {
            const expressionRef = await languageController.createPublicExpression(lang, content)
            console.log("Got ExpressionRef:", JSON.stringify(expressionRef))
            const exprURL = exprRef2String(expressionRef)
            console.log("Created new expression:", exprURL)
            
            const link = new Link({source: exprURL, target: exprURL})
            console.log("Adding new link:", link)
            rootLinks.push(link)
            await linkRepoController.addRootLink(perspective, link)
            console.log("Adding link done!")

            container.innerHTML = ''
            
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

    <div id="constructor-container"></div>

    {#each languages as lang}
        <Fab extended on:click={() => createExpression(lang)}>
            <Icon class="material-icons">{languageIcons[lang.name]}</Icon>
            <Label>Create {lang.name} expression</Label>
        </Fab>
    {/each}
</div>