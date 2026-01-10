declare module './lib/oracle' {
  export function oraclePing(): Promise<{status: string}>;
  export function oracleThothRoute(path: string, depth?: number): Promise<any>;
}
