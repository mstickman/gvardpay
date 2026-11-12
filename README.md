<img width="2000" height="535" alt="gvard-logo-2000" src="https://github.com/user-attachments/assets/b102b999-edd1-4907-a469-e9c75e451470" />


https://github.com/user-attachments/assets/16e8b9b0-7069-4136-a9d1-2592d3a0d320


# GvardPay

A mobile wallet and payment app for Solana, plus a small workflow engine for recurring payouts. React Native, Expo, TypeScript. The interface is in Russian.

It runs on devnet or against a local validator. Mainnet is wired up but has never been used with real money, so please don't put any in it.

## What it does

You create a wallet or import one from a seed phrase or a secret key. The home screen shows the balance in USD or SOL, using the current SOL rate from CoinGecko. You can send SOL, USDC or USDT by pasting an address or scanning a QR code. After a transfer you get a confirmation screen with the amount, the time and the SOL rate at that moment.

To receive, the Receive screen shows your address as text and as a QR code, with short instructions for whoever is paying you. Transaction history is read from the chain, not stored on the phone.

Each transaction has a button that generates a PDF confirmation you can share. The button says "smart contract" in the UI, but it is a PDF receipt with the transaction signature on it. There is no on-chain program behind it.

## Automation

The Automation tab builds a payout out of blocks: a date trigger, an amount calculation (SOL, USD or KZT, converted at the live rate), a compliance check, the Solana payment, a notification and an accounting entry. A typical chain: on the 5th of every month, convert 450,000 KZT to SOL, check the result against a limit and a list of allowed addresses, send it, log the run.

Workflows are stored on the device. They run when you press Run, or when you open the app on the scheduled day, and every run asks for confirmation first. All runs go into a journal, failed ones included, with the signature and a PDF for each payment. The compliance block checks a limit and an address allowlist. It does not do sanctions screening.

## Networks

Devnet is the default. For localnet, start a validator that listens on the network:

```
solana-test-validator --bind-address 0.0.0.0
```

Then open Settings, find the Local node section, type the laptop's IP and press Check. Check tests the HTTP port (8899) and the WebSocket port (8900) separately, because a closed WebSocket port makes transfers hang on confirmation. The phone and the laptop need to be on the same Wi-Fi. The address is saved on the phone, so changing networks does not need a rebuild.

## Running it

You need Node 20 or newer, plus Xcode for iOS or Android Studio for Android. Expo Go usually cannot open this project, because it only supports the newest SDK. Use a development build instead:

```
npm install
npx expo run:ios       # or: npx expo run:android
```

`npx expo start` starts Metro on its own if you already have a build installed. Signing, release builds and EAS are covered in [docs/BUILD.md](docs/BUILD.md).

Two optional variables live in `.env.example`. `EXPO_PUBLIC_LOCAL_RPC_URL` is only the default local node address. `EXPO_PUBLIC_DEBUG_CONSOLE=1` shows a floating dev console (airdrop with `add 5`, switch network, check the node). The console is hidden in release builds unless you set that flag.

## Stack

Expo SDK 57, React Native 0.86, expo-router, zustand, @solana/web3.js and @solana/spl-token, expo-secure-store, expo-camera, expo-print.

## Layout

```
app/          screens (expo-router)
components/   wallet, workflow and UI components
services/     solana, price, pdf, workflows (engine, blocks, schedule)
stores/       zustand stores
constants/    colors, tokens, config, icon registry
docs/         build guide and the workflow spec
```

Every icon is looked up in `constants/icons.ts`. To use your own, replace the PNG in `assets/icons/` with one of the same name.

## Security notes

The secret key is kept in the Keychain or Keystore through expo-secure-store. There is also an experimental copy encrypted with ML-KEM-768 and AES-GCM (@noble/post-quantum). The unencrypted copy is still stored next to it, so today the extra layer does not change what an attacker with access to the device could do. None of this has been audited.

Sending is limited to one transaction in flight at a time, so a double tap on the button cannot send twice.

## Known limits

Workflows do not run in the background. The app cannot sign a payment while it is closed, so scheduled payouts that fire on their own need a server-side scheduler, which does not exist yet. Notifications are in-app alerts, not push messages. There is no automated test suite.

## License

MIT. See [LICENSE](LICENSE).
