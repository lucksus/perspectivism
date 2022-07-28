<script lang="ts">
    import type { PerspectiveProxy } from '@perspect3vism/ad4m';

    import List, {Item, Text, Graphic} from '@smui/list';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let perspective: PerspectiveProxy

    interface OntologyClass {
        Name: string,
        Action: string,
        Color: string
    }

    let ontologyClasses: OntologyClass[] = []

    //$: if(perspective) {
    //    console.log("PAlette perspecive")
        perspective.infer("register_ontology_class(Name, c), instantiate_class(c, Action), class_color(c, Color)").then(results => {
            ontologyClasses = results
            console.log(ontologyClasses)
        })
    //}
        

</script>

<div class="palette-container">
    <div class="palette-item">
        <span class="material-icons">text_fields</span>
    </div>
    {#each ontologyClasses as customClass}
        <div class="palette-item">
            <span title="{customClass.Name}" class="ontology-class" style={`background-color: ${customClass.Color};`}>
                <span class="ontology-class-text">{customClass.Name}</span>
            </span>
        </div>
    {/each}
</div>

<style>
   .palette-container {
        background-color: bisque;
        width: 50px;
   } 

   .palette-item {
        width: 50px;
        height: 50px;
        padding: 3px;    
   }

   .ontology-class {
        position: relative;
        width: 42px;
        height: 42px;
        display: block;
        border-radius: 25px;
   }

   .ontology-class-text {   
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 10px;
   }
</style>
