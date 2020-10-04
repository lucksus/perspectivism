<script lang="ts">
    import SvelteTable from "svelte-table";
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';
    import type LanguageRef from "../acai/LanguageRef";
    import type { LanguageController } from "../main-thread/LanguageController";
    import iconComponentFromString from "./iconComponentFromString";

    export let languageController: LanguageController;
    let languages: LanguageRef[] = []
    let settingsIconConstructors = {}

    languageController.getInstalledLanguages().then(async l => {
        languages = l
        await checkLanguagesForSettingsIcon()
        createCustomSettingsIcons()
    })

    function addSettingsIcon(lang, IconConstructor) {
      settingsIconConstructors[lang.address] = IconConstructor
    }

    async function asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }
    
    async function checkLanguagesForSettingsIcon() {
      await asyncForEach(languages, async lang => {
            const settingsComponentName = lang.name + '-settings'
            console.debug("CHecking for", settingsComponentName)
            if(!settingsIconConstructors[lang.address]) {
                console.debug("not there yet...")
                const fromRegistry = customElements.get(settingsComponentName)
                if(!fromRegistry) {
                    console.debug("not in registry yet...")
                    const code = await languageController.getSettingsIcon(lang)
                    console.debug("GOT CODE:", code)
                    if(code) {
                        const SettingsIcon = iconComponentFromString(code, settingsComponentName)
                        customElements.define(settingsComponentName, SettingsIcon);
                        addSettingsIcon(lang, SettingsIcon)
                    }
                }
            }  
        })
    }

    function createCustomSettingsIcons() {
      for(const lang in settingsIconConstructors) {
        let icon = new settingsIconConstructors[lang]()
        document.getElementById(langToSettingsContainer(lang)).appendChild(icon)
        icon.updateSettings = updateSettings(lang)
      }
    }

    function langToSettingsContainer(lang) {
      let address
      if(lang.address) {
        address = lang.address
      } else {
        address = lang
      }
      return `${address}-settings-icon`
    }

    function updateSettings(lang) {
      return (newSettings) => {
        console.log("Settings settings for lang", lang, newSettings)
      }
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
              <div id={langToSettingsContainer(lang)}></div>
          </Cell>
        </Row>
      {/each}
    </Body>
  </DataTable>