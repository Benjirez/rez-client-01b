<script>
    import {myData, collPick, selectedIndex } from './stateStore.js'
</script>
<div><br><br>{#if $myData.length}myData.length: {$myData.length} {:else}No Data{/if}<br>
{#if $selectedIndex != 'none' }selectedIndex: {$selectedIndex} {:else}selectedIndex: NONE{/if}

<!--&nbsp &nbsp
collPick: { $collPick  } -->
</div>

