<script lang="ts">
	import { getContext, onMount } from "svelte";
	import TopAppBar, {Row, Section, Title} from '@smui/top-app-bar';
	import IconButton from '@smui/icon-button';
	import Drawer, {Content, Header, Title as DrawerTitle, Subtitle, Scrim} from '@smui/drawer';
	import List, {Item, Text, Graphic, Separator, Meta} from '@smui/list';
	import Chip, {Text as ChipText} from '@smui/chips';
	import Button, {Group, Label} from '@smui/button';
	import Perspective from './Perspective.svelte';
	import LanguagesSettings from './LanguagesSettings.svelte'
	import PerspectiveSettings from './PerspectiveSettings.svelte'
	import AgentProfileSettings from './AgentProfileSettings.svelte';
	import PeersView from './PeersView.svelte'
	import type { Ad4mClient } from '@perspect3vism/ad4m'
	import Zumly from 'zumly'
	import ZoomRoot from './ZoomRoot.svelte'
	import { perspectivesStore } from "./PerspectivesStore";

	const ad4m: Ad4mClient = getContext('ad4mClient')

	let perspectives = perspectivesStore(ad4m)
	let collapsed = false;
	let collapsing = false;
	let drawerOpen = false;
	let drawer
	let hovered
	$: if($perspectives) {
		hovered = {}
		$perspectives.forEach(p => {
			hovered[p.uuid] = true
		})
	}
	 	

	//for(const pID in $perspectiveStore) {
	//	linkRepoController.syncWithSharingAdapter($perspectiveStore[pID])
	//}

	let selectedMainView = {
		perspective: null,
		settings: null,
		edit: null,
	}

	async function createNewPerspective() {
		let number = 1
		let prefix = "New Perspective "
		while($perspectives.includes(prefix+number)) {
			number++
		}

		const name = prefix+number
		const result = await ad4m.perspective.add(name)
		console.log("Perspective added:", result)
	}

	function deletePerspective(perspective) {
		if(selectedMainView.perspective == perspective) {
			selectedMainView.perspective = null
		}

		ad4m.perspective.remove(perspective.uuid)
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

	function openPerspectiveByURL(perspectiveURL) {
		console.log("openPerspectiveByURL:", perspectiveURL)
		const found = $perspectives.find(p => p.sharedURL == perspectiveURL)
		if(found) {
			console.log("Found perspective! Opening...")
			selectedMainView = { perspective: found, settings: null }
		} else {
			console.log("TODO: install perspective")
		}
	}


	onMount(()=> {
		// Zumly instance
		const zumly = new Zumly({
			mount: '#zoom-container',
			initialView: 'ZoomRoot',
			views: {
				ZoomRoot,
				Perspective
			}
		})

		zumly.init()
	})
	

</script>

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
			{#each $perspectives as perspective}
				<Item href="javascript:void(0)"
					on:mouseenter="{e => hovered[perspective.uuid] = false}"
					on:mouseleave="{e => hovered[perspective.uuid] = true}"
					activated={selectedMainView.perspective?.uuid == perspective.uuid}
					on:click={() => selectedMainView = { perspective, settings: null }}
				>
					<Text>{perspective.name}</Text>
					{#if !hovered[perspective.uuid]}
					<Meta>
						<div on:click|stopPropagation={true}>
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
	
			<Item on:click={()=>createNewPerspective()}>
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

			<Item 
				activated={selectedMainView.settings == 'agent'}
				on:click={() => selectedMainView = { perspective: null, settings: 'agent' }}
			>
				<Graphic class="material-icons" aria-hidden="true">account_circle</Graphic>
				<Text>Agent Profile</Text>
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

	<PeersView on:request-open-perspective={(event)=>{
		console.log("on:request-open-perspective:", event)
		openPerspectiveByURL(event.detail.perspectiveURL)
	}}>
	</PeersView>
	
	{#if selectedMainView.perspective}
		<Perspective perspective={selectedMainView.perspective} 
			on:settings-changed={editPerspectiveSubmit}
		></Perspective>
	{:else if selectedMainView.settings }
		{#if selectedMainView.settings == 'languages'}
			<LanguagesSettings></LanguagesSettings>
		{/if}
		{#if selectedMainView.settings == 'agent'}
			<div class="centered">
				<AgentProfileSettings></AgentProfileSettings>
			</div>
		{/if}
	{:else if selectedMainView.edit }
		<PerspectiveSettings perspective={selectedMainView.edit} 
			on:submit={editPerspectiveSubmit}
			on:cancel={() => selectedMainView.edit = null}
		></PerspectiveSettings>
	{:else}
		<h1>Welcome to Perspect3ve!</h1>
		<h2>Please open the drawer and create or select a perspective to start...</h2>
		<div id="zoom-container"></div>
    {/if}
    
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

		.centered {
			margin-top: 100px;
			margin-left: auto;
			margin-right: auto;
			width: 380px;
		}
    
        @media (min-width: 640px) {
            main {
                max-width: none;
            }
        }
    </style>