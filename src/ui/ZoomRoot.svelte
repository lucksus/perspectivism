<script lang="ts">
    import { getContext } from "svelte";
    import type { Ad4mClient } from '@perspect3vism/ad4m'
    import { perspectivesStore } from "./PerspectivesStore";
    const ad4m: Ad4mClient = getContext('ad4mClient')
    let perspectives = perspectivesStore(ad4m)
    let agentPerspective 
    $: agentPerspective = $perspectives.find(e => e.name == '__agent_public_perspective')

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
</script>

<div class="perspectives">
    <div class="public">
        <h2>Public Perspectives</h2>
        {#if agentPerspective}
            <div class="perspective-box agent-perspective zoom-me" data-to="PerspectiveWrapper" 
                data-uuid={agentPerspective.uuid}
                data-settings={false}
                data-agentprofile={true}
            >
                Public Agent Perspective
            </div>
        {/if}

        <h2>Neighbourhoods</h2>
        <ul class="perspective-list neighbourhoods">
            {#each $perspectives as perspective}
                {#if perspective !== agentPerspective && perspective.sharedUrl}
                    <li class="perspective-icon">
                        <div class="perspective-box zoom-me" data-to="PerspectiveWrapper" 
                            data-uuid={perspective.uuid}
                            data-settings=true
                        >
                            {perspective.name}
                        </div>
                    </li>
                {/if}
            {/each}
        </ul>
    </div>

    <div class="private">
        <h2>Private Perspectives <div class="perspective-box plus-button" on:click={()=>createNewPerspective()}>+</div></h2>
        <ul class="perspective-list private-perspectives">
            {#each $perspectives as perspective}
                {#if perspective !== agentPerspective && !perspective.sharedUrl}
                    <li class="perspective-list-item">
                        <div class="perspective-box zoom-me" data-to="PerspectiveWrapper" 
                            data-uuid={perspective.uuid}
                            data-settings=true
                        >
                            <img class="perspective-icon zoom-me" 
                                src="images/silvereyeflower.png" 
                                alt="perspective icon"
                                data-to="PerspectiveWrapper" 
                                data-uuid={perspective.uuid}
                                data-settings=true
                            >
                            <span class="perspective-name zoom-me"
                                data-to="PerspectiveWrapper" 
                                data-uuid={perspective.uuid}
                                data-settings=true
                            >{perspective.name}</span>
                        </div>
                    </li>
                {/if}
            {/each}
        </ul>
        
    </div>

</div>

<style>
    .perspectives {
        padding: 20px;
        text-align: center;
    }
    .perspective-box {
        position: relative;
        display: inline-block;
        width: 200px;
        height: 212px;
        margin: auto;
        border-radius: 100px;
        background-color: #00ffff73;
        text-align: center;
        line-height: 212px;
        background-image: url('../images/silvereyeflower.png');
    }

    .agent-perspective {
        background-color: red;
    }

    .perspective-list {
        display: inline-block;
        list-style-type: none;
        padding: 0;
    }

    .perspective-list-item {
        display: inline-block;
    }

    .perspective-icon {
        position: absolute;
        left: 0;
        width: 200px;
    }

    .perspective-name {
        font-weight: bold;
        position: absolute;
        left: 0;
        right: 0;
        margin-left: auto;
        margin-right: auto;
        font-size: 20px;
        text-shadow: 1px 2px #fafafa;
    } 

    .private {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 33%;
        background-color: seagreen;
        overflow: scroll;
    }

    .plus-button {
        position: absolute;
        right: 0;
        top: 0;
        width: 50px;
        height: 40px;
        font-size: 30px;
        line-height: normal;
        cursor: pointer;
    }
</style>