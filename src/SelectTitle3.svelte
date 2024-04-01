<script>
    import { myData, selectedOption, selectedIndex } from './stateStore.js';
  
    let focused = false;
    
    const handleKeyDown = (event) => {
      if (!focused) return;
  
      const currentIndex = $selectedIndex;
      const maxIndex = $myData.length - 1;
  
      if (event.key === 'ArrowUp') {
        $selectedIndex = currentIndex === 0 ? maxIndex : currentIndex - 1;
        $selectedOption = $myData[$selectedIndex];
      } else if (event.key === 'ArrowDown') {
        $selectedIndex = currentIndex === maxIndex ? 0 : currentIndex + 1;
        $selectedOption = $myData[$selectedIndex];
      }
    };
  </script>
  
  <svelte:window on:keydown={handleKeyDown} />
  
  <div class="container" > 
    {#each $myData as option, index}
      <button
        class:selected={$selectedIndex === index}
        on:click={() => {
          $selectedOption = option;
          $selectedIndex = index;
        }}
        on:focus={() => (focused = true)}
        on:blur={() => (focused = false)}
      >{option.col_a}{#if option.col_a === ""}&nbsp{/if}
      </button>
    {/each}
  </div>
  
  <style>

    .container { 
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  
  background-color: #d6cba8;
  font-family: monospace;
  font-size: 18px;
 
  overflow: auto;
  scrollbar-color:  #d6cba8 #f0e9d4;
  scrollbar-width:thin;

}



button {

  padding: 2px 6px;
  margin: 1px 2px;
  border: none;
  text-align: left;
  background-color: #f0e9d4;
}

.selected {

background-color:  #d1ccbd;
}

button:active{
  background-color:   #d1ccbd;
}

  
  </style>
