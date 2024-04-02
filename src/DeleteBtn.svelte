<script>
import { myData, selectedOption, collPick, API_URI, selectedIndex  } from './stateStore.js'



async function deleteMe() {

  if ($selectedIndex > 0){

    let confirmed = confirm(
    `Are you sure you want to DELETE: 
    ${ $selectedOption.col_a }
    `
    );

  if (confirmed ) {
    
    await fetch( $API_URI + '/old/' + $selectedOption._id,{ method: 'DELETE' } )
      
    const res = await fetch( $API_URI + '/old/' + $collPick);
      $myData = await res.json() 

  } else {
    
    return
    
  }
}

      //$selectedOption -= 1;
    }    



</script>

<button on:click={ deleteMe } >delete selected</button>

<style>
button{
  margin: 0px;
  padding: 2px 8px;
  font-family: monospace;
  font-size:18px;
}
</style>