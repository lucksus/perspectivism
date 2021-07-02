<script lang="ts">
	import { ApolloClient, InMemoryCache } from "@apollo/client";
	import { WebSocketLink } from '@apollo/client/link/ws';
	import { setClient } from "svelte-apollo";
	import { setContext } from "svelte"
	import MainView from "./MainView.svelte";
	import World from "./world";
	//import User from "./user";

	const wsLink = new WebSocketLink({
		uri: `ws://localhost:4000/graphql`,
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
	setClient(client);
	  
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

