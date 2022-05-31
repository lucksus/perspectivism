<script lang="ts">
	import { setContext } from "svelte"
	import { ApolloClient, InMemoryCache } from "@apollo/client";
	import { WebSocketLink } from '@apollo/client/link/ws';
	import InitDialog from "./InitDialog.svelte"
	import { Ad4mClient } from "@perspect3vism/ad4m"

	const { ipcRenderer } = require('electron')
	const executorPort = ipcRenderer.sendSync('port-request', '')
	const wsLink = new WebSocketLink({
		uri: `ws://localhost:${executorPort}/graphql`,
		options: {
			reconnect: true
		}
	});

	const client = new ApolloClient({
		//uri: 'http://localhost:4000',
		link: wsLink,
		cache: new InMemoryCache(),
		defaultOptions: {
			watchQuery: {
				fetchPolicy: 'network-only',
				nextFetchPolicy: 'network-only'
			},
		},
  	});
	setContext('ad4mClient', new Ad4mClient(client))
</script>

<svelte:head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,600,700">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Mono">
</svelte:head>

<main>
	<InitDialog></InitDialog>
</main>

