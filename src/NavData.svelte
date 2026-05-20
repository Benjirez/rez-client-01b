<script>
import { myData, collPick, API_URI, selectedIndex, selectedOption } from './stateStore.js'
import { onMount } from 'svelte';

let storeNames = [];
let newStoreName = '';

const fetchStoreNames = async () => {
  try {
    const res = await fetch($API_URI + 'store-names');
    if (res.ok) storeNames = await res.json();
    else storeNames = ['1', '2', '3', '4', '5', '6'];
  } catch {
    storeNames = ['1', '2', '3', '4', '5', '6'];
  }
}

const addStore = async () => {
  if (!newStoreName.trim()) return;
  await fetch($API_URI + 'store-names', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newStoreName.trim() })
  });
  newStoreName = '';
  await fetchStoreNames();
}

const refreshMe = async () => {
  $selectedIndex = 'none'
  const res = await fetch($API_URI + 'old/' + $collPick);
  $myData = await res.json()
}

const sortMe = () => {
  $myData = $myData.sort((a, b) => {
    const titleA = a.col_a.toUpperCase();
    const titleB = b.col_a.toUpperCase();
    if (titleA < titleB) return -1;
    if (titleA > titleB) return 1;
    return 0;
  });
  $selectedIndex = $myData.findIndex(item => item === $selectedOption);
}

let mySearch = "";
const searchMe = () => {
  $myData = $myData.filter(obj => {
    const low3 = obj.col_c.toLowerCase() + ' ' + obj.col_a.toLowerCase();
    return low3.includes(mySearch.toLowerCase());
  });
  $selectedIndex = $myData.findIndex(item => item === $selectedOption);
}

onMount(fetchStoreNames);
</script>

<select on:change={(e) => { $collPick = parseInt(e.target.value); refreshMe() }}>
  {#each storeNames as name, i}
    <option value={i} selected={$collPick === i}>{name}</option>
  {/each}
</select>
<input class="new-store" type="text" bind:value={newStoreName} placeholder="new store"
  on:keydown={(e) => e.key === 'Enter' && addStore()} />
<button on:click={addStore}>+</button>
&nbsp <button on:click={sortMe}>A-Z</button>
&nbsp<input type="text" bind:value={mySearch} on:change={searchMe} />


<style>
  select {
    background-color: rgb(233, 217, 217);
    margin: 0px;
    padding: 2px 4px;
    font-family: monospace;
    font-size: 18px;
    width: auto;
  }

  button {
    margin: 0px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 18px;
  }

  input {
    background-color: rgb(233, 217, 217);
    height: 80%;
    margin: 0px;
  }

  input:not(.new-store) {
    width: 47%;
  }

  .new-store {
    width: 7em;
    font-family: monospace;
    font-size: 18px;
    padding: 2px 4px;
  }
</style>
