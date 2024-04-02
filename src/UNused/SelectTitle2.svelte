<script> 
 import { myData, selectedOption } from '../stateStore.js'
  
</script>

  {#if $myData}
    <div class="select">
      {#each $myData as data}
        <button value={data} class:selected={$selectedOption === data} on:click={()=>{$selectedOption = data}}>{ data.col_a }</button>
      {/each}
    </div>
  {/if}


<style>

.select { 
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  
  background-color: #d6cba8;
  font-family: monospace;
  font-size: 18px;
 
  overflow: auto;
  scrollbar-color:  #d6cba8 #f0e9d4;
  scrollbar-width:thin; /*  rgb(233, 231, 116) */

}



.select > button {

  padding: 2px 6px;
  margin: 1px 2px;
  border: none;
  text-align: left;
  background-color: #f0e9d4;
}

.select > .selected {

background-color: #d1ccbd;
}

.select > button:active{
  background-color:   #d1ccbd;
}



</style>
