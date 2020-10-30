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

export const PERSPECTIVES = gql`
    query perspectives {
        perspectives {
            uuid
            name
            linkSharingLanguage
        }
    }
`

export const PERSPECTIVE = gql`
    query perspective($uuid: String) {
        perspective(uuid: $uuid) {
            uuid
            name
            linkSharingLanguage
        }
    }
`

export const ADD_PERSPECTIVE = gql`
    mutation updatePerspective($name: String) {
        addPerspective(input: {name: $name}) {
            uuid
            name
            linkSharingLanguage
        }
    }
`

export const UPDATE_PERSPECTIVE = gql`
    mutation updatePerspective($uuid: String, $name: String, $linkSharingLanguage: String) {
        updatePerspective(input: {uuid: $uuid, name: $name, linkSharingLanguage: $linkSharingLanguage}) {
            uuid
            name
            linkSharingLanguage
        }
    }
`

export const REMOVE_PERSPECTIVE = gql`
    mutation removePerspective($uuid: String) {
        removePerspective(uuid: $uuid)
    }
`

export const PERSPECTIVE_ADDED = gql`
    subscription {
		perspectiveAdded {
			uuid
            name
            linkSharingLanguage
		}
	}  
`

export const PERSPECTIVE_UPDATED = gql`
    subscription {
		perspectiveUpdated {
			uuid
            name
            linkSharingLanguage
		}
	}  
`

export const PERSPECTIVE_REMOVED = gql`
    subscription {
		perspectiveRemoved
	}  
`