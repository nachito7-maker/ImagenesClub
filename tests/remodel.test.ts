import {it,expect} from 'vitest';
import {ClubView} from '../src/render/club';
import {Game} from '../src/core/game';
import {Group} from 'three';
it('uses two persistent hinge groups and opens and closes without replacing the leaves',()=>{
 const view=Object.create(ClubView.prototype) as ClubView;
 view.doors=[new Group(),new Group()];view.doorProgress=0;view.doorTime=0;
 // Exercise the same door update before the rest of the renderer through a small public helper.
 const game=new Game();view.updateDoors(game,.1);expect(view.doorProgress).toBe(0);
 game.open();for(let i=2;i<25;i++)view.updateDoors(game,i*.1);
 expect(view.doorProgress).toBe(1);expect(view.doors[0].rotation.y).toBeLessThan(0);expect(view.doors[1].rotation.y).toBeGreaterThan(0);
 const leaves=[...view.doors];game.close();for(let i=25;i<50;i++)view.updateDoors(game,i*.1);
 expect(view.doorProgress).toBe(0);expect(view.doors).toEqual(leaves);
});
