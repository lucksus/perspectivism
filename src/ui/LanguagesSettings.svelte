<script lang="ts">
    import SvelteTable from "svelte-table";
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';
    import type LanguageRef from "../acai/LanguageRef";
    import type { LanguageController } from "../main-thread/LanguageController";
    import iconComponentFromString from "./iconComponentFromString";

    export let languageController: LanguageController;
    let languages: LanguageRef[] = []
    let settingsIconConstructors = new Map()

    languageController.getInstalledLanguages().then(l => {
        languages = l
        checkLanguagesForSettingsIcon()
    })

    $: if(languages.length > 0) checkLanguagesForSettingsIcon()
    
    function checkLanguagesForSettingsIcon() {
        languages.forEach(async lang => {
            const settingsComponentName = lang.name + '-settings'
            console.debug("CHecking for", settingsComponentName)
            if(!settingsIconConstructors.get(lang)) {
                console.debug("not there yet...")
                const fromRegistry = customElements.get(settingsComponentName)
                if(!fromRegistry) {
                    console.debug("not in registry yet...")
                    const code = await languageController.getSettingsIcon(lang)
                    console.debug("GOT CODE:", code)
                    if(code) {
                        const SettingsIcon = iconComponentFromString(code, settingsComponentName)
                        customElements.define(settingsComponentName, SettingsIcon);
                        settingsIconConstructors.set(lang, SettingsIcon)
                    }
                }
            }  
        })
    }

    let columns = [
        {
            key: 'name',
            title: 'Name',
            value: v => v.name,
            sortable: true,
        },
        {
            key: 'address',
            title: 'address',
            value: v => v.address,
            sortable: true,
        },
        //{
        //    key: 'type',
        //    title: 'Type',
        //    value: v => v.languageType,
        //    sortable: true,
        //}
    ]
    

</script>

<DataTable>
    <Head>
      <Row>
        <Cell>Name</Cell>
        <Cell>Hash</Cell>
        <Cell>Settings</Cell>
      </Row>
    </Head>
    <Body>
      {#each languages as lang}
        <Row>
          <Cell>{lang.name}</Cell>
          <Cell>{lang.address}</Cell>
          <Cell>
              {#if settingsIconConstructors.get(lang)}
                <svelte:component this={settingsIconConstructors.get(lang)}></svelte:component>
              {/if}
          </Cell>
        </Row>
      {/each}
    </Body>
  </DataTable>