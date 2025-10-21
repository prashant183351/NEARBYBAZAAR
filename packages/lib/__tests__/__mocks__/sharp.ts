type Meta = { width?: number; height?: number };

function SharpMock(_input?: any) {
  return {
    metadata: async (): Promise<Meta> => ({ width: 200, height: 200 }),
    extract: (_region: { left: number; top: number; width: number; height: number }) => ({
      toBuffer: async () => Buffer.from([]),
    }),
    toBuffer: async () => Buffer.from([]),
  };
}

export default SharpMock as unknown as (input?: any) => ReturnType<typeof SharpMock>;