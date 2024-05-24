<script>
  import { myData, selectedOption, API_URI, collPick} from './stateStore.js'

  async function saveMe() {

   await fetch( ($API_URI +'old'), { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      { col_a: $selectedOption.col_a, 
        col_b: $selectedOption.col_b, 
        col_c: $selectedOption.col_c, 
        col_d: $selectedOption.col_d, 
        col_e: $selectedOption.col_e, 
        col_f: $selectedOption.col_f, 
        col_g: $selectedOption.col_g, 
        col_h: $selectedOption.col_h
      }),
      //mode: 'no-cors' // Add this line
      //credentials: 'include' // Add this line
    })
      
    const res = await fetch( $API_URI + 'old/' + $collPick);
      $myData = await res.json() 
  }    


</script>


<button on:click={saveMe}> save new </button>

<style>
button{
  margin: 0px;
  padding: 2px 8px;
  font-family: monospace;
  font-size:18px;
}
  </style>
