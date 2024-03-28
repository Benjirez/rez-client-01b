<script>
	import { onMount } from 'svelte'

	let API_URI = 'http://localhost:3000'
	let users = []

	let val1='?'
	let changed = false
	let selectedOption = "---"
	
	async function refreshList(){
		const usersPromise = await fetch(API_URI + '/user')
		users = await usersPromise.json()
		
	}

	async function deleteUser(id){
		await fetch(
			API_URI + '/user/' + id,
			{method: 'DELETE'}
		)
		 refreshList()
		 selectedOption = users[0]
	}


	
	function handleInput(){

		changed = true
	}

	let expanded;

function handleFocus(event) {
  expanded = event.target;
  expanded.style.height = '200px';
}

function handleBlur(event) {
  //expanded = event.target;
  expanded.style.height = '40px';
  expanded = null; 
}

	
onMount( refreshList )

</script>

<main>
	<h2>'REZ-WORK-01'</h2>
	{#if selectedOption}<p>{selectedOption}</p>{/if}
	{#if users}
	<select bind:value={selectedOption} multiple="multiple">
		{#each users as user}
			<option value={user._id}>
				{user.a}
			</option>
		{/each}
	</select>
	{/if}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}


	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
	select {

		width: 200px;
		height: 400px
	}
	textarea {

		width: 600px;
		height: 40px;
	}

	button {
		padding: 0px 4px; 
	}
</style>