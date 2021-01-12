<script lang="ts">
    import { mutation } from "svelte-apollo";
    import { OPEN_LINK } from './graphql_queries';
    const GQL_OPEN_LINK = mutation(OPEN_LINK)

    export let url: String;

    function click() {
        GQL_OPEN_LINK({variables: { url }})
    }
</script>

<!-- svelte-ignore a11y-invalid-attribute -->
<a class="link" href="#" on:click={click}><slot></slot></a>

<style>
    .link {
        cursor: pointer;
    }
</style>