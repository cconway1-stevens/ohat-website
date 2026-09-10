declare module "klaro/dist/klaro-no-css" {
  type KlaroConfig = Record<string, unknown>;

  export function render(
    config: KlaroConfig,
    options?: { modal?: boolean; show?: boolean },
  ): unknown;
  export function show(config?: KlaroConfig, modal?: boolean): false;
}
