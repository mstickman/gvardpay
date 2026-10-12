/**
 * Единая точка для всех иконок приложения.
 *
 * Чтобы поставить свою иконку — просто замени файл в assets/icons/
 * тем же именем (например, assets/icons/tab-home.png) своим PNG.
 * Ничего в коде менять не нужно, require() ниже уже на него смотрит.
 *
 * Если добавляешь новую иконку — сначала положи файл в assets/icons/,
 * потом пропиши строку здесь. React Native не умеет require() по
 * динамической строке, поэтому пути перечислены явно.
 */

export const ICONS = {
  logo: require('../assets/icons/logo.png'),

  tabHome: require('../assets/icons/tab-home.png'),
  tabSend: require('../assets/icons/tab-send.png'),
  tabSettings: require('../assets/icons/tab-settings.png'),
  tabAutomation: require('../assets/icons/tab-automation.png'),

  blockTrigger: require('../assets/icons/block-trigger.png'),
  blockCalc: require('../assets/icons/block-calc.png'),
  blockCompliance: require('../assets/icons/block-compliance.png'),
  blockPayment: require('../assets/icons/block-payment.png'),
  blockNotify: require('../assets/icons/block-notify.png'),
  blockLedger: require('../assets/icons/block-ledger.png'),

  walletCreated: require('../assets/icons/wallet-created.png'),
  sendSuccess: require('../assets/icons/send-success.png'),

  actionSend: require('../assets/icons/action-send.png'),
  actionTopup: require('../assets/icons/action-topup.png'),

  contract: require('../assets/icons/contract.png'),
} as const;

export type IconKey = keyof typeof ICONS;
