<script lang="ts">
    import type { PerspectiveProxy } from "@perspect3vism/ad4m";
    export let perspective: PerspectiveProxy

    let prompt = `|${perspective.name}>`
    let lines = []
    let input = ''

    //@ts-ignore
    perspective.eval = code => {
        return eval(code)
    }

    function keypress(event) {
        if(event.key == "Enter") {
            event.preventDefault()
            console.log('evaluate:', input)
            let result
            let error
            try {
                //@ts-ignore
                result = perspective.eval(input)
            } catch(e) {
                error = e
            }
            console.log('got', result)
            lines = [...lines, {
                input,
                result,
                error
            }]
            input = ""
        }
    }

    function evalInput() {
        try {
            return eval(input)
        } catch(e) {
            return e
        }
    }
</script>

<div class="perspective-shell-content">
    {#each lines as line}
        <div class="line">
            <div>
                <span class="prompt">{prompt}</span>
                <span class="prompt-input">{line.input}</span>    
            </div>
            {#if line.error}
                <span class="error">{line.error}</span>
            {:else}
                {line.result}
            {/if}
        </div>
    {/each}
    <div class="new-line">
        <span class="prompt">{prompt}</span>
        <input class="prompt-input" bind:value={input} on:keypress={keypress}>
    </div>
</div>

<style>
    .perspective-shell-content {
        color: white;
        background-color: black;
    }

    .prompt-input {
        color: white;
        background-color: black;
        border: none;
        outline: none;
    }

    .error {
        color: red;
    }
</style>