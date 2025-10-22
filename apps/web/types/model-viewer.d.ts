import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        poster?: string;
        ar?: any;
        'ar-modes'?: string;
        'ar-scale'?: string;
        'camera-controls'?: any;
        'auto-rotate'?: any;
        'shadow-intensity'?: number;
        exposure?: number;
        'environment-image'?: string;
        [key: string]: any;
      };
    }
  }
}
