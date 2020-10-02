<svelte:options tag={null}/>

<script lang="ts">
    export let settings: object
    export let updateSettings
</script>

<div class="container">
    <input bind:value={settings.gunDbPeer}>
    <button on:click={()=>updateSettings(settings)}>Update</button>
</div>
