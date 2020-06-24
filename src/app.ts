import * as PIXI from 'pixi.js';

const IMAGE_URL = 'https://avatars.githubusercontent.com/yamadashy';
const PARTICLE_SIZE = 10; // image pixel size
const PADDING = 10;
const DEFAULT_REPULSION_CHANGE_DISTANCE = 80;

let repulsionChangeDistance: number = DEFAULT_REPULSION_CHANGE_DISTANCE;
let mousePositionX: number = null;
let mousePositionY: number = null;

// TODO: レンダラーを分割したい

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

class PerformanceChecker
{
  private performanceCheckCount: number;
  private performanceTimeSum: number;
  private processStartTime: number;

  constructor() {
    this.performanceCheckCount = 0;
    this.performanceTimeSum = 0;
  }

  public startProcess()
  {
    this.processStartTime = performance.now();
  }

  public endProcess()
  {
    this.performanceTimeSum += performance.now() - this.processStartTime;
    this.performanceCheckCount++;
  }

  public getAverage()
  {
    return this.performanceTimeSum / this.performanceCheckCount;
  }
}

// ==================================================
// ImageParticle Class
// ==================================================
class ImageParticle {
  private positionX: number;
  private positionY: number;
  private originPositionX: number;
  private originPositionY: number;
  private velocityX: number;
  private velocityY: number;
  private repulsion: number;
  private mouseRepulsion: number;
  private gravity: number;
  private maxGravity: number;
  private scale: number;
  private originScale: number;
  private color: number[];
  private sprite: PIXI.Sprite;

  constructor(originPosition: PIXI.Point, originScale: number, originColor: number[]) {
    this.positionX = originPosition.x;
    this.positionY = originPosition.y;
    this.originPositionX = originPosition.x;
    this.originPositionY = originPosition.y;
    this.velocityX = Utils.random(0, 50);
    this.velocityY = Utils.random(0, 50);
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

    this.velocityX *= 0.95;
    this.velocityY *= 0.95;
    this.positionX += this.velocityX;
    this.positionY += this.velocityY;

    // Update sprite state
    this.sprite.position.x = this.positionX;
    this.sprite.position.y = this.positionY;
  }

  private updateStateByMouse() {
    const distanceX = mousePositionX - this.positionX;
    const distanceY = mousePositionY - this.positionY;
    const distance = Utils.approxDistance(distanceX, distanceY);
    const pointCos = distanceX / distance;
    const pointSin = distanceY / distance;

    if (distance < repulsionChangeDistance) {
      this.gravity *= 0.6;
      this.mouseRepulsion = Math.max(0, this.mouseRepulsion * 0.5 - 0.01);
      this.velocityX -= pointCos * this.repulsion;
      this.velocityY -= pointSin * this.repulsion;
      this.velocityX *= 1 - this.mouseRepulsion;
      this.velocityY *= 1 - this.mouseRepulsion;
    } else {
      this.gravity += (this.maxGravity - this.gravity) * 0.1;
      this.mouseRepulsion = Math.min(1, this.mouseRepulsion + 0.03);
    }
  }

  private updateStateByOrigin() {
    const distanceX = this.originPositionX - this.positionX;
    const distanceY = this.originPositionY - this.positionY;
    const distance = Utils.approxDistance(distanceX, distanceY);

    this.velocityX += distanceX * this.gravity;
    this.velocityY += distanceY * this.gravity;
    this.scale = this.originScale + this.originScale * distance / 512;
  }
}

// ==================================================
// ImageParticleSystem クラス
// ==================================================
class ImageParticleSystem {
  private app: PIXI.Application;
  private imageParticles: ImageParticle[];
  private particleContainer: PIXI.ParticleContainer;
  private imageTexture: PIXI.Texture;
  private performanceChecker: PerformanceChecker;

  constructor() {
    this.performanceChecker = new PerformanceChecker();
    this.imageParticles = [];
    this.app = new PIXI.Application({
      view: document.getElementById('viewport') as HTMLCanvasElement,
      backgroundColor: 0xFFFFFF,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
    });
  }

  public setup() {
    // Setup view
    this.createParticleContainer();
    this.app.stage.addChild(this.particleContainer);
    document.body.appendChild(this.app.renderer.view);

    // Setup mouse event
    this.app.stage.interactive = true;
    this.app.stage.on("mousemove", this.onMouseMove.bind(this));
    this.app.stage.on("touchmove", this.onMouseMove.bind(this));

    // Setup tick event
    this.app.ticker.add(() => {
      repulsionChangeDistance = Math.max(0, repulsionChangeDistance - 0.5);

      this.performanceChecker.startProcess();
      for (const imageParticle of this.imageParticles) {
        imageParticle.updateState();
      }
      this.performanceChecker.endProcess();
      console.log('Average time: ' + this.performanceChecker.getAverage());
    });
  }

  public changeImage(imageUrl: string) {
    this.imageTexture = PIXI.Texture.from(imageUrl);
    this.createParticles();
    this.addParticleSpritesToContainer();
  }

  private onMouseMove(event: any) {
    const newPosition = event.data.getLocalPosition(this.app.stage);
    repulsionChangeDistance = DEFAULT_REPULSION_CHANGE_DISTANCE;
    mousePositionX = newPosition.x;
    mousePositionY = newPosition.y;
  }

  private getPixelColorFromImage(x: number, y: number): number[] {
    const pixels = new Uint8Array();
    const idx = (y * this.imageTexture.width + x) * 4;

    if (x > this.imageTexture.width || x < 0 || y > this.imageTexture.height || y < 0) {
      return [0, 0, 0, 0];
    }

    return [
      pixels[idx],
      pixels[idx + 1],
      pixels[idx + 2],
      pixels[idx + 3]
    ];
  }

  private createParticleContainer() {
    const fractionSizeX = window.innerWidth / PARTICLE_SIZE;
    const fractionSizeY = window.innerHeight / PARTICLE_SIZE;

    this.particleContainer = new PIXI.ParticleContainer(fractionSizeX * fractionSizeY, {
      vertices: false,
      position: true,
      rotation: false,
      uvs: false,
      tint: false
    });
  }

  private createParticles() {
    const imageWidth = this.imageTexture.width;
    const imageHeight = this.imageTexture.height;
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
        const originColor = this.getPixelColorFromImage(imagePosition.x, imagePosition.y);

        // Skip transparent pixel
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

    console.log('particle amount: ', this.imageParticles.length);
  }

  private addParticleSpritesToContainer() {
    const particleGraphics = new PIXI.Graphics();
    particleGraphics.beginFill(0xFFFFFF);
    particleGraphics.drawRect(0, 0, PARTICLE_SIZE, PARTICLE_SIZE);
    particleGraphics.endFill();
    const particleTexture = this.app.renderer.generateTexture(particleGraphics, PIXI.SCALE_MODES.LINEAR, 1);

    for (const imageParticle of this.imageParticles) {
      this.particleContainer.addChild(imageParticle.createSprite(particleTexture));
    }
  }
}

// ==================================================
// Main
// ==================================================
const imageParticleSystem = new ImageParticleSystem();
imageParticleSystem.setup();
imageParticleSystem.changeImage(IMAGE_URL);
