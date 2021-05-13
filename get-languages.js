const fs = require('fs-extra')
const wget = require('node-wget-js')

const languages = {
    'social-context': 'https://github.com/juntofoundation/Social-Context/releases/download/0.0.1/bundle.js'
}

for(lang in languages) {
    const url = languages[lang]
    const dir = `./src/languages/${lang}/build`
    fs.ensureDir(dir)
    const dest = dir + '/bundle.js'
    wget({url, dest})
}