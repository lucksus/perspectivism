<svelte:options accessors={true}></svelte:options>
<script lang="ts">
    import { Link, PerspectiveProxy } from '@perspect3vism/ad4m';
    import Button, { Label, Icon as ButtonIcon } from '@smui/button';
    import { createEventDispatcher } from 'svelte';
    import LinkUrlPicker from './LinkUrlPicker.svelte';

    const dispatch = createEventDispatcher();

    export let source=""
    export let predicate=""
    export let target=""
    export let perspective: PerspectiveProxy

    function addLink() {
        perspective.add(new Link({
            source,
            predicate,
            target
        }))
        dispatch('ok')
    }
    
</script>

<div class="container">
    
    <div class="flex">
        <span class="paper">
            <LinkUrlPicker 
                label="Source" 
                bind:value={source} 
                on:pick={(e)=>dispatch('pick', e.detail)}
                on:create={(e)=>dispatch('create', e.detail)}>
            </LinkUrlPicker>
        </span>
        <span class="paper">
            <LinkUrlPicker 
                label="Predicate" 
                bind:value={predicate}
                on:pick={(e)=>dispatch('pick', e.detail)}
                on:create={(e)=>dispatch('create', e.detail)}>
            </LinkUrlPicker>
        </span>
        <span class="paper">
            <LinkUrlPicker 
                label="Target" 
                bind:value={target}
                on:pick={(e)=>dispatch('pick', e.detail)}
                on:create={(e)=>dispatch('create', e.detail)}>
            </LinkUrlPicker>
        </span>
    </div>
    

    <Button variant="outlined" on:click={()=>dispatch('cancel')}>
        <Label>Cancel</Label>
    </Button>
    <Button variant="raised" on:click={addLink}>
        <Label>Add Link</Label>
    </Button>
</div>

<style>
    .container {
        margin-top: -200px;
        height: 200px;
        background-color: #ffffffe0;
        text-align: center;
    }

    .flex {
        display: flex;
        margin-bottom: 10px;
    }

    .paper {
        display: inline-block;
        flex: auto;
    }
</style>