const fs = require('fs-extra')
const wget = require('node-wget-js')

const languages = {
    'social-context': {
        bundle: 'https://github.com/juntofoundation/Social-Context/releases/download/0.0.2/bundle.js',
        dna: 'https://github.com/juntofoundation/Social-Context/releases/download/0.0.2/social-context.dna'
    },
    'agent-profiles': {
        dna: 'https://github.com/perspect3vism/profiles/releases/download/0.0.1-alpha/agent-profiles.dna'
    }
}

for(lang in languages) {
    const dir = `./src/languages/${lang}`
    fs.ensureDir(dir + '/build')

    // bundle
    if(languages[lang].bundle) {
        let url = languages[lang].bundle
        let dest = dir + '/build/bundle.js'
        wget({url, dest})
    }
    
    // dna
    if(languages[lang].dna) {
        url = languages[lang].dna
        dest = dir + `/${lang}.dna`
        wget({url, dest})
    }
}