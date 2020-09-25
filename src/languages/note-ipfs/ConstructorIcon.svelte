<svelte:options tag={null}/>

<script lang="ts">
    export let commitExpression
    export let discard

    let text = ""

</script>

<input bind:value={text}>
<button on:click={()=>commitExpression(text)}>Commit</button>
<button on:click={discard}>Discard</button>
