<script lang="ts">
    import { getContext, onMount } from "svelte";
    import Dialog, {Title, Content, Actions} from '@smui/dialog';
	import Button, {Label} from '@smui/button';
	import Textfield, {Input} from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text/index';
	import FloatingLabel from '@smui/floating-label';
    import LineRipple from '@smui/line-ripple';
    import LinkExtern from './LinkExtern.svelte'
    import { Ad4mClient } from "@perspect3vism/ad4m";
    import { ApolloClient, InMemoryCache } from "@apollo/client";
    import { WebSocketLink } from "@apollo/client/link/ws";
    import { createEventDispatcher } from 'svelte';
	const { ipcRenderer } = require('electron')

	const dispatch = createEventDispatcher();

    const ad4m = getContext('ad4mClient')
    const executorPort = getContext('executorPort')
    const jwt = getContext('jwt')
    function emitJwt(jwt) {
        ipcRenderer.sendSync('valid-jwt', jwt)
    }

    let dialog
    let requestId
    let code
    let validCode = true

    onMount(async ()=>{
        if(jwt) {
            try {
                await ad4m.agent.status()
                emitJwt(jwt)
            }
            catch(e) {
                // jwt invalid, inform user
                dialog.open()
            }
        }
        else {
            dialog.open()
        }
    })


    async function requestCapability() {
        try {
            let capabilities = [{"with":{"domain":"*","pointers":["*"]},"can":["*"]}]
            requestId = await ad4m.agent.requestCapability("perspect3ve", "general purpose ad4m browser", "https://github.com/perspect3vism/perspect3ve", JSON.stringify(capabilities));
            console.log("auth request id: ", requestId);
        } catch (err) {
            console.log(err);
        }
    }
    async function generateJwt() {
        try {
            let jwt = await ad4m.agent.generateJwt(requestId, code);
            console.log("auth jwt: ", jwt);
            await checkJwt(jwt)
        } catch (err) {
            console.log(err);
            validCode = false
        }
    }

    async function checkJwt(jwt) {
        const wsLink = new WebSocketLink({
            uri: `ws://localhost:${executorPort}/graphql`,
            options: {
                reconnect: true,
                connectionParams: async () => {
                    return {
                        headers: {
                            authorization: jwt
                        }
                    }
                }
            },
            webSocketImpl: WebSocket,
        });
        let apolloClient = new ApolloClient({
            link: wsLink,
            cache: new InMemoryCache({ resultCaching: false, addTypename: false }),
            defaultOptions: {
                watchQuery: {
                    fetchPolicy: "no-cache",
                },
                query: {
                    fetchPolicy: "no-cache",
                }
            },
        })
        let ad4mClientJwt = new Ad4mClient(apolloClient)
        try {
            let status = await ad4mClientJwt.agent.status()
            console.log('agent status:', status)
            dispatch('valid-jwt')
            setTimeout(() => {}, 100)
            emitJwt(jwt)
        }
        catch (e) {
            console.log(e)
        }
    } 
</script>

<Dialog
    bind:this={dialog}
    aria-labelledby="dialog-title"
    aria-describedby="dialog-content"
    scrimClickAction=""
    escapeKeyAction=""
>
    <Title id="dialog-title">Request Capability Token</Title>
    <Content id="dialog-content">
        <Button variant="raised" on:click={requestCapability}>
            <Label>Request Code</Label>
        </Button>
        <Textfield fullwidth invalid={!validCode} lineRipple={false} label="Keystore">
            <Input bind:value={code} id="jwt-generation-code" />
            <FloatingLabel for="jwt-generation-code">{validCode ? "Code" : "Invalid Code"}</FloatingLabel>
            <LineRipple />
        </Textfield>
        <HelperText id="unlock-helper-text">Please enter the code from ad4min</HelperText>
        <Button variant="raised" on:click={generateJwt}>
            <Label>Generate JWT</Label>
        </Button>
    </Content>
</Dialog>


<style>

  h2 {
    text-align: center;
    font-size: 24px;
  }

    .capability-request {
        background-color: white;
    }
</style>