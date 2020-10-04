<svelte:options tag={null}/>

<script lang="ts">
    export let settings: object

    if(!settings) {
        settings = {
            gunDbPeer: ''
        }
    }

</script>

<div class="container" on:click:stopPropagation>
    {#if settings }
        Gun Peer:
        <input bind:value={settings.gunDbPeer}>
    {:else}
        Loading...
    {/if}
</div>
