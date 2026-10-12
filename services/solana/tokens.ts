/**
 * SPL Token operations service
 * Handles token queries, transfers, and ATA management
 */
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { getConnection, getCurrentNetwork } from './connection';
import { getKeypair } from './wallet';
import { getTokenByMint } from '../../constants/tokens';

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  uiBalance: string;
  icon: string;
  color: string;
  ataAddress?: string;
}

export interface TransactionRecord {
  signature: string;
  timestamp: number;
  type: 'send' | 'receive' | 'swap' | 'mint' | 'unknown';
  amount: number;
  token: string;
  from: string;
  to: string;
  status: 'confirmed' | 'failed' | 'pending';
  fee: number;
}

/**
 * Get SOL balance
 */
export const getSolBalance = async (publicKeyStr: string): Promise<number> => {
  const connection = getConnection();
  const pubkey = new PublicKey(publicKeyStr);
  const balance = await connection.getBalance(pubkey);
  return balance / LAMPORTS_PER_SOL;
};

/**
 * Get all SPL token accounts and balances for a wallet
 */
export const getTokenBalances = async (publicKeyStr: string): Promise<TokenBalance[]> => {
  const connection = getConnection();
  const pubkey = new PublicKey(publicKeyStr);

  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    const network = getCurrentNetwork();
    const balances: TokenBalance[] = tokenAccounts.value.map(account => {
      const parsedInfo = account.account.data.parsed.info;
      const tokenAmount = parsedInfo.tokenAmount;
      const known = getTokenByMint(parsedInfo.mint, network);

      return {
        mint: parsedInfo.mint,
        symbol: known?.symbol || '',
        name: known?.name || '',
        balance: parseFloat(tokenAmount.amount),
        decimals: tokenAmount.decimals,
        uiBalance: tokenAmount.uiAmountString || '0',
        icon: known?.icon || '🪙',
        color: known?.color || '#7B61FF',
        ataAddress: account.pubkey.toBase58(),
      };
    });

    return balances.filter(b => parseFloat(b.uiBalance) > 0);
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return [];
  }
};

/**
 * Send SOL to another address
 */
const sendSOLUnlocked = async (
  toAddress: string,
  amount: number,
): Promise<string> => {
  const connection = getConnection();
  const keypair = await getKeypair();
  if (!keypair) throw new Error('No wallet found');

  const toPubkey = new PublicKey(toAddress);
  const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey,
      lamports,
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = keypair.publicKey;

  transaction.sign(keypair);
  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
};

/**
 * Send SPL token to another address
 */
const sendSPLTokenUnlocked = async (
  toAddress: string,
  mintAddress: string,
  amount: number,
  decimals: number,
): Promise<string> => {
  const connection = getConnection();
  const keypair = await getKeypair();
  if (!keypair) throw new Error('No wallet found');

  const mintPubkey = new PublicKey(mintAddress);
  const toPubkey = new PublicKey(toAddress);

  // Get or create Associated Token Account for sender
  const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

  const senderATA = await findAssociatedTokenAddress(keypair.publicKey, mintPubkey);
  const receiverATA = await findAssociatedTokenAddress(toPubkey, mintPubkey);

  const transaction = new Transaction();

  // Check if receiver ATA exists, if not create it
  const receiverATAInfo = await connection.getAccountInfo(receiverATA);
  if (!receiverATAInfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        keypair.publicKey,
        receiverATA,
        toPubkey,
        mintPubkey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      )
    );
  }

  // Add transfer instruction
  const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));
  transaction.add(
    createTransferInstruction(senderATA, receiverATA, keypair.publicKey, rawAmount, TOKEN_PROGRAM_ID)
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = keypair.publicKey;

  transaction.sign(keypair);
  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
};

/**
 * Get recent transaction history
 */
export const getTransactionHistory = async (
  publicKeyStr: string,
  limit: number = 20,
): Promise<TransactionRecord[]> => {
  const connection = getConnection();
  const pubkey = new PublicKey(publicKeyStr);

  try {
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit });

    const records = await Promise.all(signatures.map(async (sig): Promise<TransactionRecord> => {
      const base: TransactionRecord = {
        signature: sig.signature,
        timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
        type: 'unknown',
        amount: 0,
        token: 'SOL',
        from: '',
        to: '',
        status: sig.err ? 'failed' : 'confirmed',
        fee: 0,
      };

      if (sig.err) return base;

      try {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });
        if (!tx || !tx.meta) return base;

        const accountKeys = tx.transaction.message.getAccountKeys().staticAccountKeys;
        const myIndex = accountKeys.findIndex((k) => k.equals(pubkey));
        if (myIndex === -1) return base;

        const feePaidByMe = myIndex === 0 ? tx.meta.fee : 0;
        const lamportDelta =
          tx.meta.postBalances[myIndex] - tx.meta.preBalances[myIndex] + feePaidByMe;

        // SOL-перевод: баланс изменился сильнее, чем можно объяснить одной комиссией
        if (Math.abs(lamportDelta) > 0) {
          const isSend = lamportDelta < 0;
          let counterparty = '';
          for (let i = 0; i < accountKeys.length; i++) {
            if (i === myIndex) continue;
            const delta = tx.meta.postBalances[i] - tx.meta.preBalances[i];
            if ((isSend && delta > 0) || (!isSend && delta < 0)) {
              counterparty = accountKeys[i].toBase58();
              break;
            }
          }
          return {
            ...base,
            type: isSend ? 'send' : 'receive',
            amount: Math.abs(lamportDelta) / LAMPORTS_PER_SOL,
            token: 'SOL',
            from: isSend ? publicKeyStr : counterparty,
            to: isSend ? counterparty : publicKeyStr,
            fee: myIndex === 0 ? tx.meta.fee / LAMPORTS_PER_SOL : 0,
          };
        }

        // Иначе — может быть SPL-токен перевод, смотрим pre/postTokenBalances
        const preTB = tx.meta.preTokenBalances || [];
        const postTB = tx.meta.postTokenBalances || [];
        const myPost = postTB.find((b) => b.owner === publicKeyStr);
        if (myPost) {
          const myPre = preTB.find((b) => b.accountIndex === myPost.accountIndex);
          const preAmt = myPre?.uiTokenAmount.uiAmount ?? 0;
          const postAmt = myPost.uiTokenAmount.uiAmount ?? 0;
          const delta = postAmt - preAmt;
          if (delta !== 0) {
            return {
              ...base,
              type: delta > 0 ? 'receive' : 'send',
              amount: Math.abs(delta),
              token: myPost.mint,
              from: delta > 0 ? '' : publicKeyStr,
              to: delta > 0 ? publicKeyStr : '',
            };
          }
        }

        return base;
      } catch {
        return base;
      }
    }));

    return records;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
};

// Helper: Find Associated Token Address
async function findAssociatedTokenAddress(
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey,
): Promise<PublicKey> {
  const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
  const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

  const [address] = await PublicKey.findProgramAddress(
    [
      walletAddress.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      tokenMintAddress.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}

// Helper: Create ATA instruction
function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
  tokenProgramId: PublicKey,
  associatedTokenProgramId: PublicKey,
): any {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedToken, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
  ];

  return {
    keys,
    programId: associatedTokenProgramId,
    data: Buffer.alloc(0),
  };
}

// Helper: Create transfer instruction
function createTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
  tokenProgramId: PublicKey,
): any {
  const dataLayout = Buffer.alloc(9);
  dataLayout.writeUInt8(3, 0); // Transfer instruction index
  dataLayout.writeBigUInt64LE(amount, 1);

  const keys = [
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false },
  ];

  return {
    keys,
    programId: tokenProgramId,
    data: dataLayout,
  };
}


/**
 * Замок на отправку: пока одна транзакция в процессе, вторую запустить
 * нельзя — вторая вызывается с ошибкой, а не уходит в сеть. Защита на
 * случай, если двойной вызов случится не только от тапа по кнопке
 * (например, из dev-консоли или повторного рендера).
 */
let sendInFlight = false;
const withSendLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  if (sendInFlight) {
    throw new Error('Предыдущая отправка ещё выполняется');
  }
  sendInFlight = true;
  try {
    return await fn();
  } finally {
    sendInFlight = false;
  }
};

export const sendSOL = (toAddress: string, amount: number): Promise<string> =>
  withSendLock(() => sendSOLUnlocked(toAddress, amount));

export const sendSPLToken = (
  toAddress: string,
  mintAddress: string,
  amount: number,
  decimals: number,
): Promise<string> =>
  withSendLock(() => sendSPLTokenUnlocked(toAddress, mintAddress, amount, decimals));
