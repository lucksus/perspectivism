<svelte:options tag={null}/>

<script lang="ts">
    import type Expression from "../../ad4m/Expression";
    export let expression: Expression
    let url = null
    $: if(expression && expression.data) {
        url = expression.data.url
    }
    
</script>

<div class="container">
    <iframe title={url} src={url}></iframe>
</div>