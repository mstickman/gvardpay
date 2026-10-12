/**
 * Solana RPC Connection Manager
 */
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { SOLANA_RPC, APP_CONFIG, NetworkName } from '../../constants/config';

let connectionInstance: Connection | null = null;
let currentNetwork: NetworkName = APP_CONFIG.defaultNetwork;

// Адрес локального узла, заданный пользователем в Настройках. Перекрывает
// значение из .env, чтобы не пересобирать приложение при смене сети.
let localOverride: string | null = null;

const endpointFor = (network: NetworkName): string =>
  network === 'localnet' ? localOverride || SOLANA_RPC.localnet : SOLANA_RPC[network];

export const getLocalRpcUrl = (): string => localOverride || SOLANA_RPC.localnet;

/** Меняет адрес локального узла на лету; если сейчас Localnet — пересоздаёт подключение. */
export const setLocalRpcOverride = (url: string | null): void => {
  localOverride = url;
  if (currentNetwork === 'localnet') {
    connectionInstance = new Connection(endpointFor('localnet'), APP_CONFIG.confirmationCommitment);
  }
};

export const getConnection = (): Connection => {
  if (!connectionInstance) {
    connectionInstance = new Connection(endpointFor(currentNetwork), APP_CONFIG.confirmationCommitment);
  }
  return connectionInstance;
};

export const switchNetwork = (network: NetworkName): Connection => {
  currentNetwork = network;
  connectionInstance = new Connection(endpointFor(network), APP_CONFIG.confirmationCommitment);
  return connectionInstance;
};

export const getCurrentNetwork = (): NetworkName => currentNetwork;

export const requestAirdrop = async (publicKeyStr: string, lamports: number = 1e9): Promise<string> => {
  const { PublicKey } = await import('@solana/web3.js');
  const connection = getConnection();
  if (currentNetwork === 'mainnet') {
    throw new Error('Airdrop недоступен в mainnet');
  }
  const pubkey = new PublicKey(publicKeyStr);
  const signature = await connection.requestAirdrop(pubkey, lamports);
  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
};
