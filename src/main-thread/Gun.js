const Gun = require("gun")
require('gun/lib/load.js')
require('gun/lib/then.js')

export function init(dbFilePath) {
    return Gun({ 
        file: dbFilePath,
        localStorage: false,
     })
} 
