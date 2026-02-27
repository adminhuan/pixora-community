declare module 'svg-captcha' {
  interface CaptchaOptions {
    size?: number;
    ignoreChars?: string;
    noise?: number;
    color?: boolean;
    background?: string;
    width?: number;
    height?: number;
    fontSize?: number;
    mathOperator?: string;
  }

  interface CaptchaResult {
    data: string;
    text: string;
  }

  interface SvgCaptcha {
    create(options?: CaptchaOptions): CaptchaResult;
    createMathExpr(options?: CaptchaOptions): CaptchaResult;
  }

  const svgCaptcha: SvgCaptcha;
  export = svgCaptcha;
}
