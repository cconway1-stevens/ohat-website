declare module "qrcode" {
  interface QRCodeColor {
    dark?: string;
    light?: string;
  }

  interface QRCodeRenderOptions {
    width?: number;
    margin?: number;
    color?: QRCodeColor;
  }

  const QRCode: {
    toCanvas(
      canvas: HTMLCanvasElement,
      text: string,
      options?: QRCodeRenderOptions,
    ): Promise<HTMLCanvasElement>;
    toDataURL(text: string, options?: QRCodeRenderOptions): Promise<string>;
    toString(text: string, options?: QRCodeRenderOptions): Promise<string>;
  };

  export default QRCode;
}
