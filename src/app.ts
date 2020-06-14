"use strict";

import * as p5 from 'p5';
import * as PIXI from 'pixi.js'

const IMAGE_URL = "https://avatars.githubusercontent.com/u/5019072?v=3";
const PARTICLE_SIZE = 1; // image pixel size
const PADDING = 10;
const DEFAULT_REPULSION_CHANGE_DISTANCE = 80;

let repulsionChangeDistance: number = DEFAULT_REPULSION_CHANGE_DISTANCE;
let imageParticleSystem: ImageParticleSystem = null;
let targetImage: p5.Image = null;
let p5instance: p5 = null;
let mousePositionX: number = null
let mousePositionY: number = null

// ==================================================
// Utils
// ==================================================
function approxDistance(distanceX: number, distanceY: number) {
  distanceX = Math.abs(distanceX);
  distanceY = Math.abs(distanceY);

  let max = Math.max(distanceX, distanceY);
  let min = Math.min(distanceX, distanceY);
  let approx = (max * 1007) + (min * 441);

  if (max < (min << 4)) {
    approx -= max * 40;
  }

  return (( approx + 512 ) >> 10 );
}

// ==================================================
// ImageParticle Class
// ==================================================
class ImageParticle {
  private position: p5.Vector;
  private originPosition: p5.Vector;
  private velocity: p5.Vector;
  private repulsion: number;
  private mouseRepulsion: number;
  private gravity: number;
  private maxGravity: number;
  private scale: number;
  private originScale: number;
  private color: number[];
  private sprite: PIXI.Sprite;

  constructor(originPosition: p5.Vector, originScale: number, originColor: number[]) {
    this.position = originPosition.copy();
    this.originPosition = originPosition.copy();
    this.velocity = p5instance.createVector(p5instance.random(0, 50), p5instance.random(0, 50));
    this.repulsion = p5instance.random(1.0, 5.0);
    this.mouseRepulsion = 1.0;
    this.gravity = 0.01;
    this.maxGravity = p5instance.random(0.01, 0.04);
    this.scale = originScale;
    this.originScale = originScale;
    this.color = originColor;
    this.sprite = null;
  }

  createSprite(texture: PIXI.Texture) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.tint = (this.color[0] << 16) + (this.color[1] << 8) + (this.color[2]);
    this.sprite.scale.x = this.sprite.scale.y = this.scale;

    return this.sprite;
  }

  updateState() {
    // calc position
    this.updateStateByMouse();
    this.updateStateByOrigin();

    this.velocity.mult(0.95);
    this.position.add(this.velocity);

    // update sprite state
    this.sprite.position.x = this.position.x;
    this.sprite.position.y = this.position.y;
  }

  private updateStateByMouse() {
    const distanceX = mousePositionX - this.position.x;
    const distanceY = mousePositionY - this.position.y;
    const distance = approxDistance(distanceX, distanceY);
    const pointCos = distanceX / distance;
    const pointSin = distanceY / distance;

    if (distance < repulsionChangeDistance) {
      this.gravity *= 0.6;
      this.mouseRepulsion = Math.max(0, this.mouseRepulsion * 0.5 - 0.01);
      this.velocity.sub(pointCos * this.repulsion, pointSin * this.repulsion);
      this.velocity.mult(1 - this.mouseRepulsion);
    } else {
      this.gravity += (this.maxGravity - this.gravity) * 0.1;
      this.mouseRepulsion = Math.min(1, this.mouseRepulsion + 0.03);
    }
  }

  private updateStateByOrigin() {
    const distanceX = this.originPosition.x - this.position.x;
    const distanceY = this.originPosition.y - this.position.y;
    const distance = approxDistance(distanceX, distanceY);

    this.velocity.add(distanceX * this.gravity, distanceY * this.gravity);
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
  private stage: PIXI.Container;
  private particleContainer: PIXI.ParticleContainer;

  constructor() {
    this.imageParticles = [];
    this.app = new PIXI.Application({
      view: document.getElementById("viewport") as HTMLCanvasElement,
      backgroundColor: 0xFFFFFF,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
    });
    this.renderer = this.app.renderer;
    this.stage = new PIXI.Container();

    this.createParticles();
    this.particleContainer = new PIXI.ParticleContainer(this.imageParticles.length)
    this.addParticlesToContainer();
    this.setup();
  }

  private setup() {
    this.stage.addChild(this.particleContainer);
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

    return this.renderer.generateTexture(graphics, PIXI.SCALE_MODES.NEAREST, 2);
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
        const imagePosition = p5instance.createVector(p5instance.int(i * PARTICLE_SIZE), p5instance.int(j * PARTICLE_SIZE));
        let originPosition = imagePosition;
        let originScale = imageScale;
        let originColor = this.getPixel(imagePosition.x, imagePosition.y);

        // 透明はスキップ
        if (originColor[3] === 0) {
          continue;
        }

        originPosition.mult(imageScale);
        originPosition.add(offsetX + PADDING, offsetY + PADDING);

        let particle = new ImageParticle(originPosition, originScale, originColor);
        this.imageParticles.push(particle);
      }
    }
  }

  addParticlesToContainer() {
    const texture = this.createParticleTexture();

    for (let imageParticle of this.imageParticles) {
      this.particleContainer.addChild(imageParticle.createSprite(texture));
    }
  }

  updateStates() {
    for (let imageParticle of this.imageParticles) {
      imageParticle.updateState();
    }
  }

  render() {
    this.renderer.render(this.stage);
  }
}

// ==================================================
// Main
// ==================================================
function sketch(p5instance: p5) {
  p5instance.preload = function() {
    targetImage = p5instance.loadImage(IMAGE_URL);
  }

  p5instance.setup = function() {
    targetImage.loadPixels();
    p5instance.noStroke();
    p5instance.frameRate(60);
    imageParticleSystem = new ImageParticleSystem();
  }

  p5instance.draw = function() {
    repulsionChangeDistance = Math.max(0, repulsionChangeDistance - 1.5);

    imageParticleSystem.updateStates();
    imageParticleSystem.render();
  }

  p5instance.mouseMoved = function() {
    repulsionChangeDistance = DEFAULT_REPULSION_CHANGE_DISTANCE;
    mousePositionX = p5instance.mouseX;
    mousePositionY = p5instance.mouseY;
  }

  p5instance.touchMoved = function() {
    repulsionChangeDistance = DEFAULT_REPULSION_CHANGE_DISTANCE;
    mousePositionX = p5instance.mouseX;
    mousePositionY = p5instance.mouseY;
  }
}

p5instance = new p5(sketch, document.body);
