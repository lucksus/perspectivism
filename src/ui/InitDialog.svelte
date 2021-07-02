<script lang="ts">
    import Dialog, {Title, Content, Actions} from '@smui/dialog';
	import Button, {Label} from '@smui/button';
	import Textfield, {Input} from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text/index';
	import FloatingLabel from '@smui/floating-label';
    import LineRipple from '@smui/line-ripple';
    import { mutation, getClient } from "svelte-apollo";
    import { AGENT_STATUS, INITIALIZE_AGENT, LOCK_AGENT, QUIT, UNLOCK_AGENT } from './graphql_queries';
    import LinkExtern from './LinkExtern.svelte'

    const QGL_CLIENT = getClient()
    const GQL_INITIALIZE_AGENT = mutation(INITIALIZE_AGENT)
    const GQL_LOCK_AGENT = mutation(LOCK_AGENT)
    const GQL_UNLOCK_AGENT = mutation(UNLOCK_AGENT)
    const GQL_QUIT = mutation(QUIT)

    function check() {
        QGL_CLIENT.query({ query: AGENT_STATUS }).then( result => {
            console.log("check:", result)
            if(!result.data.agentStatus.isInitialized) {
                initDialog.open()
            } else {
                initDialog.close()
                if(!result.data.agentStatus.isUnlocked) {
                    did = result.data.agentStatus.did
                    unlockDialog.open()
                } else {
                    unlockDialog.close()
                }
            }
        })
    }

    let initDialog;
    let didElementDialog;
    let didKeyDialog;
    let unlockDialog;

	let did;
	let didDocument;
	let keystore;
    let passphrase
    let passphrase2
    let passphraseError
    let unlockError

	function submitDID() {
		GQL_INITIALIZE_AGENT({
            variables: {
                did,
                didDocument: JSON.stringify(didDocument),
                keystore,
                passphrase
            }
        }).then(() => check())
    }
    
    function submitKeyDID() {
        if(passphrase !== passphrase2) {
            passphraseError = "Passphrases don't match!"
            setTimeout(didKeyDialog.open, 10)
            return
        }

        GQL_LOCK_AGENT({
            variables: { passphrase }
        })
    }

	function resolveDID() {
		console.log("resolve:", did)

		fetch(`https://resolver.identity.foundation/1.0/identifiers/${did}`)
			.then(response => response.json())
  			.then(data => didDocument = data);
	}

	function unlockKeystore() {
		GQL_UNLOCK_AGENT({ variables: { passphrase }}).then((result) => {
            console.log("unlock response:", result)
            unlockError = result.data.agentUnlock.error
            passphrase = ""
            if(result.data.agentUnlock.isUnlocked) {
                unlockDialog.close()
            } else {
                unlockDialog.open()
            }
        })
    }

    function quit() {
        GQL_QUIT({})
    }

    function importKeystore() {
        initDialog.close()
        didElementDialog.open()
    }

    async function createKeys() {
        GQL_INITIALIZE_AGENT({
            variables: {}
        }).then(result => {
            console.log(result)
            // @ts-ignore
            did = result.data?.agentInitialize?.did
            initDialog.close()
            didKeyDialog.open()
        })
    }
    
    check()
</script>

<Dialog
    bind:this={initDialog}
    aria-labelledby="dialog-title"
    aria-describedby="dialog-content"
    scrimClickAction=""
    escapeKeyAction=""
>
    <Title id="dialog-title">Setup Agent Identity</Title>
    <Content id="dialog-content">
        <h1>Welcome to Perspectivism</h1>
        <div>
            Perspectivism is agent-centric and built around <LinkExtern url="https://w3c.github.io/did-core/">DIDs (Decentralized Identifier)</LinkExtern> 
            as the agent representation.
            This means it does not add its own siloed user handling / login, but in principle can work with any decentralized/sovereign
            identitiy platform that implements DID (like <LinkExtern url="https://www.uport.me/">uPort</LinkExtern>, <LinkExtern url="https://sovrin.org/">sovrin</LinkExtern>, a DID document on your own webserver, etc.).
        </div>
        <div>
            If you don't know what this means, it's safe to choose to create a new and ephemeral DID with only locally stored keys.
        </div>
        <div>
            But if you want to use Perspectivism with your already existing DID, you can also import the according keystore
            and have Perspectivism sign all expressions under your existing identity.
        </div>

    </Content>
    <Actions>
        <Button variant="outlined" on:click={importKeystore}>
            <Label>Import existing DID & keystore</Label>
        </Button>
        <Button variant="raised" on:click={createKeys}>
            <Label>Create new ephemeral DID & keys</Label>
        </Button>
    </Actions>
</Dialog>

<Dialog bind:this={didKeyDialog}
    scrimClickAction=""
    escapeKeyAction=""
>
    <Title id="dialog-title">Create new keystore</Title>
    <Content>
        <h1>Create new Keystore</h1>
        <div>
            <div>Your freshly created DID is:</div>
            <span class="did">{did}</span>
        </div>
        <div>
            <div>
                Please enter a new passphrase to lock your keystore with:
            </div>
            
            <Textfield fullwidth lineRipple={false} label="Keystore">
                <Input bind:value={passphrase} id="input-did" type="password" aria-controls="unlock-helper-text" aria-describedby="unlock-helper-text" />
                <FloatingLabel for="input-did">Passphrase</FloatingLabel>
                <LineRipple />
            </Textfield>
            <HelperText id="unlock-helper-text">Please enter the passphrase for you keystore</HelperText>
            {#if unlockError}
                <p>
                <div class="error">{unlockError}</div>    
            {/if}
            <Textfield fullwidth lineRipple={false} label="Keystore">
                <Input bind:value={passphrase2} id="input-did" type="password" aria-controls="unlock-helper-text" aria-describedby="unlock-helper-text" />
                <FloatingLabel for="input-did">Passphrase again</FloatingLabel>
                <LineRipple />
            </Textfield>
            <HelperText id="unlock-helper-text">Please re-enter the same passphrase to be sure</HelperText>
            {#if passphraseError}
                <p>
                <div class="error">{passphraseError}</div>    
            {/if}
        </div>
        
        
    </Content>
    
    <Actions>
        <Button on:click={quit}>
            <Label>Quit</Label>
        </Button>
        <Button variant="raised" on:click={submitKeyDID}>
            <Label>Finish</Label>
        </Button>
    </Actions>
</Dialog>


<Dialog
    bind:this={didElementDialog}
    aria-labelledby="dialog-title"
    aria-describedby="dialog-content"
    scrimClickAction=""
    escapeKeyAction=""
>
    <Title id="dialog-title">Import DID keystore</Title>
    <Content id="dialog-content">
        <h1>Import DID & Keystore</h1>
        <div>
            Currently, the only supported keystore format is the one used and exported by <LinkExtern url="https://element-did.com">https://element-did.com</LinkExtern>.
        </div>
        <div>
            If have another DID provider you want to use with Perspectivism, please <LinkExtern url="https://github.com/lucksus/perspectivism/issues/new">create a ticket and let us know!</LinkExtern>
        </div>
        <div>
            DID: 
            <Textfield fullwidth lineRipple={false} label="DID">
                <Input bind:value={did} id="input-did" aria-controls="did-helper-text" aria-describedby="did-helper-text" />
                <FloatingLabel for="input-did">DID handle</FloatingLabel>
                <LineRipple />
            </Textfield>
            <HelperText id="did-helper-text">Please paste here your already existing DID (e.g.: did:github:lucksus)</HelperText>
            <HelperText id="keystore-helper-text">Keystore (locked)</HelperText>
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
                <Input bind:value={passphrase} id="input-keystore" type="password" aria-controls="keystore-helper-text" aria-describedby="keystore-helper-text" />
                <FloatingLabel for="input-keystore">Passphrase</FloatingLabel>
                <LineRipple />
            </Textfield>
            <HelperText id="keystore-helper-text">Passphrase for above entered keystore cipher</HelperText>
        </div>
        
    </Content>
    <Actions>
        <Button on:click={quit}>
            <Label>Quit</Label>
        </Button>
        <Button on:click={submitDID}>
            <Label>Submit</Label>
        </Button>
    </Actions>
</Dialog>

<Dialog bind:this={unlockDialog}
    scrimClickAction=""
    escapeKeyAction=""
>
    <Title id="dialog-title">Unlock Agent Keystore</Title>
    <Content>
        <span class="did">{did}</span>
        <Textfield fullwidth lineRipple={false} label="Keystore">
            <Input bind:value={passphrase} id="input-did" type="password" aria-controls="unlock-helper-text" aria-describedby="unlock-helper-text" />
            <FloatingLabel for="input-did">Passphrase</FloatingLabel>
            <LineRipple />
        </Textfield>
        <HelperText id="unlock-helper-text">Please enter the passphrase for you keystore</HelperText>
        {#if unlockError}
            <p>
            <div class="error">{unlockError}</div>    
        {/if}
    </Content>
    
    <Actions>
        <Button on:click={quit}>
            <Label>Quit</Label>
        </Button>
        <Button variant="raised" on:click={unlockKeystore}>
            <Label>Unlock</Label>
        </Button>
    </Actions>
</Dialog>

<style>
    .error {
        color: red;
    }

    .did {
        max-width: 512px;
        word-wrap: break-word;
    }
</style>