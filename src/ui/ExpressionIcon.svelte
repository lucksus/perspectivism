<script lang="ts">
    import type Expression from "../ad4m/Expression"
    import iconComponentFromString from "./iconComponentFromString";
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    import { query, mutation, getClient } from "svelte-apollo";
    import { gql } from "@apollo/client"
    import { CHILD_LINKS_QUERY } from "./graphql_queries";
    import { linkTo2D, coordToPredicate } from './uiUtils';
    import emailValidator from 'email-validator'
    import md5 from 'md5'
    import {Graphic} from '@smui/list';
    import { DoubleBounce } from 'svelte-loading-spinners'


    export let expressionURL: string
    export let parentLink: Expression
    export let componentConstructor
    export let selected: boolean
    export let perspectiveUUID: string

    let expression = null
    let queryResult = null
    let expressionRef = null
    let iconReady = false
    let childLinks

    
    $: if(expressionURL) queryResult = query(gql`
        { 
            expression(url: "${expressionURL}") {
                author { did, name, email }
                timestamp
                data
                language {
                    address
                }
                proof {
                    valid
                    invalid
                }
            }
        }
    `)

    $: if(expressionURL && perspectiveUUID) {
        childLinks = query(CHILD_LINKS_QUERY, {
            variables: {
                perspectiveUUID,
                source: expressionURL
            }
        })
    }
    

    //let expression: void | Expression = null
    let customElementName: void | string = null

    let container


    function iconComponentName(languageAddress: string): string {
        const onlyLetters = languageAddress
            .split('')
            .filter(letter => { return /[a-z]|[A-Z]/.test(letter)})
            .join('')
        const short = onlyLetters.substr(onlyLetters.length-10, 10).toLowerCase()

        console.debug(languageAddress, '->', onlyLetters, '->', short)
        return 'icon-'+short
    }

    async function getComponentConstructor() {
        componentConstructor = customElements.get(customElementName)
        if(!componentConstructor) {
            try {
                console.debug("ExpressionIcon loading icon for:", expressionURL)
                const { data } = await getClient().query({
                    query: gql`
                    { 
                        expression(url: "${expressionURL}") {
                            icon {
                                code
                            }
                        }
                    }
                    `
                })
                const code = data.expression.icon.code
                componentConstructor = iconComponentFromString(code, "icon")
                customElements.define(customElementName, componentConstructor)
            } catch (e) {
                componentConstructor = customElements.get(customElementName)
            }
        }
    }

    $: if(!$queryResult.loading && $queryResult.data) {
        expression = $queryResult.data.expression
        customElementName = iconComponentName(expression.language.address)
    }

    $: if(customElementName) {
        if(!componentConstructor) {
            getComponentConstructor()
        }
    }
    
    
    $: if(container && componentConstructor && !$queryResult.loading) {
        iconReady = false
        const icon = new componentConstructor()
        const expression = JSON.parse(JSON.stringify($queryResult.data.expression))
        expression.data = JSON.parse(expression.data)
        icon.expression = expression
        while(container.lastChild)
            container.removeChild(container.lastChild)
        container.appendChild(icon)
        iconReady = true
    }

    let width
    let height
    let depth = 30

    $: if(container && iconReady) {
        width = container.offsetWidth
        height = container.offsetHeight
    }

    export let rotated = false

    function rightClick(mouseEvent) {
        mouseEvent.stopPropagation()
        dispatch('context-menu', {expressionURL , mouseEvent, parentLink})
    }


</script>

<div class="box" on:contextmenu={rightClick} style={`transform: rotateY(${rotated?180:0}deg)`}>
<div class="displacement-container" style={`transform: translateX(-${width/2}px);`}>
    {#if $queryResult.loading}
        <DoubleBounce size="60" color="#7f81ff" unit="px" duration="1s"></DoubleBounce>
    {:else if $queryResult.error}
        Loading failed!
        {$queryResult.error}
    {:else}
    <div class="box__face container" class:selected class:invalid="{!expression?.proof?.valid}" bind:this={container}/>
    <div class="box__face back" style={`transform:   rotateY(180deg) translateZ(${depth}px); width: ${width}px; height: ${height}px;`}>
        <div class="backside-content">
            <div>
                <h2 class="header">Author</h2>
                {#if emailValidator.validate(expression?.author?.email) }
                    <img class="avatar" src="http://www.gravatar.com/avatar/{md5(expression?.author?.email)}?s=75" alt="gravatar">
                {/if}
                <span class="property">Name:</span><span class="value">{expression?.author?.name}</span>
                <br>
                <span class="property">Email:</span><span class="value">{expression?.author?.email}</span>
                <br>
                <span class="property">DID:</span> <span class="value">{expression?.author?.did}</span>
            </div>
            <div>
                <h2 class="header">Timestamp</h2> 
                <span class="value">{expression?.timestamp}</span>
            </div>
            <h2 class="header">URL</h2> <span class="value">{expressionURL}</span>
            <div class="signature-verification">
                {#if !expression?.proof}
                    <span class="broken">
                        Signature MISSING
                        <Graphic class="material-icons" aria-hidden="true" style="color: red; margin-right: 0;">rounded_corner</Graphic>
                    </span>
                {:else}
                    {#if expression?.proof?.valid}
                        <span class="verified">
                            Signature verified
                            <Graphic class="material-icons" aria-hidden="true" style="color: green; margin-right: 0;">verified</Graphic>
                        </span>
                    {/if}
                    {#if expression?.proof?.invalid}
                        <span class="broken">
                            Signature BROKEN
                            <Graphic class="material-icons" aria-hidden="true" style="color: red; margin-right: 0;">warning</Graphic>
                        </span>
                    {/if}
                {/if}
            </div>
            <!--{expression?.data}-->
        </div>
    </div>
    <div class="box__face right" style={`transform:  translateX(${width-depth/2}px)  translateZ(-${depth/2}px) rotateY(90deg); width: ${depth}px; height: ${height}px;`}>right</div>
    <div class="box__face left" style={`transform:  translateX(-${depth/2}px) rotateY(-90deg) translateX(-${depth/2}px); width: ${depth}px; height: ${height}px;`}>left</div>
    <!--<div class="box__face top" style={`transform:  rotateX(90deg) translateZ(${height}px); width: ${width}px; height: ${depth}px;`}>top</div>
    <div class="box__face bottom" style={`transform:  rotateX(-90deg) translateZ(${height}px); width: ${width}px; height: ${depth}px;`}>bottom</div>-->
    {/if}
</div>
</div>
<!--
{#if childLinks}
    {JSON.stringify($childLinks)}
{/if}
-->
{#if childLinks && !$childLinks.loading && $childLinks.data?.links}
    <ul class="child-plane">
        {#each $childLinks.data.links as link}
            <li class="inline expression-list-container" 
            style={`position: absolute; transform: translateX(${linkTo2D(link).x}px) translateY(${linkTo2D(link).y}px);`}>
                <svelte:self 
                    expressionURL={link.data.target}
                    parentLink={link}
                    perspectiveUUID={perspectiveUUID}>
                </svelte:self>
            </li>
        {/each}    
    </ul>
    
{/if}

<style>
    .container {
        display: inline-block;
        border: 2px solid;
        overflow: hidden;
    }

    .invalid {
        border: 5px solid red !important;
    }

    .selected {
        border: 10px solid yellow !important;
    }

    .box {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.5s;
    }

    .box__face {
        position: absolute;
        background-color:rgb(27, 32, 32);
        border: 1px solid rgb(127, 129, 255);
    }

    .backside-content {
        overflow: auto;
        color: white;
    }

    .backside-content .header {
        margin-top: 0;
        margin-bottom: 5px;
        color: rgb(127, 129, 255)
    }

    .backside-content .property {
        margin-right: 2px;
        color: rgb(127, 129, 255)
    }

    .backside-content .value {
        color: rgb(127, 219, 255);
        word-break: break-all;
    }

    .displacement-container {
        transform-style: preserve-3d;
    }

    .child-plane {
        transform: translateZ(-2000px);
    }

    .inline {
        display: inline;
        transform-style: preserve-3d;
    }

    .avatar {
        float: left;
        margin-left: 5px;
        margin-right: 5px;
        width: 75px;
        height: 75px;
    }

    .signature-verification {
        position: absolute;
        bottom: 0;
        right: 0;
    }
    .verified {
        color: green;
    }

    .broken {
        color: red;
    }
</style>