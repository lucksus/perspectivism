<script lang="ts">
    import type Expression from "../acai/Expression"
    import ExpressionRef, { parseExprURL } from "../acai/ExpressionRef";
    import type { LanguageController } from "../main-thread/LanguageController";
    import iconComponentFromString from "./iconComponentFromString";

    export let expressionURL: string
    export let componentConstructor
    export let languageController: LanguageController

    let loading = true
    let failed = false

    let expressionRef: void | ExpressionRef = null
    let expression: void | Expression = null
    let customElementName: void | string = null

    try {
        expressionRef = parseExprURL(expressionURL)
    } catch(e) {
        console.error(e)
    }

    function iconComponentName(languageAddress: string): string {
        const onlyLetters = languageAddress
            .split('')
            .filter(letter => { return /[a-z]|[A-Z]/.test(letter)})
            .join('')
        const short = onlyLetters.substr(onlyLetters.length-5, 5)

        console.debug(languageAddress, '->', onlyLetters, '->', short)
        return 'icon-'+short
    }

    async function loadExpression() {
        loading = true
        console.debug("ExpressionIcon loading expression with ref:", JSON.stringify(expressionRef))
        expression = await languageController.getExpression(expressionRef)
        if(!expression) {
            failed = true
        } else {
            console.debug("ExpressionIcon got expression:", JSON.stringify(expression))
        }
        loading = false
    }

    async function getComponentConstructor() {
        componentConstructor = customElements.get(customElementName)
        if(!componentConstructor) {
            try {
                console.debug("ExpressionIcon loading icon with ref:", JSON.stringify(expressionRef))
                const code = await languageController.getIcon(expressionRef)
                componentConstructor = iconComponentFromString(code, "icon")
                customElements.define(customElementName, componentConstructor)
            } catch (e) {
                componentConstructor = customElements.get(customElementName)
            }
        }
    }

    $: if(expressionRef) {
        customElementName = iconComponentName(expressionRef.language.address)
        loadExpression()
    }

    $: if(customElementName) {
        if(!componentConstructor) {
            getComponentConstructor()
        }
    }
    

</script>

{#if loading}
    Loading...
    {JSON.stringify(expressionRef)}
{:else if failed}
    Loading failed!
{/if}

{#if componentConstructor}
    <h3>Icon:</h3>
    <svelte:component this="{componentConstructor}" expression={expression}/>
{/if}