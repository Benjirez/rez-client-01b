<script>
import { myData, selectedOption, collPick, API_URI  } from './stateStore.js'

async function deleteMe() {

    await fetch( $API_URI + '/old/' + $selectedOption._id,{ method: 'DELETE' } )
    
    const res = await fetch( $API_URI + '/old/' + $collPick);
      $myData = await res.json() 
      //$selectedOption -= 1;
    }    



</script>

<button on:click={ deleteMe } >deleteMe</button>