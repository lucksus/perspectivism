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
    import { getContext, createEventDispatcher } from 'svelte';
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';
    import { v4 as uuid } from 'uuid'
    import { Circle3 } from 'svelte-loading-spinners'
    import path from 'path'

    const ad4m = getContext('ad4mClient')

    let showPublishPanel = false
    let publishLinkLanguage = ''
    let publishName = ''
    let publishDescription = ''
    let publishUUID = uuid()
    let isPublishing = false
    let linkLanguages = []
    let publishingStatus = ''

    const dispatch = createEventDispatcher();

    async function init() {
        linkLanguages = await ad4m.languages.byFilter('linksAdapter')
        console.log("LinkLanguages:", linkLanguages)
    }

    init()

    async function update() {
        const uuid = perspective ? perspective.uuid : perspectiveId
        perspective = await ad4m.perspective.byUUID(uuid)
    }

    update()

    ad4m.perspective.addPerspectiveUpdatedListener(update)

    async function save() {
        await ad4m.perspective.update(perspective.uuid, perspective.name)
        dispatch('submit', perspective.uuid)
    }

    function cancel() {
        dispatch('cancel')
    }

    async function publish() {
        isPublishing = true

        publishingStatus = "Cloning LinkLanguage..."

        const uniqueLinkLanguage = await ad4m.languages.cloneHolochainTemplate(
            path.join(__dirname, `../languages/${linkLanguage.name}`), 
            linkLanguage.name, 
            publishUUID
        );

        publishingStatus = `LinkLanguage cloned with address: ${uniqueLinkLanguage}!\nPublishing Neighbourhood...`

        // TODO: add name, type (or linkLanguage name) and description to meta perspective
        const meta = new Perspective()
        const neighbourhoodUrl = await ad4m.neighbourhood.publishFromPerspective(
            perspectiveHandle.uuid,
            uniqueLinkLanguage.address,
            meta
        )

        publishingStatus = 'Done!'

        isPublishing = false
        showPublishPanel = false
    }

    function randomizeUuid() {
        publishUUID = uuid()
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
                        <!--
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
                        -->
                    </Cell>
                {:else}
                    <Cell>
                        {#if showPublishPanel}
                            <h3>Publish as</h3>
                            <!--
                            <Textfield fullwidth lineRipple={false} label="Name">
                                <Input bind:value={publishName} id="input-name" aria-controls="name-helper-text" aria-describedby="name-helper-text" />
                                <FloatingLabel for="input-name">Name</FloatingLabel>
                                <LineRipple />
                            </Textfield>
                            <HelperText id="name-helper-text">Name of the shared Perspective others will see</HelperText>
                            
                            <Textfield fullwidth lineRipple={false} label="Description">
                                <Input bind:value={publishDescription} id="input-desc" aria-controls="desc-helper-text" aria-describedby="desc-helper-text" />
                                <FloatingLabel for="input-desc">Description</FloatingLabel>
                                <LineRipple />
                            </Textfield>
                            <HelperText id="desc-helper-text">Text describing the shared Perspective</HelperText>
                            -->
                            <Select bind:value={publishLinkLanguage} label="Link Language">
                                {#each linkLanguages as linkLanguage}
                                    <Option value={linkLanguage} selected={false}>{linkLanguage.name}</Option>
                                {/each}
                            </Select>

                            <Textfield fullwidth lineRipple={false} label="UUID for LinkLanguage clone">
                                <Input bind:value={publishUUID} id="input-uuid" aria-controls="uuid-helper-text" aria-describedby="uuid-helper-text" />
                                <FloatingLabel for="input-uuid">UUID for LinkLanguage clone</FloatingLabel>
                                <LineRipple />
                            </Textfield>
                            <HelperText id="uuid-helper-text">An arbitrary string that makes this LinkLanguage clone unique</HelperText>
                            <Button variant="raised" on:click={randomizeUuid}>
                                Randomize
                            </Button>



                            <p>
                                {#if isPublishing}
                                    {publishingStatus} <Circle3></Circle3>
                                {/if}
                            </p>

                            <Button variant="raised" on:click={publish}>
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