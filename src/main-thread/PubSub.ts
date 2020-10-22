import { PubSub } from 'apollo-server'
export const LINK_ADDED_TOPIC = 'link-added-topic'
export const LINK_REMOVED_TOPIC = 'link-removed-topic'

const pubsub = new PubSub()

export function get() {
    return pubsub
}