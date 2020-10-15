<script lang="ts">
    export let perspective
    export let perspectiveId
    export let perspectiveStore
    export let languageController

    import FormField from '@smui/form-field';
    import Textfield from '@smui/textfield'
    import Button, {Label} from '@smui/button';
    import Select, {Option} from '@smui/select';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();


    if(!perspective && perspectiveId && perspectiveStore)
        perspective = $perspectiveStore[perspectiveId]
    let linkLanguages = []
    let linkLanguagesLoadingDone = false
    
    async function loadLinkLanguages() {
        linkLanguages = await languageController.getLanguagesWithLinksAdapter()
        linkLanguagesLoadingDone = true
    }

    loadLinkLanguages()
    

    function save() {
        dispatch('submit', perspective.uuid)
    }
</script>

{#if perspective}
<p>
    <FormField>
        <span>Name:</span>
        <Textfield bind:value={perspective.name} label="Name" />
    </FormField>
</p>
<p>
    <FormField>
        <span>Link sharing language:</span>
        {#if linkLanguagesLoadingDone}
        <Select bind:value={perspective.linksSharingLanguage} label="Sharing Language">
            <Option value=""></Option>
            {#each linkLanguages as lang}
              <Option value={lang.address} selected={lang.address == perspective.linksSharingLanguage}>{lang.name}</Option>
            {/each}
        </Select>
        {/if}
    </FormField>
</p>    
{perspective.linksSharingLanguage}
    <Button on:click={save}>
        <Label>Ok</Label>
    </Button>
{:else}
    Loading...
{/if}