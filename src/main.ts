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
  EasingFunctions,
  Sound,
} from "excalibur";
import { starFrag } from "./star";
import { blackHoleFrag } from "./blackhole";
import { nebulaFrag } from "./nebula";
import { gridNebulaFrag } from "./gridNebula";
import { starfieldfragment } from "./starfield";

//@ts-ignore
import blackhole from "./assets/bhole.png";
//@ts-ignore
import customCursor from "custom-cursor.js";

//@ts-ignore
import noise1 from "./assets/perlin.png";
//@ts-ignore
import noise2 from "./assets/fractal.png";
//@ts-ignore
import greynoise from "./assets/blue.png";
import { p2StarFrag } from "./p2star";
//@ts-ignore
import bloop from "./assets/sound.wav";

const imgNoise1 = new ImageSource(noise1);
const imgNoise2 = new ImageSource(noise2);
const imgNoise3 = new ImageSource(greynoise);

const beep = new Sound(bloop);

let fade: boolean = true;
beep.load();

//style="pointer-events: auto;"
//style="display: flex; justify-content: center; align-items: center; width: 100%;pointer-events: none;"

const model = {
  cursor: undefined as undefined | HTMLElement,
  hoverCursor: false,
  cursorSize: 25,
  get hoverPosition() {
    if (this.hoverCursor == true) return "0";
    else return "100";
  },
};

const template = `

<div> 
    
    <canvas id="cnv" ></canvas>
</div>`;
await UI.create(document.body, model, template).attached;
console.log(`Hello World`);
/* 
const cursorOptions = {
  hideTrueCursor: true,
  focusClass: "cursor--focused",
};

let cursor = new customCursor(model.cursor, cursorOptions);
cursor.initialize();
console.log(cursor); */

let game = new Engine({ width: 1280, height: 720, canvasElementId: "cnv", displayMode: DisplayMode.FitScreen });

let p1Array: Actor[] = [];
let p2Array: Actor[] = [];
let bholeArray: Actor[] = [];

for (let index = 0; index < 8; index++) {
  let tempActor = new Actor({
    name: "token",
    width: 80,
    height: 80,
    pos: new Vector(90, 80 * index + 120),
    color: Color.Transparent,
    z: 2,
  });
  tempActor.on("pointerenter", () => {
    document.body.classList.add("hoverCursor");
  });
  tempActor.on("pointerexit", () => {
    console.log("exiting");
    document.body.classList.remove("hoverCursor");
  });
  p1Array.push(tempActor);
  p2Array.push(
    new Actor({
      name: "token",
      width: 80,
      height: 80,
      pos: new Vector(1200, 80 * index + 120),
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

let p2 = new Actor({
  name: "hole",
  width: 125,
  height: 125,
  pos: new Vector(810, 255),
  color: Color.Transparent,
  z: 2,
});

let gridSize = 300;

let p3 = new Actor({
  name: "nebula",
  width: 450,
  height: 450,
  pos: new Vector(2560 / 4, 1700 / 4),
  color: Color.Transparent,
  rotation: toRadians(90),
  z: 1,
});

let starfield = new Actor({
  name: "starfield",
  width: 2560,
  height: 1480,
  pos: new Vector(0, 0),
  color: Color.Transparent,
  z: 0,
});

class myScene extends Scene {
  _time: number = 0;

  onActivate(context: SceneActivationContext<unknown>): void {
    console.log("setting up scene");

    game.input.pointers.on("down", pe => {
      console.log("click");

      let actor = p1Array[0];
      let aque = actor.actions.getQueue();
      //guard condition
      console.log(aque.isComplete());
      if (!aque.isComplete()) return;

      beep.play();
      if (actor.hasTag("left")) {
        model.hoverCursor = true;
        actor.removeTag("left");
        actor.addTag("right");
        actor.actions.easeBy(new Vector(110, 0), 1500, EasingFunctions.EaseInOutQuad);
      } else {
        model.hoverCursor = false;
        actor.removeTag("right");
        actor.addTag("left");
        actor.actions.easeBy(new Vector(-110, 0), 1500, EasingFunctions.EaseInOutQuad);
      }
    });

    window.addEventListener("resize", () => {
      model.cursorSize = game.screen.drawWidth * 0.03;
    });

    game.input.keyboard.on("press", ke => {
      if (ke.key == "Space") {
        //toggle fade

        if (!fade) {
          fade = true;
          console.log("fade in");
          p1Array.forEach(act => {
            act.graphics.material?.update(shader => {
              shader.setUniformFloat("u_opacity", 1.0);
            });
            //act.graphics.opacity = 1;
            fadeIn(act, 1500);
          });
        } else {
          console.log("fade out");
          fade = false;
          p1Array.forEach(act => {
            act.graphics.material?.update(shader => {
              shader.setUniformFloat("u_opacity", 0.0);
            });
            //act.graphics.opacity = 0;
            fadeOut(act, 1500);
          });
        }
      }
    });

    p1Array.forEach(act => {
      this.add(act);
      act.graphics.material?.update(shader => {
        shader.setUniformFloatVector("U_resolution", new Vector(500, 500));
        shader.setUniform("uniform3f", "U_color", 0.75, 0.2, 0.2);
        shader.setUniformBoolean("U_highlight", false);
      });
    });

    p2Array.forEach(act => {
      this.add(act);
      act.graphics.material?.update(shader => {
        shader.setUniformFloatVector("U_resolution", new Vector(500, 500));
        shader.setUniform("uniform3f", "U_color", 0.2, 0.2, 0.8);
        shader.setUniformBoolean("U_highlight", false);
      });
    });

    this.add(p2);
    this.add(p3);
    this.add(starfield);

    p2.graphics.material?.update(shader => {
      shader.setUniformBoolean("U_highlighted", true);
    });

    p3.graphics.material?.update(shader => {
      shader.setUniformFloatVector("U_resolution", new Vector(800, 800));
    });

    starfield.graphics.material?.update(shader => {
      shader.setUniformFloatVector("U_resolution", new Vector(1200, 800));
    });

    p1Array[0].pos = new Vector(472, 250);
    p1Array[1].pos = new Vector(585, 375);
    p1Array[2].pos = new Vector(695, 480);
    p1Array[3].pos = new Vector(806, 590);
    p1Array[0].addTag("left");
    p1Array[0].events.on("actioncomplete", ae => {
      console.log("action done", ae);
    });
  }

  onDeactivate(context: SceneActivationContext<undefined>): void {}

  onPostUpdate(engine: Engine<any>, delta: number): void {
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

setupGraphics();

let m_scene = new myScene();
game.add("m_scene", m_scene);

await imgNoise1.load();
await imgNoise2.load();
await imgNoise3.load();

document.body.classList.add("normCursor");

game.start();
game.goToScene("m_scene");

function setupGraphics() {
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
}

function fadeIn(act: Actor, time: number) {
  let handler = setInterval(() => {
    if (act.graphics.opacity >= 1) {
      act.graphics.opacity = 1;
      clearInterval(handler);
      return;
    }
    act.graphics.opacity += 0.01;
  }, time / 100);
}

function fadeOut(act: Actor, time: number) {
  let handler = setInterval(() => {
    if (act.graphics.opacity <= 0) {
      act.graphics.opacity = 0;
      clearInterval(handler);
      return;
    }
    act.graphics.opacity -= 0.01;
  }, time / 100);
}
