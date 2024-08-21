import { createSignal } from 'solid-js';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class MemeModel {
  private boxesSignal: ReturnType<typeof createSignal<Box[]>>;
  private textsSignal: ReturnType<typeof createSignal<string[]>>;
  private canvas: HTMLCanvasElement | undefined;
  private image: HTMLImageElement | undefined;

  constructor(canvas: HTMLCanvasElement) {
    this.boxesSignal = createSignal<Box[]>([]);
    this.textsSignal = createSignal<string[]>([]);
    this.canvas = canvas;
    this.loadImage('/path/to/your/meme-template.jpg');
  }

  private loadImage(src: string) {
    const image = new Image();
    image.src = src;
    image.onload = () => {
      this.image = image;
      if (this.canvas) {
        this.canvas.width = image.width;
        this.canvas.height = image.height;
        this.redrawCanvas();
      }
    };
  }

  redrawCanvas() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.image) {
      ctx.drawImage(this.image, 0, 0);
    }

    this.boxesSignal[0]().forEach((box, index) => {
      // Draw bounding box
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Set text style
      ctx.font = '20px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw text
      const text = this.textsSignal[0]()[index] || '';
      ctx.fillText(text, box.x + box.width / 2, box.y + box.height / 2);

      // Draw text outline for better visibility
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.strokeText(text, box.x + box.width / 2, box.y + box.height / 2);
    });
  }

  addBox(box: Box) {
    const [boxes, setBoxes] = this.boxesSignal;
    const [texts, setTexts] = this.textsSignal;
    setBoxes([...boxes(), box]);
    setTexts([...texts(), '']);
    this.redrawCanvas();
  }

  updateText(index: number, text: string) {
    const [texts, setTexts] = this.textsSignal;
    const newTexts = [...texts()];
    newTexts[index] = text;
    setTexts(newTexts);
    this.redrawCanvas();
  }

  getBoxes() {
    return this.boxesSignal[0]();
  }

  getTexts() {
    return this.textsSignal[0]();
  }

  getCanvas() {
    return this.canvas;
  }
}