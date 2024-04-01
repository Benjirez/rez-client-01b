<script>
    import {myData, collPick, selectedIndex } from './stateStore.js'
</script>
<div>{#if $myData.length}total: {$myData.length}{:else}No Data{/if} / {#if $selectedIndex != 'none' }selected: {$selectedIndex} {:else}selected: NONE{/if}

<!--&nbsp &nbsp
collPick: { $collPick  } -->
</div>

