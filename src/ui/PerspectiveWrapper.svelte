<script lang="ts">
    import { getContext } from "svelte";
    import type { Ad4mClient } from "@perspect3vism/ad4m"
    import Tab, { Icon, Label } from '@smui/tab';
    import TabBar from '@smui/tab-bar';
    import Perspective from './Perspective.svelte'
    import ExpressionBrowser from './ExpressionBrowser.svelte';
    import PerspectiveSettings from './PerspectiveSettings.svelte';
    import AgentProfileSettings from './AgentProfileSettings.svelte';
    import Button, {Label as ButtonLabel} from '@smui/button';

    export let uuid: string
    export let settings: string
    export let agentprofile: string

    if(typeof settings === 'string')
        settings = JSON.parse(settings)

    const ad4m: Ad4mClient = getContext('ad4mClient')
    let perspective

    $: if(uuid) {
        (async () => {
            perspective = await ad4m.perspective.byUUID(uuid)
        })()
    }

    let tabs = [
        { k: 1, label: 'Prolog REPL', icon: 'alarm_on' },
        { k: 2, label: 'Expression Browser', icon: 'web' },
    ]

    console.log('settings:', settings)
    if(settings) {
        console.log('adding settings')
        tabs.push({ k: 3, label: 'Perspective Settings', icon: 'settings' })
    }

    async function publishAsAgentPerspective() {
      const snapshot = await perspective.snapshot()
      console.log("Publishing perspective as agent perspective: ", snapshot)
      await ad4m.agent.updatePublicPerspective(snapshot)
    }

    function noop(){}
    let active = tabs[0]
    let me
    async function init() {
        me = await ad4m.agent.me()
    }

    init()
</script>

<div class="perspective-wrapper"
    on:mousewheel|stopPropagation={noop} 
    on:touchstart|stopPropagation={noop}
    on:mouseup|stopPropagation={noop}
>
    <div class="header">
        <h1>
            {#if agentprofile}
                Your Agent Profile
            {:else}
                {perspective?.name}
            {/if}
        </h1>
        {#if agentprofile && me}
            ({me.did})
        {/if}
    </div>

    {#if perspective}
        <Perspective perspective={perspective}></Perspective>
    {:else}
        <h2>Loading...</h2>
    {/if}

    {#if agentprofile}
        <div class="agentprofile">
            <AgentProfileSettings></AgentProfileSettings>
        </div>
    {/if}

    <div class="footer-panel">
        <div class="footer-header">
            <TabBar {tabs} let:tab key={(tab) => tab.k} bind:active style="display: inline;">
                <Tab
                    {tab}
                    stacked={true}
                    indicatorSpanOnlyContent={true}
                    tabIndicator$transition="fade"
                    >
                    <Icon class="material-icons">{tab.icon}</Icon>
                    <Label>{tab.label}</Label>
                </Tab>
            </TabBar>
            {#if agentprofile}
                <Button variant="raised" on:click={publishAsAgentPerspective} style="position: absolute; right: 0; top: 2px;">
                    <ButtonLabel>Publish Profile</ButtonLabel>
                </Button>
            {/if}
        </div>
        
          <div class="footer-content">
            {#if active.k === 1 }
                Prolog REPL
            {:else if active.k === 2 }
                <ExpressionBrowser></ExpressionBrowser>
            {:else if active.k === 3 }
                {#if uuid}
                    <PerspectiveSettings perspectiveId={uuid}>
                    </PerspectiveSettings>
                {/if}
            {/if}
          </div>
    </div>

</div>

<style>
    h1 {
        margin: 5px 20px;
        display: inline;
    }

    .header {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        height: 45px;
        background-color: #44aaee6b;
    }

    .perspective-wrapper {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: aliceblue;
        padding: 20px;
    }

    .footer-panel {
        position: absolute;
        height: 200px;
        right: 0;
        bottom: 0;
        left: 0;
        text-align: center;
    }

    .footer-header { 
        height: 42px; 
        background-color: #44aaee6b;
    }

    .footer-content {
        height: 150px;
        overflow-x: scroll;
    }

    .agentprofile {
        float: right;
        margin-top: 40px
    }
</style>