<script lang="ts">
    export let perspective
    export let perspectiveId
    export let perspectiveStore

    import FormField from '@smui/form-field';
    import Textfield from '@smui/textfield'
    import Button, {Label} from '@smui/button';
    import Select, {Option} from '@smui/select';
    import { createEventDispatcher } from 'svelte';
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';
    import { LANGUAGES, PERSPECTIVE, UPDATE_PERSPECTIVE } from './graphql_queries'
    import { getClient, mutation, query } from 'svelte-apollo'

    const dispatch = createEventDispatcher();


    if(!perspective && perspectiveId) {
        getClient().query({
            query: PERSPECTIVE,
            variables: { uuid: perspectiveId }
        }).then(p => {
            perspective = {
                name: p.name,
                uuid: p.uuid,
                linksSharingLanguage: p.linksSharingLanguage,
            }
        })
    }

    let linkLanguages = query(LANGUAGES, {
        variables: { filter: "linksAdapter" }
    })   

    function save() {
        mutation(UPDATE_PERSPECTIVE)({
            variables: perspective
        })
        dispatch('submit', perspective.uuid)
    }

    function cancel() {
        dispatch('cancel')
    }
</script>

{#if perspective.name}
<div class="perspective-settings-container">
    <h1>Perspective Settings</h1>
    <DataTable>
        <Body>
            <Row>
                <Cell>Name:</Cell>
                <Cell><Textfield bind:value={perspective.name} label="Name" /></Cell>
            </Row>
            <Row>
                <Cell>Link sharing language:</Cell>
                <Cell>
                    {#if !$linkLanguages.loading}
                    <Select bind:value={perspective.linksSharingLanguage} label="Sharing Language">
                        <Option value=""></Option>
                        {#each $linkLanguages.data.languages as lang}
                        <Option value={lang.address} selected={lang.address == perspective.linksSharingLanguage}>{lang.name}</Option>
                        {/each}
                    </Select>
                    {/if}
                </Cell>
            </Row>
        </Body>
    </DataTable>
</div>
<p></p>
<Button on:click={save}>
    <Label>Ok</Label>
</Button>
<Button on:click={cancel}>
    <Label>Cancel</Label>
</Button>
{:else}
    Loading...
{/if}

<style>
    .perspective-settings-container {
        min-width: 400px;
    }
</style>