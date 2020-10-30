<script lang="ts">
	import TopAppBar, {Row, Section, Title, FixedAdjust, ShortFixedAdjust} from '@smui/top-app-bar';
	import IconButton from '@smui/icon-button';
	import Drawer, {AppContent, Content, Header, Title as DrawerTitle, Subtitle, Scrim} from '@smui/drawer';
	import List, {Item, Text, Graphic, Separator, Meta, Subheader} from '@smui/list';
	import Chip, {Set, Icon, Text as ChipText} from '@smui/chips';
	import Fab, {Icon as FabIcon} from '@smui/fab';
	import Button, {Group, GroupItem, Label} from '@smui/button';
	import Perspective from './Perspective.svelte';
	import LanguagesSettings from './LanguagesSettings.svelte'
	import PerspectiveSettings from './PerspectiveSettings.svelte'
	import { ApolloClient, InMemoryCache } from "@apollo/client";
	import { WebSocketLink } from '@apollo/client/link/ws';
	import { mutation, query, setClient } from "svelte-apollo";
	import { ADD_PERSPECTIVE, PERSPECTIVES, PERSPECTIVE_ADDED, PERSPECTIVE_REMOVED, PERSPECTIVE_UPDATED, REMOVE_PERSPECTIVE } from './graphql_queries';

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

	let perspectives = query(PERSPECTIVES)

	let collapsed = false;
	let collapsing = false;
	let drawerOpen = false;
	let drawer
	let hovered
	$: if(!$perspectives.loading && $perspectives.data) {
		hovered = {}
		$perspectives.data.perspectives.forEach(p => {
			hovered[p.uuid] = true
		})
	}
	 	

	//for(const pID in $perspectiveStore) {
	//	linkRepoController.syncWithSharingAdapter($perspectiveStore[pID])
	//}

	client.subscribe({
		query: PERSPECTIVE_ADDED
	}).subscribe({
		next: () => perspectives.fetchMore({}),
		error: (e) => console.error(e)
	})

	client.subscribe({
		query: PERSPECTIVE_UPDATED
	}).subscribe({
		next: () => perspectives.refetch({}),
		error: (e) => console.error(e)
	})

	client.subscribe({
		query: PERSPECTIVE_REMOVED
	}).subscribe({
		next: () => perspectives.refetch({}),
		error: (e) => console.error(e)
	})

	let selectedMainView = {
		perspective: null,
		settings: null,
		edit: null,
	}

	function createNewPerspective() {
		let number = 1
		let prefix = "New Perspective "
		while($perspectives.data.perspectives.includes(prefix+number)) {
			number++
		}

		const name = prefix+number
		mutation(ADD_PERSPECTIVE)({
			variables: {
				name
			}
		})
	}

	function deletePerspective(perspective) {
		if(selectedMainView.perspective == perspective) {
			selectedMainView.perspective = null
		}

		mutation(REMOVE_PERSPECTIVE)({
			variables: {
				uuid: perspective.uuid
			}
		})
	}

	function editPerspective(perspective) {
		selectedMainView.perspective = null
		selectedMainView.settings = null
		selectedMainView.edit = perspective
	}

	function editPerspectiveSubmit(event) {
		const uuid = event.detail
		console.log(uuid)
		//const perspective = $perspectiveStore[uuid]
		//perspectiveStore.update(perspective)
		//linkRepoController.syncWithSharingAdapter(perspective)
		if(selectedMainView.perspective == null) {
			selectedMainView.perspective = selectedMainView.edit
			selectedMainView.settings = null
			selectedMainView.edit = null
		}
	}

</script>

<svelte:head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,600,700">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Mono">
</svelte:head>

<main>



	<Drawer variant="modal" bind:this={drawer} bind:open={drawerOpen}>
		<Header>
			<DrawerTitle>Perspectives</DrawerTitle>
			<Subtitle>Switch to perspective from list</Subtitle>
		</Header>
		<Content>
		<List>
			{#if $perspectives.data?.perspectives?.length == 0}
				<Chip><ChipText>No Perspectives yet</ChipText></Chip>
			{/if}
			{#if $perspectives.loading}
				<Chip><ChipText>Loading...</ChipText></Chip>
			{:else}
			{#each $perspectives.data.perspectives as perspective}
				<Item href="javascript:void(0)"
					on:mouseenter="{e => hovered[perspective.uuid] = false}"
					on:mouseleave="{e => hovered[perspective.uuid] = true}"
					activated={selectedMainView.perspective?.uuid == perspective.uuid}
					on:click={() => selectedMainView = { perspective, settings: null }}
				>
					<Text>{perspective.name}</Text>
					{#if !hovered[perspective.uuid]}
					<Meta>
						<div on:click|stopPropagation="">
							<Group variant="unelevated">
								<Button variant="unelevated" color="secondary" on:click={()=>deletePerspective(perspective)}>
									<Label>Delete</Label>
								</Button>
								<Button variant="unelevated" on:click={(event)=>{
									editPerspective(perspective)
								}}>
									<Label>Edit</Label>
								</Button>
							</Group>
						</div>
						
					</Meta>
					{/if}
				</Item>
				
			{/each}
			{/if}
	
			<Item on:click={createNewPerspective}>
				<Graphic class="material-icons" aria-hidden="true">note_add</Graphic>
				<Text>Create Perspective</Text>
			</Item>

			<Separator nav />

			<Header>
				<DrawerTitle>Settings</DrawerTitle>
				<Subtitle>
					Manage installed Languages and other stuff
				</Subtitle>
			</Header>
			

			<Item 
				activated={selectedMainView.settings == 'languages'}
				on:click={() => selectedMainView = { perspective: null, settings: 'languages' }}
			>
				<Graphic class="material-icons" aria-hidden="true">insert_comment</Graphic>
				<Text>Manage Languages</Text>
			</Item>
			
		</List>
		</Content>
	</Drawer>
	<Scrim></Scrim>

	<TopAppBar dense='true' variant='static' 
		bind:collapsed
		on:mouseenter="{e => collapsing ? collapsed=false : undefined}"
		on:mouseleave="{e => collapsing ? collapsed=true : undefined}"
	>
		<Row>
		<Section>
			<IconButton class="material-icons" on:click={() => {drawerOpen = !drawerOpen}}>menu</IconButton>
			<Title>
				Perspectivism
				{#if selectedMainView.perspective}
					> {selectedMainView.perspective.name}
				{:else if selectedMainView.settings }
					> {selectedMainView.settings}
				{:else if selectedMainView.edit }
					> Editing Perspective "{selectedMainView.edit.name }"
				{/if}
			</Title>
		</Section>
		</Row>
	</TopAppBar>

	{#if selectedMainView.perspective}
		<Perspective perspective={selectedMainView.perspective} 
			on:settings-changed={editPerspectiveSubmit}
		></Perspective>
	{:else if selectedMainView.settings }
		{#if selectedMainView.settings == 'languages'}
			<LanguagesSettings></LanguagesSettings>
		{/if}
	{:else if selectedMainView.edit }
		<PerspectiveSettings perspective={JSON.parse(JSON.stringify(selectedMainView.edit))} 
			on:submit={editPerspectiveSubmit}
			on:cancel={() => selectedMainView.edit = null}
		></PerspectiveSettings>
	{:else}
		<h1>Welcome to Perspectivism!</h1>
		<h2>Please open the drawer and create or select a perspective to start...</h2>
	{/if}
</main>

<style>
	main {
		height: 100%;
		text-align: center;
		padding: 0;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #00c3ff;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>