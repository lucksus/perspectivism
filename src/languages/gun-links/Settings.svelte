<svelte:options tag={null}/>

<script lang="ts">
    export let settings: object
    import Switch from '@smui/switch';

    customElements.define("notes-ipfs-mdc-switch", Switch)

    if(!settings) {
        settings = {
            gunDbPeer: '',
            runServer: false,
            port: 9988,
        }
    }

    

</script>

<div class="container" on:click:stopPropagation>
    {#if settings }
        <table>
            <tr>
                <td>Bootstrap Peer:</td>
                <td><input bind:value={settings.gunDbPeer}></td>
            </tr>
            <tr>
                <td>Run server:</td>
                <td><Switch bind:checked={settings.runServer}></Switch></td>
            </tr>
            <tr>
                <td>Listen to port:</td>
                <td>
                    {#if settings.runServer}
                        <input bind:value={settings.port}>
                    {:else}
                        <input disabled bind:value={settings.port}>
                    {/if}
                </td>
            </tr>
        </table>
    {:else}
        Loading...
    {/if}
</div>
