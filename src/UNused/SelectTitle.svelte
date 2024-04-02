<script> 
 import { myData, selectedOption } from '../stateStore.js'
  
</script>

  {#if $myData}
    <select  multiple="multiple" bind:value={$selectedOption}>
      {#each $myData as data}
        <option value={data}>{data.col_a}</option>
      {/each}
    </select>
  {/if}


<style>

select { 
    width: 100%;
    height: 100%;

    background-color: #f7f6f3;
    font-family: monospace;
    font-size: 20px;
  
    overflow-x: auto; 
}

</style>
