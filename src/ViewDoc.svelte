<script> 
  import { selectedOption } from './stateStore.js'

</script>
  
<!-- <textarea id='body1' on:input={ (e)=>{$selectedOption.col_c=e.target.value} }>{$selectedOption.col_c}</textarea> -->
<textarea id='body1' bind:value={$selectedOption.col_c} ></textarea>

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
  