<script> 
    import { selectedOption} from './stateStore.js'
  </script>
    
  {#if $selectedOption}
  <input id='title1' value={$selectedOption.col_a} on:change={ (e)=>{$selectedOption.col_a=e.target.value} }>{/if}
  
  <style>
    
    input{ 
      width: 100%;
      height: 100%;
      padding: 0px 6px;
      background-color: inherit;
      font-family: monospace; /**/
      /*font-weight: bold; /**/
      font-size: 24px;
      overflow-x: auto; 
      resize: none;
  }
  </style>
    