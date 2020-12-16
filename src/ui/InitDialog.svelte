<script lang="ts">
    import Dialog, {Title, Content, Actions} from '@smui/dialog';
	import Button, {Label} from '@smui/button';
	import Textfield, {Input} from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text/index';
	import { afterUpdate } from "svelte";
	import FloatingLabel from '@smui/floating-label';
    import LineRipple from '@smui/line-ripple';
    import { query, mutation, getClient } from "svelte-apollo";
    import { AGENT } from './graphql_queries';

	let dialog;
	let did;
	let didDocument;
	let keystore;
	let passphrase

	function submitDID() {
		dialog.close()
	}

	function resolveDID() {
		console.log("resolve:", did)

		fetch(`https://resolver.identity.foundation/1.0/identifiers/${did}`)
			.then(response => response.json())
  			.then(data => didDocument = data);
	}

	function unlockKeystore() {
		//let wallet = didWallet.create(keystore)
		//wallet.unlock(passphrase)
		//keystoreUnlocked = wallet
	}
    getClient().query({ query: AGENT }).then( agent => {
            console.log(agent)
            if(!agent.isInitialized)
                dialog.open()
        })

	afterUpdate(() => {
        
	})
</script>

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
        <div>
            Keystore: 
            <Textfield fullwidth lineRipple={false} label="Keystore">
                <Input bind:value={keystore} id="input-keystore" aria-controls="keystore-helper-text" aria-describedby="keystore-helper-text" />
                <FloatingLabel for="input-keystore">Locked keystore string</FloatingLabel>
                <LineRipple />
            </Textfield>
            <HelperText id="keystore-helper-text">Please paste here your locked/encrypted keystore string</HelperText>
            <br>
            Passphrase:
            <Textfield fullwidth lineRipple={false} label="Passphrase">
                <Input bind:value={passphrase} id="input-keystore" aria-controls="keystore-helper-text" aria-describedby="keystore-helper-text" />
                <FloatingLabel for="input-keystore">Passphrase</FloatingLabel>
                <LineRipple />
            </Textfield>
            <HelperText id="keystore-helper-text">Passphrase for above entered keystore cipher</HelperText>
            <Button on:click={unlockKeystore}>
                <Label>Unlock</Label>
            </Button>
        </div>
        
    </Content>
    <Actions>
        <Button on:click={submitDID}>
            <Label>Submit</Label>
        </Button>
    </Actions>
</Dialog>