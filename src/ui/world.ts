import { PERSPECTIVES, PERSPECTIVE, ADD_PERSPECTIVE, PUBLISH_PERSPECTIVE, ADD_LINK, LINKS_DATED } from './graphql_queries'
import subMinutes from 'date-fns/subMinutes'
import type { ApolloClient } from '@apollo/client';

const WORLD_PERSPECTIVE_NAME = '__WORLD'


function logError(result) {
    if(result.error) {
        console.error(result)
    }
    return result
}

export default class World {
    #perspectiveUUID: string
    #gqlClient: ApolloClient<any>
    #initialized: Promise<void>

    constructor(gqlClient: ApolloClient<any>) {
        this.#gqlClient = gqlClient
        this.#initialized = new Promise(resolve => {
            this.ensureGlobalAppPerspective().then(() => resolve())
        })
    }

    async ensureGlobalAppPerspective() {
        console.log("Ensure global shared app perspective '__WORLD'")
        const result = await this.#gqlClient.query({query: PERSPECTIVES})
        if(!result.data) {
            console.error(result)
        }
        const perspectives = result.data.perspectives
    
        let found = perspectives.find( e => e.name === WORLD_PERSPECTIVE_NAME)
    
        if(!found) {
            console.log("'__WORLD' not found locally - creating..")
            const add_result = logError(await this.#gqlClient.mutate({
                mutation: ADD_PERSPECTIVE,
                variables: { name: WORLD_PERSPECTIVE_NAME }
            }))
    
            found = add_result.data.addPerspective
        }
    
        this.#perspectiveUUID = found.uuid
    
        console.log("'__WORLD' UUID is:", this.#perspectiveUUID)
    
        const perspectiveResult = logError(await this.#gqlClient.query({
            query: PERSPECTIVE,
            variables: { uuid: this.#perspectiveUUID }
        }))
        const perspective = perspectiveResult.data.perspective
    
        console.log("__WORLD:", perspective)
    
    
        if(!perspective.sharedPerspective) {
            console.log("'__WORLD' is not shared yet - publishing perspective...")
            logError(await this.#gqlClient.mutate({
                mutation: PUBLISH_PERSPECTIVE,
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

    async getOnlinePeers() {
        await this.#initialized

        const untilDate = Date.now()
        const fromDate = subMinutes(untilDate, 2)
        const variables = {
            perspectiveUUID: this.#perspectiveUUID,
            fromDate,
            untilDate,
        }
    
        console.log("PeersView getting online peers with LINKS_DATED query with variables:", variables)
        const result = logError(await this.#gqlClient.query({ 
            query: LINKS_DATED,
            variables
        }))
    
        return result.data.links.map(l => l.author.did)
    }
    
    async publishOnlineStatus() {
        await this.#initialized
        
        console.log("PeersView publishing online status...")
        const newLink = {
            source: 'status',
            target: 'online',
        }
        logError(await this.#gqlClient.mutate({
            mutation: ADD_LINK,
            variables: {
                perspectiveUUID: this.#perspectiveUUID,
                link: JSON.stringify(newLink)
            }
        }))
    }
    
}

