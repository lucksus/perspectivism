<script lang="ts">
    export let perspective : object
    export let IPFS: object
    console.log(perspective)

    import IconButton from '@smui/icon-button';

    let fileObject = null
    let downloaded = null

    async function saveIPFS() {
        fileObject = await IPFS.add({content: perspective})
        console.log("fileObject in UI:", fileObject)
    }

    async function loadIPFS() {
        downloaded = await IPFS.cat("QmdLiaDBWdxfHMWMyeSeUR25Cg6jH9x9iJTH1L34JnP5RZ")
        console.log("downloed in UI:", downloaded)
    }
</script>


<div>
    <h1>Perspective {perspective.name}</h1>
    <IconButton class="material-icons" on:click={saveIPFS}>cloud_upload</IconButton>
    <IconButton class="material-icons" on:click={loadIPFS}>cloud_download</IconButton>
    {#if fileObject}
        <span>Saved: {fileObject.cid.multihash}</span>
    {/if}
</div>