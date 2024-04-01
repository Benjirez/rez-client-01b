<script> 
  import { selectedOption} from './stateStore.js'
</script>
  
{#if $selectedOption}
<textarea id='body1' on:input={ (e)=>{$selectedOption.c=e.target.value} }>{$selectedOption.col_c}</textarea>
{/if} 

<style>
  
  textarea { 
    width: 100%;
    height: 100%;
    padding: 0px 6px;
    background-color: #ece5be;
    font-family: monospace;
    font-size: 20px;
    overflow-x: auto; 
    resize: none;
}
</style>
  