import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* model-viewer web component for 3D/AR */}
          <script
            type="module"
            src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
