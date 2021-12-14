<script lang="ts">
    import { getContext } from "svelte";
    import type { Ad4mClient } from '@perspect3vism/ad4m'
    import { perspectivesStore } from "./PerspectivesStore";
    const ad4m: Ad4mClient = getContext('ad4mClient')
    console.log("ad4m in zoomroot:", ad4m)
    let perspectives = perspectivesStore(ad4m)
</script>

<div id="perspectives">
    <h1>Perspectives</h1>
    <ul>
        {#each $perspectives as perspective}
        <li class="perspective-icon">
            <span class="perspective-name zoom-me" data-to="Perspective" data-uuid={perspective.uuid}>
                {perspective.name}
            </span>
        </li>
        {/each}
    </ul>
</div>

<div class="zoom-me" data-to="stringView">zoom me</div>
