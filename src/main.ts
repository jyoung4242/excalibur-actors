import "./style.css";
import { UI } from "@peasy-lib/peasy-ui";
import {
  Engine,
  Actor,
  Vector,
  DisplayMode,
  Color,
  Material,
  Clock,
  Scene,
  SceneActivationContext,
  ImageSource,
  ImageFiltering,
  toRadians,
} from "excalibur";
import { starFrag } from "./star";
import { blackHoleFrag } from "./blackhole";
import { nebulaFrag } from "./nebula";
import { gridNebulaFrag } from "./gridNebula";
import { starfieldfragment } from "./starfield";

//@ts-ignore
import noise1 from "./assets/perlin.png";
//@ts-ignore
import noise2 from "./assets/fractal.png";
//@ts-ignore
import greynoise from "./assets/blue.png";
import { p2StarFrag } from "./p2star";

const imgNoise1 = new ImageSource(noise1);
const imgNoise2 = new ImageSource(noise2);
const imgNoise3 = new ImageSource(greynoise);

const model = {};
const template = `<div> 
    <canvas id="cnv"></canvas>
</div>`;
await UI.create(document.body, model, template).attached;
console.log(`Hello World`);

let game = new Engine({ width: 600, height: 400, canvasElementId: "cnv", displayMode: DisplayMode.FitScreen });

let p1Array: Actor[] = [];
let p2Array: Actor[] = [];
let bholeArray: Actor[] = [];

for (let index = 0; index < 10; index++) {
  p1Array.push(
    new Actor({
      name: "token",
      width: 150,
      height: 150,
      pos: new Vector(35, 35 * index + 50),
      color: Color.Transparent,
      z: 2,
    })
  );
  p2Array.push(
    new Actor({
      name: "token",
      width: 150,
      height: 150,
      pos: new Vector(575, 35 * index + 50),
      color: Color.Transparent,
      z: 2,
    })
  );
}

for (let index = 0; index < 16; index++) {
  bholeArray.push(
    new Actor({
      name: "hole",
      width: 100,
      height: 100,
      pos: new Vector(410, 90),
      color: Color.Transparent,
      z: 2,
    })
  );
}

/* let p1 = new Actor({
  name: "token",
  width: 200,
  height: 200,
  pos: new Vector(188, 90),
  color: Color.Transparent,
  z: 2,
}); */

let p2 = new Actor({
  name: "hole",
  width: 100,
  height: 100,
  pos: new Vector(410, 90),
  color: Color.Transparent,
  z: 2,
});

let gridSize = 300;

let p3 = new Actor({
  name: "nebula",
  width: 250,
  height: 250,
  pos: new Vector(300, 250),
  color: Color.Transparent,
  rotation: toRadians(90),
  z: 1,
});

let starfield = new Actor({
  name: "starfield",
  width: 1200,
  height: 800,
  pos: new Vector(0, 0),
  color: Color.Transparent,
  z: 0,
});

class myScene extends Scene {
  _time: number = 0;

  onActivate(context: SceneActivationContext<unknown>): void {
    p1Array.forEach(act => {
      this.add(act);
      act.graphics.material?.update(shader => {
        shader.setUniformFloatVector("U_resolution", new Vector(250, 250));
        shader.setUniform("uniform3f", "U_color", 0.75, 0.2, 0.2);
        shader.setUniformBoolean("U_highlight", true);
      });
    });

    p2Array.forEach(act => {
      this.add(act);
      act.graphics.material?.update(shader => {
        shader.setUniformFloatVector("U_resolution", new Vector(250, 250));
        shader.setUniform("uniform3f", "U_color", 0.2, 0.2, 0.8);
        shader.setUniformBoolean("U_highlight", true);
      });
    });
    //this.add(p1);
    //this.add(p2);
    this.add(p3);
    this.add(starfield);

    p2.graphics.material?.update(shader => {
      //shader.setUniformFloatVector("U_resolution", new Vector(250, 250));
      shader.setUniformBoolean("U_highlighted", true);
    });

    p3.graphics.material?.update(shader => {
      shader.setUniformFloatVector("U_resolution", new Vector(400, 400));
    });

    starfield.graphics.material?.update(shader => {
      shader.setUniformFloatVector("U_resolution", new Vector(1200, 800));
    });
  }

  onDeactivate(context: SceneActivationContext<undefined>): void {}

  update(engine: Engine, delta: number): void {
    this._time += delta / 1000;

    p1Array.forEach(act => {
      act.graphics.material?.update(shader => {
        shader.setUniformFloat("U_time", this._time);
      });
    });

    p2Array.forEach(act => {
      act.graphics.material?.update(shader => {
        shader.setUniformFloat("U_time", this._time);
      });
    });

    p2.graphics.material?.update(shader => {
      shader.setUniformFloat("U_time", this._time);
    });
    p3.graphics.material?.update(shader => {
      shader.setUniformFloat("U_time", this._time);
    });
    starfield.graphics.material?.update(shader => {
      shader.setUniformFloat("U_time", this._time);
    });
  }
}

game.backgroundColor = Color.Black;

let starMaterial = game.graphicsContext.createMaterial({ fragmentSource: starFrag });
let p2starMaterial = game.graphicsContext.createMaterial({ fragmentSource: p2StarFrag });
var bholeMaterial = game.graphicsContext.createMaterial({
  fragmentSource: blackHoleFrag,
  images: {
    U_noise1: imgNoise1,
    U_noise2: imgNoise2,
  },
});
let nebulaMaterial = game.graphicsContext.createMaterial({
  fragmentSource: gridNebulaFrag,
  images: {
    U_noise1: imgNoise3,
  },
});
let starfieldMaterial = game.graphicsContext.createMaterial({ fragmentSource: starfieldfragment });

p1Array.forEach(act => {
  act.graphics.material = starMaterial;
});

p2Array.forEach(act => {
  act.graphics.material = p2starMaterial;
});

//p1.graphics.material = starMaterial;
p2.graphics.material = bholeMaterial;
p3.graphics.material = nebulaMaterial;
starfield.graphics.material = starfieldMaterial;

let m_scene = new myScene();
game.add("m_scene", m_scene);

await imgNoise1.load();
await imgNoise2.load();
await imgNoise3.load();

game.start();

game.goToScene("m_scene");
