<script lang="ts">
    import Textfield, { Textarea } from '@smui/textfield';
    import Button, { Label, Icon as ButtonIcon } from '@smui/button';
    import { Link, LinkQuery, Literal, PerspectiveProxy } from '@perspect3vism/ad4m';
    import Card, { Content, Actions, ActionButtons } from '@smui/card';

    export let perspective: PerspectiveProxy
    
    let editorInput
    let existingZomes = []

    async function add() {
        const literal = Literal.from(editorInput)
        await perspective.add(new Link({
            source: 'self',
            predicate: 'ad4m://has_zome',
            target: literal.toUrl()
        }))
        editorInput = ''
    }

    async function update() {
        let links = await perspective.get(new LinkQuery({
            source: 'self',
            predicate: 'ad4m://has_zome'
        }))

        existingZomes = links.map(link => {
            return {
                link,
                code: Literal.fromUrl(link.data.target).get()
            }
        })
    }

    function deleteZome(zome) {
        perspective.remove(zome.link)
    }

    perspective.addListener(() => {
        update()
        return null
    })

    perspective.removeListener(() => {
        update()
        return null
    })

    update()

</script>

{#each existingZomes as zome}
<Card variant="outlined">
    <Content>
        <code class="zome-code">
            {zome.code}
        </code>
    </Content>
    <Actions>
        <ActionButtons>
            <Button variant="outlined" on:click={()=>deleteZome(zome)}>
                <ButtonIcon class="material-icons">delete</ButtonIcon>
                <Label>Delete</Label>
            </Button>
        </ActionButtons>
    </Actions>
</Card>


{/each}


<Textarea
    class="shaped-outlined"
    bind:value={editorInput}
    variant="outlined"
></Textarea>

<Button on:click={add}>
    <Label>Add</Label>
</Button>