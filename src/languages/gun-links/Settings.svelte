<svelte:options tag={null}/>

<script lang="ts">
    export let settings: object
    export let updateSettings

    if(!settings) {
        settings = {
            gunDbPeer: ''
        }
    }

</script>

<div class="container" on:click:stopPropagation>
    {#if settings && updateSettings}
        <input bind:value={settings.gunDbPeer}>
        <button on:click={()=>updateSettings(settings)}>Update</button>
    {:else}
        Loading...
    {/if}
</div>
