import "./style.css";
import { UI } from "@peasy-lib/peasy-ui";
import { Engine, Actor, Vector, DisplayMode, Color, Material, Clock, Scene, SceneActivationContext } from "excalibur";
import { starFrag } from "./star";
const model = {};
const template = `<div> 
    <canvas id="cnv"></canvas>
</div>`;
await UI.create(document.body, model, template).attached;
console.log(`Hello World`);

let game = new Engine({ width: 600, height: 400, canvasElementId: "cnv", displayMode: DisplayMode.FitScreen });

let p1 = new Actor({
  name: "token",
  width: 50,
  height: 50,
  pos: new Vector(25, 25),
});

class myScene extends Scene {
  _time: number = 0;

  onActivate(context: SceneActivationContext<unknown>): void {
    this.add(p1);
    //@ts-ignore
    p1.graphics.material.getShader().use();
    //@ts-ignore
    p1.graphics.material.getShader()?.setUniformFloatVector("U_resolution", new Vector(50, 50));
    //@ts-ignore
    p1.graphics.material.getShader().use();
    //@ts-ignore
    //p1.graphics.material.getShader()?.setUniform("U_color", 0.75, 0.2, 0.2);
    p1.graphics.material.getShader()?.setUniform("uniform3f", "U_color", 0.75, 0.2, 0.2);
    //@ts-ignore
    p1.graphics.material.getShader().use();
    //@ts-ignore
    p1.graphics.material.getShader()?.setUniformBoolean("U_highlight", true);
  }

  onDeactivate(context: SceneActivationContext<undefined>): void {}

  update(engine: Engine, delta: number): void {
    this._time += delta / 1000;
    if (p1.graphics.material && p1.graphics.material.getShader()) {
      //@ts-ignore
      p1.graphics.material.getShader().use();
      //@ts-ignore
      p1.graphics.material.getShader().setUniformFloat("U_time", this._time);
    }
  }
}

game.backgroundColor = Color.Black;

//let starMaterial = new Material({ fragmentSource: starFrag });
let starMaterial = game.graphicsContext.createMaterial({ fragmentSource: starFrag });
p1.graphics.material = starMaterial;
let m_scene = new myScene();
game.add("m_scene", m_scene);
game.start();

game.goToScene("m_scene");
