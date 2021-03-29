import { gql } from '@apollo/client'

export const OPEN_LINK = gql `
    mutation openLinkExtern($url: String) {
        openLinkExtern(url: $url)
    }
`

export const QUIT = gql `
    mutation quit {
        quit
    }
`

export const AGENT_SERVICE_STATUS = gql `
    query agent {
        agent {
            isInitialized
            isUnlocked
            did
            didDocument
        }
    }
`

export const AGENT = gql `
    query agent {
        agent {
            agent {
                did
                name
                email
            }
        }
    }
`

export const INITIALIZE_AGENT = gql `
    mutation initializeAgent($did: String, $didDocument: String, $keystore: String, $passphrase: String) {
        initializeAgent(input: { did: $did, didDocument: $didDocument, keystore: $keystore, passphrase: $passphrase }) {
            isInitialized
            isUnlocked
            did
            didDocument
        }
    }
`

export const LOCK_AGENT = gql `
    mutation lockAgent($passphrase: String) {
        lockAgent(passphrase: $passphrase) {
            isInitialized
            isUnlocked
            did
        }
    }
`

export const UNLOCK_AGENT = gql `
    mutation unlockAgent($passphrase: String) {
        unlockAgent(passphrase: $passphrase) {
            isInitialized
            isUnlocked
            did
            error
        }
    }
`

export const UPDATE_AGENT_PROFILE = gql `
    mutation updateAgentProfile($name: String, $email: String) {
        updateAgentProfile(input: {name: $name, email: $email}) {
            agent {
                did
                name
                email
            }
            isInitialized
            isUnlocked
            did
            error
        }
    }
`

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
        }
    }
`

export const PERSPECTIVE = gql`
    query perspective($uuid: String) {
        perspective(uuid: $uuid) {
            uuid
            name
            sharedURL
            sharedPerspective {
                name
                description
                type 
            }
        }
    }
`

export const ADD_PERSPECTIVE = gql`
    mutation updatePerspective($name: String) {
        addPerspective(input: {name: $name}) {
            uuid
            name
            sharedURL
            sharedPerspective {
                name
                description
                type 
            }
        }
    }
`

export const UPDATE_PERSPECTIVE = gql`
    mutation updatePerspective($uuid: String, $name: String, $linksSharingLanguage: String) {
        updatePerspective(input: {uuid: $uuid, name: $name, linksSharingLanguage: $linksSharingLanguage}) {
            uuid
            name
            sharedURL
            sharedPerspective {
                name
                description
                type
            }
        }
    }
`

export const PUBLISH_PERSPECTIVE = gql`
    mutation publishPerspective($uuid: String, $name: String, $description: String, $type: String, $hcDnaSeed: String) {
        publishPerspective(input: {uuid: $uuid, name: $name, description: $description, type: $type, hcDnaSeed: $hcDnaSeed}) {
            uuid
            name
            sharedURL
            sharedPerspective {
                name
                description
                type 
            }
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
            sharedURL
            sharedPerspective {
                name
                description
                type 
            }
		}
	}  
`

export const PERSPECTIVE_UPDATED = gql`
    subscription {
		perspectiveUpdated {
			uuid
            name
            sharedURL
            sharedPerspective {
                name
                description
                type                
            }
		}
	}  
`

export const PERSPECTIVE_REMOVED = gql`
    subscription {
		perspectiveRemoved
	}  
`

export const ALL_LINKS_QUERY = gql`
    query links($perspectiveUUID: String) {
        links(perspectiveUUID: $perspectiveUUID, query: { }) {
            author { did }
            timestamp
            data {
                source
                predicate
                target
            }
        }
    }
`

export const CHILD_LINKS_QUERY = gql`
    query links($perspectiveUUID: String, $source: String) {
        links(perspectiveUUID: $perspectiveUUID, query: { source: $source }) {
            author { did }
            timestamp
            data {
                source
                predicate
                target
            }
        }
    }
`