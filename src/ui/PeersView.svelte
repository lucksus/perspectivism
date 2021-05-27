<script lang="ts">
    import { query, mutation, getClient } from "svelte-apollo";
    import { gql } from '@apollo/client';
    import { PERSPECTIVES, PERSPECTIVE, ADD_PERSPECTIVE, PUBLISH_PERSPECTIVE, ADD_LINK, LINKS_DATED } from './graphql_queries'
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
        console.log("Ensure global shared app perspective '__WORLD'")
        const result = await gqlClient.query({query: PERSPECTIVES})
        if(!result.data) {
            console.error(result)
        }
        const perspectives = result.data.perspectives

        let found = perspectives.find( e => e.name === WORLD_PERSPECTIVE_NAME)

        if(!found) {
            console.log("'__WORLD' not found locally - creating..")
            const add_result = logError(await addPerspective({
                variables: { name: WORLD_PERSPECTIVE_NAME }
            }))

            found = add_result.data.addPerspective
        }

        perspectiveUUID = found.uuid

        console.log("'__WORLD' UUID is:", perspectiveUUID)

        const perspectiveResult = logError(await gqlClient.query({
            query: PERSPECTIVE,
            variables: { uuid: perspectiveUUID }
        }))
        const perspective = perspectiveResult.data.perspective

        console.log("__WORLD:", perspective)


        if(!perspective.sharedPerspective) {
            console.log("'__WORLD' is not shared yet - publishing perspective...")
            logError(await publishPerspective({
                variables: {
                    uuid: perspective.uuid,
                    name: perspective.name,
                    description: "All Peers",
                    type: 'holochain',
                    uid: 'Perspect3ve__WORLD',
                    requiredExpressionLanguages: [],
                    allowedExpressionLanguages: []
                }
            }))

            console.log("'__WORLD' was just published")
        } else {
            console.log("'__WORLD' was published before")
        }
    }

    async function getOnlinePeers() {
        const untilDate = Date.now()
        const fromDate = subMinutes(untilDate, 2)
        const variables = {
            perspectiveUUID,
            fromDate,
            untilDate,
        }

        console.log("PeersView getting online peers with LINKS_DATED query with variables:", variables)
        const result = logError(await gqlClient.query({ 
            query: LINKS_DATED,
            variables
        }))

        onlinePeers = result.data.links.map(l => l.author.did)
    }

    async function publishOnlineStatus() {
        console.log("PeersView publishing online status...")
        const newLink = {
            source: 'status',
            target: 'online',
        }
        logError(await addLink({
            variables: {
                perspectiveUUID,
                link: JSON.stringify(newLink)
            }
        }))
    }

    async function init() {
        console.log("Initializing PeersView...")
        await ensureGlobalAppPerspective()
        console.log("Initializing PeersView 1")
        await publishOnlineStatus()
        console.log("Initializing PeersView 2")
        await getOnlinePeers()
        console.log("Initializing PeersView 3")
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
