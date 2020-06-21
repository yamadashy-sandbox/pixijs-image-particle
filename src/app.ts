'use strict';

import * as p5 from 'p5';
import * as PIXI from 'pixi.js';

const IMAGE_URL = 'https://avatars.githubusercontent.com/yamadashy';
const PARTICLE_SIZE = 4; // image pixel size
const PADDING = 10;
const DEFAULT_REPULSION_CHANGE_DISTANCE = 80;

let repulsionChangeDistance: number = DEFAULT_REPULSION_CHANGE_DISTANCE;
let imageParticleSystem: ImageParticleSystem = null;
let targetImage: p5.Image = null;
let mousePositionX: number = null;
let mousePositionY: number = null;

// ==================================================
// Utils
// ==================================================
class Utils {
  public static approxDistance(distanceX: number, distanceY: number) {
    distanceX = Math.abs(distanceX);
    distanceY = Math.abs(distanceY);

    const max = Math.max(distanceX, distanceY);
    const min = Math.min(distanceX, distanceY);
    let approx = (max * 1007) + (min * 441);

    if (max < (min << 4)) {
      approx -= max * 40;
    }

    return (( approx + 512 ) >> 10 );
  }

  public static random(min: number, max: number) {
    return (Math.random() * (max - min)) + min;
  }
}

// ==================================================
// ImageParticle Class
// ==================================================
class ImageParticle {
  private position: PIXI.Point;
  private originPosition: PIXI.Point;
  private velocity: PIXI.Point;
  private repulsion: number;
  private mouseRepulsion: number;
  private gravity: number;
  private maxGravity: number;
  private scale: number;
  private originScale: number;
  private color: number[];
  private sprite: PIXI.Sprite;

  constructor(originPosition: PIXI.Point, originScale: number, originColor: number[]) {
    this.position = originPosition.clone();
    this.originPosition = originPosition.clone();
    this.velocity = new PIXI.Point(Utils.random(0, 50), Utils.random(0, 50));
    this.repulsion = Utils.random(1.0, 5.0);
    this.mouseRepulsion = 1.0;
    this.gravity = 0.01;
    this.maxGravity = Utils.random(0.01, 0.04);
    this.scale = originScale;
    this.originScale = originScale;
    this.color = originColor;
    this.sprite = null;
  }

  createSprite(texture: PIXI.Texture) {
    this.sprite = PIXI.Sprite.from(texture);
    this.sprite.tint = (this.color[0] << 16) + (this.color[1] << 8) + (this.color[2]);
    this.sprite.scale.x = this.sprite.scale.y = this.scale;

    return this.sprite;
  }

  updateState() {
    // Calc position
    this.updateStateByMouse();
    this.updateStateByOrigin();

    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Update sprite state
    this.sprite.position.x = this.position.x;
    this.sprite.position.y = this.position.y;
  }

  private updateStateByMouse() {
    const distanceX = mousePositionX - this.position.x;
    const distanceY = mousePositionY - this.position.y;
    const distance = Utils.approxDistance(distanceX, distanceY);
    const pointCos = distanceX / distance;
    const pointSin = distanceY / distance;

    if (distance < repulsionChangeDistance) {
      this.gravity *= 0.6;
      this.mouseRepulsion = Math.max(0, this.mouseRepulsion * 0.5 - 0.01);
      this.velocity.x -= pointCos * this.repulsion;
      this.velocity.y -= pointSin * this.repulsion;
      this.velocity.x *= 1 - this.mouseRepulsion;
      this.velocity.y *= 1 - this.mouseRepulsion;
    } else {
      this.gravity += (this.maxGravity - this.gravity) * 0.1;
      this.mouseRepulsion = Math.min(1, this.mouseRepulsion + 0.03);
    }
  }

  private updateStateByOrigin() {
    const distanceX = this.originPosition.x - this.position.x;
    const distanceY = this.originPosition.y - this.position.y;
    const distance = Utils.approxDistance(distanceX, distanceY);

    this.velocity.x += distanceX * this.gravity;
    this.velocity.y += distanceY * this.gravity;
    this.scale = this.originScale + this.originScale * distance / 512;
  }
}

// ==================================================
// ImageParticleSystem クラス
// ==================================================
class ImageParticleSystem {
  private app: PIXI.Application;
  private imageParticles: ImageParticle[];
  private renderer: PIXI.Renderer;
  private particleContainer: PIXI.ParticleContainer;

  constructor() {
    this.imageParticles = [];
    this.app = new PIXI.Application({
      view: document.getElementById('viewport') as HTMLCanvasElement,
      backgroundColor: 0xFFFFFF,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
    });
    this.renderer = this.app.renderer;

    this.createParticles();
    this.particleContainer = new PIXI.ParticleContainer(this.imageParticles.length, {
      vertices: false,
      position: true,
      rotation: false,
      uvs: false,
      tint: false
    });
    this.addParticlesToContainer();
    this.setup();
  }

  private setup() {
    this.app.stage.addChild(this.particleContainer);
    document.body.appendChild(this.renderer.view);
  }

  private getPixel(x: number, y: number): number[] {
    const pixels = targetImage.pixels;
    const idx = (y * targetImage.width + x) * 4;

    if (x > targetImage.width || x < 0 || y > targetImage.height || y < 0) {
      return [0, 0, 0, 0];
    }

    return [
      pixels[idx],
      pixels[idx + 1],
      pixels[idx + 2],
      pixels[idx + 3]
    ];
  }

  private createParticleTexture() {
    const graphics = new PIXI.Graphics();

    graphics.beginFill(0xFFFFFF);
    graphics.drawRect(0, 0, PARTICLE_SIZE, PARTICLE_SIZE);
    graphics.endFill();

    return this.renderer.generateTexture(graphics, PIXI.SCALE_MODES.LINEAR, 1);
  }

  private createParticles() {
    const imageWidth = targetImage.width;
    const imageHeight = targetImage.height;
    const imageScale = Math.min((window.innerWidth - PADDING * 2) / imageWidth, (window.innerHeight - PADDING * 2) / imageHeight);
    const fractionSizeX = imageWidth / PARTICLE_SIZE;
    const fractionSizeY = imageHeight / PARTICLE_SIZE;
    const offsetX = (window.innerWidth - Math.min(window.innerWidth, window.innerHeight)) / 2;
    const offsetY = (window.innerHeight - Math.min(window.innerWidth, window.innerHeight)) / 2;

    for (let i = 0; i < fractionSizeX; i++) {
      for (let j = 0; j < fractionSizeY; j++) {
        const imagePosition = new PIXI.Point(Math.floor(i * PARTICLE_SIZE), Math.floor(j * PARTICLE_SIZE));
        const originPosition = imagePosition;
        const originScale = imageScale;
        const originColor = this.getPixel(imagePosition.x, imagePosition.y);

        // 透明はスキップ
        if (originColor[3] === 0) {
          continue;
        }

        imagePosition.x *= imageScale;
        imagePosition.y *= imageScale;
        imagePosition.x += offsetX + PADDING;
        imagePosition.y += offsetY + PADDING;

        const particle = new ImageParticle(originPosition, originScale, originColor);
        this.imageParticles.push(particle);
      }
    }
  }

  addParticlesToContainer() {
    const texture = this.createParticleTexture();

    for (const imageParticle of this.imageParticles) {
      this.particleContainer.addChild(imageParticle.createSprite(texture));
    }
  }

  updateStates() {
    for (const imageParticle of this.imageParticles) {
      imageParticle.updateState();
    }
  }

  render() {
    this.renderer.render(this.app.stage);
  }
}

// ==================================================
// Main
// ==================================================
function sketch(p5instance: p5) {
  p5instance.preload = function() {
    targetImage = p5instance.loadImage(IMAGE_URL);
  };

  p5instance.setup = function() {
    targetImage.loadPixels();
    p5instance.noStroke();
    p5instance.frameRate(60);
    imageParticleSystem = new ImageParticleSystem();
  };

  p5instance.draw = function() {
    repulsionChangeDistance = Math.max(0, repulsionChangeDistance - 1.5);

    imageParticleSystem.updateStates();
    imageParticleSystem.render();
  };

  p5instance.mouseMoved = function() {
    repulsionChangeDistance = DEFAULT_REPULSION_CHANGE_DISTANCE;
    mousePositionX = p5instance.mouseX;
    mousePositionY = p5instance.mouseY;
  };

  p5instance.touchMoved = function() {
    repulsionChangeDistance = DEFAULT_REPULSION_CHANGE_DISTANCE;
    mousePositionX = p5instance.mouseX;
    mousePositionY = p5instance.mouseY;
  };
}

new p5(sketch, document.body);
