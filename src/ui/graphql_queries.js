import { gql } from '@apollo/client'

export const LANGUAGES = gql `
    query languages($filter: String = ""){
        languages(filter: $filter) {
            name
            address
        }
    }
`

export const LANGUAGES_WITH_SETTINGS = gql `
    query languagesWithSettings($filter: String = ""){
        languages(filter: $filter) {
            name
            address
            settings
            settingsIcon {
                code
            }
        }
    }
`

export const SET_LANGUAGE_SETTINGS = gql`
    mutation setLanguageSettings($languageAddress: String, $settings: String) {
        setLanguageSettings(input: { languageAddress: $languageAddress, settings: $settings})
    }
`