# Japanese UI for Local

**By Kohei Elimi Lab** · [All our add-ons](https://github.com/KouheiIchikawa/kohei-elimi-lab-addons)

Japanese menus, dialogs, notifications and interface translations for Local.

## Compatibility and scope

Developed against Local 10.1.2 on Windows. Other operating systems and Local versions are unverified. The interface is currently Japanese. This is an independent community add-on, not an official Local or WP Engine product.

Japanese UI with English fallback and editable overrides. Uses i18next (MIT); its license is included with the dependency. Existing site content is not translated. Local interface changes may require dictionary or adapter updates.

## Install

Download the `local-japanese` ZIP from [Releases](https://github.com/KouheiIchikawa/local-japanese/releases/latest). Quit Local before installation. Extract the ZIP into `%APPDATA%\Local\addons` so that `addons/local-japanese/package.json` exists (avoid an extra nested folder). Restart Local, then enable the add-on in Add-ons if needed. Keep a copy of an existing installation before replacing it. To uninstall, quit Local and remove only this add-on directory; your sites are separate.

The Japanese UI release ZIP includes its production dependency. For a source checkout of that add-on, run `npm ci --omit=dev --ignore-scripts` first. The other add-ons have no bundled npm dependencies.

## 日本語

Kohei Elimi Lab 制作のLocal向けアドオンです。Local本体やWordPressプラグインではありません。ZIPを展開して `%APPDATA%\Local\addons\local-japanese` に配置し、Localを再起動して有効化します。公開前の確認は構文・パッケージ内容と限定的な動作検証です。すべての環境での動作を保証するものではありません。

## Privacy and license

No analytics or developer telemetry. Git Deploy communicates with your configured GitHub repository using your existing CLI authentication. Japanese UI probes the local router for site readiness. Local settings, credentials, site files, PHP service snapshots and private deployment profiles are not distributed in this release. MIT for original code; third-party notices remain applicable.

© 2026 Kohei Elimi Lab
