<script lang="ts">
    import { getContext } from "svelte"
    import { query, mutation, getClient } from "svelte-apollo";
    import { PERSPECTIVES, PERSPECTIVE, ADD_PERSPECTIVE, PUBLISH_PERSPECTIVE, ADD_LINK, LINKS_DATED } from './graphql_queries'
    import subMinutes from 'date-fns/subMinutes'

    const world = getContext('world')
    let onlinePeers = []

    async function updatePeersList() {
        onlinePeers = await world.getOnlinePeers()
    }

    async function publishStatus() {
        await world.publishOnlineStatus()
    }

    async function init() {
        await publishStatus()
        await updatePeersList()
        setInterval(updatePeersList, 5000)
        setInterval(publishStatus, 60000)
    }

    init()
</script>


<h1>Online peers:</h1>
<ul>
    {#each onlinePeers as peer}
        <li>{peer}</li>
    {/each}
</ul>
