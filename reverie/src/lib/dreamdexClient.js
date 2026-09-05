import { SomniaMarkets } from '@somnia-chain/markets-sdk';

const INDEXER_URL = 'https://dev.smk.somnia.host/v1/graphql';
const RPC_URL = 'https://dream-rpc.somnia.network';
const WS_RPC_URL = 'wss://dream-rpc.somnia.network/ws';

export const exchangeClient = new SomniaMarkets({
  rpcUrl: RPC_URL,
  wsRpcUrl: WS_RPC_URL,
  indexerUrl: INDEXER_URL,
  addresses: {
    binaryModule: '0x3ecC694Cef705358864a646142ac17A90E29e388'
  }
});