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
//@ts-ignore
import noise1 from "./assets/perlin.png";
//@ts-ignore
import noise2 from "./assets/fractal.png";
//@ts-ignore
import greynoise from "./assets/blue.png";

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

let p1 = new Actor({
  name: "token",
  width: 250,
  height: 250,
  pos: new Vector(100, 100),
  color: Color.Transparent,
});

let p2 = new Actor({
  name: "hole",
  width: 250,
  height: 250,
  pos: new Vector(300, 200),
  color: Color.Transparent,
});

let p3 = new Actor({
  name: "nebula",
  width: 300,
  height: 250,
  pos: new Vector(350, 200),
  color: Color.Transparent,
  rotation: toRadians(90),
});

class myScene extends Scene {
  _time: number = 0;

  onActivate(context: SceneActivationContext<unknown>): void {
    // this.add(p1);
    this.add(p2);
    //this.add(p3);

    p1.graphics.material?.update(shader => {
      shader.setUniformFloatVector("U_resolution", new Vector(250, 250));
      shader.setUniform("uniform3f", "U_color", 0.75, 0.2, 0.2);
      shader.setUniformBoolean("U_highlight", true);
    });

    p2.graphics.material?.update(shader => {
      //shader.setUniformFloatVector("U_resolution", new Vector(250, 250));
      shader.setUniformBoolean("U_highlighted", true);
    });
  }

  onDeactivate(context: SceneActivationContext<undefined>): void {}

  update(engine: Engine, delta: number): void {
    this._time += delta / 1000;
    /*  p1.graphics.material?.update(shader => {
      shader.setUniformFloat("U_time", this._time);
    }); */
    p2.graphics.material?.update(shader => {
      shader.setUniformFloat("U_time", this._time);
    });
    /*  p3.graphics.material?.update(shader => {
      shader.setUniformFloat("U_time", this._time);
    }); */
  }
}

game.backgroundColor = Color.Black;

//let starMaterial = new Material({ fragmentSource: starFrag });
let starMaterial = game.graphicsContext.createMaterial({ fragmentSource: starFrag });
//let bholeMaterial = game.graphicsContext.createMaterial({ fragmentSource: blackHoleFrag });

var bholeMaterial = game.graphicsContext.createMaterial({
  fragmentSource: blackHoleFrag,
  images: {
    U_noise1: imgNoise1,
    U_noise2: imgNoise2,
  },
});

let nebulaMaterial = game.graphicsContext.createMaterial({
  fragmentSource: nebulaFrag,
  images: {
    U_noise1: imgNoise3,
  },
});

p1.graphics.material = starMaterial;
p2.graphics.material = bholeMaterial;
p3.graphics.material = nebulaMaterial;

let m_scene = new myScene();
game.add("m_scene", m_scene);
game.start();

game.goToScene("m_scene");
