# Спека: автоматизация платежей (workflows) — GvardPay

Заменяет вкладку «Токены». Источник UI — одобренный мокап (тёмная строгая тема). Значения ниже брать буквально.

## Границы (что это и чем не является)

Клиентский движок: сценарии хранятся и выполняются **на устройстве**. Запуск — вручную («Запустить сейчас») и при открытии приложения, если подошла дата (с подтверждением пользователя). Серверного оркестратора, фоновых задач и очередей **нет** — это следующий этап, в приложении об этом не обещать.

## Структура файлов

| Файл | Роль |
|---|---|
| `services/workflows/types.ts` | Типы: `Workflow`, `WorkflowBlock`, конфиги блоков, `RunRecord` |
| `services/workflows/blocks.ts` | Метаданные блоков (название, иконка, дефолтный конфиг, краткое описание) |
| `services/workflows/schedule.ts` | `isDue(workflow, now)` |
| `services/workflows/engine.ts` | `runWorkflow()` — последовательное выполнение, контекст, замок |
| `stores/workflowStore.ts` | zustand + AsyncStorage: сценарии и журнал запусков |
| `app/(tabs)/automation.tsx` | Список сценариев |
| `app/workflow/[id].tsx` | Редактор цепочки |
| `app/journal.tsx` | Журнал запусков + PDF |
| `components/workflows/BlockEditSheet.tsx` | Модалка настройки блока |
| `services/workflows/useAutoRun.ts` | Проверка «пора запускать» при старте и возврате в приложение |

Новые зависимости не добавлять.

## Модель данных

```
Workflow { id, name, active, blocks: WorkflowBlock[], createdAt, lastRunAt? }
WorkflowBlock { id, type: 'trigger'|'calc'|'compliance'|'payment'|'notify'|'ledger', config }
RunRecord { id, workflowId, workflowName, startedAt, manual, status: 'success'|'failed',
            steps: { blockId, type, status: 'ok'|'fail', message }[],
            payment?: { token, amount, to, signature }, notifications: string[], error? }
```

Ключи AsyncStorage: `gvardpay_workflows`, `gvardpay_workflow_runs`. Журнал хранит последние 100 запусков.

## Блоки: конфиги и семантика

| Блок | config | Что делает |
|---|---|---|
| trigger | `mode: 'monthly'\|'manual'`, `dayOfMonth` (1–28), `hour` (0–23) | `monthly`: «пора», если сегодня `dayOfMonth`, час ≥ `hour`, в этом месяце ещё не запускался. При ручном запуске проверка даты пропускается |
| calc | `amount`, `currency: 'SOL'\|'USD'\|'KZT'` | Кладёт в контекст `value`. KZT→USD по реальному курсу (CoinGecko, `getUsdKztRate`) |
| compliance | `maxUsd`, `allowedAddresses: string` (через пробел/запятую/перенос, может быть пустым) | Смотрит на следующий блок `payment`: адрес валиден, входит в список (если список не пуст), сумма в USD ≤ `maxUsd`. Иначе — ошибка, цепочка останавливается **до** платежа |
| payment | `token: 'SOL'\|'USDC'\|'USDT'`, `recipient`, `amount` (запасная, если нет calc) | `sendSOL` / `sendSPLToken` из `services/solana/tokens.ts`. Mint по сети как в `payments.tsx`; USDC/USDT на localnet — ошибка |
| notify | `message` | Добавляет в `notifications` запуска; после запуска показывается `Alert`. Системных push нет |
| ledger | — | Помечает запуск как учтённый, пишет сообщение в шаги. PDF формируется из журнала по кнопке |

Порядок выполнения — по порядку в массиве. Ошибка блока → его статус `fail`, остальные не выполняются, запуск `failed` и всё равно сохраняется в журнал.

## Защита денег (обязательно)

- Ручной запуск и автозапуск **всегда** через `Alert` с подтверждением и перечнем: сценарий, сумма, токен, адрес (сокращённо).
- Один запуск за раз: `runLock` (module-level) в `engine.ts`, второй вызов отклоняется. Платёж дополнительно под замком `withSendLock` из `tokens.ts` — не обходить.
- Автозапуск **не отправляет молча**: только предлагает выполнить.
- Комплаенс — только лимит и список адресов. Санкционный скрининг не реализован, в UI не называть «проверкой по санкционным спискам».

## UI — точные значения

Цвета (все из `constants/colors.ts`, hex не писать руками): фон `background`, карточки/блоки `surface`, иконочная плашка `surfaceLight`, граница `border` (толщина `0.5`), текст `textPrimary`/`textSecondary`, акцент `accent`, успех `success`, ошибка `error`.

| Элемент | Значение |
|---|---|
| Карточка сценария | `surface`, border 0.5, radius 12, padding 14, отступ снизу 10 |
| Бейдж статуса | 11px/500, radius 6, padding 3×8; «Активен»: фон `successGlow`, текст `success`; «Пауза»: фон `surfaceLight`, текст `textSecondary` |
| Блок в цепочке | `surface`, border 0.5, radius 12, padding 11×12, gap 11 |
| Плашка иконки блока | 34×34, radius 9, `surfaceLight`; картинка 20×20 из `ICONS.block*` |
| Тип блока | 11px/500 `textSecondary`; заголовок 13.5px/500; описание 11.5px `textSecondary` |
| Соединитель | ширина 1, высота 14, `border`, отступ слева 29 |
| Состояния блока при запуске | run: border `accent` + вращающийся индикатор; ok: border `success` (с прозрачностью 0.5) + галочка; fail: border `error` + крестик |
| Кнопка «Запустить сейчас» | `accent`, radius 10, padding 12, 13px/500 |
| Результат запуска | успех: фон `successGlow`, border `success` с прозрачностью, текст `success`; ошибка — то же с `error` |

Иконки блоков и вкладки — только через `constants/icons.ts` (`blockTrigger`, `blockCalc`, `blockCompliance`, `blockPayment`, `blockNotify`, `blockLedger`, `tabAutomation`), файлы в `assets/icons/`.

## Что НЕ делать

- Не добавлять `expo-notifications`, `expo-task-manager`, background fetch и любые новые нативные зависимости до первой успешной сборки.
- Не писать в UI и в тексте для инвесторов, что платежи выполняются «по расписанию в фоне» — это не так на клиенте.
- Не отправлять платёж без подтверждения пользователя ни в каком режиме.
- Не менять `sendSOL`/`sendSPLToken` и их замок.
- Не использовать `LinearGradient`, тени, `1px`-границы, `fontWeight` выше `500`.
- Не хранить в сценариях приватные ключи; только адреса и числа.
- Не переименовывать существующие ключи хранилища кошелька.
