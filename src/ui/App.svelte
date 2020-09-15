<script lang="ts">
	export let name: string;
	export let rootConfigPath: string;
	import TopAppBar, {Row, Section, Title, FixedAdjust, ShortFixedAdjust} from '@smui/top-app-bar';
	import IconButton from '@smui/icon-button';
	let collapsed = true;
</script>

<svelte:head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,600,700">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Mono">
</svelte:head>

<main>
	<TopAppBar dense='true' variant='short' 
		bind:collapsed
		on:mouseenter="{e => collapsed=false}"
		on:mouseleave="{e => collapsed=true}"
	>
		<Row>
		<Section>
			<IconButton class="material-icons">menu</IconButton>
			<Title>{name}</Title>
		</Section>
		<Section align="end" toolbar>
			<IconButton class="material-icons" aria-label="Download">file_download</IconButton>
			<IconButton class="material-icons" aria-label="Print this page">print</IconButton>
			<IconButton class="material-icons" aria-label="Bookmark this page">bookmark</IconButton>
		</Section>
		</Row>
	</TopAppBar>
	<h1>Hello {name}!</h1>
	<h2>Root config path is: {rootConfigPath}</h2>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
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