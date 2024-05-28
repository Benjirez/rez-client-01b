import { writable } from 'svelte/store'

export const myData = writable([])

export const selectedOption = writable()

export const collPick = writable(0)

export const selectedIndex = writable('none')

export const API_URI = writable('https://rez-api-01.fly.dev') 

//export const API_URI = writable('http://localhost:3000')

