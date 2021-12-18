<script lang="ts">
    import { getContext } from "svelte";
    import { Ad4mClient, parseExprUrl, PerspectiveProxy } from '@perspect3vism/ad4m'
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
    

    if(!perspective && uuid) {
        (async () => {
            perspective = await ad4m.perspective.byUUID(uuid)
        })()
    }

    if(!uuid && perspective) {
        uuid = perspective.uuid
    }

    //@ts-ignore
    ad4m.perspective.addPerspectiveUpdatedListener(async p => {
        //@ts-ignore
        if(p.uuid == perspective.uuid || p.uuid == uuid) {
            //@ts-ignore
            perspective = await ad4m.perspective.byUUID(perspective.uuid)
        }
    })

    async function update() {
        await graph.load()
        network.setData({nodes: graph.nodes, edges: graph.edges})
        getNodePositions()
    }

    ad4m.perspective.addPerspectiveLinkAddedListener(uuid, () => {
        update()
        return null
    })

    ad4m.perspective.addPerspectiveLinkRemovedListener(uuid, () => {
        update()
        return null
    })

    let network
    let networkDiv
    let nodePositions
    let graph
    let scale = 1

    $: if(perspective && networkDiv) {
        init()
    }

    async function init() {
        await graphFromPerspective(perspective)
        await createNetwork(networkDiv)
    }

    async function graphFromPerspective(p) {
        graph = new VisGraph(p)
        await graph.load()
    }

    async function createNetwork(container) {
        network = new Network(container, {nodes: graph.nodes, edges: graph.edges}, {
            groups: {
                linkLanguageLink: {color:{background:'#FF3366'}},
                metaLinks: {color:{background:'#33A1FF'}}
            },
            nodes: {
                borderWidth: 1,
                shape: 'box',
                color: 'teal'
            },
            edges: {
                color: 'black',
                arrows: {
                    to: {
                        enabled: true,
                    }
                },
                arrowStrikethrough: false,
            },
            physics: {
                barnesHut: {
                    springLength: 400,
                    gravitationalConstant: -10000,
                }
            },
        })

        for(let event of ['dragging', 'stabilizationProgress', 'stabilized', 'resize', 'afterDrawing']) {
            network.on(event, () => {
                getNodePositions()
            })
        }

        network.on('zoom', (params) => {
            scale = params.scale
            getNodePositions()
        })

        network.on('oncontext', params => {
            if(params.nodes.length > 0) {
                let url = params.nodes[0]
                let pos = params.pointer.DOM
                expressionContextMenu.open(pos.x, pos.y, url)
            }
        })

        getNodePositions()
    }

    function getNodePositions() {
        nodePositions = []
        for(let node of graph.nodes) {
            console.log(node)
            nodePositions.push( {
                url: node.label,
                pos: network.canvasToDOM(network.getPosition(node.id)),
            })
        }
    }

    

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
            if(l.data.target === expression || l.data.source === expression) {
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

    function shouldRenderExpressionIcon(url: string) {
        const isLiteral = url.startsWith('literal://')

        let isValidUrl
        try {
            const ref = parseExprUrl(url)
            isValidUrl = true
        } catch(e) {
            isValidUrl = false
        }

        return isValidUrl && !isLiteral
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

<div class="network-wrapper">
    {#if nodePositions}
        <div class="expression-icons">
            {#each nodePositions as node}
                {#if shouldRenderExpressionIcon(node.url)}
                    <div class="expression-icon-wrapper" style={
                        `top: ${node.pos.y+(30*scale)}px; 
                        left: ${node.pos.x}px;
                        transform: scale(${scale*0.8});
                        `}>
                        <ExpressionIcon 
                            expressionURL={node.url} 
                            perspectiveUUID={perspective.uuid}
                            on:context-menu={onExpressionContextMenu} 
                            rotated={iconStates[node.url] === 'rotated'}
                        />
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
    <div class="network" bind:this={networkDiv}>
    </div>
</div>


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
    .network-wrapper {
        position: absolute;
        top: 30px;
        left: 0;
        right: 0;
        height: 100%;
    }

    .network {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100%;
    }

    .expression-icons {
        perspective: 1000px;
        transform-style: preserve-3d;
    }

    .expression-icon-wrapper {
        position: absolute;
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