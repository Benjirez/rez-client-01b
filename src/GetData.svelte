<script> 
  import { myData, collPick, API_URI } from './stateStore.js'
  import { onMount } from 'svelte';


  const refreshMe = async () => {
    const res = await fetch( $API_URI +'/old/' + $collPick);
    $myData = await res.json() 
    console.log ($myData)
  }

  onMount( refreshMe );

  </script>
