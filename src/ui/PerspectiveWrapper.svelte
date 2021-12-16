<script lang="ts">
    import { getContext } from "svelte";
    import type { Ad4mClient } from "@perspect3vism/ad4m"
    import Tab, { Icon, Label } from '@smui/tab';
    import TabBar from '@smui/tab-bar';
    import Perspective from './Perspective.svelte'
    import ExpressionBrowser from './ExpressionBrowser.svelte';
    import PerspectiveSettings from './PerspectiveSettings.svelte';
import isFirstDayOfMonth from "date-fns/isFirstDayOfMonth/index.js";

    export let uuid: string

    const ad4m: Ad4mClient = getContext('ad4mClient')
    let perspective

    $: if(uuid) {
        (async () => {
            perspective = await ad4m.perspective.byUUID(uuid)
        })()
    }

    let loading = !perspective

    let tabs = [
        { k: 1, label: 'Prolog REPL', icon: 'alarm_on' },
        { k: 2, label: 'Expression Browser', icon: 'web' },
        { k: 3, label: 'Perspective Settings', icon: 'settings' },
    ]

    function noop(){}

    let active = tabs[0]
</script>

<div class="perspective-wrapper"
    on:mousewheel|stopPropagation={noop} 
    on:touchstart|stopPropagation={noop}
    on:mouseup|stopPropagation={noop}
>
    {#if perspective}
        <Perspective perspective={perspective}></Perspective>
    {:else}
        <h2>Loading...</h2>
    {/if}

    <div class="footer-panel">
        <TabBar {tabs} let:tab key={(tab) => tab.k} bind:active style="height: 42px; background-color: #44aaee6b;">
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

    .footer-content {
        height: 150px;
        overflow-x: scroll;
    }
</style>