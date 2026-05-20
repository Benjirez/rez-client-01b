<script>
import { myData, collPick,  API_URI, selectedIndex , selectedOption} from './stateStore.js'

let storeNames = ['1', '2', '3', '4', '5', '6'];

const refreshMe = async () => {
    $selectedIndex = 'none'
    const res = await fetch( $API_URI +'old/' + $collPick);
    $myData = await res.json() 
    //console.log ($myData)

  }

  const sortMe = ()=>{
    $myData = $myData.sort((a, b) => {
    const titleA = a.col_a.toUpperCase();
    const titleB = b.col_a.toUpperCase();
    if (titleA < titleB) {
        return -1;
    }
    if (titleA > titleB) {
        return 1;
    }
    return 0;
    });
   
   $selectedIndex = $myData.findIndex(item => item === $selectedOption ); 
  }


  let mySearch = "";
    const searchMe =()=>{
        $myData = $myData.filter(obj => {

          let low1 = obj.col_c.toLowerCase()
          let low2 = obj.col_a.toLowerCase()
          let low3 = low1 + ' ' + low2

    const myKeyValue = ( low3 );
    const searchText = mySearch.toLowerCase();
    return myKeyValue.includes(searchText);
    });
    $selectedIndex = $myData.findIndex(item => item === $selectedOption ); 
  }

</script>

<select on:change={(e) => { $collPick = parseInt(e.target.value); refreshMe() }}>
  {#each storeNames as name, i}
    <option value={i} selected={$collPick === i}>{name}</option>
  {/each}
</select>
&nbsp <button on:click={ sortMe }>A-Z</button>
&nbsp<input type="text" bind:value={ mySearch } on:change={ searchMe } />


<style>
  input{
    background-color: rgb(233, 217, 217);
    height: 80%;
    width: 47%;

  }

  select {
    background-color: rgb(233, 217, 217);
    margin: 0px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 18px;
  }

  button{
    margin: 0px;
    padding: 2px 6px;
    font-family: monospace;
    font-size:18px;
  }
 
  input{
    margin: 0px;

  }

</style>
