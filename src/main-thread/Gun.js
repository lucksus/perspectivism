const Gun = require("gun")
require('gun/lib/load.js')
require('gun/lib/then.js')
require('gun/lib/unset.js')

module.exports = {
    init: (dbFilePath) => {
        return Gun({ 
            file: dbFilePath,
            localStorage: false,
        })
    }
} 
