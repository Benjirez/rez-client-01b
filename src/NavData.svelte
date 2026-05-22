<script>
import { myData, collPick, API_URI, selectedIndex, selectedOption } from './stateStore.js'
import { onMount } from 'svelte';

let storeNames = [];
let showModal = false;
let newStoreName = '';
let editingId = null;
let editingName = '';

const fetchStoreNames = async () => {
  try {
    const res = await fetch($API_URI + 'store-names');
    if (res.ok) storeNames = await res.json();
    else storeNames = ['1','2','3','4','5','6'].map(name => ({ _id: null, name }));
  } catch {
    storeNames = ['1','2','3','4','5','6'].map(name => ({ _id: null, name }));
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

let pendingDelete = null; // { store, count }

const confirmDelete = async (store) => {
  if (!store._id) return;
  const res = await fetch($API_URI + 'store-names/' + store._id + '/count');
  const data = await res.json();
  pendingDelete = { store, count: data.count };
}

const executeDelete = async () => {
  if (!pendingDelete) return;
  await fetch($API_URI + 'store-names/' + pendingDelete.store._id, { method: 'DELETE' });
  pendingDelete = null;
  await fetchStoreNames();
}

const startEdit = (store) => {
  editingId = store._id;
  editingName = store.name;
}

const saveEdit = async () => {
  if (!editingName.trim() || !editingId) return;
  await fetch($API_URI + 'store-names/' + editingId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: editingName.trim() })
  });
  editingId = null;
  await fetchStoreNames();
}

const duplicateStore = async (store) => {
  if (!store._id) return;
  await fetch($API_URI + 'store-names/' + store._id + '/duplicate', {
    method: 'POST'
  });
  await fetchStoreNames();
}

const refreshMe = async () => {
  $selectedIndex = 'none';
  const res = await fetch($API_URI + 'old/' + $collPick);
  $myData = await res.json();
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

let mySearch = '';
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
  {#each storeNames as store, i}
    <option value={i} selected={$collPick === i}>{store.name}</option>
  {/each}
</select>

<button on:click={() => showModal = true}>+/-</button>
&nbsp;<button on:click={sortMe}>A-Z</button>
&nbsp;<input class="search" type="text" bind:value={mySearch} on:change={searchMe} />

{#if showModal}
<div class="overlay" on:click|self={() => showModal = false}>
  <div class="modal">
    <div class="modal-header">
      <span>Manage Stores</span>
      <button class="close-btn" on:click={() => showModal = false}>✕</button>
    </div>

    {#each storeNames as store}
      <div class="store-row">
        {#if pendingDelete?.store._id === store._id}
          <span class="warn">Delete "{store.name}" ({pendingDelete.count} docs)?</span>
          <button class="danger" on:click={executeDelete}>yes</button>
          <button on:click={() => pendingDelete = null}>no</button>
        {:else if editingId === store._id}
          <input class="edit-input" type="text" bind:value={editingName}
            on:keydown={(e) => e.key === 'Enter' && saveEdit()} />
          <button on:click={saveEdit}>save</button>
          <button on:click={() => editingId = null}>cancel</button>
        {:else}
          <span class="store-name">{store.name}</span>
          <button on:click={() => startEdit(store)}>edit</button>
          <button on:click={() => duplicateStore(store)}>dup</button>
          <button on:click={() => confirmDelete(store)}>del</button>
        {/if}
      </div>
    {/each}

    <div class="add-row">
      <input class="add-input" type="text" bind:value={newStoreName} placeholder="new store name"
        on:keydown={(e) => e.key === 'Enter' && addStore()} />
      <button on:click={addStore}>+</button>
    </div>
  </div>
</div>
{/if}

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
  .search {
    background-color: rgb(233, 217, 217);
    height: 80%;
    margin: 0px;
    width: 47%;
  }
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .modal {
    background: white;
    border-radius: 6px;
    padding: 16px;
    min-width: 300px;
    font-family: monospace;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: bold;
  }
  .close-btn {
    font-size: 14px;
    padding: 2px 6px;
  }
  .store-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
    border-bottom: 1px solid #eee;
  }
  .store-name {
    flex: 1;
    font-size: 14px;
  }
  .store-row button {
    font-size: 12px;
    padding: 2px 5px;
  }
  .edit-input {
    flex: 1;
    font-family: monospace;
    font-size: 14px;
    padding: 2px 4px;
  }
  .add-row {
    display: flex;
    gap: 4px;
    margin-top: 12px;
  }
  .add-input {
    flex: 1;
    font-family: monospace;
    font-size: 14px;
    background-color: rgb(233, 217, 217);
    padding: 2px 4px;
  }
  .add-row button {
    font-size: 18px;
  }
.warn {
  flex: 1;
  font-size: 13px;
  color: #c00;
}
.danger {
  font-size: 12px;
  padding: 2px 5px;
  color: #c00;
  font-weight: bold;
}
</style>

