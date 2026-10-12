# GvardPay — как собрать приложение для iOS и Android

Результат — самостоятельное приложение: ставится на телефон как обычное, не требует Expo Go и dev-сервера (`npx expo start`). Команды ниже — для Mac. Android можно собирать и на Windows (отмечено отдельно), iOS — только на Mac.

## 0. Выбери путь

| Цель | Путь | Что нужно | Платно |
|---|---|---|---|
| Показать с экрана Mac | iOS-симулятор (раздел 3A) | Xcode | нет |
| Свой iPhone | iOS по кабелю (3B) | Xcode, Apple ID, кабель | нет (подпись живёт 7 дней) |
| iPhone других людей | TestFlight / ad-hoc (3C) | Apple Developer Program | $99/год |
| Android, быстро и без установки SDK | APK в облаке EAS (4A) | аккаунт expo.dev | нет (есть лимит сборок и очередь) |
| Android без аккаунтов | APK локально (4B) | JDK 17, Android Studio | нет |

Для первого показа проще всего: симулятор на Mac + APK на Android.

## 1. Подготовка проекта (один раз)

```bash
unzip gvardpay-fixes-*.zip -d gvardpay && cd gvardpay      # или поверх существующей папки
rm -rf ios android node_modules/.cache                       # старые нативные папки от Payfinity удалить обязательно
npm install
cp .env.example .env
```

Проект переименован (GvardPay, `com.gvardpay.app`). Если папка `ios/` осталась от старой попытки, Xcode будет собирать проект с прежним именем и идентификатором. Её нужно удалить: при следующей сборке она создастся заново.

## 2. Адрес узла и флаги

**Адрес локального валидатора (Localnet) задаётся в самом приложении**, пересобирать при смене сети не нужно:
Настройки → «Локальный узел» → ввести `IP:порт` (например `192.168.1.23:8899`) → «Проверить» → «Сохранить». Адрес сохраняется на телефоне. То же можно сделать командой `rpc 192.168.1.23:8899` в dev-консоли.

- IP ноутбука: `ipconfig getifaddr en0` (Mac, Wi-Fi). Для iOS-симулятора `127.0.0.1:8899`, для Android-эмулятора `10.0.2.2:8899`.
- Кнопка «Проверить» проверяет **две вещи**: HTTP-порт узла (8899) и WebSocket (8900). Если WebSocket недоступен, баланс будет открываться, а переводы зависать на подтверждении.
- Только Devnet: ничего вводить не нужно, Localnet просто не используется.

В `.env` остаются только **значения по умолчанию**, которые вшиваются в сборку:

```
EXPO_PUBLIC_LOCAL_RPC_URL=http://127.0.0.1:8899     # стартовый адрес, потом меняется в Настройках
EXPO_PUBLIC_DEBUG_CONSOLE=0                          # 1 = показывать dev-консоль на демо (команда add)
```

Файл `.env` можно вообще не создавать. Если ты всё же меняешь его, учти ловушку, которую я воспроизвёл: Metro кэширует вшитые значения, и без очистки кэша в билде останется **старое** значение. Перед сборкой после правки `.env`:

```bash
rm -rf "$TMPDIR"/metro-* node_modules/.cache      # Mac; на Windows: удалить %TEMP%\metro-*
```

Для облачной сборки EAS значения по умолчанию задаются в `eas.json` внутри профиля (см. 4A).

## 2b. Валидатор (только для Localnet)

В отдельном терминале, оставить открытым:

```bash
solana-test-validator --bind-address 0.0.0.0
```

Firewall должен пропустить входящие. Телефон и ноутбук в одной Wi-Fi сети (не гостевой). Пополнение кошелька: dev-консоль, `add 10`.

## 3. iOS

### 3A. Симулятор (без подписи и аккаунтов)

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
sudo xcodebuild -license accept
npx expo run:ios --configuration Release
```

Первая сборка идёт долго (CocoaPods, компиляция), обычно 10–20 минут. Если CocoaPods не установлен: `brew install cocoapods` и повторить команду. Собирается Release: JS внутри приложения, Metro не нужен.

### 3B. Свой iPhone по кабелю (бесплатный Apple ID)

1. Xcode → Settings → Accounts → «+» → войти своим Apple ID (появится «Personal Team»).
2. `npx expo prebuild --platform ios` (создаст `ios/`), затем `open ios/GvardPay.xcworkspace` (именно `.xcworkspace`).
3. Проект GvardPay → target GvardPay → Signing & Capabilities → включить **Automatically manage signing**, Team = Personal Team.
4. Если пишет, что идентификатор занят: в `app.json` смени `bundleIdentifier` на свой уникальный (например `com.chingiz.gvardpay`), затем `rm -rf ios && npx expo prebuild --platform ios` и снова шаг 3.
5. iPhone: подключить кабелем → «Доверять»; Настройки → Конфиденциальность и безопасность → **Режим разработчика** → включить (перезагрузка).
6. `npx expo run:ios --device --configuration Release`.
7. При первом запуске: Настройки → Основные → VPN и управление устройством → твой Apple ID → Доверять.

Подпись бесплатного аккаунта действует 7 дней: за день до показа пересобери приложение.

На iOS 14+ при первом обращении к локальной сети появится системный запрос «разрешить доступ к локальной сети» — нужно нажать «Разрешить», иначе Localnet недоступен.

### 3C. Для других iPhone (платно)

Нужен Apple Developer Program ($99/год). Дальше один из двух вариантов: TestFlight (`eas build -p ios --profile ios-device`, затем `eas submit -p ios`) либо ad-hoc: зарегистрировать UDID устройств (`eas device:create`) и собрать тем же профилем. Подробности EAS спросит интерактивно.

## 4. Android

### 4A. APK в облаке EAS (ничего ставить не нужно)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile android-apk
```

Первый запуск предложит создать EAS-проект — согласиться. Через 10–25 минут (очередь на бесплатном тарифе) придёт ссылка и QR на APK: открыть на Android-телефоне, скачать, разрешить установку из этого источника.

Адрес валидатора вшивать не нужно: он вводится в приложении (раздел 2). В облачной сборке `.env` не считается надёжным каналом, поэтому значения по умолчанию (например, показ dev-консоли на демо) задаются в `eas.json` внутри профиля:

```json
"android-apk": {
  "distribution": "internal",
  "android": { "buildType": "apk" },
  "env": { "EXPO_PUBLIC_DEBUG_CONSOLE": "1" }
}
```

Замечание: механизм `env` в профилях EAS описан в документации EAS, в этой песочнице я его не запускал.

### 4B. APK локально (без аккаунтов)

Один раз: JDK 17 (`brew install --cask zulu@17`), Android Studio (SDK ставится через него), переменные в `~/.zshrc`:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
```

Сборка:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease          # Windows: gradlew.bat assembleRelease
```

Готовый файл: `android/app/build/outputs/apk/release/app-release.apk`. На телефон: `adb install app-release.apk` (по кабелю, включить «Отладку по USB») или просто передать файл и открыть. Release-сборка по умолчанию подписывается debug-ключом: для показа и установки по ссылке этого достаточно, для публикации в Google Play нужен свой ключ.

Если Gradle пишет `SDK location not found`: создай `android/local.properties` со строкой `sdk.dir=/Users/<ты>/Library/Android/sdk`.

## 5. Чек-лист перед каждой сборкой

- [ ] `EXPO_PUBLIC_DEBUG_CONSOLE` выставлен как нужно (1 только для демо с пополнением кошелька).
- [ ] Кэш Metro очищен, если `.env` менялся (команда в разделе 2).
- [ ] Валидатор запущен с `--bind-address 0.0.0.0`, firewall разрешил.
- [ ] На месте показа: Настройки → Локальный узел → адрес ноутбука → «Проверить»: обе строки (HTTP и WebSocket) с галочкой.
- [ ] Иконки заменены: `assets/icon.png`, `assets/splash-icon.png`, `assets/icons/logo.png` и остальные в `assets/icons/`.
- [ ] Кошелёк на демо пополнен заранее, один тестовый перевод сделан за день до показа (публичный devnet-faucet часто отказывает).
- [ ] `ios/` и `android/` удалены, если менялись `app.json`, плагины или идентификатор.

## 6. Частые ошибки

| Сообщение | Причина и решение |
|---|---|
| `No Accounts` / `No profiles for 'com.gvardpay.app'` | Не добавлен Apple ID или не выбрана Team: раздел 3B, шаги 1–3 |
| `Failed to register bundle identifier` | Идентификатор занят в мире: смени `bundleIdentifier`, пересоздай `ios/` (3B, шаг 4) |
| `xcrun is not configured correctly` | Команды `xcode-select` и `xcodebuild` из 3A |
| `CocoaPods not installed` | `brew install cocoapods` |
| iPhone: «ненадёжный разработчик» | Настройки → Основные → VPN и управление устройством → Доверять |
| Приложение не запускается на iPhone | Не включён Режим разработчика |
| `SDK location not found` (Android) | `android/local.properties`, см. 4B |
| Приложение открывается, но «не видит валидатор» | Настройки → Локальный узел → «Проверить», по строке ошибки видно причину. Частые: неверный IP (сменилась сеть, введи новый), валидатор без `--bind-address 0.0.0.0`, firewall, другая Wi-Fi сеть, на iOS не принят запрос локальной сети |
| Переводы зависают на «подтверждении» | В проверке строка про WebSocket с крестиком: закрыт порт 8900 |
| Стартовый адрес из `.env` в билде не тот | Кэш Metro, раздел 2 (адрес, введённый в Настройках, от этого не зависит) |

## 7. Что проверено, а что нет

Проверено в песочнице: нативные проекты iOS и Android генерируются без ошибок (`expo prebuild`); имя `GvardPay`, bundle id/package `com.gvardpay.app`, cleartext-HTTP для Android и строка про локальную сеть для iOS присутствуют; микрофон не запрашивается; JS-бандл собирается; значения `.env` вшиваются в бандл, а устаревший кэш Metro их перекрывает (отсюда правило в разделе 2). Адрес узла в Настройках: нормализация ввода, проверки HTTP и WebSocket на реальных локальных серверах (исправный, отстающий, не-Solana, зависший, с закрытым портом), сохранение между запусками и применение до первого подключения.

Не проверено (в песочнице нет Xcode, Android SDK и доступа к EAS): сами сборки, подпись, установка на устройство, связь с реальным валидатором. Первый реальный билд за тобой: если что-то упадёт, пришли текст ошибки целиком.
