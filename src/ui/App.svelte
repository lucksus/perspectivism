<script lang="ts">
	export let name: string;
	export let rootConfigPath: string;
	export let perspectiveStore: object;
	import TopAppBar, {Row, Section, Title, FixedAdjust, ShortFixedAdjust} from '@smui/top-app-bar';
	import IconButton from '@smui/icon-button';
	import Drawer, {AppContent, Content, Header, Title as DrawerTitle, Subtitle, Scrim} from '@smui/drawer';
	import List, {Item, Text, Graphic, Separator, Subheader} from '@smui/list';
	import Chip, {Set, Icon, Text as ChipText} from '@smui/chips';
	import Fab, {Icon as FabIcon} from '@smui/fab';
	import Perspective from './Perspective.svelte';

	let collapsed = false;
	let collapsing = false;
	let drawerOpen = false;
	let drawer
	let hovered = JSON.parse(JSON.stringify($perspectiveStore))

	let selectedPerspective = null


	function createNewPerspective() {
		let number = 1
		let prefix = "New Perspective "
		while(Object.keys($perspectiveStore).includes(prefix+number)) {
			number++
		}

		const name = prefix+number
		perspectiveStore.add(name, {name})
	}

	function deletePerspective(perspective) {
		if(selectedPerspective == perspective) {
			selectedPerspective = null
		}
		perspectiveStore.remove(perspective)
	}

</script>

<svelte:head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,600,700">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Mono">
</svelte:head>

<main>
	<TopAppBar dense='true' variant='short' 
		bind:collapsed
		on:mouseenter="{e => collapsing ? collapsed=false : undefined}"
		on:mouseleave="{e => collapsing ? collapsed=true : undefined}"
	>
		<Row>
		<Section>
			<IconButton class="material-icons" on:click={() => {drawerOpen = !drawerOpen}}>menu</IconButton>
			<Title>{name}</Title>
		</Section>
		</Row>
	</TopAppBar>


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
				on:click={() => selectedPerspective = perspective}
				activated={selectedPerspective == perspective}
			>
				<Text>{perspective}</Text>
				<Fab mini="true" bind:exited={hovered[perspective]}
					on:click={()=>deletePerspective(perspective)}
				>
					<FabIcon class="material-icons">delete</FabIcon>
				</Fab>
			</Item>
			{/each}

			{#if Object.keys($perspectiveStore).length == 0}

			<Chip><ChipText>No Perspectives yet</ChipText></Chip>
			{/if}
	
			<Separator nav />
			<Item on:click={createNewPerspective}>
				<Graphic class="material-icons" aria-hidden="true">note_add</Graphic>
				<Text>Create Perspective</Text>
			</Item>
			
		</List>
		</Content>
	</Drawer>
	<Scrim></Scrim>

	{#if !selectedPerspective}
		<h1>Hello {name}!</h1>
		<h2>Root config path is: {rootConfigPath}</h2>
		<h2>Perspectives: {JSON.stringify($perspectiveStore)}</h2>
		<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
	{/if}

	{#if selectedPerspective}
		<Perspective perspective={$perspectiveStore[selectedPerspective]}></Perspective>
	{/if}


</main>

<style>
	main {
		text-align: center;
		padding: 1em;
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