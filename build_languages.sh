#!/bin/bash

for lang in "agent-profiles" "ipfs-links" "note-ipfs"
do
echo "============================"
echo "BUILDING LANGUAGE" $lang
cd src/languages/$lang
npm i && npm run build && echo "SUCCESSFULLY BUILT" $lang || echo "ERROR BUILDING" $lang "!!!"
cd -
echo "============================"
done
exit 0