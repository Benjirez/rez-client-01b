<script> 
  import { myData, collPick, API_URI, selectedOption } from './stateStore.js'
  import { onMount } from 'svelte';
  import { PopupMessage } from './PopupMessage.svelte'; // Import the popup component

  let isLoading = false;

  $selectedOption = {
  col_a: "",
  col_b: "",
  col_c: "",
  col_d: "",
  col_e: "",
  col_f: "",
  col_g: "",
  col_h: ""
  }

  const refreshMe = async () => {
    isLoading = true; // Set isLoading to true before fetching
    const res = await fetch( $API_URI +'old/' + $collPick);
    $myData = await res.json() 
    //console.log ($myData)
    isLoading = false; // Set isLoading to true before fetching
  }

  onMount( refreshMe );

  </script>

  {#if isLoading}
    <PopupMessage>Waiting...</PopupMessage>
  {/if}

<!-- PopupMessage.svelte -->
<style>
  .popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #fff;
    padding: 20px;
    border: 1px solid #ccc;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    z-index: 9999;
  }
</style>

<div class="popup">
  <slot></slot>
</div>
