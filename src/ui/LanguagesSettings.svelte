<script lang="ts">
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';
    import Button from '@smui/button'
    import type LanguageRef from "../acai/LanguageRef";
    import type { LanguageController } from "../main-thread/LanguageController";
    import iconComponentFromString from "./iconComponentFromString";
    import { LANGUAGES_WITH_SETTINGS, SET_LANGUAGE_SETTINGS } from "./graphql_queries"
    import { getClient, mutation } from "svelte-apollo"

    let languages: LanguageRef[] = []
    let settingsIconConstructors = new Map()
    let settingsIcons = {}

    getClient().query({query: LANGUAGES_WITH_SETTINGS}).then(async result => {
        languages = result.data.languages
        await checkLanguagesForSettingsIcon()
        createCustomSettingsIcons()
    })

    async function asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }
    
    async function checkLanguagesForSettingsIcon() {
      await asyncForEach(languages, async lang => {
        const settingsComponentName = lang.name + '-settings'
        console.debug("CHecking for", settingsComponentName)
        const code = lang.settingsIcon?.code
        if(!code) {
          return
        }
        if(!settingsIconConstructors.get(lang)) {
          console.debug("not there yet...")
          let SettingsIcon = customElements.get(settingsComponentName)
          if(!SettingsIcon) {
              console.debug("not in registry yet...")
              SettingsIcon = iconComponentFromString(code, settingsComponentName)
              customElements.define(settingsComponentName, SettingsIcon);
          } 
          settingsIconConstructors.set(lang, SettingsIcon)
        }  
      })
    }

    async function createCustomSettingsIcons() {
      for(const item of settingsIconConstructors) {
        const lang = item[0]
        const iconConstructor = item[1]
        const icon = new iconConstructor()
        console.log("lang", lang)
        console.log("icon", icon)
        document.getElementById(langToSettingsContainer(lang)).appendChild(icon)
        settingsIcons[lang.address] = icon
        icon.settings = JSON.parse(lang.settings)
      }
    }

    function langToSettingsContainer(lang) {
      const address = lang.address ? lang.address : lang
      return `${address}-settings-icon`
    }

    function updateSettings(lang) {
      mutation(SET_LANGUAGE_SETTINGS)({variables: {
        languageAddress: lang.address,
        settings: JSON.stringify(settingsIcons[lang.address].settings)
      }})
    }
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
              {#if settingsIcons[lang.address]}
                <Button on:click={()=>updateSettings(lang)}>Update</Button>
              {/if}
          </Cell>
        </Row>
      {/each}
    </Body>
  </DataTable>