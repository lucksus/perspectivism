
export function init(dbFilePath) {
    const Gun = require("gun/gun")
    require('gun-file')
    require('gun/lib/load.js')
    require('gun/lib/then.js')
    const gun = Gun({
        file: dbFilePath ? dbFilePath : './data.json6',
        localStorage: false,
    })

    return gun
} 
