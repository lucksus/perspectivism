<svelte:options tag={null}/>

<script lang="ts">
    export let commitExpression
    export let discard

    let name = ""
    let description = ""
    let bundleFile = ""
    let expressionPicture = ""

</script>

<div class="container">
    <div>
        <span class="label">Name: </span>
        <input bind:value={name}>
    </div>
    <div>
        <span class="label big">Description: </span>
        <input bind:value={description}>
    </div>
    <div>
        <span class="label big">Expression Picture: </span>
        <input type="file" id="file-selector" accept=".jpg, .jpeg, .png">
    </div>
    <hr>
    <div>
        <span class="label big">Language bundle.js: </span>
        <input type="file" id="file-selector" accept=".js">
    </div>
    <hr>
    
    <button on:click={()=>commitExpression({name, description, bundleFile, expressionPicture })}>Commit</button>
    <button on:click={discard}>Discard</button>
</div>


<style>
    .container {
        color: burlywood;
        width: 400px;
        height: 300px;
    }

    input {
        width: 100%;
    }

    .big {
        height: 200px;
    }
</style>