# Правки мета в Sanity — для владельца

Из свежего краула (baseline-2026-08-27.csv): 8 заголовков статей длиннее 60 символов
(обрезаются в сниппете) и одно описание длиннее 160. Всё это — поля `title_en` /
`title_es` / `description_es` в Sanity Studio; write-токена у агента нет и не должно быть.

Суффикс « — Ve7as» добавляет шаблон (8 симв.), поэтому лимит поля — 52 символа.
Замены предложены готовыми — можно копировать как есть или править на свой вкус.

| Статья | Поле | Сейчас (длина с суффиксом) | Предложение (длина с суффиксом) |
|---|---|---|---|
| esports-betting-basics | title_en | Esports betting: how it differs from traditional betting (64) | Esports betting vs traditional sports betting (54) |
| football-betting-basics | title_en | Football betting: where to start with understanding odds (64) | Football betting: understanding the odds (49) |
| how-to-develop-igaming-slots | title_en | How Are Slots Created? Secrets of iGaming Development & RNG (67) | How online slots are developed: RNG, math, design (57) |
| poker-formats-guide | title_en | Poker formats: how Texas Hold'em, Omaha, and Stud differ (64) | Poker formats: Hold'em, Omaha and Stud (46) |
| blackjack-basic-strategy | title_es | Blackjack: qué es la estrategia básica y para qué sirve (63) | Blackjack: la estrategia básica explicada (49) |
| esports-betting-basics | title_es | Apuestas en eSports: en qué se diferencian de las apuestas deportivas clásicas (86) | Apuestas en eSports: en qué se diferencian (50) |
| football-betting-basics | title_es | Apuestas de fútbol: por dónde empezar a entender las cuotas (67) | Apuestas de fútbol: cómo leer las cuotas (48) |
| lottery-formats-overview | title_es | Cómo funcionan las loterías: formatos, probabilidades y mitos habituales (80) | Loterías: formatos, probabilidades y mitos (50) |
| poker-formats-guide | title_es | Formatos de póquer: en qué se diferencian el Texas Hold'em, la Omaha y el Stud (86) | Formatos de póquer: Hold'em, Omaha y Stud (49) |
| esports-betting-basics | description_es | (168 симв.) | Dota 2, CS2, LoL: particularidades de cada disciplina, formatos de torneo y qué debe saber un principiante antes de apostar en eSports. (135) |

Кодовая часть той же находки (M4) уже исправлена агентом и не требует действий:
title главной теперь из tagline, у FAQ собственное description, frontmatter
about/privacy/terms en+es приведён к 70–160.

Заодно (та же сессия в Studio): слаг `how-to-develop-igaming-slots` с U+2060 —
перенабрать руками, это разблокирует перелинковку двух ТЗ и уберёт последний orphan.
