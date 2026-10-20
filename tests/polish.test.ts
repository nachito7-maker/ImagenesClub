import {describe,it,expect} from 'vitest';
import {moveAlong,pathfind,stairPose,STAIRS,type Point} from '../src/core/navigation';
import {Game} from '../src/core/game';
describe('continuous stair traversal',()=>{
 it.each([0,1])('takes time from floor %s and keeps the landing atomic',floor=>{const p:Point={...STAIRS[floor]};const destination={...STAIRS[1-floor]};const path=[destination];moveAlong(p,path,.1,1.8,[]);expect(p.floor).toBe(floor);expect(p.x).toBe(STAIRS[floor].x);expect(p.stair?.progress).toBeGreaterThan(0);expect(p.stair?.progress).toBeLessThan(1);for(let i=0;i<40;i++)moveAlong(p,path,.1,1.8,[]);expect(p).toEqual(destination);expect(path).toHaveLength(0);});
 it.each([0,1])('reaches the exact stair threshold on floor %s',floor=>{const path=pathfind({x:0,z:0,floor},STAIRS[floor]);expect(path.at(-1)).toEqual(STAIRS[floor]);});
 it.each([0,1])('restores descending and ascending visual pose from floor %s',floor=>{const g=new Game();g.open();const group=g.spawn(1)!;const c=g.members(group)[0];c.position={...STAIRS[floor]};c.path=[{...STAIRS[1-floor]}];moveAlong(c.position,c.path,.7,1.8,[]);const restored=Game.load(g.save()).customers[0];for(const view of [0,1])expect(stairPose(restored.position,view)).toEqual(stairPose(c.position,view));});
 it.each([0,1])('has a continuous endpoint on floor %s',floor=>{const p:Point={...STAIRS[floor],stair:{from:1-floor,to:floor,progress:1}};expect(stairPose(p,floor)).toMatchObject({x:STAIRS[floor].x,y:0,z:STAIRS[floor].z});});
 it('persists an in-flight stair traversal',()=>{const g=new Game();g.open();const group=g.spawn(1)!;const c=g.members(group)[0];c.position={...STAIRS[0]};c.path=[{...STAIRS[1]}];moveAlong(c.position,c.path,.2,1.8,[]);const loaded=Game.load(g.save());expect(loaded.customers[0].position.stair).toEqual(c.position.stair);expect(loaded.customers[0].path).toEqual(c.path);});
});
