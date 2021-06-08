# Perspect3ve - The general purpose AD4M UI and browser

**WIP and under heavy development**

![Logo](graphics/Perspect3veLogo.png)

This is an agent-centric browser and example usage of AD4M. Its a desktop GUI application that provides means for creating Perspectives and creating and linking expressions inside these Perspectives. It therefore holds a set of Languages in which expressions can be created. Languages have access to a list of storage backe-ends (currently implemented are only IPFS and Holochain - more will follow soon).
Many features are still missing and currently under development.

TODO: add list of features here.




## Contents
* [AD4M Languages](src/languages)
* [Svelte based UI](src/ui)

This project was the birthing place of all things Perspect3vism and thus the first AD4M implementation. In order to reuse the same AD4M run-time code in other projects, the code that is running in the Electron/Node thread (i.e. the local back-end) got extracted into other repositories under the [Perspect3vism GitHub org](https://github.com/perspect3vism) - particularly the [AD4M executor](https://github.com/perspect3vism/ad4m-executor) which gets pulled in as NPM package [@perspect3vism/ad4m-executor](https://www.npmjs.com/package/@perspect3vism/ad4m-executor) and spawned in [main.js](main.js).

## Build

Since some of the AD4M Languages use Holochain and include a Holochain DNA, building those needs a [Holochain dev environment](https://developer.holochain.org/install/). The supported way of getting that is through `nix-shell`. (See https://developer.holochain.org/install/ for how to install Nix)

### 0. Holochain binaries / dependencies through nix-shell
All the Holochain dependencies are handled through Nix, as configured in [default.nix](default.nix). 
Several sub-commands run with `npm run build` use `nix-shell`.
Entering the nix-shell will take a while on first run - subsequent runs will be instantanious.

### 1. Installing dependencies and actual building
```
npm install
npm run build
```

This will build all AD4M Languages as well as the UI.
It will also create symbolic links from the repositories root directory to the Holochain binaries in the Nix store.

`npm run build` runs these sub-commands in order:
* `build-ui` (running TSC and Rollup over UI code)
* `get-languages` (download some pre-built AD4M Languages)
* `build-languages` (build AD4M Languages in this repo - runs `nix-shell`)
* `create-symlinks` (create symbolic links for Holochain binaries - runs `nix-shell`)

### 2. Run
```
npm start
```
or
```
npm run dev
```