
import { applyWatermark } from '../src/watermark.client';

describe.skip('applyWatermark', () => {
  beforeAll(() => {
    // @ts-ignore
    global.HTMLCanvasElement = class {
      width = 0;
      height = 0;
      getContext() {
        return {
          drawImage: jest.fn(),
          save: jest.fn(),
          restore: jest.fn(),
          globalAlpha: 1,
          font: '',
          fillStyle: '',
          textBaseline: '',
          measureText: (text: string) => ({ width: text.length * 10 }),
          fillText: jest.fn(),
        };
      }
    };
    // @ts-ignore
    global.Image = class {
      naturalWidth = 100;
      naturalHeight = 50;
      set src(_v: string) {}
      set crossOrigin(_v: string) {}
      onload = () => {};
      onerror = () => {};
    };
    // @ts-ignore
    global.FileReader = class {
      onload: ((ev: any) => void) | null = null;
      onerror: ((ev: any) => void) | null = null;
      readAsDataURL(_file: unknown) {
        if (typeof this.onload === 'function') {
          this.onload({ target: { result: 'data:image/png;base64,abc' } });
        }
      }
    };
    // @ts-ignore
    global.document = {
      createElement: () => new global.HTMLCanvasElement(),
    };
    // @ts-ignore
    global.window = { Image: global.Image };
  });

  it('should apply watermark text', async () => {
    const canvas = await applyWatermark('fake.png', { text: 'Test', font: '20px Arial', color: '#fff', position: 'center' });
    expect(canvas).toBeDefined();
  });

  it('should apply watermark image', async () => {
    const canvas = await applyWatermark('fake.png', { imageSrc: 'wm.png', opacity: 0.8, position: 'top-left' });
    expect(canvas).toBeDefined();
  });

  it('should resize image if width/height provided', async () => {
    const canvas = await applyWatermark('fake.png', { width: 200, height: 100 });
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
  });

  it('should use pica if provided', async () => {
    const pica = { resize: jest.fn().mockResolvedValue(undefined) };
    const canvas = await applyWatermark('fake.png', { width: 300, height: 150, pica });
    expect(pica.resize).toHaveBeenCalled();
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(150);
  });
});
