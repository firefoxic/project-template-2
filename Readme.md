# Личный проект «Cat Energy»

[![Project check][check-image]][check-url]

* Студент: [Неопознанный енот](https://up.htmlacademy.ru/adaptive/27/user/000000000000).
* Наставник: [Сергей Артёмов](https://htmlacademy.ru/profile/firefoxic).

---

В корне проекта находятся только его конфиги. А также [Contributing.md](Contributing.md) — полезное руководство по внесению изменений.

**Исходные файлы вёрстки должны лежать в `source/`.**

Собирается проект в `build/`.

---

## Установка зависимостей проекта

Сложная сборка в этом проекте не заведётся без дополнительных инструментов — зависимостей. Поэтому их необходимо установить.

### 1. Терминал

Для установки зависимостей понадобится терминал. В Linux и macOS он уже есть, а в Windows лучше установить _git-bash_, который идёт в комплекте с самим [Git](https://git-scm.com/download/windows).

### 2. Node.js

Зависимости работают в среде _node.js_, которую тоже нужно установить, но лучше не с помощью установщика с официального сайта, а через менеджер версий ноды — _nvm_: для [Linux и macOS](https://github.com/nvm-sh/nvm#install--update-script) и для [Windows](https://github.com/coreybutler/nvm-windows/releases).

После установки _nvm_ выполняем установку требуемой в проекте версии ноды:

```shell
nvm install 16.18.1
```

* В Linux после этого достаточно перезапустить терминал.

* В macOS перед перезапуском терминала возможно придётся в файл `~/.zshrc` добавить такие строчки, если они в нём не появились или если файл не существует:

	```bash
	export NVM_DIR="$HOME/.nvm"
	[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
	```

* В Windows нужно закрыть терминал опять его запустить, но уже от имени администратора (даже если пользователь администратор), и выполнить:

	```shell
	nvm use 16.18.1
	```

	Затем закрыть небезопасный терминал.

Снова открываем терминал и проверяем установившуюся версию:

```shell
node -v
```

Если всё хорошо, команда выведет `16.18.1`.

### 3. Зависимости

Вместе с нодой нам стал доступен её менеджер пакетов — _npm_ (не путать с _nvm_!). Он нам нужен в первую очередь для установки зависимости проекта (но не только).

Для этого в терминале, находясь в директории проекта, выполняем (не обращая внимание на предупреждения во время установки):

```shell
npm ci
```

После установки зависимостей можно запускать сборку для разработки:

```shell
npm start
```

При этом запустится и локальный сервер в папке `build/`, в которую собирается проект из папки `source/`, а в брауезере откроется разрабатываемый сайт и будет обновляться при обновлении файлов в проекте.

---

<a href="https://htmlacademy.ru/intensive/adaptive"><img align="left" width="60" height="60" alt="HTML Academy" src="https://raw.githubusercontent.com/htmlacademy-adaptive/000000000000-cat-energy-27/master/source/icons/htmlacademy.svg"></a>

Репозиторий создан для обучения на профессиональном онлайн‑курсе «[HTML и CSS. Адаптивная вёрстка и автоматизация](https://htmlacademy.ru/intensive/adaptive)» от [HTML Academy](https://htmlacademy.ru).

[check-image]: https://github.com/htmlacademy-adaptive/000000000000-cat-energy-27/workflows/Project%20check/badge.svg?branch=master
[check-url]: https://github.com/htmlacademy-adaptive/000000000000-cat-energy-27/actions
