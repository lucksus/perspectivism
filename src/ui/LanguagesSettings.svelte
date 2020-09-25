<script lang="ts">
    import SvelteTable from "svelte-table";
    import type LanguageRef from "../acai/LanguageRef";
    import type { LanguageController } from "../main-thread/LanguageController";

    export let languageController: LanguageController;
    let languages: LanguageRef[] = []
    languageController.getInstalledLanguages().then(l => languages = l)

    let columns = [
        {
            key: 'name',
            title: 'Name',
            value: v => v.name,
            sortable: true,
        },
        {
            key: 'hash',
            title: 'Hash',
            value: v => v.languageHash,
            sortable: true,
        },
        {
            key: 'type',
            title: 'Type',
            value: v => v.languageType,
            sortable: true,
        }
    ]
    

</script>

<SvelteTable columns="{columns}" rows="{languages}"></SvelteTable>