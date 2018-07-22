export class DepthConverterService {
  public static toAtm(depth: number): number {
    return depth / 10 + 1;
  }

  public static fromAtm(atm: number): number {
    return (atm - 1) * 10;
  }
}
