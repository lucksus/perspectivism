<script lang="ts">
    import { getContext } from "svelte";
    import type { Ad4mClient, PerspectiveProxy } from '@perspect3vism/ad4m'
    import { exprRef2String, hashLinkExpression, linkEqual, Link } from '@perspect3vism/ad4m';
    import ExpressionIcon from './ExpressionIcon.svelte';
    import iconComponentFromString from './iconComponentFromString';
    import ConstructionMenu from './ConstructionMenu.svelte'
    import ExpressionContextMenu from "./ExpressionContextMenu.svelte";
    import { linksStoreForPerspective } from "./LinksStore";
    import { Network } from 'vis-network/esnext'
    import VisGraph from "./VisGraph";

    export let perspective: PerspectiveProxy
    export let uuid: string

    const ad4m: Ad4mClient = getContext('ad4mClient')
    const graph = new VisGraph(ad4m)

    if(!perspective && uuid) {
        (async () => {
            perspective = await ad4m.perspective.byUUID(uuid)
        })()
    }

    //@ts-ignore
    ad4m.perspective.addPerspectiveUpdatedListener(async p => {
        //@ts-ignore
        if(p.uuid == perspective.uuid || p.uuid == uuid) {
            //@ts-ignore
            perspective = await ad4m.perspective.byUUID(perspective.uuid)
        }
    })

    let network
    let networkDiv
    
    async function createNetwork(container) {
        await graph.load()
        network = new Network(container, {nodes: graph.nodes, edges: graph.edges}, {
            groups: {
                linkLanguageLink: {color:{background:'#FF3366'}},
                metaLinks: {color:{background:'#33A1FF'}}
            },
            nodes: {
                borderWidth: 1
            },
            edges: {
                color: 'black'
            },
            physics: {
                hierarchicalRepulsion: {
                    nodeDistance: 300,
                    centralGravity: 0.0,
                    springLength: 200,
                    damping: 0.09,
                    avoidOverlap: 1,
                    springConstant: 0.001,
                },
                solver: 'hierarchicalRepulsion'
            },
            layout: {
                hierarchical: {
                    enabled: true,
                    levelSeparation: 350,
                    nodeSpacing: 350,
                    treeSpacing: 350,
                    direction: 'UD',        // UD, DU, LR, RL
                    sortMethod: 'directed'   // hubsize, directed
                }
            }
        })
    }

    $: if(networkDiv) createNetwork(networkDiv)

    let linksStore
    let constructionMenu
    let languages = []
    let languageIcons = {
        'note-ipfs': 'note',
        'url-iframe': 'link'
    }
    let constructorIconComponents = {}
    let iconStates = {}

    let content
    let container
    let zoom = 0
    let translateX = 0
    let translateY = 0
    let isPanning = false
    let isMovingExpression = false
    let movingLink
    let movingLinkOriginal
    let isLinking = false
    let linkingSource
    let linkingCursor = {}
    let dropMove = false
    let dropMoveTarget

    function contextMenu(event) {
        isPanning = false
        isMovingExpression = false
        constructionMenu.open(event.clientX, event.clientY)
    }

    ad4m.languages.byFilter("expressionUI").then( expressionUILanguages => {
        languages = expressionUILanguages
    })


    async function commitExpression(lang, content, container) {
        const exprURL = await ad4m.expression.create(JSON.stringify(content), lang.address)
        console.log("Created new expression:", exprURL)
        ad4m.perspective.addLink(perspective.uuid, new Link({source: 'root', target: exprURL}))
        container.innerHTML = ''
    }

    async function createExpression(lang) {
        console.log("Create expression:", lang, JSON.stringify(lang))
        if(!constructorIconComponents[lang.name]) {
            const language = await ad4m.languages.byAddress(lang.address)
            const code = language.constructorIcon.code
            const ConstructorIcon = iconComponentFromString(code, lang.name)
            constructorIconComponents[lang.name] = ConstructorIcon
            customElements.define(lang.name+"-constructor", ConstructorIcon);
        }

        const container = document.getElementById("constructor-container")

        container.innerHTML = ''
        const constructorIcon = new constructorIconComponents[lang.name]()
        constructorIcon.commitExpression = async (content) => {
            commitExpression(lang, content, container)
        }
        constructorIcon.discard = () => {
            container.innerHTML = ''
        }
        
        container.appendChild(constructorIcon)
    }

    $: if(perspective) {
        linksStore = linksStoreForPerspective(ad4m, perspective)
    }


    let expressionContextMenu

    function onExpressionContextMenu(event) {
        const { expressionURL, mouseEvent, parentLink } = event.detail
        expressionContextMenu.open(mouseEvent.clientX, mouseEvent.clientY, expressionURL, parentLink)
        isPanning = false
        isMovingExpression = false
    }

    function onExpressionSwitchHeaderContent(event) {
        const expression = event.detail
        if(iconStates[expression] != 'rotated') {
            iconStates[expression] = 'rotated'
        } else {
            iconStates[expression] = ''
        }
        isPanning = false
        isMovingExpression = false
    }

    function onDeleteExpression(event) {
        const expression = event.detail
        $linksStore.forEach(l => {
            if(l.data.target === expression) {
                console.log("deleting expression:", l)
                ad4m.perspective.removeLink(perspective.uuid, l)
            }
        })
    }

    function onLinkExpression(event) {
        const link = event.detail
        isLinking = true
        linkingSource = link
    }

    function noop(){}

</script>

<div 
    on:mousewheel|stopPropagation={noop} 
    on:touchstart|stopPropagation={noop}
    on:mouseup|stopPropagation={noop}
>

{#if !perspective || !perspective.uuid}
    <h1>Loading...</h1>
{:else}

<div class="network" bind:this={networkDiv}></div>

<ConstructionMenu bind:this={constructionMenu} 
    languages={languages} 
    languageIcons={languageIcons}
    on:language-clicked={({detail: lang}) => createExpression(lang)}
></ConstructionMenu>
<ExpressionContextMenu bind:this={expressionContextMenu}
    on:switch-header-content={onExpressionSwitchHeaderContent}
    on:delete={onDeleteExpression}
    on:link={onLinkExpression}
></ExpressionContextMenu>

{/if}

</div>
<style>
    .network {
        position: absolute;
        top: 30px;
        left: 0;
        right: 0;
        height: 100%;
    }

    .debug {
        position: fixed;
        width: 100%;
        z-index: -10;
    }

    .inline {
        display: inline;
        transform-style: preserve-3d;
    }

    .link-path {
        position: absolute;
        top: 0;
        left: 0;
        transform: translateX(-10000px) translateY(-10000px);
    }

    .drop-move-container {
        transition: transform 0.5s;
    }
</style>