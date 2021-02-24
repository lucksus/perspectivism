# Perspect3ve and AD4M

**WIP and under heavy development**

![Logo](graphics/Perspet3veLogo.png)

This repository contains two parts that will soon get separated:
1. **AD4M** (The *Agent-Centric Application Interface*)
    This is an abstract interface definition that tries to distill the quintessence of agent-centric software architecture such that applications can choose to become interoprable by building components congruent to this interface. It introduces a simple and powerful ontology consisting of three entities
    1. **Agent** (=user/human)
    2. **Language** (=space of expressions / combining storage and UI on an abstract level)
    3. **Perspective** (=what an agent perceives / spaces of links (triplets) between expressions)
    
    See [src/ad4m](src/ad4m) for a more detailed description as well as TypeScript classes and interfaces.

2. **Perspect3ve**
    This is an agent-centric browser and example implementation of AD4M. Its a desktop GUI application that provides means for creating Perspectives and creating and linking expressions inside these Perspectives. It therefore holds a set of Languages in which expressions can be created. Languages have access to a list of storage backe-ends (currently implemented only IPFS, Holochain and others will follow soon).
    Many features, such as Shared Perspectives, are still missing and 
    currently under development.
    
    It includes an [example Language](src/languages/note-ipfs) for simple text notes, implemented on top of IPFS.
    
    TODO: add list of features here.
    
    
## Why?

### Silos.
Not only are centralized databases and servers data-silos - monolothic applications with their own ontologies and special purpose UIs can't just easily interoperate even if built on decentralized storage.

### Competing tech.
Should I build my app on Holochain, Solid, Ethereum, EOS, matrix, IPFS, ThreeFold, Semantic Web, you-name-it? Can I do all of the above, and still use centralized components while stuff is emerging and changing?

### Sensemaking.
[The Internet is broken](https://www.ted.com/talks/tristan_harris_how_a_handful_of_tech_companies_control_billions_of_minds_every_day#t-26228). We need a solution that helps us escape the [war on sensemaking](https://www.youtube.com/watch?v=7LqaotiGWjQ&t=255s) without introducing the next concentration of power or mono-perspectiv 
orthodoxy. We need to be able to communicate complex stuff efficiently and freely between memetic tribes. We need an ecosystem of compatible micro-apps that can share information in a meanigful way.

## Solution

The core intention of AD4M is to **suggest a minimal and quintessential ontology** to help think about software in a way that interoperability and multi-perspectivistic subjectivity is inherently baked-in.

It needs to be minimal in order to get buy-in by enough projects creating a piece of software targeted at social interaction and coordination.

It needs to be quintessential so that every app that currently is build in a centralized and/or monolithic style *can* be implemented on top of AD4M.

### *Why should the triplet of Agent, Language and Perspective be minimal and quintessential?*

It captures the characteristics of the real-world human network in fron of the screen (and [maybe even of reality on a fundamental level](https://www.youtube.com/watch?v=dd6CQCbk2ro)).
1. Software is made and used by human **Agents**. Every relevant bit of data is created by an agent, for other agents to consume. Data without provenance only makes sense if provenance (and validity) is implied.
2. Even with centralized data-centric apps, we treat communcation services like **Languages**: do you speak WhatsApp or Telegram, Facebook or Twitter or Instagram? For the user, it is a means of reaching specific people and being able to express specific and different (messages, posts, pictures) perceptions.
3. Meaning is dependent on context. Context is different for each agent - it is constituted by their **Perspective**, their unique set of associations and differentiations, their learned assumptions and expectations of sameness and difference. A specific Perspective as a curated selection of associations is what constitutes the perception of a Gestalt, and thus its meaning.


## Perspectivism
The core assumption is this:
**We can build any complex application logic by combining implementations of these three ontological root entities**

Since this might be perceived as a big and unreasonable claim, **Perspectivism** is being implemented with the aim to provide a proof by example.

### Code overview

* Electron app with all the UI code (which gets bundled to `public/build/bundle.js`) in [src/ui](src/ui) - based on Svelte.
* Code that runs in the Node main thread resides in [src/core](src/core) - that includes:
    1. LanguageController - loads language bundles and provide access to installed languages
    2. LinkRepoController - build around GunDB / stores links per Perspective
    3. IPFS adapter and GunDB initialization code
    4. TODO: Holochain conductor adapter and other adapters will follow
* [src/services](src/services) contains proxy objects for the controllers and storage services that are used
    from the UI thread and that use Electron IPC to connect to the instances in the main thread

LanguageController can load and store Languages in the form of JavaScript bundles assuming they are CommonJS modules exporting a function that creates an object of type Language as defined in [src/ad4m/Language.ts](src/ad4m/Language.ts).

[src/languages/note-ipfs](src/languages/note-ipfs) contains a full sub-project of a language including UI components.

## Build

Getting from first checkout to running Perspectivism:
```
npm install
npm run build
npm run dev
```

### Note on building of built-in Languages
Currently, Perspectivism comes with one built-in Language `note-ipfs` which implements small text notes stored in IPFS. If you run
```
npm run build
```
in the root directory it will also run `npm run build` inside `src/languages/note-ipfs` which will build the Language bundle.

`npm run dev` or `npm start` will not (re-) build the built-in language(s) but will suffice once they are build.