<script lang="ts">
    export let perspective
    export let perspectiveId

    import FormField from '@smui/form-field';
    import Textfield, {Input} from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text/index';
	import FloatingLabel from '@smui/floating-label';
    import LineRipple from '@smui/line-ripple';
    import Button, {Label} from '@smui/button';
    import Select, {Option} from '@smui/select';
    import { createEventDispatcher } from 'svelte';
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';
    import { LANGUAGES, PERSPECTIVE, PERSPECTIVE_UPDATED, PUBLISH_PERSPECTIVE, UPDATE_PERSPECTIVE } from './graphql_queries'
    import { getClient, mutation, query } from 'svelte-apollo'

    let showPublishPanel = false
    let publishType = ''
    let publishName = ''
    let publishDescription = ''
    let isPublishing = false

    const dispatch = createEventDispatcher();
    const gqlClient = getClient()
    const M_UPDATE_PERSPECTIVE = mutation(UPDATE_PERSPECTIVE)
    const M_PUBLISH_PERSPECTIVE = mutation(PUBLISH_PERSPECTIVE)

    function update() {
        const uuid = perspective ? perspective.uuid : perspectiveId
        gqlClient.query({
            query: PERSPECTIVE,
            variables: { uuid }
        }).then(result => {
            const p = result.data.perspective
            perspective = {
                name: p.name,
                uuid: p.uuid,
                sharedPerspective: p.sharedPerspective,
                sharedURL: p.sharedURL,
            }
            isPublishing = false
        })
    }

    update()

    getClient().subscribe({
		query: PERSPECTIVE_UPDATED
	}).subscribe({
		next: () => update(),
		error: (e) => console.error(e)
	})

    function save() {
        M_UPDATE_PERSPECTIVE({
            variables: perspective
        })
        dispatch('submit', perspective.uuid)
    }

    function cancel() {
        dispatch('cancel')
    }

    function publish() {
        M_PUBLISH_PERSPECTIVE({
            variables: {
                uuid: perspective.uuid,
                name: publishName,
                description: publishDescription,
                type: publishType
            }
        })
        isPublishing = true
    }

    if(!perspective)
        perspective = {}
    if(!perspective.name)
        perspective.name = '<loading>'

</script>

<div class="perspective-settings-container">
    <h1>Perspective Settings</h1>
    <DataTable>
        <Body>
            <Row>
                <Cell>Name:</Cell>
                <Cell><Textfield bind:value={perspective.name} label="Name" /></Cell>
            </Row>
            <Row>
                <Cell>Sharing:</Cell>
                {#if perspective.sharedPerspective}
                    <Cell>
                        <h3>This Perspective is shared</h3>
                        <div>
                            <span>URL: </span>
                            <span>{perspective.sharedURL}</span>
                        </div>
                        <div>
                            <span>Name: </span>
                            <span>{perspective.sharedPerspective.name}</span>
                        </div>
                        <div>
                            <span>Description: </span>
                            <span>{perspective.sharedPerspective.description}</span>
                        </div>
                        <div>
                            <span>Type: </span>
                            <span>{perspective.sharedPerspective.type}</span>
                        </div>
                    </Cell>
                {:else}
                    <Cell>
                        {#if showPublishPanel}
                            <h3>Publish as</h3>
                            <Textfield fullwidth lineRipple={false} label="Name">
                                <Input bind:value={publishName} id="input-name" aria-controls="name-helper-text" aria-describedby="name-helper-text" />
                                <FloatingLabel for="input-name">Name</FloatingLabel>
                                <LineRipple />
                            </Textfield>
                            <HelperText id="name-helper-text">Name of the shared Perspective others will see</HelperText>
                            
                            <Textfield fullwidth lineRipple={false} label="Description">
                                <Input bind:value={publishDescription} id="input-desc" aria-controls="desc-helper-text" aria-describedby="desc-helper-text" />
                                <FloatingLabel for="desc-did">Description</FloatingLabel>
                                <LineRipple />
                            </Textfield>
                            <HelperText id="desc-helper-text">Text describing the shared Perspective</HelperText>
                            
                            <Select bind:value={publishType} label="Sharing Type">
                                <Option value={'broadcast'} selected={false}>Broadcast</Option>
                                <Option value={'permissionless'} selected={true}>Permissionless</Option>
                                <Option value={'permissioned'} selected={false} deactivated={true}>Permissioned</Option>
                                <Option value={'holochain'} selected={false} deactivated={true}>Holochain</Option>
                            </Select>

                            <p></p>

                            <Button variant="raised" on:click={publish} disabled={publishType==='permissioned' || isPublishing}>
                                Publish!
                            </Button>
                            <Button variant="outlined" on:click={() => showPublishPanel=false}>
                                Cancel
                            </Button>
                        {:else}
                            <h3>This Perspective is private</h3>
                            <p></p>
                            <Button variant="raised" on:click={() => showPublishPanel=true}>
                                Publish Perspective...
                            </Button>
                        {/if}
                    </Cell>
                {/if}
            </Row>
        </Body>
    </DataTable>
</div>
<p></p>
<Button variant="raised" on:click={save}>
    <Label>Ok</Label>
</Button>
<Button variant="outlined" on:click={cancel}>
    <Label>Cancel</Label>
</Button>

<style>

</style>