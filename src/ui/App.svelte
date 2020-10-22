<script lang="ts">
	import type { LanguageController } from '../main-thread/LanguageController';
	export let perspectiveStore: object;
	export let languageController: LanguageController;
	export let linkRepoController: LinkRepoController;
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
	import type LinkRepoController from '../main-thread/LinkRepoController';
	import { ApolloClient, InMemoryCache } from "@apollo/client";
	import { WebSocketLink } from '@apollo/client/link/ws';
	import { setClient } from "svelte-apollo";

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

	let collapsed = false;
	let collapsing = false;
	let drawerOpen = false;
	let drawer
	let hovered = JSON.parse(JSON.stringify($perspectiveStore))

	for(const pID in $perspectiveStore) {
		linkRepoController.syncWithSharingAdapter($perspectiveStore[pID])
	}

	let selectedMainView = {
		perspective: null,
		settings: null,
		edit: null,
	}

	function createNewPerspective() {
		let number = 1
		let prefix = "New Perspective "
		while(Object.keys($perspectiveStore).includes(prefix+number)) {
			number++
		}

		const name = prefix+number
		perspectiveStore.add({name})
	}

	function deletePerspective(perspective) {
		if(selectedMainView.perspective == perspective) {
			selectedMainView.perspective = null
		}
		perspectiveStore.remove(perspective)
	}

	function editPerspective(perspective) {
		selectedMainView.perspective = null
		selectedMainView.settings = null
		selectedMainView.edit = perspective
	}

	function editPerspectiveSubmit(event) {
		const uuid = event.detail
		console.log(uuid)
		const perspective = $perspectiveStore[uuid]
		perspectiveStore.update(perspective)
		linkRepoController.syncWithSharingAdapter(perspective)
		if(selectedMainView.perspective == null) {
			selectedMainView.perspective = uuid
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
			{#each Object.keys($perspectiveStore) as perspective}
				<Item href="javascript:void(0)"
					on:mouseenter="{e => hovered[perspective] = false}"
					on:mouseleave="{e => hovered[perspective] = true}"
					activated={selectedMainView.perspective == perspective}
					on:click={() => selectedMainView = { perspective, settings: null }}
				>
					<Text>{$perspectiveStore[perspective].name}</Text>
					{#if !hovered[perspective]}
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

			{#if Object.keys($perspectiveStore).length == 0}

			<Chip><ChipText>No Perspectives yet</ChipText></Chip>
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
					> {$perspectiveStore[selectedMainView.perspective].name}
				{:else if selectedMainView.settings }
					> {selectedMainView.settings}
				{:else if selectedMainView.edit }
					> Editing Perspective "{$perspectiveStore[selectedMainView.edit].nameAdd }"
				{/if}
			</Title>
		</Section>
		</Row>
	</TopAppBar>

	{#if selectedMainView.perspective}
		<Perspective perspective={$perspectiveStore[selectedMainView.perspective]} 
			on:settings-changed={editPerspectiveSubmit}
			{...$$props} 
		></Perspective>
	{:else if selectedMainView.settings }
		{#if selectedMainView.settings == 'languages'}
			<LanguagesSettings languageController={languageController}></LanguagesSettings>
		{/if}
	{:else if selectedMainView.edit }
		<PerspectiveSettings perspectiveId={selectedMainView.edit} 
			on:submit={editPerspectiveSubmit}
			{...$$props}
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