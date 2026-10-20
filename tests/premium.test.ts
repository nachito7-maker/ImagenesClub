import {describe,it,expect} from 'vitest';
import {moveAlong,STAIRS,UPPER_ORIGIN,stairPose,stairWorldPose,type Point} from '../src/core/navigation';
describe('one physical staircase in both floor views',()=>{
 it.each([0,1])('keeps world position continuous on repeated journeys starting at %s',start=>{
  const p:Point={...STAIRS[start]};let previous=stairWorldPose(p);
  for(let journey=0;journey<6;journey++){
   const destination=1-p.floor,path=[{...STAIRS[destination]}];
   for(let step=0;step<400&&path.length;step++){
    moveAlong(p,path,.02,1.8,[]);const world=stairWorldPose(p);
    expect(Math.hypot(world.x-previous.x,world.y-previous.y,world.z-previous.z)).toBeLessThan(.05);
    for(const floor of [0,1]){const local=stairPose(p,floor);expect(local.x+(floor?UPPER_ORIGIN.x:0)).toBeCloseTo(world.x,10);expect(local.y+(floor?UPPER_ORIGIN.y:0)).toBeCloseTo(world.y,10);expect(local.z+(floor?UPPER_ORIGIN.z:0)).toBeCloseTo(world.z,10);}
    previous=world;
   }
   expect(p).toEqual(STAIRS[destination]);expect(path).toHaveLength(0);
  }
 });
});
