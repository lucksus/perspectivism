<script lang="ts">
	import { ApolloClient, InMemoryCache } from "@apollo/client";
	import { WebSocketLink } from '@apollo/client/link/ws';
	import { setClient } from "svelte-apollo";
import MainView from "./MainView.svelte";
	import Dialog, {Title, Content, Actions} from '@smui/dialog';
	import Button, {Label} from '@smui/button';
	import Textfield, {Input} from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text/index';
	import { afterUpdate } from "svelte";
	import FloatingLabel from '@smui/floating-label';
	import LineRipple from '@smui/line-ripple';


	let dialog;
	let did;
	let didDocument;

	function resolveDID() {
		console.log("resolve:", did)

		fetch(`https://resolver.identity.foundation/1.0/identifiers/${did}`)
			.then(response => response.json())
  			.then(data => didDocument = data);
	}
	afterUpdate(() => {
		dialog.open()
	})

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
</script>

<svelte:head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,600,700">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Mono">
</svelte:head>

<main>
	<Dialog
		bind:this={dialog}
		aria-labelledby="dialog-title"
		aria-describedby="dialog-content"
	>
		<Title id="dialog-title">Setup Agent Identity</Title>
		<Content id="dialog-content">
			<div>
				Perspectivism is agent-centric and built around <a href="https://w3c.github.io/did-core/">DIDs (Decentralized Identifier)</a> 
				as the agent representation.
				This means it does not add its own siloed user handling / login, but in principle can work with any decentralized/sovereign
				identitiy platform that implements DID (like <a href="https://www.uport.me/">uPort</a>, <a href="https://sovrin.org/">sovrin</a>, a DID document on your own webserver, etc.).
				<p>
					The main caveat is that Perspectivism needs access to that agent's private key to sign expressions - and it can't implement
					all keystore formats at once. (adding more as we progress towards v 1.0)
					For pragmatic reasons, to get going quickly while still being alpha software and under heavy develpment,
					it currently supportSubmit export the according keys in a locked keystore.
				</p>
				<p>
					Please head over to <a href="https://element-did.com">https://element-did.com</a> and create a keytore and register a DID.
					You will need a web3 browser/plugin like <a href="https://metamask.io/">MetaMask</a>, set it to the Ropsten test network
					and load your account with some <a href="https://faucet.dimensions.network/">test ETH</a>.
					<br>
					Then paste both your DID and your exported keystore below.
				</p>
				<p>
					You only need to do thiPlease paste here your locked/encrypted keystore strings once. Perspectivism will save your (locked) keystore and ask for its passphrase on future startups.
				</p>
			</div>
			<div>
				DID: 
				<Textfield fullwidth lineRipple={false} label="DID">
					<Input bind:value={did} id="input-did" aria-controls="did-helper-text" aria-describedby="did-helper-text" />
					<FloatingLabel for="input-did">DID handle</FloatingLabel>
					<LineRipple />
				</Textfield>
				<HelperText id="did-helper-text">Please paste here your already existing DID (e.g.: did:github:lucksus)</HelperText>
				<Button on:click={resolveDID}>				<HelperText id="keystore-helper-text">Keystore (locked)</HelperText>

					<Label>Resolve</Label>
				</Button>
				<br>
				DID document:Please paste here your locked/encrypted keystore string
			</div>
			
		</Content>
		<Actions>
			<Button on:click={submitDID}>
				<Label>Submit</Label>
			</Button>
		</Actions>
	</Dialog>

	<MainView></MainView>

</main>

