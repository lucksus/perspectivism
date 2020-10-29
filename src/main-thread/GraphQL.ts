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
}

type Query {
    hello: String
    links(perspectiveUUID: String, query: LinkQuery): [LinkExpression]
    expression(url: String): Expression
    language(address: String): Language
    languages(filter: String): [Language]
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

type Mutation {
    addLink(input: AddLinkInput): LinkExpression
    updateLink(input: UpdateLinkInput): LinkExpression
    removeLink(input: RemoveLinkInput): Boolean
    createExpression(input: CreateExpressionInput): String
}

type Subscription {
    linkAdded(perspectiveUUID: String): LinkExpression
    linkRemoved(perspectiveUUID: String): LinkExpression
}
`


function createResolvers(languageController, linkRepoController) {
    const pubsub = PubSub.get()

    return {
        Query: {
            hello: () => 'Hello world!',
            links: async (parent, args, context, info) => {
                console.log("GQL| links:", args)
                const { perspectiveUUID, query } = args
                const perspective = { uuid: perspectiveUUID } as Perspective
                const result = await linkRepoController.getLinks(perspective, query)
                return result
            },
            expression: async (parent, args, context, info) => {
                const ref = parseExprURL(args.url.toString())
                let expression = await languageController.getExpression(ref)
                expression.ref = ref
                expression.url = args.url.toString()
                console.log("Query.expression:", expression)
                return expression
            },
            language: (parent, args, context, info) => {
                const { address } = args
                let lang = languageController.languageByRef({address})
                lang.address = address
                return lang
            },
            languages: (parent, args, context, info) => {
                let filter
                if(args.filter && args.filter != '') filter = args.filter
                return languageController.filteredLanguageRefs(filter)
            }
        },
        Mutation: {
            addLink: (parent, args, context, info) => {
                console.log("GQL| addLink:", args)
                let { perspectiveUUID, link } = args.input
                const perspective = { uuid: perspectiveUUID } as Perspective
                link = JSON.parse(link)
                return linkRepoController.addLink(perspective, link)
            },
            updateLink: (parent, args, context, info) => {
                console.log("GQL| updateLink:", args)
                let { perspectiveUUID, oldLink, newLink } = args.input
                const perspective = { uuid: perspectiveUUID } as Perspective
                oldLink = JSON.parse(oldLink)
                newLink = JSON.parse(newLink)
                linkRepoController.updateLink(perspective, oldLink, newLink)
                return newLink
            },
            removeLink: (parent, args, context, info) => {
                console.log("GQL| removeLink:", args)
                let { perspectiveUUID, link } = args.input
                const perspective = { uuid: perspectiveUUID } as Perspective
                link = JSON.parse(link)
                linkRepoController.removeLink(perspective, link)
                return true
            },
            createExpression: async (parent, args, context, info) => {
                const { languageAddress, content } = args.input
                const langref = { address: languageAddress }
                const expref = await languageController.createPublicExpression(langref, content)
                return exprRef2String(expref)
            }
        },
        
        Subscription: {   
            linkAdded: {
                subscribe: (parent, args, context, info) => {
                    return withFilter(
                        () => pubsub.asyncIterator(PubSub.LINK_ADDED_TOPIC), 
                        (payload, args) => payload.perspective.uuid === args.perspectiveUUID
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
                let lang = await languageController.languageForExpression(expression.ref)
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
            }
        }
    }
}


export async function startServer(languageController, linkRepoController) {
    const resolvers = createResolvers(languageController, linkRepoController)
    const server = new ApolloServer({ typeDefs, resolvers });
    const { url, subscriptionsUrl } = await server.listen()
    return { url, subscriptionsUrl }
}