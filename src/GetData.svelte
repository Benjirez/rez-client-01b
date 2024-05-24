<script> 
  import { myData, collPick, API_URI, selectedOption } from './stateStore.js'
  import { onMount } from 'svelte';

  $selectedOption = {
  col_a: "",
  col_b: "",
  col_c: "...refreshing data, please wait",
  col_d: "",
  col_e: "",
  col_f: "...refreshing data, please wait",
  col_g: "",
  col_h: ""
  }

  const refreshMe = async () => {
    const res = await fetch( $API_URI +'old/' + $collPick);
    $myData = await res.json() 
    //console.log ($myData)
  }

  onMount( refreshMe );

  </script>
