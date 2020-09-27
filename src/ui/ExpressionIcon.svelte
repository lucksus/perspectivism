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
    try {
        expressionRef = parseExprURL(expressionURL)

    } catch(e) {
        console.error(e)
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

    async function loadIcon() {
        console.debug("ExpressionIcon loading icon with ref:", JSON.stringify(expressionRef))
        const code = await languageController.getIcon(expressionRef)
        componentConstructor = iconComponentFromString(code, "icon")
        
    }

    $: if(expressionRef) {
        loadExpression()
        if(!componentConstructor) {
            loadIcon()
        }
    }

    $: if(expression && componentConstructor) {
        const container = document.getElementById("component-container")
        container.innerHTML = ''

        let component
        try{
            component = new componentConstructor()
        } catch(e) {
            console.debug("error creating component:", e)
            customElements.define(`icon-f`, componentConstructor);
            component = new componentConstructor()
        }
        component.expression = expression
        container.appendChild(component)
    }
    

</script>

{#if loading}
    Loading...
    {JSON.stringify(expressionRef)}
{:else if failed}
    Loading failed!
{/if}
<div id="component-container"></div>