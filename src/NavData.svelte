<script>
import { myData, collPick,  API_URI, selectedIndex , selectedOption} from './stateStore.js'

const refreshMe = async () => {
    $selectedIndex = 'none'
    const res = await fetch( $API_URI +'/old/' + $collPick);
    $myData = await res.json() 
    console.log ($myData)

  }

  const sortMe = ()=>{
  // Assuming you have an array of objects called 'myCollection'
    $myData = $myData.sort((a, b) => {
    const titleA = a.col_a.toUpperCase(); // Ignore case by converting to uppercase
    const titleB = b.col_a.toUpperCase(); // Ignore case by converting to uppercase

    // Compare the titles alphabetically
    if (titleA < titleB) {
        return -1; // If titleA comes before titleB, return a negative number
    }
    if (titleA > titleB) {
        return 1; // If titleA comes after titleB, return a positive number
    }
    return 0; // If titles are equal, return 0
    });
   
   $selectedIndex = $myData.findIndex(item => item === $selectedOption ); 
   //console.log( newIndex)
  }


  let mySearch = "";
  // Assuming you have an array of objects called 'myCollection'
    const searchMe =()=>{
        $myData = $myData.filter(obj => {
    const myKeyValue = obj.col_c.toLowerCase(); // Convert myKey value to lowercase for case-insensitive matching
    const searchText = mySearch.toLowerCase(); // Convert searchText to lowercase for case-insensitive matching
    return myKeyValue.includes(searchText);
    });
    $selectedIndex = $myData.findIndex(item => item === $selectedOption ); 
  }

</script>

<!-- <input type="text" bind:value={$collPick} on:change={ refreshMe }/> -->
<button class:selected={$collPick === 0} on:click={ ()=>{ $collPick=0; refreshMe() }}>1</button>
<button class:selected={$collPick === 1} on:click={ ()=>{ $collPick=1; refreshMe() }}>2</button>
<button class:selected={$collPick === 2} on:click={ ()=>{ $collPick=2; refreshMe() }}>3</button>
<button class:selected={$collPick === 3} on:click={ ()=>{ $collPick=3; refreshMe() }}>4</button>
<button class:selected={$collPick === 4} on:click={ ()=>{ $collPick=4; refreshMe() }}>5</button>
<button class:selected={$collPick === 5} on:click={ ()=>{ $collPick=5; refreshMe() }}>6</button>
&nbsp <button on:click={ sortMe }>A-Z</button>
&nbsp<input type="text" bind:value={ mySearch } on:change={ searchMe } />

<style>
  input{
    background-color: rgb(233, 217, 217);
    height: 80%;
    width: 47%;

  }

  .selected {
    background-color: rgb(238, 156, 156);
  }

</style>