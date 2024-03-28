<script>

    import GetData from './GetData.svelte'  
    import SelectTitle from './SelectTitle2.svelte'
    import ViewTitle from './ViewTitle.svelte'
    import ViewDoc from './ViewDoc.svelte'
    import DeleteBtn from './DeleteBtn.svelte'
    import SaveBtn from './SaveBtn.svelte'
    import NavData from './NavData.svelte'


</script>
<GetData />
<div class="container">
    <div class="a"><NavData /></div>
    <div class="b">b</div>
    <div class="c">
      <SelectTitle  />
    </div>

    <div class="d">d</div>

    <div class="e">e</div>
    <div class="f"><ViewTitle /></div>
    <div class="g"></div>
    <div class="h">
      <ViewDoc  />
      </div>
    <div class="i">i</div>
    <div class="j">j</div>

    <div class="k">
      <DeleteBtn />  
      <SaveBtn  />
    </div>

      
  </div>


  <style>

  .container {  
    display: grid;
    height: 100%;
    width: 100%;
    grid-template-columns: repeat(20, 1fr);
    grid-template-rows: repeat(20, 1fr);
    gap: 0px 0px;
    grid-auto-flow: row;
    grid-template-areas:
      "a a a a a a f f f f f f f f f f f f f f"
      "b b b b b b g g g g g g g g g g g g g g"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "c c c c c c h h h h h h h h h h h h h h"
      "d d d e e e i i i i i i i i i i i i i i"
      "d d d e e e j j j j j j j j j j j j j j"
      "d d d e e e k k k k k k k k k k k k k k";
  }
  
  .a { grid-area: a; background-color: #d6aaaa ;
    display: flex; /* This makes the container a flex container */
    flex-direction: row; /* Arrange items horizontally */
    justify-content:space-evenly; /* Align items horizontally in the center */
    align-items: center; /* Align items vertically in the center */}
  .b { grid-area: b;  background-color: #b7b5cc ;}
  .c { 
        grid-area: c;  
        background-color: #e9e3e3 ; 
        display: flex;
       /* justify-content: stretch; /**/
        /* align-items: stretch; /**/
    }



  .d { grid-area: d;  background-color: #bccfb7 ;}
  .e { grid-area: e;  background-color: #dab292 ;}
  .f { grid-area: f;  background-color: #acc9e0 ;}
  .g { grid-area: g;  background-color: #dee9a0 ;}
  .h { grid-area: h;  background-color: #f0dea4 ;}
  .i { grid-area: i;  background-color: #909090 ;}
  .j { grid-area: j;  background-color: #c1dddf ;}
  .k { grid-area: k; background-color: #e48f8f ; 
  display: flex; /* This makes the container a flex container */
  flex-direction: row; /* Arrange items horizontally */
  justify-content:space-evenly; /* Align items horizontally in the center */
  align-items: center; /* Align items vertically in the center */
}
</style>
