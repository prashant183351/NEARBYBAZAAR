import React from 'react';

// Use model-viewer web component (https://modelviewer.dev/)
// You may need to add <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script> in _document.tsx or _app.tsx

interface Product3DViewerProps {
  modelUrl: string;
  ar?: boolean;
  arMeta?: Record<string, any>;
}

const Product3DViewer: React.FC<Product3DViewerProps> = ({ modelUrl, ar, arMeta }) => {
  if (!modelUrl) return null;
  return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
      {/* @ts-expect-error model-viewer is a custom web component */}
      <model-viewer
        src={modelUrl}
        ar={ar ? 'true' : undefined}
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        style={{ width: '100%', height: 400 }}
        {...arMeta}
      >
        <div slot="ar-button">View in your space</div>
        {/* @ts-expect-error closing tag */}
      </model-viewer>
    </div>
  );
};

export default Product3DViewer;
