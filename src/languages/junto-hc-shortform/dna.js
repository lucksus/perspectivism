import dna from './shortform.png'

const omit = "data:image/png;base64,".length
const cropped = dna.substring(omit)
export const DNA = Buffer.from(cropped, 'base64')
export const DNA_NICK = "junto-shortform"
