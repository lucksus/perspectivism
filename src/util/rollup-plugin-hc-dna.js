import fs from 'fs';

// Holochain DNA Rollup loader function
// Checks if filename ends with .dna.gz and then loads it as base64 string
export default function dna() {
	return {
	  name: 'dna',
	  load: function load(id) {
		if(!id.endsWith(".dna"))
			return null
		var base64 = fs.readFileSync(id, "base64").replace(/[\r\n]+/gm, '');
		var code = `var dna = "${base64}"; \nexport default dna;` 
		return code.trim();
	  }
	};
  }
