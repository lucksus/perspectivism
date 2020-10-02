<script lang="ts">
    export let perspectiveName
    export let perspectiveStore

    import FormField from '@smui/form-field';
    import Textfield from '@smui/textfield'
    import Button, {Label} from '@smui/button';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();


    let perspective = $perspectiveStore[perspectiveName]

    function save() {
        perspectiveStore.update(perspectiveName, perspective)
        dispatch('submit')
    }
</script>

{#if perspective}
    <FormField>
        <Textfield bind:value={perspective.name} label="Name" />
        <span slot="label">Name</span>
    </FormField>

    <Button on:click={save}>
        <Label>Ok</Label>
    </Button>
{:else}
    Loading...
{/if}