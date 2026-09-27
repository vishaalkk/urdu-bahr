import json

handbook_chapters = [
    {
        "id": "ch1",
        "num": "1",
        "title": "The Core Quantitative Rule",
        "urdu_title": "قاعدۂ وزن: دو حرفی اور یک حرفی",
        "summary": "Urdu meter is quantitative, based on duration in time rather than stress. Two letters make a long syllable (=), one letter makes a short syllable (-).",
        "sections": [
            {
                "title": "1.0 Why Should You Learn Meter?",
                "content": "<p>Meter was carefully built into the classical ghazal by the master poets (<em>ustāds</em>), and expected by their connoisseur audiences. No poet dared break the rules without facing mockery. Knowing meter allows you to:</p><ul><li><strong>Memorize verses effortlessly</strong> due to rhythmic predictability.</li><li><strong>Solve textual corruptions</strong> and establish correct readings of ambiguous manuscripts.</li><li><strong>Develop an authentic ear</strong> for reciting classical poetry with natural musicality (<em>tarannum</em> and <em>taḥt-ul-lafẓ</em>).</li></ul>"
            },
            {
                "title": "1.1 The Golden Rule: Two Letters or One",
                "content": "<p>The foundation of Urdu prosody is surprisingly concrete and orthographic:</p><blockquote><strong>2 Letters = Long Syllable (=)</strong><br><strong>1 Letter = Short Syllable (-)</strong></blockquote><p>A long syllable ideally takes <em>twice as much time</em> to say as a short one. This is a <strong>quantitative</strong> difference (duration in time), NOT stress accent.</p>"
            },
            {
                "title": "1.2 What Counts as a Metrical Letter?",
                "content": "<p>In Urdu, written consonants and long vowels count as letters. However, keep these vital orthographic rules in mind:</p><ul><li><strong>Do-Chashmī He (ھ)</strong> marks aspiration (e.g. <em>bh, th, jh, chh</em>); it is <strong>not an independent letter</strong>. For example, <em>mujh</em> (مجھ) = <code>[m-j]</code> = 2 letters = <strong>Long (=)</strong>.</li><li><strong>Nūn Ghunnah (ں)</strong> marks nasalization after a long vowel; it is <strong>not a letter</strong>. For example, <em>māñ</em> (ماں) = <code>[m-a]</code> = 2 letters = <strong>Long (=)</strong>.</li><li><strong>Tashdīd (ّ)</strong> indicates a doubled consonant, counting as <strong>two letters</strong>.</li><li><strong>Alif Madd (آ)</strong> counts as two letters (an alif plus vowel duration).</li></ul>"
            }
        ]
    },
    {
        "id": "ch2",
        "num": "2",
        "title": "The Art of Bending: Flexibility",
        "urdu_title": "اختیارات اور لچک",
        "summary": "Because Arabic meter generates too many long syllables and too few short ones for Urdu, the tradition provides relief valves: flexible monosyllables and word-final vowel shortening.",
        "sections": [
            {
                "title": "2.1 Flexible Monosyllables (x)",
                "content": "<p>The common two-letter grammatical words can be scanned as <strong>either Long (=) or Short (-)</strong> at the poet's pleasure. In scansion we mark them as <strong>(x)</strong>:</p><div class='chip-grid'><span class='chip'>جو (jo)</span><span class='chip'>تو (to)</span><span class='chip'>سے (se)</span><span class='chip'>کو (ko)</span><span class='chip'>کا / کے / کی (kā/ke/kī)</span><span class='chip'>ہے (hai)</span><span class='chip'>میں (meñ)</span><span class='chip'>بھی (bhī)</span><span class='chip'>نے (ne)</span><span class='chip'>ہوں (hūñ)</span><span class='chip'>یہ (yeh)</span><span class='chip'>وہ (voh)</span></div><p><em>Rule:</em> Within any given line of verse, the word is fixed as either long or short based on the bahr's demands, but its identity is inherently flexible.</p>"
            },
            {
                "title": "2.2 Word-Final Vowels",
                "content": "<p>Vowels at the end of a word (<em>-ā, -ī, -e, -o, -ah</em>) can be shortened by the poet to a short syllable (-). For example, <em>kabhī</em> (کبھی) can scan as <code>[ka-bhī]</code> (- =) or shortened to <code>[ka-bhi]</code> (- -).</p>"
            }
        ]
    },
    {
        "id": "ch3",
        "num": "3",
        "title": "Crossing Word Boundaries",
        "urdu_title": "وصل، اضافت اور واوِ عطف",
        "summary": "Syllables are not confined by word spaces. Word-grafting (vas̤l), Iẓāfat (-e), and Vāo-e-ʻat̤af (-o-) allow consonants and vowels to fuse across adjacent words.",
        "sections": [
            {
                "title": "3.1 Word-Grafting (Vas̤l)",
                "content": "<p>When word A ends in a consonant and word B begins with <em>alif</em> or <em>alif madd</em>, they fuse into a single phonological unit:</p><div class='example-box'><code>dil (دل) + e (اے) + nādāñ (ناداں) → di-le-nā-dāñ (دِلِ ناداں)</code><br><code>is (اس) + dard (درد) + kī (کی) → is-dar-d-kī</code></div><p>Word-grafting frequently eliminates an extra syllable, allowing lines with seemingly surplus letters to fit the meter perfectly.</p>"
            },
            {
                "title": "3.2 Iẓāfat (-e) and Vāo-e-ʻAt̤af (-o-)",
                "content": "<p>The Persian <em>iẓāfat</em> (short <em>zer</em> sounding as <code>-e</code>) links two words ('pain of heart' = <em>dard-e dil</em>). Metrically, it is usually a <strong>short syllable (-)</strong>, but can be lengthened to <strong>long (=)</strong> when needed.<br>Similarly, the conjunction <em>vāo-e-ʻat̤af</em> (<code>-o-</code>, meaning 'and') joins words as a flexible syllable.</p>"
            }
        ]
    },
    {
        "id": "ch5",
        "num": "5",
        "title": "Metrical Feet (Afāʻīl)",
        "urdu_title": "ارکان اور افاعیل",
        "summary": "Every meter is constructed from rhythmic building blocks called feet (rukn, plural arkān). These are named using mnemonic patterns derived from the root f-ʻ-l.",
        "sections": [
            {
                "title": "5.1 The Arabic Mnemonic Feet",
                "content": "<p>Instead of abstract numbers, traditional prosody uses memorable vocalic shapes derived from <em>faʻl</em> (فعل):</p><ul><li><strong>فاعِلاتُن (fāʻilātun)</strong> = <code>= - = =</code></li><li><strong>مَفَاعِيلُن (mafāʻīlun)</strong> = <code>- = = =</code></li><li><strong>مُسْتَفْعِلُن (mustafʻilun)</strong> = <code>= = - =</code></li><li><strong>فَعُولُن (faʻūlun)</strong> = <code>- = =</code></li><li><strong>مُتَفَاعِلُن (mutafāʻilun)</strong> = <code>- - = - =</code></li><li><strong>مَفْعُولُ (mafʻūlu)</strong> = <code>= = -</code></li></ul>"
            }
        ]
    },
    {
        "id": "ch7",
        "num": "7",
        "title": "Scanning as Code-Breaking",
        "urdu_title": "تقطیع بحیثیت کشفِ رموز",
        "summary": "A systematic, foolproof algorithm to determine the meter of any Urdu poem by treating it as an encrypted code.",
        "sections": [
            {
                "title": "7.1 The Step-by-Step Algorithm",
                "content": "<ol><li><strong>Write down 4 to 8 lines</strong> of the poem in vertical columns.</li><li><strong>Divide each word into syllables</strong> using the 2-letter / 1-letter rule.</li><li><strong>Mark known syllables</strong> as (=) or (-), and ambiguous ones as (x).</li><li><strong>Look down each column:</strong> columns with all long syllables are fixed (=).</li><li><strong>Check for word-grafting</strong> to remove surplus syllables.</li><li><strong>Match the resulting pattern</strong> against the 37 canonical meters in Chapter 6.</li></ol>"
            }
        ]
    },
    {
        "id": "ch8",
        "num": "8",
        "title": "From Eye to Ear: Oral Internalization",
        "urdu_title": "سماع: آنکھ سے کان تک",
        "summary": "Urdu meter is music. Move past pencil and paper by internalizing the beat through table-tapping, vocables (da/dum), and tuning your ear to the master bahr families.",
        "sections": [
            {
                "title": "8.1 Duration, Not Stress",
                "content": "<p>English speakers instinctively try to stress or punch metrical beats. In Urdu, <strong>never stress</strong>; simply <strong>hold long syllables twice as long</strong> in time.</p><p>Practice tapping a metronomic pulse on your table: 1 tap for short (<em>da</em>), 2 taps for long (<em>dum</em>). Master this quantitative duration before reciting with full words.</p>"
            },
            {
                "title": "8.2 The 7 Master Bahr Families",
                "content": "<p>More than 85% of all classical Urdu ghazals are composed in just 7 meter families. By mastering the tunes of these 7, you can identify almost any ghazal on sight:</p><ol><li><strong>Dil-e-Nādāñ</strong> (<code>x - = = / - = - = / = =</code>)</li><li><strong>Bāzīcha-e-At̤fāl</strong> (<code>= = - / - = = - / - = = - / - = =</code>)</li><li><strong>Yeh Na Thī Hamārī Qismat</strong> (<code>- - = - / = - = = // - - = - / = - = =</code>)</li><li><strong>Nuqta-chīn Hai Gham-e Dil</strong> (<code>x - = = / - - = = / - - = = / = =</code>)</li><li><strong>Har Ek Baat Pe Kehte Ho</strong> (<code>- = - = / - - = = / - = - = / = =</code>)</li><li><strong>Muddat Huʼī Hai Yār Ko</strong> (<code>= = - / = - = - / - = = - / = - =</code>)</li><li><strong>Milne Ke Nahīñ Nāyāb Haiñ Ham</strong> (<code>= - - = / - = - = // = - - = / - = - =</code>)</li></ol>"
            }
        ]
    }
]

with open('data/handbook.json', 'w', encoding='utf-8') as out:
    json.dump(handbook_chapters, out, ensure_ascii=False, indent=2)

print('Saved data/handbook.json successfully!')
