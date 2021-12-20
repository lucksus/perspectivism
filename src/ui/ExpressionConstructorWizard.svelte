<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Tab, { Icon, Label } from '@smui/tab';
    import TabBar from '@smui/tab-bar';
    import Textfield, { Textarea } from '@smui/textfield';
    import Button, { Label as ButtonLabel  } from '@smui/button';
    import { Literal } from '@perspect3vism/ad4m';
    import Radio from '@smui/radio';
    import FormField from '@smui/form-field';

    const dispatch = createEventDispatcher()

    let tabs1 = [
        { k: 1, label: 'Literal', icon: 'text_snippet' },
        { k: 2, label: 'Dynamic', icon: 'waves' },
    ]

    let tabs2 = [
        { k: 1, label: 'String', icon: 'text_format' },
        { k: 2, label: 'Number', icon: 'pin' },
        { k: 3, label: 'Object', icon: 'data_object' },
    ]


    let active1 = tabs1[0], active2 = tabs2[0]
    let literalType = 'string'
    let literalInput = ''
    let literalValue = ''
    let literalError

    $: if(literalInput){
        literalValue = updateLiteralValue(literalInput)
    }
    
    $: if(literalType) {
        literalValue = updateLiteralValue(literalInput)
    }

    function updateLiteralValue(input) {
        let value
        literalError = undefined
        try{
            switch(literalType) {
                case 'string': 
                    value = input
                    break
                case 'number': 
                    value = parseFloat(input)
                    if(isNaN(value)) {
                        literalError = "Not a number"
                    }
                    break
                case 'object':
                    value = JSON.parse(input)
                    break
            }
        }catch(e) {
            literalError = e
            return literalValue
        }
        return value
    }

    function createLiteral() {
        let literal = Literal.from(literalValue)
        console.log(literal.toUrl())
        dispatch('expression-created', literal.toUrl())
    }
</script>

<div class="header">
    <TabBar tabs={tabs1} let:tab key={(tab) => tab.k} bind:active1>
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
</div>

<div class="content1">
    {#if active1.label == 'Literal' }
        <div class="header">
            <FormField>
                <Radio bind:group={literalType} value='string'/>
                <Icon class="material-icons">text_format</Icon>
                <span slot="label">String</span>
            </FormField>
            <FormField>
                <Radio bind:group={literalType} value='number'/>
                <Icon class="material-icons">pin</Icon>
                <span slot="label">Number</span>
            </FormField>
            <FormField>
                <Radio bind:group={literalType} value='object'/>
                <Icon class="material-icons">data_object</Icon>
                <span slot="label">Object</span>
            </FormField>
        </div>
        <div class="content2">
            {#if literalType != 'object'}
                <Textfield
                    class="shaped-outlined"
                    bind:value={literalInput}
                    variant="outlined"
                    label="Literal Value"
                ></Textfield>
            {:else}
                <Textarea
                    class="shaped-outlined"
                    bind:value={literalInput}
                    variant="outlined"
                    label="Literal Value"
                ></Textarea>
            {/if}
            {#if literalError}
                <div class="error">{literalError}</div>
            {/if}
            <p></p>
            <Button variant="raised" on:click={createLiteral} disabled={literalError}>
                <ButtonLabel>Ok</ButtonLabel>
            </Button>
        </div>
    {:else}
        <div>s</div>
    {/if}
</div>

