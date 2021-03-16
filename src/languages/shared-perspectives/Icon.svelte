<svelte:options tag={null}/>

<script lang="ts">
    import type Expression from "../../ad4m/Expression";
    export let expression: Expression
</script>

<div class="container">
    {#if expression}
        <h3>Shared Perspective</h3>
        <div>
            <span class="label">Name: </span>
            <span class="value">{expression.data.name}</span>
        </div>
        <div>
            <span class="label">Description: </span>
            <span class="value">{expression.data.description}</span>
        </div>
        <div>
            <span class="label">Sharing Type: </span>
            <span class="value">{expression.data.type}</span>
        </div>
    {/if}
</div>


<style>
    .container {
        color: white;
        width: 400px;
        height: 300px;
        padding: 20px;
    }

    .label {
        font-weight: bold;
    }
</style>