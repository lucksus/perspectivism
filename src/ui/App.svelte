<script lang="ts">
	import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
	import { WebSocketLink } from '@apollo/client/link/ws';
	import { getContext, setContext } from "svelte"
	import { Ad4mClient } from "@perspect3vism/ad4m"
	import MainView from "./MainView.svelte";
	import { setClient } from "svelte-apollo"
	import { removeTypenameFromMutationLink } from 'apollo-remove-typename-mutation-link';
	import World from "./world";

	const { ipcRenderer } = require('electron')
	const { executorUrl, capToken } = ipcRenderer.sendSync('connection-request', '')
	const wsLink = new WebSocketLink({
		uri: executorUrl,
		options: {
			reconnect: true,
			connectionParams: async () => {
				return {
					headers: {
						authorization: capToken
					}
				}
			}
		},
	});
	
	const client = new ApolloClient({
		link: ApolloLink.from([removeTypenameFromMutationLink, wsLink]) ,
		cache: new InMemoryCache(),
		defaultOptions: {
			watchQuery: {
				fetchPolicy: 'no-cache',
				nextFetchPolicy: 'network-only'
			},
			query: {
				fetchPolicy: 'no-cache',
				errorPolicy: 'all',
			},
		},
	});
	setClient(client)
	setContext('ad4mClient', new Ad4mClient(client))
	const world = new World(client);
	setContext('world', world)
	//const user = new User(world, client);
	//setContext('user', user)

</script>

<svelte:head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,600,700">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Mono">
</svelte:head>

<main>
	<MainView></MainView>
</main>
