<script lang="ts">
    import type Expression from "../acai/Expression"
    import iconComponentFromString from "./iconComponentFromString";
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    import { query, mutation, getClient } from "svelte-apollo";
    import { gql } from "@apollo/client"

    export let expressionURL: string
    export let parentLink: Expression
    export let componentConstructor
    export let selected: boolean

    let expression = null
    let queryResult = null
    let expressionRef = null
    let iconReady = false

    
    $: if(expressionURL) queryResult = query(gql`
        { 
            expression(url: "${expressionURL}") {
                author { did }
                timestamp
                data
                language {
                    address
                }
            }
        }
    `)
    

    //let expression: void | Expression = null
    let customElementName: void | string = null

    let container


    function iconComponentName(languageAddress: string): string {
        const onlyLetters = languageAddress
            .split('')
            .filter(letter => { return /[a-z]|[A-Z]/.test(letter)})
            .join('')
        const short = onlyLetters.substr(onlyLetters.length-5, 5)

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

    $: if(!$queryResult.loading) {
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
        icon.expression = $queryResult.data.expression
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
        Loading...
        {JSON.stringify(expressionRef)}
    {:else if $queryResult.error}
        Loading failed!
        {$queryResult.error}
    {:else}
    <div class="box__face container" class:selected bind:this={container}/>
    <div class="box__face back" style={`transform:   rotateY(180deg) translateZ(${depth}px); width: ${width}px; height: ${height}px;`}>
        <div class="backside-content">
            <div>
                <span class="header">Author:</span> <span class="value">{expression?.author?.did}</span>
            </div>
            <div>
                <span class="header">Timestamp:</span> <span class="value">{expression?.timestamp}</span>
            </div>
            <hr>
                <span class="header">URL:</span> <span class="value">{expressionURL}</span>
            <hr>
            {expression?.data}
        </div>
    </div>
    <div class="box__face right" style={`transform:  translateX(${width-depth/2}px)  translateZ(-${depth/2}px) rotateY(90deg); width: ${depth}px; height: ${height}px;`}>right</div>
    <div class="box__face left" style={`transform:  translateX(-${depth/2}px) rotateY(-90deg) translateX(-${depth/2}px); width: ${depth}px; height: ${height}px;`}>left</div>
    <!--<div class="box__face top" style={`transform:  rotateX(90deg) translateZ(${height}px); width: ${width}px; height: ${depth}px;`}>top</div>
    <div class="box__face bottom" style={`transform:  rotateX(-90deg) translateZ(${height}px); width: ${width}px; height: ${depth}px;`}>bottom</div>-->
    {/if}
</div>
</div>

<style>
    .container {
        display: inline-block;
        border: 2px solid;
        overflow: hidden;
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
        color: rgb(127, 129, 255)
    }

    .backside-content .value {
        color: rgb(127, 219, 255);
        word-break: break-all;
    }

    .displacement-container {
        transform-style: preserve-3d;
    }
</style>