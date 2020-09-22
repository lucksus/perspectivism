<script lang="ts">
    export let perspective: object
    export let perspectiveStore: object
    export let linkRepoController: object
    export let IPFS: object

    //console.log(perspectiveName)
    //let perspective = null
    //$: perspective = $perspectiveStore[perspectiveName]
    //console.log(JSON.stringify(perspective))

    import IconButton from '@smui/icon-button';
    import { afterUpdate } from 'svelte';

    let fileObject = null
    let downloaded = null
    let rootLinks = []

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

    $: if(perspective) loadRootLinks()

</script>


<div>
    <h1>Perspective {JSON.stringify(perspective)}</h1>
    <h2>Root links: {JSON.stringify(rootLinks)}</h2>
    <IconButton class="material-icons" on:click={saveIPFS}>cloud_upload</IconButton>
    <IconButton class="material-icons" on:click={loadIPFS}>cloud_download</IconButton>
    <IconButton class="material-icons" on:click={createLink}>create_new_folder</IconButton>
    <IconButton class="material-icons" on:click={createLink2}>create_new_folder</IconButton>
    {#if fileObject}
        <span>Saved: {fileObject.cid.multihash}</span>
    {/if}
</div>