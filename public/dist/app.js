!function(t){function i(i){for(var n,s,a=i[0],h=i[1],l=i[2],c=0,d=[];c<a.length;c++)s=a[c],Object.prototype.hasOwnProperty.call(o,s)&&o[s]&&d.push(o[s][0]),o[s]=0;for(n in h)Object.prototype.hasOwnProperty.call(h,n)&&(t[n]=h[n]);for(u&&u(i);d.length;)d.shift()();return r.push.apply(r,l||[]),e()}function e(){for(var t,i=0;i<r.length;i++){for(var e=r[i],n=!0,a=1;a<e.length;a++){var h=e[a];0!==o[h]&&(n=!1)}n&&(r.splice(i--,1),t=s(s.s=e[0]))}return t}var n={},o={0:0},r=[];function s(i){if(n[i])return n[i].exports;var e=n[i]={i:i,l:!1,exports:{}};return t[i].call(e.exports,e,e.exports,s),e.l=!0,e.exports}s.m=t,s.c=n,s.d=function(t,i,e){s.o(t,i)||Object.defineProperty(t,i,{enumerable:!0,get:e})},s.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},s.t=function(t,i){if(1&i&&(t=s(t)),8&i)return t;if(4&i&&"object"==typeof t&&t&&t.__esModule)return t;var e=Object.create(null);if(s.r(e),Object.defineProperty(e,"default",{enumerable:!0,value:t}),2&i&&"string"!=typeof t)for(var n in t)s.d(e,n,function(i){return t[i]}.bind(null,n));return e},s.n=function(t){var i=t&&t.__esModule?function(){return t.default}:function(){return t};return s.d(i,"a",i),i},s.o=function(t,i){return Object.prototype.hasOwnProperty.call(t,i)},s.p="";var a=window.webpackJsonp=window.webpackJsonp||[],h=a.push.bind(a);a.push=i,a=a.slice();for(var l=0;l<a.length;l++)i(a[l]);var u=h;r.push([10,1]),e()}({10:function(t,i,e){"use strict";e.r(i);var n=e(7),o=e(1);function r(t,i,e){return i in t?Object.defineProperty(t,i,{value:e,enumerable:!0,configurable:!0,writable:!0}):t[i]=e,t}let s=80,a=null,h=null,l=null,u=null,c=null;function d(t,i){t=Math.abs(t),i=Math.abs(i);let e=Math.max(t,i),n=Math.min(t,i),o=1007*e+441*n;return e<n<<4&&(o-=40*e),o+512>>10}class p{constructor(t,i,e){r(this,"position",void 0),r(this,"originPosition",void 0),r(this,"velocity",void 0),r(this,"repulsion",void 0),r(this,"mouseRepulsion",void 0),r(this,"gravity",void 0),r(this,"maxGravity",void 0),r(this,"scale",void 0),r(this,"originScale",void 0),r(this,"color",void 0),r(this,"sprite",void 0),this.position=t.copy(),this.originPosition=t.copy(),this.velocity=l.createVector(l.random(0,50),l.random(0,50)),this.repulsion=l.random(1,5),this.mouseRepulsion=1,this.gravity=.01,this.maxGravity=l.random(.01,.04),this.scale=i,this.originScale=i,this.color=e,this.sprite=null}createSprite(t){return this.sprite=new o.e(t),this.sprite.tint=(this.color[0]<<16)+(this.color[1]<<8)+this.color[2],this.sprite}updateState(){this.updateStateByMouse(),this.updateStateByOrigin(),this.velocity.mult(.95),this.position.add(this.velocity),this.sprite.position.x=this.position.x,this.sprite.position.y=this.position.y,this.sprite.scale.x=this.sprite.scale.y=this.scale}updateStateByMouse(){const t=u-this.position.x,i=c-this.position.y,e=d(t,i),n=t/e,o=i/e;e<s?(this.gravity*=.6,this.mouseRepulsion=Math.max(0,.5*this.mouseRepulsion-.01),this.velocity.sub(n*this.repulsion,o*this.repulsion),this.velocity.mult(1-this.mouseRepulsion)):(this.gravity+=.1*(this.maxGravity-this.gravity),this.mouseRepulsion=Math.min(1,this.mouseRepulsion+.03))}updateStateByOrigin(){const t=this.originPosition.x-this.position.x,i=this.originPosition.y-this.position.y,e=d(t,i);this.velocity.add(t*this.gravity,i*this.gravity),this.scale=this.originScale+this.originScale*e/512}}class v{constructor(){r(this,"app",void 0),r(this,"imageParticle",void 0),r(this,"renderer",void 0),r(this,"stage",void 0),r(this,"container",void 0),this.imageParticle=[],this.app=new o.a({view:document.getElementById("viewport"),backgroundColor:16777215,width:window.innerWidth,height:window.innerHeight,antialias:!0}),this.renderer=this.app.renderer,this.stage=new o.b,this.container=new o.b,this.createParticles(),this.setup()}setup(){this.stage.addChild(this.container),document.body.appendChild(this.renderer.view)}getPixel(t,i){const e=h.pixels,n=4*(i*h.width+t);return t>h.width||t<0||i>h.height||i<0?[0,0,0,0]:[e[n],e[n+1],e[n+2],e[n+3]]}createParticleTexture(){const t=new o.c;return t.beginFill(16777215),t.drawRect(0,0,1,1),t.endFill(),this.renderer.generateTexture(t,o.d.NEAREST,2)}createParticles(){const t=h.width,i=h.height,e=Math.min((window.innerWidth-20)/t,(window.innerHeight-20)/i),n=this.createParticleTexture(),o=t/1,r=i/1,s=(window.innerWidth-Math.min(window.innerWidth,window.innerHeight))/2,a=(window.innerHeight-Math.min(window.innerWidth,window.innerHeight))/2;for(let t=0;t<o;t++)for(let i=0;i<r;i++){const o=l.createVector(l.int(1*t),l.int(1*i));let r=o,h=e,u=this.getPixel(o.x,o.y);if(0===u[3])continue;r.mult(e),r.add(s+10,a+10);let c=new p(r,h,u);this.imageParticle.push(c),this.container.addChild(c.createSprite(n))}}updateState(){for(let t of this.imageParticle)t.updateState()}render(){this.renderer.render(this.stage)}}l=new n((function(t){t.preload=function(){h=t.loadImage("https://avatars.githubusercontent.com/u/5019072?v=3")},t.setup=function(){h.loadPixels(),t.noStroke(),t.frameRate(60),a=new v},t.draw=function(){s=Math.max(0,s-1.5),a.updateState(),a.render()},t.mouseMoved=function(){s=80,u=t.mouseX,c=t.mouseY},t.touchMoved=function(){s=80,u=t.mouseX,c=t.mouseY}}),document.body)}});
//# sourceMappingURL=app.js.map