<svelte:options tag={null}/>

<script lang="ts">
    import '@simonwep/pickr/dist/themes/nano.min.css';      // 'nano' theme
    import Pickr from '@simonwep/pickr';
    import { onMount } from 'svelte';

    let picker
    let container
    export let color = '#9C27B0E6';

    onMount(() => {
        const pickr = Pickr.create({
            el: picker,
            theme: 'nano', // or 'monolith', or 'nano'
            container: container,

            swatches: [
                'rgba(244, 67, 54, 1)',
                'rgba(233, 30, 99, 0.95)',
                'rgba(156, 39, 176, 0.9)',
                'rgba(103, 58, 183, 0.85)',
                'rgba(63, 81, 181, 0.8)',
                'rgba(33, 150, 243, 0.75)',
                'rgba(3, 169, 244, 0.7)',
                'rgba(0, 188, 212, 0.7)',
                'rgba(0, 150, 136, 0.75)',
                'rgba(76, 175, 80, 0.8)',
                'rgba(139, 195, 74, 0.85)',
                'rgba(205, 220, 57, 0.9)',
                'rgba(255, 235, 59, 0.95)',
                'rgba(255, 193, 7, 1)'
            ],

            components: {

                // Main components
                preview: true,
                opacity: true,
                hue: true,

                // Input / output Options
                interaction: {
                    hex: true,
                    input: true,
                    clear: true,
                    save: true
                }
            }
        });

        pickr.on('save', (color, instance) => {
            console.log('Event: "save"', color, instance);
            color = color.toHEXA().toString();
            console.log("Color is now", color);
        });
    });
    export let commitExpression

    let expData = {
        body: "",
        background: []
    };

</script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/themes/nano.min.css"/> <!-- 'nano' theme -->

<div class="container" id="exp_container" bind:this={container} style="--theme-color: {color}">
    <div><input bind:value={expData.body}></div>
    <div bind:this={picker}></div>
    <div>
    <button on:click={()=>commitExpression(expData)}>Commit</button>
    </div>
</div>


<style>
    .container {
        background-color: var(--theme-color);
        width: 60%;
        height: 300px;
        display: flex;
        flex-direction: row;
    }

    input {
        width: 50%;
        height: 20%;
    }
</style>