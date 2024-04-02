<script>
    import GetData from '../GetData.svelte'
    import SelectTitle from './SelectTitle.svelte'
    import ViewDoc from '../ViewDoc.svelte'

</script>

<div class='container'>
    <div class='a'><SelectTitle /></div>
    <div class='b'></div>
    <div class='c'></div>
    <div class='d'></div>
    <div class='e'><GetData /></div>
    <div class='f'></div>
    <div class='g'></div>
    <div class='h'></div>
    <div class='i'><ViewDoc /></div>
</div>

<style>
    .container{
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        /*grid-auto-flow: row; */
        grid-template-areas:
        "a b c"
        "d e f"
        "g h i";
    }
    .a { grid-area: a; background-color: #39660e ;}
    .b { grid-area: b; background-color: #4f787e ;}
    .c { grid-area: c; background-color: #8a9151 ;}
    .d { grid-area: d; background-color: #c8aad6 ;}
    .e { grid-area: e; background-color: #81522b ;}
    .f { grid-area: f; background-color: #1f201e ;}
    .g { grid-area: g; background-color: #d6d2aa ;}
    .h { grid-area: h; background-color: #aac8d6 ;}
    .i { grid-area: i; background-color: #b84040 ;}

</style>