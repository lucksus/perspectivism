import { ApolloServer, gql, withFilter } from 'apollo-server'
import { exprRef2String, parseExprURL } from '../acai/ExpressionRef'
import type Perspective from '../acai/Perspective'
import * as PubSub from './PubSub'

const typeDefs = gql`
type Agent {
    did: String
}

type Icon {
    code: String
}

type Expression {
    url: String

    author: Agent
    timestamp: String
    data: String

    icon: Icon
    language: Language
}

type Link {
    source: String
    predicate: String
    target: String
}

type LinkExpression {
    author: Agent
    timestamp: String
    data: Link
}
input LinkQuery {
    source: String
    predicate: String
    target: String
}

type Language {
    name: String
    address: String
    constructorIcon: Icon
    settings: String
    settingsIcon: Icon
}

type Perspective {
    uuid: String
    name: String
    linksSharingLanguage: String
    links(query: LinkQuery): [LinkExpression]
}

type Query {
    hello: String
    links(perspectiveUUID: String, query: LinkQuery): [LinkExpression]
    expression(url: String): Expression
    language(address: String): Language
    languages(filter: String): [Language]
    perspectives: [Perspective]
    perspective(uuid: String): Perspective
}


input AddLinkInput {
    perspectiveUUID: String
    link: String
}

input UpdateLinkInput {
    perspectiveUUID: String
    oldLink: String
    newLink: String
}

input RemoveLinkInput {
    perspectiveUUID: String
    link: String
}

input CreateExpressionInput {
    languageAddress: String
    content: String
}

input SetLanguageSettingsInput {
    languageAddress: String
    settings: String
}

input AddPerspectiveInput {
    name: String
}

input UpdatePerspectiveInput {
    uuid: String
    name: String
    linksSharingLanguage: String
}

type Mutation {
    addPerspective(input: AddPerspectiveInput): Perspective
    updatePerspective(input: UpdatePerspectiveInput): Perspective
    removePerspective(uuid: String): Boolean
    addLink(input: AddLinkInput): LinkExpression
    updateLink(input: UpdateLinkInput): LinkExpression
    removeLink(input: RemoveLinkInput): Boolean
    createExpression(input: CreateExpressionInput): String
    setLanguageSettings(input: SetLanguageSettingsInput): Boolean
}

type Subscription {
    perspectiveAdded: Perspective
    perspectiveUpdated: Perspective
    perspectiveRemoved: String
    linkAdded(perspectiveUUID: String): LinkExpression
    linkRemoved(perspectiveUUID: String): LinkExpression
}
`


function createResolvers(perspectivesController, languageController, linkRepoController) {
    const pubsub = PubSub.get()

    return {
        Query: {
            hello: () => 'Hello world!',
            perspective: (parent, args, context, info) => {
                const { uuid } = args
                return perspectivesController.get()[uuid]
            },
            perspectives: (parent, args, context, info) => {
                const ps = Object.values(perspectivesController.get())
                console.debug("PERSPECTIVES:", ps)
                return ps
            },
            links: async (parent, args, context, info) => {
                console.log("GQL| links:", args)
                const { perspectiveUUID, query } = args
                const perspective = { uuid: perspectiveUUID } as Perspective
                const result = await linkRepoController.getLinks(perspective, query)
                return result
            },
            expression: async (parent, args, context, info) => {
                const ref = parseExprURL(args.url.toString())
                const expression = await languageController.getExpression(ref)
                expression.ref = ref
                expression.url = args.url.toString()
                console.log("Query.expression:", expression)
                return expression
            },
            language: (parent, args, context, info) => {
                const { address } = args
                const lang = languageController.languageByRef({address})
                lang.address = address
                return lang
            },
            languages: (parent, args, context, info) => {
                let filter
                if(args.filter && args.filter !== '') filter = args.filter
                return languageController.filteredLanguageRefs(filter)
            }
        },
        Mutation: {
            addLink: (parent, args, context, info) => {
                console.log("GQL| addLink:", args)
                const { perspectiveUUID, link } = args.input
                const perspective = { uuid: perspectiveUUID } as Perspective
                const parsedLink = JSON.parse(link)
                return linkRepoController.addLink(perspective, parsedLink)
            },
            updateLink: (parent, args, context, info) => {
                console.log("GQL| updateLink:", args)
                const { perspectiveUUID, oldLink, newLink } = args.input
                const perspective = { uuid: perspectiveUUID } as Perspective
                const parsedOldLink = JSON.parse(oldLink)
                const parsedNewLink = JSON.parse(newLink)
                linkRepoController.updateLink(perspective, parsedOldLink, parsedNewLink)
                return newLink
            },
            removeLink: (parent, args, context, info) => {
                console.log("GQL| removeLink:", args)
                const { perspectiveUUID, link } = args.input
                const perspective = { uuid: perspectiveUUID } as Perspective
                const parsedLink = JSON.parse(link)
                linkRepoController.removeLink(perspective, parsedLink)
                return true
            },
            createExpression: async (parent, args, context, info) => {
                const { languageAddress, content } = args.input
                const langref = { address: languageAddress }
                const expref = await languageController.createPublicExpression(langref, content)
                return exprRef2String(expref)
            },
            setLanguageSettings: (parent, args, context, info) => {
                console.log("GQL| settings", args)
                const { languageAddress, settings } = args.input
                const langref = { name: '', address: languageAddress }
                const lang = languageController.languageByRef(langref)
                langref.name = lang.name
                languageController.putSettings(langref, JSON.parse(settings))
                return true
            },
            addPerspective: (parent, args, context, info) => {
                return perspectivesController.add(args.input)
            },
            updatePerspective: (parent, args, context, info) => {
                const perspective = args.input
                perspectivesController.update(perspective)
                return perspective
            },
            removePerspective: (parent, args, context, info) => {
                const { uuid } = args
                perspectivesController.remove(uuid)
                return true
            }
        },

        Subscription: {
            perspectiveAdded: {
                subscribe: () => pubsub.asyncIterator(PubSub.PERSPECTIVE_ADDED_TOPIC),
                resolve: payload => payload.perspective
            },
            perspectiveUpdated: {
                subscribe: () => pubsub.asyncIterator(PubSub.PERSPECTIVE_UPDATED_TOPIC),
                resolve: payload => payload.perspective
            },
            perspectiveRemoved: {
                subscribe: () => pubsub.asyncIterator(PubSub.PERSPECTIVE_REMOVED_TOPIC),
                resolve: payload => payload.uuid
            },
            linkAdded: {
                subscribe: (parent, args, context, info) => {
                    return withFilter(
                        () => pubsub.asyncIterator(PubSub.LINK_ADDED_TOPIC),
                        (payload, argsInner) => payload.perspective.uuid === argsInner.perspectiveUUID
                    )(undefined, args)
                },
                resolve: payload => payload.link
            },
            linkRemoved: {
                subscribe: (parent, args, context, info) => withFilter(
                    () => pubsub.asyncIterator(PubSub.LINK_REMOVED_TOPIC),
                    (payload, variables) => payload.perspective.uuid === variables.perspectiveUUID
                )(undefined, args),
                resolve: payload => payload.link
            }
        },

        Expression: {
            language: async (expression) => {
                console.log("GQL EXPRESSION", expression)
                const lang = await languageController.languageForExpression(expression.ref)
                lang.address = expression.ref.language.address
                return lang
            },

            icon: (expression) => {
                return { code: languageController.getIcon(expression.ref.language) }
            }
        },

        Language: {
            constructorIcon: (language) => {
                return { code: languageController.getConstructorIcon(language) }
            },
            settings: (language) => {
                return JSON.stringify(languageController.getSettings(language))
            },
            settingsIcon: (language) => {
                const code =  languageController.getSettingsIcon(language)
                if(code)
                    return { code }
                else
                    return null
            }
        }
    }
}


export async function startServer(perspectivesController, languageController, linkRepoController) {
    const resolvers = createResolvers(perspectivesController, languageController, linkRepoController)
    const server = new ApolloServer({ typeDefs, resolvers });
    const { url, subscriptionsUrl } = await server.listen()
    return { url, subscriptionsUrl }
}