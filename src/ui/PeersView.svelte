<script lang="ts">
    import { query, mutation, getClient } from "svelte-apollo";
    import { gql } from '@apollo/client';
    import { PERSPECTIVES, ADD_PERSPECTIVE, PUBLISH_PERSPECTIVE, ADD_LINK, LINKS_DATED } from './graphql_queries'
    import subMinutes from 'date-fns/subMinutes'

    const WORLD_PERSPECTIVE_NAME = '__WORLD'
    const gqlClient = getClient()

    let perspectiveUUID
    let onlinePeers = []

    function logError(result) {
        if(result.error) {
            console.error(result)
        }
        return result
    }

    const addPerspective = mutation(ADD_PERSPECTIVE)
    const publishPerspective = mutation(PUBLISH_PERSPECTIVE)
    const addLink = mutation(ADD_LINK)

    async function ensureGlobalAppPerspective() {
        const result = await gqlClient.query({query: PERSPECTIVES})
        if(!result.data) {
            console.error(result)
        }
        const perspectives = result.data.perspectives

        let found = perspectives.find( e => e.name === WORLD_PERSPECTIVE_NAME)

        if(!found) {
            const add_result = logError(await addPerspective({
                variables: { name: WORLD_PERSPECTIVE_NAME }
            }))

            found = add_result.data.addPerspective
        }

        perspectiveUUID = found.uuid

        if(!found.sharedPerspective) {
            logError(await publishPerspective({
                variables: {
                    uuid: found.uuid,
                    name: found.name,
                    description: "All Peers",
                    type: 'holochain'
                }
            }))
        }
    }

    async function getOnlinePeers() {
        const untilDate = Date.now()
        const fromDate = subMinutes(untilDate, 2)
        const result = logError(await gqlClient.query({ 
            query: LINKS_DATED,
            variables: {
                perspectiveUUID,
                fromDate,
                untilDate,
            }
        }))

        onlinePeers = result.data.links.map(l => l.author.did)
    }

    async function publishOnlineStatus() {
        const newLink = {
            source: 'status',
            target: 'online',
        }
        logError(await addLink({
            variables: {
                link: JSON.stringify(newLink)
            }
        }))
    }

    async function init() {
        await ensureGlobalAppPerspective()
        await publishOnlineStatus()
        await getOnlinePeers()
        setInterval(getOnlinePeers, 5000)
    }

    init()
</script>


<h1>Online peers:</h1>
<ul>
    {#each onlinePeers as peer}
        <li>{peer}</li>
    {/each}
</ul>
