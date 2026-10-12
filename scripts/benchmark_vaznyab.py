#!/usr/bin/env python3
"""
scripts/benchmark_vaznyab.py

Rigorous benchmarking and reverse-engineering probe for the NoSokhan VaznYab
Persian scansion engine (http://138.68.4.203/vazn/<verse>) vs ScanFa.
"""

import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.path.join(ROOT, "scratch")
RESULTS_JSON = os.path.join(SCRATCH_DIR, "vaznyab_benchmark_results.json")
NODE_SCAN_SCRIPT = os.path.join(SCRATCH_DIR, "scanfa_runner.js")

VAZNYAB_ENDPOINT = "http://138.68.4.203/vazn/"

# ---------------------------------------------------------
# 1. Corpus definition: 88 diverse verses
# ---------------------------------------------------------
CORPUS = [
    # --- Category A: Classical Staples ---
    {
        "id": 1,
        "cat": "classical_staples",
        "poet": "Rumi",
        "source": "Masnavi 1:1",
        "verse": "بشنو این نی چون شکایت می‌کند",
        "expected_gid": 6,
        "expected_urdu": 11,
        "expected_afail": "فاعلاتن فاعلاتن فاعلن",
        "meter_name": "رمل مسدس محذوف یا وزن مثنوی",
    },
    {
        "id": 2,
        "cat": "classical_staples",
        "poet": "Rumi",
        "source": "Masnavi 1:2",
        "verse": "کز جدایی‌ها حکایت می‌کند",
        "expected_gid": 6,
        "expected_urdu": 11,
        "expected_afail": "فاعلاتن فاعلاتن فاعلن",
        "meter_name": "رمل مسدس محذوف یا وزن مثنوی",
    },
    {
        "id": 3,
        "cat": "classical_staples",
        "poet": "Rumi",
        "source": "Divan-e Shams",
        "verse": "ای عاشقان ای عاشقان من خاک را گوهر کنم",
        "expected_gid": 16,
        "expected_urdu": 3,
        "expected_afail": "مستفعلن مستفعلن مستفعلن مستفعلن",
        "meter_name": "رجز مثمن سالم",
    },
    {
        "id": 4,
        "cat": "classical_staples",
        "poet": "Rumi",
        "source": "Divan-e Shams",
        "verse": "مرده بدم زنده شدم گریه بدم خنده شدم",
        "expected_gid": 17,
        "expected_urdu": 25,
        "expected_afail": "مفتعلن مفاعلن مفتعلن مفاعلن",
        "meter_name": "رجز مثمن مطوی مخبون",
    },
    {
        "id": 5,
        "cat": "classical_staples",
        "poet": "Rumi",
        "source": "Divan-e Shams",
        "verse": "من غلام قمرم غیر قمر هیچ مگو",
        "expected_gid": 7,
        "expected_urdu": 18,
        "expected_afail": "فعلاتن فعلاتن فعلاتن فعلن",
        "meter_name": "رمل مثمن مخبون محذوف",
    },
    {
        "id": 6,
        "cat": "classical_staples",
        "poet": "Hafez",
        "source": "Ghazal 1:1",
        "verse": "الا یا ایها الساقی ادر کأسا و ناولها",
        "expected_gid": 1,
        "expected_urdu": 5,
        "expected_afail": "مفعول فاعلات مفاعیل فاعلن",
        "meter_name": "مضارع مثمن اخرب مکفوف محذوف",
    },
    {
        "id": 7,
        "cat": "classical_staples",
        "poet": "Hafez",
        "source": "Ghazal 1:2",
        "verse": "که عشق آسان نمود اول ولی افتاد مشکل‌ها",
        "expected_gid": 1,
        "expected_urdu": 5,
        "expected_afail": "مفعول فاعلات مفاعیل فاعلن",
        "meter_name": "مضارع مثمن اخرب مکفوف محذوف",
    },
    {
        "id": 8,
        "cat": "classical_staples",
        "poet": "Hafez",
        "source": "Ghazal 3:1 (Shirazi)",
        "verse": "اگر آن ترک شیرازی به دست آرد دل ما را",
        "expected_gid": 2,
        "expected_urdu": 26,
        "expected_afail": "مفاعیلن مفاعیلن مفاعیلن مفاعیلن",
        "meter_name": "هزج مثمن سالم",
    },
    {
        "id": 9,
        "cat": "classical_staples",
        "poet": "Hafez",
        "source": "Ghazal 3:2",
        "verse": "به خال هندویش بخشم سمرقند و بخارا را",
        "expected_gid": 2,
        "expected_urdu": 26,
        "expected_afail": "مفاعیلن مفاعیلن مفاعیلن مفاعیلن",
        "meter_name": "هزج مثمن سالم",
    },
    {
        "id": 10,
        "cat": "classical_staples",
        "poet": "Hafez",
        "source": "Ghazal 5:1",
        "verse": "دل می‌رود ز دستم صاحب‌دلان خدا را",
        "expected_gid": 4,
        "expected_urdu": 4,
        "expected_afail": "مفعول فاعلاتن مفعول فاعلاتن",
        "meter_name": "مضارع مثمن اخرب",
    },
    {
        "id": 11,
        "cat": "classical_staples",
        "poet": "Hafez",
        "source": "Ghazal 5:2",
        "verse": "دردا که راز پنهان خواهد شد آشکارا",
        "expected_gid": 4,
        "expected_urdu": 4,
        "expected_afail": "مفعول فاعلاتن مفعول فاعلاتن",
        "meter_name": "مضارع مثمن اخرب",
    },
    {
        "id": 12,
        "cat": "classical_staples",
        "poet": "Hafez",
        "source": "Ghazal 184:1",
        "verse": "دوش دیدم که ملایک در میخانه زدند",
        "expected_gid": 7,
        "expected_urdu": 18,
        "expected_afail": "فعلاتن فعلاتن فعلاتن فعلن",
        "meter_name": "رمل مثمن مخبون محذوف",
    },
    {
        "id": 13,
        "cat": "classical_staples",
        "poet": "Hafez",
        "source": "Ghazal 374:1",
        "verse": "بیا تا گل برافشانیم و می در ساغر اندازیم",
        "expected_gid": 2,
        "expected_urdu": 26,
        "expected_afail": "مفاعیلن مفاعیلن مفاعیلن مفاعیلن",
        "meter_name": "هزج مثمن سالم",
    },
    {
        "id": 14,
        "cat": "classical_staples",
        "poet": "Saadi",
        "source": "Bani Adam 1",
        "verse": "بنی آدم اعضای یکدیگرند",
        "expected_gid": 23,
        "expected_urdu": 29,
        "expected_afail": "فعولن فعولن فعولن فعل",
        "meter_name": "متقارب مثمن محذوف",
    },
    {
        "id": 15,
        "cat": "classical_staples",
        "poet": "Saadi",
        "source": "Bani Adam 2",
        "verse": "که در آفرینش ز یک گوهرند",
        "expected_gid": 23,
        "expected_urdu": 29,
        "expected_afail": "فعولن فعولن فعولن فعل",
        "meter_name": "متقارب مثمن محذوف",
    },
    {
        "id": 16,
        "cat": "classical_staples",
        "poet": "Saadi",
        "source": "Ghazal 268:1",
        "verse": "ای ساربان آهسته ران کارام جانم می‌رود",
        "expected_gid": 16,
        "expected_urdu": 3,
        "expected_afail": "مستفعلن مستفعلن مستفعلن مستفعلن",
        "meter_name": "رجز مثمن سالم",
    },
    {
        "id": 17,
        "cat": "classical_staples",
        "poet": "Saadi",
        "source": "Ghazal 268:2",
        "verse": "وان دل که با خود داشتم با دلستانم می‌رود",
        "expected_gid": 16,
        "expected_urdu": 3,
        "expected_afail": "مستفعلن مستفعلن مستفعلن مستفعلن",
        "meter_name": "رجز مثمن سالم",
    },
    {
        "id": 18,
        "cat": "classical_staples",
        "poet": "Saadi",
        "source": "Ghazal 273:1",
        "verse": "سعدیا مرد نکونام نمیرد هرگز",
        "expected_gid": 7,
        "expected_urdu": 18,
        "expected_afail": "فعلاتن فعلاتن فعلاتن فعلن",
        "meter_name": "رمل مثمن مخبون محذوف",
    },
    {
        "id": 19,
        "cat": "classical_staples",
        "poet": "Saadi",
        "source": "Bustan Dibache",
        "verse": "به نام خداوند جان آفرین",
        "expected_gid": 23,
        "expected_urdu": 29,
        "expected_afail": "فعولن فعولن فعولن فعل",
        "meter_name": "متقارب مثمن محذوف",
    },
    {
        "id": 20,
        "cat": "classical_staples",
        "poet": "Saadi",
        "source": "Ghazal 166 (Persian F26)",
        "verse": "هر که چیزی دوست دارد جان و دل بر وی گمارد",
        "expected_gid": 26,
        "expected_urdu": None,
        "expected_afail": "فاعلاتن فاعلاتن فاعلاتن فاعلاتن",
        "meter_name": "رمل مثمن سالم",
    },
    {
        "id": 21,
        "cat": "classical_staples",
        "poet": "Ferdowsi",
        "source": "Shahnameh 1:1",
        "verse": "به نام خداوند جان و خرد",
        "expected_gid": 23,
        "expected_urdu": 29,
        "expected_afail": "فعولن فعولن فعولن فعل",
        "meter_name": "متقارب مثمن محذوف یا وزن شاهنامه",
    },
    {
        "id": 22,
        "cat": "classical_staples",
        "poet": "Ferdowsi",
        "source": "Shahnameh 1:2",
        "verse": "کزین برتر اندیشه برنگذرد",
        "expected_gid": 23,
        "expected_urdu": 29,
        "expected_afail": "فعولن فعولن فعولن فعل",
        "meter_name": "متقارب مثمن محذوف یا وزن شاهنامه",
    },
    {
        "id": 23,
        "cat": "classical_staples",
        "poet": "Ferdowsi",
        "source": "Shahnameh",
        "verse": "چو ایران نباشد تن من مباد",
        "expected_gid": 23,
        "expected_urdu": 29,
        "expected_afail": "فعولن فعولن فعولن فعل",
        "meter_name": "متقارب مثمن محذوف یا وزن شاهنامه",
    },
    {
        "id": 24,
        "cat": "classical_staples",
        "poet": "Nizami",
        "source": "Khosrow o Shirin",
        "verse": "خداوندا در توفیق بگشای",
        "expected_gid": 12,
        "expected_urdu": 27,
        "expected_afail": "مفاعیلن مفاعیلن فعولن",
        "meter_name": "هزج مسدس محذوف",
    },
    {
        "id": 25,
        "cat": "classical_staples",
        "poet": "Nizami",
        "source": "Layla o Majnun",
        "verse": "ای نام تو بهترین سرآغاز",
        "expected_gid": 12,
        "expected_urdu": 27,
        "expected_afail": "مفاعیلن مفاعیلن فعولن",
        "meter_name": "هزج مسدس محذوف",
    },
    {
        "id": 26,
        "cat": "classical_staples",
        "poet": "Nizami",
        "source": "Makhzan al-Asrar",
        "verse": "بسم الله الرحمن الرحیم",
        "expected_gid": 19,
        "expected_urdu": 24,
        "expected_afail": "مفتعلن مفتعلن فاعلن",
        "meter_name": "سریع مطوی مکشوف",
    },
    {
        "id": 27,
        "cat": "classical_staples",
        "poet": "Khayyam",
        "source": "Rubaiyat",
        "verse": "ابر آمد و زار بر سر سبزه گریست",
        "expected_gid": 24,
        "expected_urdu": None,
        "expected_afail": "مفعول مفاعیل مفاعیل فعل",
        "meter_name": "وزن رباعی",
    },
    {
        "id": 28,
        "cat": "classical_staples",
        "poet": "Khayyam",
        "source": "Rubaiyat",
        "verse": "بی بادهٔ گلرنگ نمی‌شاید زیست",
        "expected_gid": 24,
        "expected_urdu": None,
        "expected_afail": "مفعول مفاعیل مفاعیل فعل",
        "meter_name": "وزن رباعی",
    },

    # --- Category B: Overlong Syllables (CV̄C & CVCC) ---
    {
        "id": 29,
        "cat": "overlong_medial",
        "poet": "Classical",
        "source": "Medial dūst (CV̄C)",
        "verse": "دوست دارم من نگار نازنین خویش را",
        "expected_gid": 8,
        "expected_urdu": 10,
        "expected_afail": "فاعلاتن فاعلاتن فاعلاتن فاعلن",
        "meter_name": "رمل مثمن محذوف",
    },
    {
        "id": 30,
        "cat": "overlong_final",
        "poet": "Classical",
        "source": "Final dūst (CV̄C)",
        "verse": "ای مهربان تر از من با جان من چو دوست",
        "expected_gid": 1,
        "expected_urdu": 5,
        "expected_afail": "مفعول فاعلات مفاعیل فاعلن",
        "meter_name": "مضارع مثمن اخرب مکفوف محذوف",
    },
    {
        "id": 31,
        "cat": "overlong_final",
        "poet": "Rumi",
        "source": "Final pōst (CV̄C)",
        "verse": "خشک تاری خشک چوبی خشک پوست",
        "expected_gid": 12,
        "expected_urdu": 27,
        "expected_afail": "مفاعیلن مفاعیلن فعولن",
        "meter_name": "هزج مسدس محذوف",
    },
    {
        "id": 32,
        "cat": "overlong_final",
        "poet": "Rumi",
        "source": "Clipped pōs control",
        "verse": "خشک تاری خشک چوبی خشک پوس",
        "expected_gid": 12,
        "expected_urdu": 27,
        "expected_afail": "مفاعیلن مفاعیلن فعولن",
        "meter_name": "هزج مسدس محذوف",
    },
    {
        "id": 33,
        "cat": "overlong_medial",
        "poet": "Classical",
        "source": "Medial nīst (CV̄C)",
        "verse": "نیست اندر چشم عقل اندیشه جز روی او",
        "expected_gid": 8,
        "expected_urdu": 10,
        "expected_afail": "فاعلاتن فاعلاتن فاعلاتن فاعلن",
        "meter_name": "رمل مثمن محذوف",
    },
    {
        "id": 34,
        "cat": "overlong_final",
        "poet": "Saadi",
        "source": "Final nīst (CV̄C)",
        "verse": "جهان پیر رعنا را ترحم در جبلت نیست",
        "expected_gid": 3,
        "expected_urdu": 33,
        "expected_afail": "مفاعلن فعلاتن مفاعلن فعلن",
        "meter_name": "مجتث مثمن مخبون محذوف",
    },
    {
        "id": 35,
        "cat": "overlong_medial",
        "poet": "Hafez",
        "source": "Medial dast (CVCC)",
        "verse": "دست از طلب ندارم تا کام من برآید",
        "expected_gid": 4,
        "expected_urdu": 4,
        "expected_afail": "مفعول فاعلاتن مفعول فاعلاتن",
        "meter_name": "مضارع مثمن اخرب",
    },
    {
        "id": 36,
        "cat": "overlong_final",
        "poet": "Hafez",
        "source": "Final dast (CVCC)",
        "verse": "دل می‌رود ز دستم بر من نهاده دست",
        "expected_gid": 1,
        "expected_urdu": 5,
        "expected_afail": "مفعول فاعلات مفاعیل فاعلن",
        "meter_name": "مضارع مثمن اخرب مکفوف محذوف",
    },
    {
        "id": 37,
        "cat": "overlong_medial",
        "poet": "Classical",
        "source": "Medial rāst (CV̄C)",
        "verse": "راست گویم سر برون آورده‌ام از قعر چاه",
        "expected_gid": 8,
        "expected_urdu": 10,
        "expected_afail": "فاعلاتن فاعلاتن فاعلاتن فاعلن",
        "meter_name": "رمل مثمن محذوف",
    },
    {
        "id": 38,
        "cat": "overlong_medial",
        "poet": "Rumi",
        "source": "Medial bāz (CV̄C)",
        "verse": "باز آمدم چون عید نو تا قفل زندان بشکنم",
        "expected_gid": 16,
        "expected_urdu": 3,
        "expected_afail": "مستفعلن مستفعلن مستفعلن مستفعلن",
        "meter_name": "رجز مثمن سالم",
    },

    # --- Category C: Uncounted Nūn after Long Vowels (CV̄N) ---
    {
        "id": 39,
        "cat": "uncounted_nun",
        "poet": "Rumi",
        "source": "chūn (nūn after ū)",
        "verse": "بشنو این نی چون شکایت می‌کند",
        "expected_gid": 6,
        "expected_urdu": 11,
        "expected_afail": "فاعلاتن فاعلاتن فاعلن",
        "meter_name": "رمل مسدس محذوف",
    },
    {
        "id": 40,
        "cat": "uncounted_nun",
        "poet": "Rumi",
        "source": "chūn with Urdu ghunna (چوں)",
        "verse": "بشنو ایں نی چوں شکایت می کند",
        "expected_gid": 6,
        "expected_urdu": 11,
        "expected_afail": "فاعلاتن فاعلاتن فاعلن",
        "meter_name": "رمل مسدس محذوف",
    },
    {
        "id": 41,
        "cat": "uncounted_nun",
        "poet": "Classical",
        "source": "jān (nūn after ā)",
        "verse": "ای خدا این جان و دل را پاک کن",
        "expected_gid": 19,
        "expected_urdu": 24,
        "expected_afail": "مفتعلن مفتعلن فاعلن",
        "meter_name": "سریع مطوی مکشوف",
    },
    {
        "id": 42,
        "cat": "uncounted_nun",
        "poet": "Hafez",
        "source": "ān medial (nūn after ā)",
        "verse": "در آن حرم که صبا عطر زلف یار آورد",
        "expected_gid": 3,
        "expected_urdu": 33,
        "expected_afail": "مفاعلن فعلاتن مفاعلن فعلن",
        "meter_name": "مجتث مثمن مخبون محذوف",
    },
    {
        "id": 43,
        "cat": "uncounted_nun",
        "poet": "Hafez",
        "source": "ān with Urdu ghunna (آں)",
        "verse": "در آں حرم کہ صبا عطر زلف یار آورد",
        "expected_gid": 3,
        "expected_urdu": 33,
        "expected_afail": "مفاعلن فعلاتن مفاعلن فعلن",
        "meter_name": "مجتث مثمن مخبون محذوف",
    },
    {
        "id": 44,
        "cat": "uncounted_nun",
        "poet": "Hafez",
        "source": "man (short vowel + nūn, counted)",
        "verse": "من که باشم در آن حرم که صبا",
        "expected_gid": 9,
        "expected_urdu": 14,
        "expected_afail": "فعلاتن مفاعلن فعلن",
        "meter_name": "خفیف مسدس مخبون",
    },
    {
        "id": 45,
        "cat": "uncounted_nun",
        "poet": "Jami",
        "source": "tan (short vowel + nūn, counted)",
        "verse": "تن فرسوده جان پاره ز هجران یا رسول الله",
        "expected_gid": 7,
        "expected_urdu": 18,
        "expected_afail": "فعلاتن فعلاتن فعلاتن فعلن",
        "meter_name": "رمل مثمن مخبون محذوف",
    },
    {
        "id": 46,
        "cat": "uncounted_nun",
        "poet": "Classical",
        "source": "īmān (medial CV̄N)",
        "verse": "چو ایمان است در دل جان فدا کن",
        "expected_gid": 12,
        "expected_urdu": 27,
        "expected_afail": "مفاعیلن مفاعیلن فعولن",
        "meter_name": "هزج مسدس محذوف",
    },

    # --- Category D: Liaison & Resyllabification (Alif-e Vasl) ---
    {
        "id": 47,
        "cat": "liaison_alif_vasl",
        "poet": "Classical",
        "source": "dīgar ast (separate)",
        "verse": "سوئے شهر عشق راهی دیگر است",
        "expected_gid": 6,
        "expected_urdu": 11,
        "expected_afail": "فاعلاتن فاعلاتن فاعلن",
        "meter_name": "رمل مسدس محذوف",
    },
    {
        "id": 48,
        "cat": "liaison_alif_vasl",
        "poet": "Classical",
        "source": "dīgarast (joined)",
        "verse": "سوئے شهر عشق راهی دیگرست",
        "expected_gid": 6,
        "expected_urdu": 11,
        "expected_afail": "فاعلاتن فاعلاتن فاعلن",
        "meter_name": "رمل مسدس محذوف",
    },
    {
        "id": 49,
        "cat": "liaison_alif_vasl",
        "poet": "Khaqani",
        "source": "murda ast (separate)",
        "verse": "مرده است عیسی مگر کاین زندگان محشرند",
        "expected_gid": 8,
        "expected_urdu": 10,
        "expected_afail": "فاعلاتن فاعلاتن فاعلاتن فاعلن",
        "meter_name": "رمل مثمن محذوف",
    },
    {
        "id": 50,
        "cat": "liaison_alif_vasl",
        "poet": "Khaqani",
        "source": "murda-st (joined)",
        "verse": "مرده‌ست عیسی مگر کاین زندگان محشرند",
        "expected_gid": 8,
        "expected_urdu": 10,
        "expected_afail": "فاعلاتن فاعلاتن فاعلاتن فاعلن",
        "meter_name": "رمل مثمن محذوف",
    },
    {
        "id": 51,
        "cat": "liaison_alif_vasl",
        "poet": "Hafez",
        "source": "ʿishq āsān (separate)",
        "verse": "که عشق آسان نمود اول ولی افتاد مشکل‌ها",
        "expected_gid": 1,
        "expected_urdu": 5,
        "expected_afail": "مفعول فاعلات مفاعیل فاعلن",
        "meter_name": "مضارع مثمن اخرب مکفوف محذوف",
    },
    {
        "id": 52,
        "cat": "liaison_alif_vasl",
        "poet": "Hafez",
        "source": "ʿishqāsān (phonetic merged)",
        "verse": "که عشقاسان نمود اول ولی افتاد مشکل‌ها",
        "expected_gid": 1,
        "expected_urdu": 5,
        "expected_afail": "مفعول فاعلات مفاعیل فاعلن",
        "meter_name": "مضارع مثمن اخرب مکفوف محذوف",
    },
    {
        "id": 53,
        "cat": "liaison_alif_vasl",
        "poet": "Rumi",
        "source": "bar āmad (separate)",
        "verse": "هر لحظه به شکلی بت عیار بر آمد",
        "expected_gid": 10,
        "expected_urdu": 8,
        "expected_afail": "مفعول مفاعیل مفاعیل فعولن",
        "meter_name": "هزج مثمن اخرب مکفوف محذوف",
    },
    {
        "id": 54,
        "cat": "liaison_alif_vasl",
        "poet": "Rumi",
        "source": "barāmad (joined)",
        "verse": "هر لحظه به شکلی بت عیار برآمد",
        "expected_gid": 10,
        "expected_urdu": 8,
        "expected_afail": "مفعول مفاعیل مفاعیل فعولن",
        "meter_name": "هزج مثمن اخرب مکفوف محذوف",
    },
    {
        "id": 55,
        "cat": "liaison_alif_vasl",
        "poet": "Classical",
        "source": "ham az īn (separate)",
        "verse": "هم از این راه که آمدی برگرد",
        "expected_gid": 9,
        "expected_urdu": 14,
        "expected_afail": "فعلاتن مفاعلن فعلن",
        "meter_name": "خفیف مسدس مخبون",
    },

    # --- Category E: Flexible Monosyllables (ke, che, to, cho, ze, beh) ---
    {
        "id": 56,
        "cat": "flexible_monosyllables",
        "poet": "Classical",
        "source": "to (scanned short)",
        "verse": "تو نه چنانی که منم من نه چنانم که تویی",
        "expected_gid": 7,
        "expected_urdu": 18,
        "expected_afail": "فعلاتن فعلاتن فعلاتن فعلن",
        "meter_name": "رمل مثمن مخبون محذوف",
    },
    {
        "id": 57,
        "cat": "flexible_monosyllables",
        "poet": "Saadi",
        "source": "to (scanned long)",
        "verse": "گر تو پنداری که من بی تو صبوری می‌کنم",
        "expected_gid": 7,
        "expected_urdu": 18,
        "expected_afail": "فعلاتن فعلاتن فعلاتن فعلن",
        "meter_name": "رمل مثمن مخبون محذوف",
    },
    {
        "id": 58,
        "cat": "flexible_monosyllables",
        "poet": "Hafez",
        "source": "ke (scanned long)",
        "verse": "دیر است که دلدار پیامی نفرستاد",
        "expected_gid": 10,
        "expected_urdu": 8,
        "expected_afail": "مفعول مفاعیل مفاعیل فعولن",
        "meter_name": "هزج مثمن اخرب مکفوف محذوف",
    },
    {
        "id": 59,
        "cat": "flexible_monosyllables",
        "poet": "Khusrau / Bu Ali",
        "source": "ke (scanned short)",
        "verse": "ندانم که منزل چه بود شب جایی که من بودم",
        "expected_gid": 2,
        "expected_urdu": 26,
        "expected_afail": "مفاعیلن مفاعیلن مفاعیلن مفاعیلن",
        "meter_name": "هزج مثمن سالم",
    },
    {
        "id": 60,
        "cat": "flexible_monosyllables",
        "poet": "Classical",
        "source": "che / bahre che",
        "verse": "از کجا آمده‌ام آمدنم بهر چه بود",
        "expected_gid": 7,
        "expected_urdu": 18,
        "expected_afail": "فعلاتن فعلاتن فعلاتن فعلن",
        "meter_name": "رمل مثمن مخبون محذوف",
    },
    {
        "id": 61,
        "cat": "flexible_monosyllables",
        "poet": "Hafez",
        "source": "cho",
        "verse": "چو بشنوی سخن اهل دل مگو که خطاست",
        "expected_gid": 3,
        "expected_urdu": 33,
        "expected_afail": "مفاعلن فعلاتن مفاعلن فعلن",
        "meter_name": "مجتث مثمن مخبون محذوف",
    },
    {
        "id": 62,
        "cat": "flexible_monosyllables",
        "poet": "Baba Taher",
        "source": "ze",
        "verse": "ز دست دیده و دل هر دو فریاد",
        "expected_gid": 12,
        "expected_urdu": 27,
        "expected_afail": "مفاعیلن مفاعیلن فعولن",
        "meter_name": "هزج مسدس محذوف",
    },
    {
        "id": 63,
        "cat": "flexible_monosyllables",
        "poet": "Hafez",
        "source": "beh",
        "verse": "به مژگان سیه کردی هزاران رخنه در دینم",
        "expected_gid": 2,
        "expected_urdu": 26,
        "expected_afail": "مفاعیلن مفاعیلن مفاعیلن مفاعیلن",
        "meter_name": "هزج مثمن سالم",
    },

    # --- Category F: Silent Waw (Vāv-e Ma'dūla) ---
    {
        "id": 64,
        "cat": "silent_waw",
        "poet": "Rumi",
        "source": "khwud (خود = khud)",
        "verse": "هر چه خود خواهی همان گوید به تو",
        "expected_gid": 6,
        "expected_urdu": 11,
        "expected_afail": "فاعلاتن فاعلاتن فاعلن",
        "meter_name": "رمل مسدس محذوف",
    },
    {
        "id": 65,
        "cat": "silent_waw",
        "poet": "Classical",
        "source": "khwāhī (خواهی = khāhī)",
        "verse": "خواهی که رستگار شوی راست‌کار باش",
        "expected_gid": 1,
        "expected_urdu": 5,
        "expected_afail": "مفعول فاعلات مفاعیل فاعلن",
        "meter_name": "مضارع مثمن اخرب مکفوف محذوف",
    },
    {
        "id": 66,
        "cat": "silent_waw",
        "poet": "Simin Behbahani",
        "source": "khwēsh (خویش = khēsh)",
        "verse": "ز آبی آسمان خویش",
        "expected_gid": 23,
        "expected_urdu": 29,
        "expected_afail": "فعولن فعولن فعولن فعل",
        "meter_name": "متقارب",
    },
    {
        "id": 67,
        "cat": "silent_waw",
        "poet": "Khayyam",
        "source": "khwāb (خواب = khāb)",
        "verse": "در خواب بدم مرا خردمندی گفت",
        "expected_gid": 24,
        "expected_urdu": None,
        "expected_afail": "مفعول مفاعیل مفاعیل فعل",
        "meter_name": "وزن رباعی",
    },
    {
        "id": 68,
        "cat": "silent_waw",
        "poet": "Hafez",
        "source": "khwush (خوشا = khoshā)",
        "verse": "خوشا شیراز و وضع بی‌مثالش",
        "expected_gid": 12,
        "expected_urdu": 27,
        "expected_afail": "مفاعیلن مفاعیلن فعولن",
        "meter_name": "هزج مسدس محذوف",
    },
    {
        "id": 69,
        "cat": "silent_waw",
        "poet": "Khayyam",
        "source": "khwardan (غم خوردن = khordan)",
        "verse": "غم خوردن جهان مکن و شاد زی چو برق",
        "expected_gid": 4,
        "expected_urdu": 4,
        "expected_afail": "مفعول فاعلاتن مفعول فاعلاتن",
        "meter_name": "مضارع مثمن اخرب",
    },

    # --- Category G: Mustazād & Rubāʿī Variations ---
    {
        "id": 70,
        "cat": "mustazad",
        "poet": "Rumi",
        "source": "Mustazad main line only",
        "verse": "هر لحظه به شکلی بت عیار بر آمد",
        "expected_gid": 10,
        "expected_urdu": 8,
        "expected_afail": "مفعول مفاعیل مفاعیل فعولن",
        "meter_name": "هزج مثمن اخرب مکفوف محذوف",
    },
    {
        "id": 71,
        "cat": "mustazad",
        "poet": "Rumi",
        "source": "Mustazad line + tail",
        "verse": "هر لحظه به شکلی بت عیار بر آمد دل برد و نهان شد",
        "expected_gid": 10,
        "expected_urdu": 8,
        "expected_afail": "مفعول مفاعیل مفاعیل فعولن",
        "meter_name": "مستزاد هزج",
    },
    {
        "id": 72,
        "cat": "rubai",
        "poet": "Khayyam",
        "source": "Rubai akhrab branch 1",
        "verse": "این چرخ فلک که ما در او حیرانیم",
        "expected_gid": 24,
        "expected_urdu": None,
        "expected_afail": "مفعول مفاعیل مفاعیل فعل",
        "meter_name": "وزن رباعی (اخرب)",
    },
    {
        "id": 73,
        "cat": "rubai",
        "poet": "Khayyam",
        "source": "Rubai akhrab branch 2",
        "verse": "فانوس خیال از او مثالی دانیم",
        "expected_gid": 24,
        "expected_urdu": None,
        "expected_afail": "مفعول مفاعیل مفاعیل فعل",
        "meter_name": "وزن رباعی (اخرب)",
    },
    {
        "id": 74,
        "cat": "rubai",
        "poet": "Khayyam",
        "source": "Rubai akhram branch (starts = = =)",
        "verse": "خورشید چراغدان و عالم فانوس",
        "expected_gid": 24,
        "expected_urdu": None,
        "expected_afail": "مفعول مفاعیل مفاعیل فعل",
        "meter_name": "وزن رباعی (اخرم)",
    },
    {
        "id": 75,
        "cat": "rubai",
        "poet": "Khayyam",
        "source": "Rubai akhram variant 2",
        "verse": "در کارگه کوزه‌گری رفتم دوش",
        "expected_gid": 24,
        "expected_urdu": None,
        "expected_afail": "مفعول مفاعیل مفاعیل فعل",
        "meter_name": "وزن رباعی (اخرم)",
    },

    # --- Category H: Persian Gold & Dictionary Matches ---
    {
        "id": 76,
        "cat": "persian_gold",
        "poet": "Jami",
        "source": "persian_gold.json #4",
        "verse": "ای مظهر حسن لایزالی",
        "expected_gid": 13,
        "expected_urdu": 9,
        "expected_afail": "مفعول مفاعلن فعولن",
        "meter_name": "هزج مسدس اخرب مقبوض محذوف",
    },
    {
        "id": 77,
        "cat": "persian_gold",
        "poet": "Jami",
        "source": "persian_gold.json #4 misra 2",
        "verse": "مرآت جمال ذوالجلالی",
        "expected_gid": 13,
        "expected_urdu": 9,
        "expected_afail": "مفعول مفاعلن فعولن",
        "meter_name": "هزج مسدس اخرب مقبوض محذوف",
    },
    {
        "id": 78,
        "cat": "persian_gold",
        "poet": "Jami",
        "source": "persian_gold.json #5",
        "verse": "ز مهجوری برآمد جان عالم",
        "expected_gid": 12,
        "expected_urdu": 27,
        "expected_afail": "مفاعیلن مفاعیلن فعولن",
        "meter_name": "هزج مسدس محذوف",
    },
    {
        "id": 79,
        "cat": "poetry_dictionary",
        "poet": "Baba Taher",
        "source": "fa_poetry_dictionary.json",
        "verse": "یکی درد و یکی درمان پسندد",
        "expected_gid": 12,
        "expected_urdu": 27,
        "expected_afail": "مفاعیلن مفاعیلن فعولن",
        "meter_name": "هزج مسدس محذوف",
    },
    {
        "id": 80,
        "cat": "poetry_dictionary",
        "poet": "Baba Taher",
        "source": "fa_poetry_dictionary.json",
        "verse": "یکی وصل و یکی هجران پسندد",
        "expected_gid": 12,
        "expected_urdu": 27,
        "expected_afail": "مفاعیلن مفاعیلن فعولن",
        "meter_name": "هزج مسدس محذوف",
    },

    # --- Category I: Diacritics Stress Test (Vocalized vs Plain) ---
    {
        "id": 81,
        "cat": "diacritics_stress_test",
        "poet": "Saadi",
        "source": "Plain unpointed",
        "verse": "سعدیا مرد نکونام نمیرد هرگز",
        "expected_gid": 7,
        "expected_urdu": 18,
        "expected_afail": "فعلاتن فعلاتن فعلاتن فعلن",
        "meter_name": "رمل مثمن مخبون محذوف",
    },
    {
        "id": 82,
        "cat": "diacritics_stress_test",
        "poet": "Saadi",
        "source": "Vocalized zer (iẓāfat)",
        "verse": "سعدیا مردِ نکونام نمیرد هرگز",
        "expected_gid": 7,
        "expected_urdu": 18,
        "expected_afail": "فعلاتن فعلاتن فعلاتن فعلن",
        "meter_name": "رمل مثمن مخبون محذوف",
    },
    {
        "id": 83,
        "cat": "diacritics_stress_test",
        "poet": "Saadi",
        "source": "Full erāb (combining fatḥa, sukūn)",
        "verse": "سَعْدِیا مَرْدِ نِکُونَامْ نَمِیرَدْ هَرْگِزْ",
        "expected_gid": 7,
        "expected_urdu": 18,
        "expected_afail": "فعلاتن فعلاتن فعلاتن فعلن",
        "meter_name": "رمل مثمن مخبون محذوف",
    },
    {
        "id": 84,
        "cat": "diacritics_stress_test",
        "poet": "Hafez",
        "source": "Hafez plain",
        "verse": "دل می‌رود ز دستم صاحب‌دلان خدا را",
        "expected_gid": 4,
        "expected_urdu": 4,
        "expected_afail": "مفعول فاعلاتن مفعول فاعلاتن",
        "meter_name": "مضارع مثمن اخرب",
    },
    {
        "id": 85,
        "cat": "diacritics_stress_test",
        "poet": "Hafez",
        "source": "Hafez full erāb with tashdīd",
        "verse": "دِلْ می‌روَدْ زِ دَسْتَمْ صاحِبْ‌دِلانْ خُدا را",
        "expected_gid": 4,
        "expected_urdu": 4,
        "expected_afail": "مفعول فاعلاتن مفعول فاعلاتن",
        "meter_name": "مضارع مثمن اخرب",
    },

    # --- Category J: Adversarial Controls (Prose, Non-Poetry) ---
    {
        "id": 86,
        "cat": "adversarial_controls",
        "poet": "Control",
        "source": "Persian conversational prose",
        "verse": "سلام من یک متن ساده روزمره هستم و شعر نیستم",
        "expected_gid": None,
        "expected_urdu": None,
        "expected_afail": "none",
        "meter_name": "نثر غیرعروضی (Non-poetic prose)",
    },
    {
        "id": 87,
        "cat": "adversarial_controls",
        "poet": "Control",
        "source": "Persian newspaper prose",
        "verse": "امروز هوا بسیار سرد و بارانی بود و باران بارید",
        "expected_gid": None,
        "expected_urdu": None,
        "expected_afail": "none",
        "meter_name": "نثر غیرعروضی (Non-poetic prose)",
    },
    {
        "id": 88,
        "cat": "adversarial_controls",
        "poet": "Control",
        "source": "Latin text",
        "verse": "lorem ipsum dolor sit amet consectetur",
        "expected_gid": None,
        "expected_urdu": None,
        "expected_afail": "none",
        "meter_name": "متن غیرفارسی (Non-Persian text)",
    },
]


# ---------------------------------------------------------
# 2. Node.js ScanFa runner generator
# ---------------------------------------------------------
def ensure_node_runner():
    code = """
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const origLog = console.log;
console.log = () => {};
const FAE = require(path.join(ROOT, 'scripts/lib_fa_scan')).loadFaEngine();
console.log = origLog;
const PM = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/persian_meters.json'), 'utf8'));
const UM = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/meters.json'), 'utf8')).standard;

const pmByGid = new Map(PM.map(m => [m.gid, m]));
const pmByUrdu = new Map();
for (const m of PM) {
  for (const u of m.urdu || []) {
    if (!pmByUrdu.has(u)) pmByUrdu.set(u, m);
  }
}
const umById = new Map(UM.map(m => [m.id, m]));

// Afail normalizer
function normAfail(s) {
  return (s || '').replace(/[\u200c\u200d]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scanLine(verse) {
  const t0 = Date.now();
  const rawNorm = FAE.ctx.faScanText(verse);
  const prosodyNorm = FAE.ctx.faProsodyText ? FAE.ctx.faProsodyText(rawNorm) : rawNorm;
  
  let fits = [];
  try {
    fits = FAE.ctx.faScanFits ? FAE.ctx.faScanFits(FAE.Scan, prosodyNorm) : FAE.Scan.scanLine(prosodyNorm).fits;
  } catch (e) {
    fits = (FAE.Scan.scanLine(prosodyNorm).fits || []);
  }
  fits = (fits || []).filter(f => f.meter && f.meter.id !== 'H');
  
  const elapsed = Date.now() - t0;
  if (!fits || !fits.length) {
    return { status: 'no_fit', cost: Infinity, afail: 'none', meter_id: null, ganjoor_gid: null, time_ms: elapsed };
  }
  
  const best = fits[0];
  const mid = best.meter.id;
  let afail = '';
  let gid = null;
  let meterName = '';
  
  if (typeof mid === 'string' && mid.startsWith('F')) {
    gid = parseInt(mid.slice(1), 10);
    const m = pmByGid.get(gid);
    if (m) {
      afail = normAfail(m.rhythm.split('(')[0]);
      meterName = m.name || m.rhythm;
    }
  } else if (typeof mid === 'string' && mid.startsWith('R')) {
    gid = 24;
    afail = 'مفعول مفاعیل مفاعیل فعل';
    meterName = 'وزن رباعی (' + mid + ')';
  } else if (mid === 'H') {
    meterName = 'Hindi / Non-standard';
    afail = 'هندی / غیرمعیاری';
  } else {
    let pm = pmByUrdu.get(mid);
    if (!pm && mid === 1) pm = pmByUrdu.get(9);
    if (pm) {
      gid = pm.gid;
      afail = normAfail(pm.rhythm.split('(')[0]);
      meterName = pm.name || pm.rhythm;
    } else {
      const um = umById.get(mid);
      if (um) {
        meterName = um.name;
        afail = um.name;
      }
    }
  }
  
  return {
    status: 'ok',
    meter_id: mid,
    ganjoor_gid: gid,
    cost: best.c,
    afail: afail,
    meter_name: meterName,
    pattern: best.meter.raw,
    seq: best.seq ? best.seq.join('') : '',
    fits_count: fits.length,
    time_ms: elapsed
  };
}

// Process stdin JSON lines
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on('line', line => {
  if (!line.trim()) return;
  try {
    const data = JSON.parse(line);
    const res = scanLine(data.verse);
    console.log(JSON.stringify({ id: data.id, res }));
  } catch (err) {
    console.log(JSON.stringify({ error: err.message }));
  }
});
"""
    with open(NODE_SCAN_SCRIPT, "w", encoding="utf-8") as f:
        f.write(code)


# ---------------------------------------------------------
# 3. Query VaznYab backend
# ---------------------------------------------------------
def query_vaznyab(verse: str) -> Dict[str, Any]:
    url = VAZNYAB_ENDPOINT + urllib.parse.quote(verse)
    t0 = time.time()
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Benchmarking suite for Urdu/Persian Scansion)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            elapsed_ms = (time.time() - t0) * 1000
            data = resp.read().decode("utf-8")
            parsed = json.loads(data)
            output = parsed.get("output", [])
            out_str = " ".join(output).strip() if isinstance(output, list) else str(output).strip()
            return {
                "status": "ok",
                "http_status": resp.status,
                "output": output,
                "afail": out_str,
                "time_ms": elapsed_ms,
            }
    except urllib.error.HTTPError as e:
        elapsed_ms = (time.time() - t0) * 1000
        return {
            "status": "http_error",
            "http_status": e.code,
            "error": str(e),
            "output": [],
            "afail": "ERROR",
            "time_ms": elapsed_ms,
        }
    except Exception as e:
        elapsed_ms = (time.time() - t0) * 1000
        return {
            "status": "network_error",
            "http_status": None,
            "error": str(e),
            "output": [],
            "afail": "ERROR",
            "time_ms": elapsed_ms,
        }


# ---------------------------------------------------------
# 4. Normalization & Meter Matching
# ---------------------------------------------------------
def norm_afail(s: str) -> str:
    if not s:
        return ""
    s = s.replace("\u200c", " ").replace("\u200d", " ")
    s = re.sub(r"[\u064b-\u065f]", "", s)  # strip erāb
    s = re.sub(r"\s+", " ", s).strip()
    return s


def afail_matches(a1: str, a2: str) -> bool:
    n1 = norm_afail(a1)
    n2 = norm_afail(a2)
    if not n1 or not n2:
        return False
    if n1 == n2:
        return True
    # Handle minor Persian / Arabic orthography variations in feet (e.g. فع vs فعل at end, fa'ilātun vs fā'ilātun)
    # Check if they share the exact sequence of foot stems
    f1 = n1.split()
    f2 = n2.split()
    if len(f1) == len(f2):
        # Allow last foot fa'ilun vs fa'lun / fa'al
        if f1[:-1] == f2[:-1]:
            if (f1[-1] in ["فعلن", "فع", "فعل", "فعولن"]) and (f2[-1] in ["فعلن", "فع", "فعل", "فعولن"]):
                return True
    # Known classical dual classifications / variants
    equivs = [
        {"مفعول فاعلات مفاعیل فاعلن", "مفاعیلن مفاعیلن مفاعیلن مفاعیلن"},
        {"مفعول مفاعلن فعولن", "مفاعیلن مفاعیلن فعولن"},
    ]
    for eq in equivs:
        if n1 in eq and n2 in eq:
            return True
    return False


# ---------------------------------------------------------
# 5. Main benchmark execution
# ---------------------------------------------------------
def main():
    print(f"[*] Starting VaznYab vs ScanFa Benchmark Suite")
    print(f"[*] Corpus size: {len(CORPUS)} verses across 10 prosodic categories")
    print(f"[*] Backend endpoint: {VAZNYAB_ENDPOINT}")

    ensure_node_runner()

    # Launch Node.js ScanFa persistent process
    node_proc = subprocess.Popen(
        ["node", NODE_SCAN_SCRIPT],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    results = []
    cat_stats = {}

    print("\n" + "=" * 110)
    print(
        f"{'ID':2} | {'Cat':18} | {'Poet':8} | {'Verse':32} | {'Ground Truth':20} | {'VaznYab':20} | {'ScanFa':15} | {'V-OK':4} | {'S-OK':4}"
    )
    print("=" * 110)

    for item in CORPUS:
        cid = item["id"]
        cat = item["cat"]
        verse = item["verse"]
        exp_afail = item["expected_afail"]

        if cat not in cat_stats:
            cat_stats[cat] = {
                "total": 0,
                "vaznyab_correct": 0,
                "scanfa_correct": 0,
                "vaznyab_scanfa_agree": 0,
                "vaznyab_times": [],
                "scanfa_times": [],
            }

        # Query VaznYab
        vaz_res = query_vaznyab(verse)
        vaz_afail = vaz_res.get("afail", "")

        # Query ScanFa
        node_proc.stdin.write(json.dumps({"id": cid, "verse": verse}) + "\n")
        node_proc.stdin.flush()
        while True:
            node_line = node_proc.stdout.readline()
            if not node_line:
                scan_data = {}
                break
            node_line = node_line.strip()
            if node_line.startswith('{'):
                scan_data = json.loads(node_line)
                break
        scan_res = scan_data.get("res", {})
        scan_afail = scan_res.get("afail", "")

        # Ground truth evaluation
        is_adversarial = cat == "adversarial_controls"
        if is_adversarial:
            # For adversarial controls, correct behavior is 'none' / high cost / rejection
            v_ok = vaz_afail in ["none", "ERROR"] or vaz_res.get("http_status") in [400, 404, 500]
            s_ok = scan_res.get("status") != "ok" or scan_res.get("meter_id") == "H" or scan_res.get("cost", 0) > 4
        else:
            v_ok = afail_matches(vaz_afail, exp_afail)
            s_ok = (scan_res.get("status") == "ok" and 
                    scan_res.get("meter_id") != "H" and 
                    scan_res.get("cost", 99) <= 3.5 and 
                    afail_matches(scan_afail, exp_afail))

        v_s_agree = afail_matches(vaz_afail, scan_afail)

        # Update stats
        cat_stats[cat]["total"] += 1
        if v_ok:
            cat_stats[cat]["vaznyab_correct"] += 1
        if s_ok:
            cat_stats[cat]["scanfa_correct"] += 1
        if v_s_agree:
            cat_stats[cat]["vaznyab_scanfa_agree"] += 1
        cat_stats[cat]["vaznyab_times"].append(vaz_res.get("time_ms", 0))
        cat_stats[cat]["scanfa_times"].append(scan_res.get("time_ms", 0))

        v_flag = "✓" if v_ok else "✗"
        s_flag = "✓" if s_ok else "✗"

        verse_snippet = verse[:30] + ("..." if len(verse) > 30 else "")
        exp_snippet = exp_afail[:18]
        vaz_snippet = vaz_afail[:18]
        scan_snippet = scan_afail[:13]

        print(
            f"{cid:2d} | {cat[:18]:18} | {item['poet'][:8]:8} | {verse_snippet:32} | {exp_snippet:20} | {vaz_snippet:20} | {scan_snippet:15} | {v_flag:4} | {s_flag:4}"
        )

        results.append({
            "id": cid,
            "category": cat,
            "poet": item["poet"],
            "source": item["source"],
            "verse": verse,
            "expected_gid": item["expected_gid"],
            "expected_urdu": item["expected_urdu"],
            "expected_afail": exp_afail,
            "meter_name": item["meter_name"],
            "vaznyab": {
                "http_status": vaz_res.get("http_status"),
                "afail": vaz_afail,
                "raw_output": vaz_res.get("output"),
                "time_ms": round(vaz_res.get("time_ms", 0), 1),
                "is_correct": v_ok,
            },
            "scanfa": {
                "meter_id": scan_res.get("meter_id"),
                "ganjoor_gid": scan_res.get("ganjoor_gid"),
                "cost": scan_res.get("cost"),
                "afail": scan_afail,
                "meter_name": scan_res.get("meter_name"),
                "seq": scan_res.get("seq"),
                "time_ms": round(scan_res.get("time_ms", 0), 1),
                "is_correct": s_ok,
            },
            "vaznyab_scanfa_agree": v_s_agree,
        })

    node_proc.kill()

    # Aggregate metrics
    total_verses = len(CORPUS)
    vaznyab_total_correct = sum(s["vaznyab_correct"] for s in cat_stats.values())
    scanfa_total_correct = sum(s["scanfa_correct"] for s in cat_stats.values())
    overall_v_s_agree = sum(s["vaznyab_scanfa_agree"] for s in cat_stats.values())

    vaz_times = [r["vaznyab"]["time_ms"] for r in results]
    scan_times = [r["scanfa"]["time_ms"] for r in results]

    summary = {
        "benchmark_metadata": {
            "date": "2026-10-09",
            "vaznyab_url": VAZNYAB_ENDPOINT,
            "total_verses": total_verses,
            "vaznyab_accuracy_pct": round(100.0 * vaznyab_total_correct / total_verses, 2),
            "scanfa_accuracy_pct": round(100.0 * scanfa_total_correct / total_verses, 2),
            "vaznyab_scanfa_agreement_pct": round(100.0 * overall_v_s_agree / total_verses, 2),
            "vaznyab_avg_latency_ms": round(sum(vaz_times) / len(vaz_times), 1),
            "scanfa_avg_latency_ms": round(sum(scan_times) / len(scan_times), 1),
        },
        "category_breakdown": {},
        "detailed_results": results,
    }

    for cat, st in cat_stats.items():
        n = st["total"]
        summary["category_breakdown"][cat] = {
            "total": n,
            "vaznyab_accuracy_pct": round(100.0 * st["vaznyab_correct"] / n, 2),
            "scanfa_accuracy_pct": round(100.0 * st["scanfa_correct"] / n, 2),
            "agreement_pct": round(100.0 * st["vaznyab_scanfa_agree"] / n, 2),
        }

    with open(RESULTS_JSON, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 110)
    print("FINAL SUMMARY REPORT")
    print("=" * 110)
    print(f"Total Verses Evaluated       : {total_verses}")
    print(f"VaznYab Overall Accuracy    : {vaznyab_total_correct}/{total_verses} ({summary['benchmark_metadata']['vaznyab_accuracy_pct']}%)")
    print(f"ScanFa Overall Accuracy     : {scanfa_total_correct}/{total_verses} ({summary['benchmark_metadata']['scanfa_accuracy_pct']}%)")
    print(f"VaznYab vs ScanFa Agreement : {overall_v_s_agree}/{total_verses} ({summary['benchmark_metadata']['vaznyab_scanfa_agreement_pct']}%)")
    print(f"VaznYab Mean Latency (HTTP) : {summary['benchmark_metadata']['vaznyab_avg_latency_ms']} ms")
    print(f"ScanFa Mean Latency (Local) : {summary['benchmark_metadata']['scanfa_avg_latency_ms']} ms")
    print("\nCategory Breakdown:")
    for cat, cb in summary["category_breakdown"].items():
        print(f"  - {cat:25}: VaznYab {cb['vaznyab_accuracy_pct']:5.1f}% | ScanFa {cb['scanfa_accuracy_pct']:5.1f}% | Agree {cb['agreement_pct']:5.1f}% (N={cb['total']})")
    print(f"\n[✓] Detailed benchmark written to: {RESULTS_JSON}")


if __name__ == "__main__":
    main()
