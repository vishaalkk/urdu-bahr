/* ===================== 17c-CIRCLES (DAWĀʾIR) =====================
   Khalīl ibn Aḥmad al-Farāhīdī’s Metric Circles & Formula Calculator.
   Uses the site's canonical play() audio engine, quiet manuscript styling,
   and standard .vnum and .fran-link couplet aesthetics. */
    const CIRCLES = [
      {
        id: 'mujtalib',
        nameEn: 'Dāʾira-e-Mujtaliba',
        transEn: 'The Pulled Circle',
        nameUr: 'دائرہِ مجتلبہ',
        badge: 'Dominant (60%+ of Urdu)',
        tagGold: true,
        whyNamed: 'Khalil named it "al-Mujtalab" (The Drawn/Brought Over) because its uniform 4-beat feet (mafāʿīlun, mustafʿilun, fāʿilātun) were drawn directly from the compound circles and isolated into a pure, symmetrical loop.',
        urduPresence: 'The undisputed foundation of Urdu ghazal poetry. Over 60% of classical and modern Urdu ghazals (Mir, Ghalib, Iqbal, Faiz) are composed in meters derived from this single circle.',
        structureDesc: 'Loop of 12 beats: (– = = =) repeating 3 times. Uniform quadrisyllabic feet. Yields 3 base meters: Hazaj, Rajaz, Ramal.',
        cycle: ['s', 'l', 'l', 'l', 's', 'l', 'l', 'l', 's', 'l', 'l', 'l'], // 12 beats
        footLen: 4,
        meters: [
          {
            id: 'hazaj',
            name: 'Hazaj',
            canonical: { length: 'musamman', bodyMod: 'base', endMod: 'salim', meterNum: 26, handbookNum: 15, nameEn: 'Hazaj Mus̱amman Sālim', nameUr: 'بحرِ ہزج مثمن سالم' },
            meaning: 'Trilling',
            nameUr: 'ہزج',
            startIdx: 0,
            baseFoot: '– = = =',
            trimmedFoot: '– = =',
            maqtuFoot: '= =',
            makhbunFoot: '– = – =',
            footUr: 'مفاعیلن',
            footRo: 'mafāʿīlun',
            desc: 'Starting Beat 1',
            verses: {
              'musamman_salim': {
                ur: 'ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے',
                ro: 'hazāroñ khvāhisheñ aisī kih har khvāhish pih dam nikle',
                hi: 'हज़ारों ख़्वाहिशें ऐसी कि हर ख़्वाहिश पे दम निकले',
                ur2: 'بہت نکلے مرے ارمان لیکن پھر بھی کم نکلے',
                ro2: 'bohat nikle mire armān lekin phir bhī kam nikle',
                hi2: 'बहुत निकले मिरे अरमान लेकिन फिर भी कम निकले',
                poet: 'Ghalib',
                syls: [
                  { ro: 'ha', m: 's' }, { ro: 'zā', m: 'l' }, { ro: 'roñ', m: 'l' }, { ro: 'khvā', m: 'l' },
                  { ro: 'hi', m: 's' }, { ro: 'sheñ', m: 'l' }, { ro: 'ai', m: 'l' }, { ro: 'sī', m: 'l' },
                  { ro: 'ki', m: 's' }, { ro: 'har', m: 'l' }, { ro: 'khvā', m: 'l' }, { ro: 'hish', m: 'l' },
                  { ro: 'pi', m: 's' }, { ro: 'dam', m: 'l' }, { ro: 'nik', m: 'l' }, { ro: 'le', m: 'l' }
                ]
              },
              'musaddas_mahzuuf': {
                ur: 'ہوس کو ہے نشاطِ کار کیا کیا',
                ro: 'havas ko hai nashāt̤-e kār kyā kyā',
                hi: 'हवस को है निशात-ए-कार क्या क्या',
                ur2: 'نہ ہو مرنا تو جینے کا مزا کیا',
                ro2: 'nah ho marnā to jīne kā mazā kyā',
                hi2: 'न हो मरना तो जीने का मज़ा क्या',
                poet: 'Ghalib',
                syls: [
                  { ro: 'ha', m: 's' }, { ro: 'vas', m: 'l' }, { ro: 'ko', m: 'l' }, { ro: 'hai', m: 'l' },
                  { ro: 'na', m: 's' }, { ro: 'shā', m: 'l' }, { ro: 'ṭe', m: 'l' }, { ro: 'kār', m: 'l' },
                  { ro: 'ki', m: 's' }, { ro: 'yā', m: 'l' }, { ro: 'kyā', m: 'l' }
                ]
              },
              'musamman_mahzuuf': {
                ur: 'دل ہی تو ہے نہ سنگ و خشت درد سے بھر نہ آئے کیوں',
                ro: 'dil hī to hai nah sang-o-ḳhisht dard se bhar nah āʾe kyoñ',
                hi: 'दिल ही तो है न संग-ओ-ख़िश्त दर्द से भर न आए क्यों',
                ur2: 'روئیں گے ہم ہزار بار کوئی ہمیں ستائے کیوں',
                ro2: 'roʾeñge ham hazār bār koʾī hameñ satāʾe kyoñ',
                hi2: 'रोएँगे हम हज़ार बार कोई हमें सताए क्यों',
                poet: 'Ghalib',
                syls: [
                  { ro: 'dil', m: 's' }, { ro: 'hī', m: 'l' }, { ro: 'to', m: 'l' }, { ro: 'hai', m: 'l' },
                  { ro: 'nah', m: 's' }, { ro: 'san', m: 'l' }, { ro: 'go', m: 'l' }, { ro: 'ḳhisht', m: 'l' },
                  { ro: 'dar', m: 's' }, { ro: 'd-se', m: 'l' }, { ro: 'bhar', m: 'l' }, { ro: 'nah', m: 'l' },
                  { ro: 'ā', m: 's' }, { ro: 'e', m: 'l' }, { ro: 'kyoñ', m: 'l' }
                ]
              },
              'musaddas_salim': {
                ur: 'محبت نے نکالا ہے تری گھر سے',
                ro: 'muḥabbat ne nikālā hai tirī ghar se',
                hi: 'मोहब्बत ने निकाला है तिरे घर से',
                ur2: 'نہ چھوڑا اس نے کچھ بھی اپنے جی ڈر سے',
                ro2: 'nah chhoṛā us ne kuchh bhī apne jī ḍar se',
                hi2: 'न छोड़ा उस ने कुछ भी अपने जी डर से',
                poet: 'Mir',
                syls: [
                  { ro: 'mu', m: 's' }, { ro: 'ḥab', m: 'l' }, { ro: 'bat', m: 'l' }, { ro: 'ne', m: 'l' },
                  { ro: 'ni', m: 's' }, { ro: 'kā', m: 'l' }, { ro: 'lā', m: 'l' }, { ro: 'hai', m: 'l' },
                  { ro: 'ti', m: 's' }, { ro: 'rī', m: 'l' }, { ro: 'ghar', m: 'l' }, { ro: 'se', m: 'l' }
                ]
              },
              'musamman_maqtu': {
                ur: 'نہ تھا کچھ تو خدا تھا کچھ نہ ہوتا تو خدا ہوتا',
                ro: 'nah thā kuchh to ḳhudā thā kuchh nah hotā to ḳhudā hotā',
                hi: 'न था कुछ तो ख़ुदा था कुछ न होता तो ख़ुदा होता',
                ur2: 'ڈبویا مجھ کو ہونے نے نہ ہوتا میں تو کیا ہوتا',
                ro2: 'ḍuboyā mujh ko hone ne nah hotā maiñ to kyā hotā',
                hi2: 'डुबोया मुझ को होने ने न होता मैं तो क्या होता',
                poet: 'Ghalib',
                syls: [
                  { ro: 'nah', m: 's' }, { ro: 'thā', m: 'l' }, { ro: 'kuchh', m: 'l' }, { ro: 'to', m: 'l' },
                  { ro: 'ḳhu', m: 's' }, { ro: 'dā', m: 'l' }, { ro: 'thā', m: 'l' }, { ro: 'kuchh', m: 'l' },
                  { ro: 'nah', m: 's' }, { ro: 'ho', m: 'l' }, { ro: 'tā', m: 'l' }, { ro: 'to', m: 'l' },
                  { ro: 'ḳhu', m: 's' }, { ro: 'dā', m: 'l' }, { ro: 'ho', m: 'l' }, { ro: 'tā', m: 'l' }
                ]
              },
              'musamman_makhbun': {
                ur: 'عشق پر زور نہیں ہے یہ وہ آتش غالب',
                ro: 'ʿishq par zor nahīñ hai yih voh ātish ghālib',
                hi: 'इश्क़ पर ज़ोर नहीं है ये वो आतिश ग़ालिब',
                ur2: 'کہ لگائے نہ لگے اور بجھائے نہ بنے',
                ro2: 'kih lagāʾe nah lage aur bujhāʾe nah bane',
                hi2: 'कि लगाए न लगे और बुझाए न बने',
                poet: 'Ghalib',
                syls: [
                  { ro: 'ʿishq', m: 'l' }, { ro: 'par', m: 's' }, { ro: 'zor', m: 'l' }, { ro: 'na', m: 's' },
                  { ro: 'hīñ', m: 'l' }, { ro: 'hai', m: 'l' }, { ro: 'yih', m: 's' }, { ro: 'voh', m: 's' },
                  { ro: 'ā', m: 'l' }, { ro: 'tish', m: 'l' }, { ro: 'ghā', m: 'l' }, { ro: 'lib', m: 'l' }
                ]
              },
              'musaddas_maqtu': {
                ur: 'ہوس کو ہے نشاطِ کار کیا کیا',
                ro: 'havas ko hai nashāt̤-e kār kyā kyā',
                hi: 'हवस को है निशात-ए-कार क्या क्या',
                ur2: 'نہ ہو مرنا تو جینے کا مزا کیا',
                ro2: 'nah ho marnā to jīne kā mazā kyā',
                hi2: 'न हो मरना तो जीने का मज़ा क्या',
                poet: 'Ghalib',
                syls: [
                  { ro: 'ha', m: 's' }, { ro: 'vas', m: 'l' }, { ro: 'ko', m: 'l' }, { ro: 'hai', m: 'l' },
                  { ro: 'na', m: 's' }, { ro: 'shā', m: 'l' }, { ro: 'ṭe', m: 'l' }, { ro: 'kār', m: 'l' },
                  { ro: 'ki', m: 's' }, { ro: 'yā', m: 'l' }, { ro: 'kyā', m: 'l' }
                ]
              }
            }
          },
          {
            id: 'rajaz',
            name: 'Rajaz',
            canonical: { length: 'musamman', bodyMod: 'base', endMod: 'salim', meterNum: 3, handbookNum: null, nameEn: 'Rajaz Mus̱amman Sālim', nameUr: 'بحرِ رجز مثمن سالم' },
            meaning: 'Trembling',
            nameUr: 'رجز',
            startIdx: 2, // (= = – =)
            baseFoot: '= = – =',
            trimmedFoot: '= = –',
            maqtuFoot: '= = =',
            makhbunFoot: '– = – =',
            footUr: 'مستفعلن',
            footRo: 'mustafʿilun',
            desc: 'Starting Beat 3',
            verses: {
              'musamman_salim': {
                ur: 'ہو آدمی اے چرخ ترکِ گردشِ ایّام کر',
                ro: 'ho ādmī ai charḳh tark-e gardish-e ayyām kar',
                hi: 'हो आदमी ऐ चर्ख़ तर्क-ए-गर्दिश-ए-अय्याम कर',
                ur2: 'یا صبح کو مت شام کر یا شام کو مت صبح کر',
                ro2: 'yā subḥ ko mat shām kar yā shām ko mat subḥ kar',
                hi2: 'या सुब्ह को मत शाम कर या शाम को मत सुब्ह कर',
                poet: 'Mir',
                syls: [
                  { ro: 'ho', m: 'l' }, { ro: 'ād', m: 'l' }, { ro: 'mī', m: 's' }, { ro: 'ai', m: 'l' },
                  { ro: 'char', m: 'l' }, { ro: 'ḳhe', m: 'l' }, { ro: 'tar', m: 's' }, { ro: 'ke', m: 'l' },
                  { ro: 'gar', m: 'l' }, { ro: 'dish', m: 'l' }, { ro: 'e', m: 's' }, { ro: 'ay', m: 'l' },
                  { ro: 'yā', m: 'l' }, { ro: 'me', m: 'l' }, { ro: 'kar', m: 's' }, { ro: 'dā', m: 'l' }
                ]
              },
              'musaddas_salim': {
                ur: 'گھر میں نہیں کچھ رات کو',
                ro: 'ghar meñ nahīñ kuchh rāt ko',
                hi: 'घर में नहीं कुछ रात को',
                ur2: 'روٹی نہ ہو تو بات کیا',
                ro2: 'roṭī nah ho to baat kyā',
                hi2: 'रोटी न हो तो बात क्या',
                poet: 'Mir',
                syls: [
                  { ro: 'ghar', m: 'l' }, { ro: 'meñ', m: 'l' }, { ro: 'na', m: 's' }, { ro: 'hīñ', m: 'l' },
                  { ro: 'kuchh', m: 'l' }, { ro: 'rāt', m: 'l' }, { ro: 'ko', m: 'l' }
                ]
              },
              'musamman_mahzuuf': {
                ur: 'اے ہم‌نشیں مت پوچھ تو کیفیتِ حالِ مرا',
                ro: 'ay ham-nishīñ mat pūchh tū kaifiyyat-e ḥāl-e mirā',
                hi: 'ऐ हम-नशीं मत पूछ तू कैफ़ियत-ए-हाल-ए-मिरा',
                ur2: 'تجھ پر کہیں کھل جائے نہ احوالِ دل کے ماجرا',
                ro2: 'tujh par kahīñ khul jāʾe nah aḥvāl-e dil ke mājarā',
                hi2: 'ऐ हम-नशीं मत पूछ तू कैफ़ियत-ए-हाल-ए-मरा',
                poet: 'Dard',
                syls: [
                  { ro: 'ay', m: 'l' }, { ro: 'ham', m: 'l' }, { ro: 'ni', m: 's' }, { ro: 'shīñ', m: 'l' },
                  { ro: 'mat', m: 'l' }, { ro: 'pūchh', m: 'l' }, { ro: 'tū', m: 's' }, { ro: 'kai', m: 'l' },
                  { ro: 'fiy', m: 'l' }, { ro: 'ya', m: 's' }, { ro: 'te', m: 'l' }, { ro: 'ḥā', m: 'l' },
                  { ro: 'le', m: 's' }, { ro: 'mi', m: 'l' }, { ro: 'rā', m: 'l' }
                ]
              },
              'musaddas_mahzuuf': {
                ur: 'دیکھا تجھے تو دل گیا',
                ro: 'dekhā tujhe to دل gayā',
                hi: 'देखा तुझे तो दिल गया',
                ur2: 'رویا تو جی پگھل گیا',
                ro2: 'royā to jī pighal gayā',
                hi2: 'रोया तो जी पिघल गया',
                poet: 'Mir',
                syls: [
                  { ro: 'de', m: 'l' }, { ro: 'khā', m: 'l' }, { ro: 'tu', m: 's' }, { ro: 'jhe', m: 'l' },
                  { ro: 'to', m: 'l' }, { ro: 'dil', m: 'l' }, { ro: 'ga', m: 's' }, { ro: 'yā', m: 'l' }
                ]
              },
              'musamman_maqtu': {
                ur: 'چپکے چپکے رات دن آنسو بہانا یاد ہے',
                ro: 'chupke chupke rāt din āñsū bahānā yād hai',
                hi: 'चुपके चुपके रात दिन आँसू बहाना याद है',
                ur2: 'ہم کو اب تک عاشقی کا وہ زمانہ یاد ہے',
                ro2: 'ham ko ab tak ʿāshiqī kā voh zamāna yaad hai',
                hi2: 'हम को अब तक आशिक़ी का वो ज़माना याद है',
                poet: 'Hasrat',
                syls: [
                  { ro: 'chup', m: 'l' }, { ro: 'ke', m: 'l' }, { ro: 'chup', m: 'l' }, { ro: 'ke', m: 'l' },
                  { ro: 'rāt', m: 'l' }, { ro: 'din', m: 'l' }, { ro: 'āñ', m: 'l' }, { ro: 'sū', m: 'l' }
                ]
              },
              'musamman_makhbun': {
                ur: 'دل ہی تو ہے نہ سنگ و خشت درد سے بھر نہ آئے کیوں',
                ro: 'dil hī to hai nah sang-o-ḳhisht dard se bhar nah āʾe kyūñ',
                hi: 'दिल ही तो है न संग-ओ-ख़िश्त दर्द से भर न आए क्यों',
                ur2: 'روئیں گے ہم ہزار بار کوئی ہمیں ستائے کیوں',
                ro2: 'roʾeñge ham hazār bār koʾī hameñ satāʾe kyoñ',
                hi2: 'रोएँगे हम हज़ार बार कोई हमें सताए क्यों',
                poet: 'Ghalib',
                syls: [
                  { ro: 'dil', m: 'l' }, { ro: 'hī', m: 's' }, { ro: 'to', m: 's' }, { ro: 'hai', m: 'l' },
                  { ro: 'nah', m: 's' }, { ro: 'san', m: 'l' }, { ro: 'go', m: 's' }, { ro: 'ḳhisht', m: 'l' },
                  { ro: 'dar', m: 'l' }, { ro: 'de', m: 's' }, { ro: 'se', m: 's' }, { ro: 'bhar', m: 'l' },
                  { ro: 'nah', m: 's' }, { ro: 'ā', m: 'l' }, { ro: 'ye', m: 's' }, { ro: 'kyūñ', m: 'l' }
                ]
              }
            }
          },
          {
            id: 'ramal',
            name: 'Ramal',
            canonical: { length: 'musamman', bodyMod: 'makhbun', endMod: 'mahzuuf', meterNum: 18, handbookNum: 1, nameEn: 'Ramal Mus̱amman Makhbūn Maḥzūf', nameUr: 'بحرِ رمل مثمن مخبون محذوف' },
            meaning: 'Running',
            nameUr: 'رمل',
            startIdx: 3, // (= – = =)
            baseFoot: '= – = =',
            trimmedFoot: '= – =',
            maqtuFoot: '= =',
            makhbunFoot: '– – = =',
            makhbunEnding: '– – =',
            footUr: 'فاعلاتن',
            footRo: 'fāʿilātun',
            desc: 'Starting Beat 4',
            verses: {
              'musamman_salim': {
                ur: 'سب کہاں کچھ لالہ و گل میں نمایاں ہو گئیں',
                ro: 'sab kahāñ kuchh lālah-o-gul meñ numāyāñ ho gaʾīñ',
                hi: 'सब कहाँ कुछ लाला-ओ-गुल में नुमायाँ हो गईं',
                ur2: 'خاک میں کیا صورتیں ہوں گی کہ پنہاں ہو گئیں',
                ro2: 'khāk meñ kyā sūrateñ hoñgī kih pinhāñ ho gaʾīñ',
                hi2: 'ख़ाक में क्या सूरतें होंगी कि पिन्हाँ हो गईं',
                poet: 'Ghalib',
                syls: [
                  { ro: 'sab', m: 'l' }, { ro: 'ka', m: 's' }, { ro: 'hāñ', m: 'l' }, { ro: 'kuchh', m: 'l' },
                  { ro: 'lā', m: 'l' }, { ro: 'la', m: 's' }, { ro: 'ho', m: 'l' }, { ro: 'gul', m: 'l' },
                  { ro: 'meñ', m: 'l' }, { ro: 'nu', m: 's' }, { ro: 'mā', m: 'l' }, { ro: 'yāñ', m: 'l' },
                  { ro: 'ho', m: 'l' }, { ro: 'ga', m: 's' }, { ro: 'īñ', m: 'l' }
                ]
              },
              'musaddas_salim': {
                ur: 'کوئی دن گر زندگانی اور ہے',
                ro: 'koʾī din gar zindagānī aur hai',
                hi: 'कोई दिन गर ज़िंदगानी और है',
                ur2: 'اپنے جی میں ہم نے ٹھانی اور ہے',
                ro2: 'apne jī meñ ham ne ṭhānī aur hai',
                hi2: 'अपने जी में हम ने ठानी और है',
                poet: 'Ghalib',
                syls: [
                  { ro: 'ko', m: 'l' }, { ro: 'ī', m: 's' }, { ro: 'din', m: 'l' }, { ro: 'gar', m: 'l' },
                  { ro: 'zin', m: 'l' }, { ro: 'da', m: 's' }, { ro: 'gā', m: 'l' }, { ro: 'nī', m: 'l' },
                  { ro: 'au', m: 'l' }, { ro: 'r', m: 's' }, { ro: 'hai', m: 'l' }
                ]
              },
              'musamman_makhbun_maqtu': {
                ur: 'بسکہ دشوار ہے ہر کام کا آساں ہونا',
                ro: 'baskih dushvār hai har kām kā āsāñ honā',
                hi: 'बस्कह दुश्वार है हर काम का आसाँ होना',
                ur2: 'آدمی کو بھی میسر نہیں انساں ہونا',
                ro2: 'aadmī ko bhī muyassar nahīñ insāñ honā',
                hi2: 'आदमी को भी मुयस्सर नहीं इंसाँ होना',
                poet: 'Ghalib',
                syls: [
                  { ro: 'bas', m: 'l' }, { ro: 'kih', m: 's' }, { ro: 'dush', m: 'l' }, { ro: 'vā', m: 'l' },
                  { ro: 'r', m: 's' }, { ro: 'hai', m: 's' }, { ro: 'har', m: 'l' }, { ro: 'kā', m: 'l' },
                  { ro: 'm', m: 's' }, { ro: 'kā', m: 's' }, { ro: 'ā', m: 'l' }, { ro: 'sāñ', m: 'l' },
                  { ro: 'ho', m: 'l' }, { ro: 'nā', m: 'l' }
                ]
              },
              'musamman_makhbun_mahzuuf': {
                ur: 'دہر میں نقشِ وفا وجہِ تسلی نہ ہوا',
                ro: 'dahr meñ naqsh-e vafā vajah-e tasallī nah huʾā',
                hi: 'दहर में नक़्श-ए-वफ़ा वजह-ए-तसल्ली न हुआ',
                ur2: 'ہے یہ وہ لفظ کہ شرمندۂ معنی نہ ہوا',
                ro2: 'hai yih voh lafẓ kih sharmindah-e maʿnī nah huʾā',
                hi2: 'है ये वो लफ़्ज़ कि शर्मिंदा-ए-मा\'नी न हुआ',
                poet: 'Ghalib',
                syls: [
                  { ro: 'dah', m: 'l' }, { ro: 'r', m: 's' }, { ro: 'meñ', m: 'l' }, { ro: 'naq', m: 'l' },
                  { ro: 'she', m: 's' }, { ro: 'va', m: 's' }, { ro: 'fā', m: 'l' }, { ro: 'vaj', m: 'l' },
                  { ro: 'he', m: 's' }, { ro: 'ta', m: 's' }, { ro: 'sal', m: 'l' }, { ro: 'lī', m: 'l' },
                  { ro: 'nah', m: 's' }, { ro: 'hu', m: 's' }, { ro: 'ā', m: 'l' }
                ]
              },
              'musamman_makhbun': {
                ur: 'بسکہ دشوار ہے ہر کام کا آساں ہونا',
                ro: 'baskih dushvār hai har kām kā āsāñ honā',
                hi: 'बस्कह दुश्वार है हर काम का आसाँ होना',
                ur2: 'آدمی کو بھی میسر نہیں انساں ہونا',
                ro2: 'aadmī ko bhī muyassar nahīñ insāñ honā',
                hi2: 'आदमी को भी मुयस्सर नहीं इंसाँ होना',
                poet: 'Ghalib',
                syls: [
                  { ro: 'bas', m: 'l' }, { ro: 'kih', m: 's' }, { ro: 'dush', m: 'l' }, { ro: 'vā', m: 'l' },
                  { ro: 'r', m: 's' }, { ro: 'hai', m: 's' }, { ro: 'har', m: 'l' }, { ro: 'kā', m: 'l' },
                  { ro: 'm', m: 's' }, { ro: 'kā', m: 's' }, { ro: 'ā', m: 'l' }, { ro: 'sāñ', m: 'l' },
                  { ro: 'ho', m: 'l' }, { ro: 'nā', m: 'l' }
                ]
              },
              'musamman_mahzuuf': {
                ur: 'سب کہاں کچھ لالہ و گل میں نمایاں ہو گئیں',
                ro: 'sab kahāñ kuchh lālah-o-gul meñ numāyāñ ho gaʾīñ',
                hi: 'सब कहाँ कुछ लाला-ओ-गुल में नुमायाँ हो गईं',
                ur2: 'خاک میں کیا صورتیں ہوں گی کہ پنہاں ہو گئیں',
                ro2: 'khāk meñ kyā sūrateñ hoñgī kih pinhāñ ho gaʾīñ',
                hi2: 'ख़ाक में क्या सूरतें होंगी कि पिन्हाँ हो गईं',
                poet: 'Ghalib',
                syls: [
                  { ro: 'sab', m: 'l' }, { ro: 'ka', m: 's' }, { ro: 'hāñ', m: 'l' }, { ro: 'kuchh', m: 'l' },
                  { ro: 'lā', m: 'l' }, { ro: 'la', m: 's' }, { ro: 'ho', m: 'l' }, { ro: 'gul', m: 'l' },
                  { ro: 'meñ', m: 'l' }, { ro: 'nu', m: 's' }, { ro: 'mā', m: 'l' }, { ro: 'yāñ', m: 'l' },
                  { ro: 'ho', m: 'l' }, { ro: 'ga', m: 's' }, { ro: 'īñ', m: 'l' }
                ]
              },
              'musamman_maqtu': {
                ur: 'بسکہ دشوار ہے ہر کام کا آساں ہونا',
                ro: 'baskih dushvār hai har kām kā āsāñ honā',
                hi: 'बस्कह दुश्वार है हर काम का आसाँ होना',
                ur2: 'آدمی کو بھی میسر نہیں انساں ہونا',
                ro2: 'aadmī ko bhī muyassar nahīñ insāñ honā',
                hi2: 'आदमी को भी मुयस्सर नहीं इंसाँ होना',
                poet: 'Ghalib',
                syls: [
                  { ro: 'bas', m: 'l' }, { ro: 'kih', m: 's' }, { ro: 'dush', m: 'l' }, { ro: 'vā', m: 'l' },
                  { ro: 'r', m: 's' }, { ro: 'hai', m: 's' }, { ro: 'har', m: 'l' }, { ro: 'kā', m: 'l' },
                  { ro: 'm', m: 's' }, { ro: 'kā', m: 's' }, { ro: 'ā', m: 'l' }, { ro: 'sāñ', m: 'l' },
                  { ro: 'ho', m: 'l' }, { ro: 'nā', m: 'l' }
                ]
              },
              'musaddas_makhbun_maqtu': {
                ur: 'پھر مجھے دیدۂ تر یاد آیا',
                ro: 'phir mujhe dīdah-e tar yād āyā',
                hi: 'फिर मुझे दीदा-ए-तर याद आया',
                ur2: 'دلِ جگر تشنۂ فریاد آیا',
                ro2: 'dil-e jigar tishnah-e faryād aayā',
                hi2: 'दिल-ए-जिगर तिश्ना-ए-फ़रियाद आया',
                poet: 'Ghalib',
                syls: [
                  { ro: 'phir', m: 'l' }, { ro: 'mu', m: 's' }, { ro: 'jhe', m: 'l' }, { ro: 'dī', m: 'l' },
                  { ro: 'da', m: 's' }, { ro: 'he', m: 's' }, { ro: 'tar', m: 'l' }, { ro: 'yā', m: 'l' },
                  { ro: 'd-ā', m: 'l' }, { ro: 'yā', m: 'l' }
                ]
              },
              'musaddas_makhbun_mahzuuf': {
                ur: 'عشق مجھ کو نہیں وحشت ہی سہی',
                ro: 'ʿishq mujh ko nahīñ vaḥshat hī sahī',
                hi: 'इश्क़ मुझ को नहीं वहशत ही सही',
                ur2: 'میری وحشت تری شہرت ہی سہی',
                ro2: 'merī vaḥshat tirī shuhrat hī sahī',
                hi2: 'मेरी वहशत तिरी शोहरत ही सही',
                poet: 'Ghalib',
                syls: [
                  { ro: 'ʿish', m: 'l' }, { ro: 'q', m: 's' }, { ro: 'mujh', m: 'l' }, { ro: 'ko', m: 'l' },
                  { ro: 'na', m: 's' }, { ro: 'hīñ', m: 's' }, { ro: 'vaḥ', m: 'l' }, { ro: 'shat', m: 'l' },
                  { ro: 'hī', m: 's' }, { ro: 'sa', m: 's' }, { ro: 'hī', m: 'l' }
                ]
              },
              'musaddas_makhbun': {
                ur: 'پھر مجھے دیدۂ تر یاد آیا',
                ro: 'phir mujhe dīdah-e tar yād āyā',
                hi: 'फिर मुझे दीदा-ए-तर याद आया',
                ur2: 'دلِ جگر تشنۂ فریاد آیا',
                ro2: 'dil-e jigar tishnah-e faryād aayā',
                hi2: 'दिल-ए-जिगर तिश्ना-ए-फ़रियाद आया',
                poet: 'Ghalib',
                syls: [
                  { ro: 'phir', m: 'l' }, { ro: 'mu', m: 's' }, { ro: 'jhe', m: 'l' }, { ro: 'dī', m: 'l' },
                  { ro: 'da', m: 's' }, { ro: 'he', m: 's' }, { ro: 'tar', m: 'l' }, { ro: 'yād', m: 'l' },
                  { ro: 'ā', m: 's' }, { ro: 'yā', m: 'l' }
                ]
              },
              'musaddas_mahzuuf': {
                ur: 'بشنو این نی چون شکایت می‌کند',
                ro: 'bishnao īn nai chūn shikāyat mīkunad',
                hi: 'बिश्रौ ईं नै चूँ शिकायत मी-कुनद',
                ur2: 'از جدایی‌ها حکایت می‌کند',
                ro2: 'az judāʾī-hā ḥikāyat mī-kunad',
                hi2: 'अज़ जुदाई-हा हिकायत मी-कुनद',
                poet: 'Rumi',
                genre: 'Masnavi (Persian)',
                url: 'https://ganjoor.net/moulavi/masnavi/daftar1/sh1',
                source: 'Ganjoor ↗',
                syls: [
                  { ro: 'bish', m: 'l' }, { ro: 'na', m: 's' }, { ro: 'vīn', m: 'l' }, { ro: 'nai', m: 'l' },
                  { ro: 'chūn', m: 'l' }, { ro: 'shi', m: 's' }, { ro: 'kā', m: 'l' }, { ro: 'yat', m: 'l' },
                  { ro: 'mī', m: 'l' }, { ro: 'ku', m: 's' }, { ro: 'nad', m: 'l' }
                ]
              },
              'musaddas_maqtu': {
                ur: 'پھر مجھے دیدۂ تر یاد آیا',
                ro: 'phir mujhe dīdah-e tar yād āyā',
                hi: 'फिर मुझे दीदा-ए-तर याद आया',
                ur2: 'دلِ جگر تشنۂ فریاد آیا',
                ro2: 'dil-e jigar tishnah-e faryād aayā',
                hi2: 'दिल-ए-जिगर तिश्ना-ए-फ़रियाद आया',
                poet: 'Ghalib',
                syls: [
                  { ro: 'phir', m: 'l' }, { ro: 'mu', m: 's' }, { ro: 'jhe', m: 'l' }, { ro: 'dī', m: 'l' },
                  { ro: 'da', m: 's' }, { ro: 'he', m: 's' }, { ro: 'tar', m: 'l' }, { ro: 'yā', m: 'l' },
                  { ro: 'd-ā', m: 'l' }, { ro: 'yā', m: 'l' }
                ]
              }
            }
          }
        ]
      },
      {
        id: 'mushtabih',
        nameEn: 'Dāʾira-e-Mushtabiha',
        transEn: 'The Resembling Circle',
        nameUr: 'دائرہِ مشتبہہ',
        badge: 'Major (Ghalib & Faiz)',
        tagGold: true,
        whyNamed: 'Named "al-Mushtabih" (The Resembling / The Ambiguous) because all six meters share identical foot lengths (7 letters) but subtly differ in internal caesura (watad majmūʿ vs watad mafrūq), easily confusing the untrained ear.',
        urduPresence: 'Highly celebrated in Urdu literature. Khafīf and Muḍāriʿ are among the most expressive, contemplative meters in Urdu, immortalized in landmark ghazals by Ghalib and Faiz.',
        structureDesc: 'Loop of 18 beats with mixed compound foot structures. Generates 6 classical meters: Khafīf, Muḍāriʿ, Mujtathth, Sarīʿ, Munsariḥ, Muqtaḍab.',
        cycle: ['l', 's', 'l', 'l', 's', 'l', 'l', 'l', 's', 'l', 'l', 's', 'l', 'l', 'l', 's', 'l', 'l'], // 18 beats
        footLen: 6,
        meters: [
          {
            id: 'khafif',
            name: 'Khafīf',
            canonical: { length: 'musaddas', bodyMod: 'makhbun', endMod: 'maqtu', meterNum: 14, handbookNum: 17, nameEn: 'Khafīf Musaddas Makhbūn Maqṭūʿ', nameUr: 'بحرِ خفیف مسدس مخبون مقطوع' },
            meaning: 'Light',
            nameUr: 'خفیف',
            startIdx: 0,
            baseFoot: '= – = = / – = =',
            trimmedFoot: '= – = = / = =',
            footUr: 'فاعلاتن مستفعلن',
            footRo: 'fāʿilātun mustafʿilun',
            desc: 'Starting Beat 1',
            verses: {
              'musaddas_makhbun_maqtu': {
                ur: 'دلِ ناداں تجھے ہوا کیا ہے',
                ro: 'dil-e nādāñ tujhe huʾā kyā hai',
                hi: 'दिल-ए-नादाँ तुझे हुआ क्या है',
                ur2: 'آخر اس درد کی دوا کیا ہے',
                ro2: 'ākhir is dard kī davā kyā hai',
                hi2: 'आख़िर इस दर्द की दवा क्या है',
                poet: 'Ghalib',
                syls: [
                  { ro: 'di', m: 's' }, { ro: 'le', m: 'l' }, { ro: 'nā', m: 'l' }, { ro: 'dāñ', m: 'l' },
                  { ro: 'tu', m: 's' }, { ro: 'jhe', m: 'l' }, { ro: 'hu', m: 's' }, { ro: 'ā', m: 'l' },
                  { ro: 'kyā', m: 'l' }, { ro: 'hai', m: 'l' }
                ]
              },
              'musaddas_makhbun_mahzuuf': {
                ur: 'نازکی اس کے لب کی کیا کہیے',
                ro: 'nāzukī us ke lab kī kyā kahiye',
                hi: 'नाज़ुकी उस के लब की क्या कहिए',
                ur2: 'پنکھڑی اک گلاب کی سی ہے',
                ro2: 'pankhaṛī ik gulāb kī sī hai',
                hi2: 'पंखुड़ी इक गुलाब की सी है',
                poet: 'Mir',
                syls: [
                  { ro: 'nā', m: 'l' }, { ro: 'zu', m: 's' }, { ro: 'kī', m: 'l' }, { ro: 'us', m: 'l' },
                  { ro: 'ke', m: 's' }, { ro: 'lab', m: 'l' }, { ro: 'kī', m: 's' }, { ro: 'kyā', m: 'l' },
                  { ro: 'ka', m: 's' }, { ro: 'hi', m: 's' }, { ro: 'ye', m: 'l' }
                ]
              }
            }
          },
          {
            id: 'mudari',
            name: 'Muḍāriʿ',
            canonical: { length: 'musamman', bodyMod: 'makhbun', endMod: 'mahzuuf', meterNum: 5, handbookNum: 21, nameEn: 'Muḍāriʿ Mus̱amman Akhrab Makfūf Maḥzūf', nameUr: 'بحرِ مضارع مثمن اخرب مکفوف محذوف' },
            meaning: 'Resembling',
            nameUr: 'مضارع',
            startIdx: 4,
            baseFoot: '– = – = / = = – =',
            trimmedFoot: '– = – = / = – =',
            footUr: 'مفاعلن مستفعلن',
            footRo: 'mafāʿilun mustafʿilun',
            desc: 'Starting Beat 5',
            verses: {
              'musamman_makhbun_mahzuuf': {
                ur: 'دائم پڑا ہوا ترے در پر نہیں ہوں میں',
                ro: 'dāʾim paṛā huʾā tire dar par nahīñ hūñ maiñ',
                hi: 'दाइम पड़ा हुआ तिरे दर पर नहीं हूँ मैं',
                ur2: 'خاک ایسی زندگی پہ کہ پتھر نہیں ہوں میں',
                ro2: 'khāk aisī zindagī pah kih patthar nahīñ hūñ maiñ',
                hi2: 'ख़ाक ऐसी ज़िंदगी पे कि पत्थर नहीं हूँ मैं',
                poet: 'Ghalib',
                syls: [
                  { ro: 'dā', m: 'l' }, { ro: 'ʾim', m: 'l' }, { ro: 'pa', m: 's' },
                  { ro: 'ṛā', m: 'l' }, { ro: 'hu', m: 's' }, { ro: 'vā', m: 'l' }, { ro: 'ti', m: 's' },
                  { ro: 're', m: 's' }, { ro: 'dar', m: 'l' }, { ro: 'par', m: 'l' }, { ro: 'na', m: 's' },
                  { ro: 'hīñ', m: 'l' }, { ro: 'hūñ', m: 's' }, { ro: 'maiñ', m: 'l' }
                ]
              },
              'musamman_makhbun_maqtu': {
                ur: 'دائم پڑا ہوا ترے در پر نہیں ہوں میں',
                ro: 'dāʾim paṛā huʾā tire dar par nahīñ hūñ maiñ',
                hi: 'दाइम पड़ा हुआ तिरे दर पर नहीं हूँ मैं',
                ur2: 'خاک ایسی زندگی پہ کہ پتھر نہیں ہوں میں',
                ro2: 'khāk aisī zindagī pah kih patthar nahīñ hūñ maiñ',
                hi2: 'ख़ाक ऐसी ज़िंदगी पे कि पत्थर नहीं हूँ मैं',
                poet: 'Ghalib',
                syls: [
                  { ro: 'dā', m: 'l' }, { ro: 'ʾim', m: 'l' }, { ro: 'pa', m: 's' },
                  { ro: 'ṛā', m: 'l' }, { ro: 'hu', m: 's' }, { ro: 'vā', m: 'l' }, { ro: 'ti', m: 's' },
                  { ro: 're', m: 's' }, { ro: 'dar', m: 'l' }, { ro: 'par', m: 'l' }, { ro: 'na', m: 's' },
                  { ro: 'hīñ', m: 'l' }, { ro: 'hūñ', m: 's' }, { ro: 'maiñ', m: 'l' }
                ]
              },
              'musamman_mahzuuf': {
                ur: 'دائم پڑا ہوا ترے در پر نہیں ہوں میں',
                ro: 'dāʾim paṛā huʾā tire dar par nahīñ hūñ maiñ',
                hi: 'दाइम पड़ा हुआ तिरे दर पर नहीं हूँ मैं',
                ur2: 'خاک ایسی زندگی پہ کہ پتھر نہیں ہوں میں',
                ro2: 'khāk aisī zindagī pah kih patthar nahīñ hūñ maiñ',
                hi2: 'ख़ाक ऐसी ज़िंदगी पे कि पत्थर नहीं हूँ मैं',
                poet: 'Ghalib',
                syls: [
                  { ro: 'dā', m: 'l' }, { ro: 'ʾim', m: 'l' }, { ro: 'pa', m: 's' },
                  { ro: 'ṛā', m: 'l' }, { ro: 'hu', m: 's' }, { ro: 'vā', m: 'l' }, { ro: 'ti', m: 's' },
                  { ro: 're', m: 's' }, { ro: 'dar', m: 'l' }, { ro: 'par', m: 'l' }, { ro: 'na', m: 's' },
                  { ro: 'hīñ', m: 'l' }, { ro: 'hūñ', m: 's' }, { ro: 'maiñ', m: 'l' }
                ]
              },
              'musamman_salim': {
                ur: 'یا رب ہے بخش دینا بندے کو کام تیرا',
                ro: 'yā rab hai baḳhsh denā bande ko kām terā',
                hi: 'या रब है बख़्श देना बंदे को काम तेरा',
                ur2: 'تجھ بن نہیں سہارا کوئی مدام تیرا',
                ro2: 'tujh bin nahīñ sahārā koʾī mudām terā',
                hi2: 'तुझ बिन नहीं सहारा कोई मुदाम तेरा',
                poet: 'Dagh',
                syls: [
                  { ro: 'yā', m: 'l' }, { ro: 'rab', m: 'l' }, { ro: 'hai', m: 's' }, { ro: 'baḳhsh', m: 'l' },
                  { ro: 'de', m: 'l' }, { ro: 'nā', m: 's' }, { ro: 'ban', m: 'l' }, { ro: 'de', m: 'l' },
                  { ro: 'ko', m: 's' }, { ro: 'kām', m: 'l' }, { ro: 'te', m: 'l' }, { ro: 'rā', m: 'l' }
                ]
              },
              'musaddas_mahzuuf': {
                ur: 'یہ نہ تھی ہماری قسمت کہ وصالِ یار ہوتا',
                ro: 'yih nah thī hamārī qismat kih viṣāl-e yār hotā',
                hi: 'ये न थी हमारी क़िस्मत कि विसाल-ए-यार होता',
                ur2: 'اگر اور جیتے رہتے یہی انتظار ہوتا',
                ro2: 'agar aur jīte rahte yahī intizār hotā',
                hi2: 'अगर और जीते रहते यही इंतज़ार होता',
                poet: 'Ghalib',
                syls: [
                  { ro: 'yeh', m: 's' }, { ro: 'nah', m: 'l' }, { ro: 'thī', m: 's' }, { ro: 'ha', m: 'l' },
                  { ro: 'mā', m: 'l' }, { ro: 'rī', m: 'l' }, { ro: 'qis', m: 's' }, { ro: 'mat', m: 'l' },
                  { ro: 'ki', m: 's' }, { ro: 'vi', m: 'l' }, { ro: 'ṣā', m: 'l' }, { ro: 'le', m: 's' },
                  { ro: 'yār', m: 'l' }, { ro: 'ho', m: 'l' }, { ro: 'tā', m: 'l' }
                ]
              },
              'musaddas_salim': {
                ur: 'یہ نہ تھی ہماری قسمت کہ وصالِ یار ہوتا',
                ro: 'yih nah thī hamārī qismat kih viṣāl-e yār hotā',
                hi: 'ये न थी हमारी क़िस्मत कि विसाल-ए-यार होता',
                ur2: 'اگر اور جیتے رہتے یہی انتظار ہوتا',
                ro2: 'agar aur jīte rahte yahī intizār hotā',
                hi2: 'अगर और जीते रहते यही इंतज़ार होता',
                poet: 'Ghalib',
                syls: [
                  { ro: 'yeh', m: 's' }, { ro: 'nah', m: 'l' }, { ro: 'thī', m: 's' }, { ro: 'ha', m: 'l' },
                  { ro: 'mā', m: 'l' }, { ro: 'rī', m: 'l' }, { ro: 'qis', m: 's' }, { ro: 'mat', m: 'l' }
                ]
              }
            }
          },
          {
            id: 'mujtathth',
            name: 'Mujtathth',
            canonical: { length: 'musamman', bodyMod: 'makhbun', endMod: 'maqtu', meterNum: 33, handbookNum: 13, nameEn: 'Mujtathth Mus̱amman Makhbūn Maqṭūʿ', nameUr: 'بحرِ مجتث مثمن مخبون مقطوع' },
            meaning: 'Severed',
            nameUr: 'مجتث',
            startIdx: 8,
            baseFoot: '– = – = / = – = =',
            trimmedFoot: '– = – = / – – =',
            footUr: 'مفاعلن فاعلاتن',
            footRo: 'mafāʿilun fāʿilātun',
            desc: 'Starting Beat 9',
            verses: {
              'musamman_makhbun_maqtu': {
                ur: 'یہ آرزو تھی تجھے گل کے رو بہ رو کرتے',
                ro: 'ye aarzū thī tujhe gul ke rū-ba-rū karte',
                hi: 'ये आरज़ू थी तुझे गुल के रू-ब-रू करते',
                ur2: 'ہم اور بلبلِ بے تاب گفتگو کرتے',
                ro2: 'ham aur bulbul-e be-tāb guftugū karte',
                hi2: 'हम और बुलबुल-ए-बे-ताब गुफ़्तुगू करते',
                poet: 'Atish',
                syls: [
                  { ro: 'ye', m: 's' }, { ro: 'ā', m: 'l' }, { ro: 'r', m: 's' }, { ro: 'zū', m: 'l' },
                  { ro: 'thī', m: 's' }, { ro: 'tu', m: 's' }, { ro: 'jhe', m: 'l' }, { ro: 'gul', m: 'l' },
                  { ro: 'ke', m: 's' }, { ro: 'rū', m: 'l' }, { ro: 'ba', m: 's' }, { ro: 'rū', m: 'l' },
                  { ro: 'kar', m: 'l' }, { ro: 'te', m: 'l' }
                ]
              },
              'musamman_makhbun_mahzuuf': {
                ur: 'حنائے پائے خزاں ہے بہار اگر ہے یہی',
                ro: 'ḥinā-e pā-e ḳhizāñ hai bahār agar hai yihī',
                hi: 'हिना-ए पा-ए ख़िज़ाँ है बहार अगर है यही',
                ur2: 'دوامِ کلفتِ خاطر ہے عیش دنیا کا',
                ro2: 'davām-e kulfat-e ḳhāt̤ir hai ʿaish dunyā kā',
                hi2: 'दवाम-ए-कुलफ़त-ए-ख़ातिर है ऐश दुनिया का',
                poet: 'Ghalib',
                syls: [
                  { ro: 'ḥi', m: 's' }, { ro: 'nā', m: 'l' }, { ro: 'e', m: 's' }, { ro: 'pā', m: 'l' },
                  { ro: 'e', m: 's' }, { ro: 'ḳhi', m: 's' }, { ro: 'zāñ', m: 'l' }, { ro: 'hai', m: 'l' },
                  { ro: 'ba', m: 's' }, { ro: 'hā', m: 'l' }, { ro: 'ra', m: 's' }, { ro: 'gar', m: 'l' },
                  { ro: 'hai', m: 's' }, { ro: 'yi', m: 's' }, { ro: 'hī', m: 'l' }
                ]
              },
              'musamman_mahzuuf': {
                ur: 'حنائے پائے خزاں ہے بہار اگر ہے یہی',
                ro: 'ḥinā-e pā-e ḳhizāñ hai bahār agar hai yihī',
                hi: 'हिना-ए पा-ए ख़िज़ाँ है बहार अगर है यही',
                ur2: 'دوامِ کلفتِ خاطر ہے عیش دنیا کا',
                ro2: 'davām-e kulfat-e ḳhāt̤ir hai ʿaish dunyā kā',
                hi2: 'दवाम-ए-कुलफ़त-ए-ख़ातिर है ऐश दुनिया का',
                poet: 'Ghalib',
                syls: [
                  { ro: 'ḥi', m: 's' }, { ro: 'nā', m: 'l' }, { ro: 'e', m: 's' }, { ro: 'pā', m: 'l' },
                  { ro: 'e', m: 's' }, { ro: 'ḳhi', m: 's' }, { ro: 'zāñ', m: 'l' }, { ro: 'hai', m: 'l' },
                  { ro: 'ba', m: 's' }, { ro: 'hā', m: 'l' }, { ro: 'ra', m: 's' }, { ro: 'gar', m: 'l' },
                  { ro: 'hai', m: 's' }, { ro: 'yi', m: 's' }, { ro: 'hī', m: 'l' }
                ]
              },
              'musamman_maqtu': {
                ur: 'یہ آرزو تھی تجھے گل کے رو بہ رو کرتے',
                ro: 'ye aarzū thī tujhe gul ke rū-ba-rū karte',
                hi: 'ये आरज़ू थी तुझे गुल के रू-ब-रू करते',
                ur2: 'ہم اور بلبلِ بے تاب گفتگو کرتے',
                ro2: 'ham aur bulbul-e be-tāb guftugū karte',
                hi2: 'हम और बुलबुल-ए-बे-ताब गुफ़्तुगू करते',
                poet: 'Atish',
                syls: [
                  { ro: 'ye', m: 's' }, { ro: 'ā', m: 'l' }, { ro: 'r', m: 's' }, { ro: 'zū', m: 'l' },
                  { ro: 'thī', m: 's' }, { ro: 'tu', m: 's' }, { ro: 'jhe', m: 'l' }, { ro: 'gul', m: 'l' },
                  { ro: 'ke', m: 's' }, { ro: 'rū', m: 'l' }, { ro: 'ba', m: 's' }, { ro: 'rū', m: 'l' },
                  { ro: 'kar', m: 'l' }, { ro: 'te', m: 'l' }
                ]
              },
              'musamman_salim': {
                ur: 'یہ آرزو تھی تجھے گل کے رو بہ رو کرتے',
                ro: 'ye aarzū thī tujhe gul ke rū-ba-rū karte',
                hi: 'ये आरज़ू थी तुझे गुल के रू-ब-रू करते',
                ur2: 'ہم اور بلبلِ بے تاب گفتگو کرتے',
                ro2: 'ham aur bulbul-e be-tāb guftugū karte',
                hi2: 'हम और बुलबुल-ए-बे-ताब गुफ़्तुगू करते',
                poet: 'Atish',
                syls: [
                  { ro: 'ye', m: 's' }, { ro: 'ā', m: 'l' }, { ro: 'r', m: 's' }, { ro: 'zū', m: 'l' },
                  { ro: 'thī', m: 's' }, { ro: 'tu', m: 's' }, { ro: 'jhe', m: 'l' }, { ro: 'gul', m: 'l' },
                  { ro: 'ke', m: 's' }, { ro: 'rū', m: 'l' }, { ro: 'ba', m: 's' }, { ro: 'rū', m: 'l' },
                  { ro: 'kar', m: 'l' }, { ro: 'te', m: 'l' }
                ]
              },
              'musaddas_makhbun_maqtu': {
                ur: 'فقر کے ہیں معجزات تاج و سریر و سپاہ',
                ro: 'faqr ke haiñ mo.ajizāt taaj o sarīr o sipāh',
                hi: 'फ़क़्र के हैं मो़जिज़ात ताज-ओ-सरीत-ओ-सिपाह',
                ur2: 'فقر ہے میرِ سپاہ فقر ہے قلب و نگاہ',
                ro2: 'faqr hai mīr-e sipāh faqr hai qalb-o-nigāh',
                hi2: 'फ़क़्र है मीर-ए-सिपाह फ़क़्र है क़ल्ब-ओ-निगाह',
                poet: 'Iqbal',
                syls: [
                  { ro: 'faq', m: 's' }, { ro: 're', m: 'l' }, { ro: 'ke', m: 's' }, { ro: 'haiñ', m: 'l' },
                  { ro: 'mo', m: 's' }, { ro: 'a', m: 's' }, { ro: 'ji', m: 'l' }, { ro: 'zāt', m: 'l' },
                  { ro: 'tā', m: 's' }, { ro: 'jo', m: 'l' }, { ro: 'sa', m: 's' }, { ro: 'rī', m: 'l' },
                  { ro: 'ro', m: 's' }, { ro: 'si', m: 's' }, { ro: 'pāh', m: 'l' }
                ]
              },
              'musaddas_makhbun_mahzuuf': {
                ur: 'فقر کے ہیں معجزات تاج و سریر و سپاہ',
                ro: 'faqr ke haiñ mo.ajizāt taaj o sarīr o sipāh',
                hi: 'फ़क़्र के हैं मो़जिज़ात ताज-ओ-सरीत-ओ-सिपाह',
                ur2: 'فقر ہے میرِ سپاہ فقر ہے قلب و نگاہ',
                ro2: 'faqr hai mīr-e sipāh faqr hai qalb-o-nigāh',
                hi2: 'फ़क़्र है मीर-ए-सिपाह फ़क़्र है क़ल्ब-ओ-निगाह',
                poet: 'Iqbal',
                syls: [
                  { ro: 'faq', m: 's' }, { ro: 're', m: 'l' }, { ro: 'ke', m: 's' }, { ro: 'haiñ', m: 'l' },
                  { ro: 'mo', m: 's' }, { ro: 'a', m: 's' }, { ro: 'ji', m: 'l' }, { ro: 'zāt', m: 'l' },
                  { ro: 'tā', m: 's' }, { ro: 'jo', m: 'l' }, { ro: 'sa', m: 's' }, { ro: 'rī', m: 'l' },
                  { ro: 'ro', m: 's' }, { ro: 'si', m: 's' }, { ro: 'pāh', m: 'l' }
                ]
              },
              'musaddas_makhbun': {
                ur: 'فقر کے ہیں معجزات تاج و سریر و سپاہ',
                ro: 'faqr ke haiñ mo.ajizāt taaj o sarīr o sipāh',
                hi: 'फ़क़्र के हैं मो़जिज़ात ताज-ओ-सरीत-ओ-सिपाह',
                ur2: 'فقر ہے میرِ سپاہ فقر ہے قلب و نگاہ',
                ro2: 'faqr hai mīr-e sipāh faqr hai qalb-o-nigāh',
                hi2: 'फ़क़्र है मीर-ए-सिपाह फ़क़्र है क़ल्ब-ओ-निगाह',
                poet: 'Iqbal',
                syls: [
                  { ro: 'faq', m: 's' }, { ro: 're', m: 'l' }, { ro: 'ke', m: 's' }, { ro: 'haiñ', m: 'l' },
                  { ro: 'mo', m: 's' }, { ro: 'a', m: 's' }, { ro: 'ji', m: 'l' }, { ro: 'zāt', m: 'l' },
                  { ro: 'tā', m: 's' }, { ro: 'jo', m: 'l' }, { ro: 'sa', m: 's' }, { ro: 'rī', m: 'l' },
                  { ro: 'ro', m: 's' }, { ro: 'si', m: 's' }, { ro: 'pāh', m: 'l' }
                ]
              },
              'musaddas_mahzuuf': {
                ur: 'فقر کے ہیں معجزات تاج و سریر و سپاہ',
                ro: 'faqr ke haiñ mo.ajizāt taaj o sarīr o sipāh',
                hi: 'फ़क़्र के हैं मो़जिज़ात ताज-ओ-सरीत-ओ-सिपाह',
                ur2: 'فقر ہے میرِ سپاہ فقر ہے قلب و نگاہ',
                ro2: 'faqr hai mīr-e sipāh faqr hai qalb-o-nigāh',
                hi2: 'फ़क़्र है मीर-ए-सिपाह फ़क़्र है क़ल्ब-ओ-निगाह',
                poet: 'Iqbal',
                syls: [
                  { ro: 'faq', m: 's' }, { ro: 're', m: 'l' }, { ro: 'ke', m: 's' }, { ro: 'haiñ', m: 'l' },
                  { ro: 'mo', m: 's' }, { ro: 'a', m: 's' }, { ro: 'ji', m: 'l' }, { ro: 'zāt', m: 'l' },
                  { ro: 'tā', m: 's' }, { ro: 'jo', m: 'l' }, { ro: 'sa', m: 's' }, { ro: 'rī', m: 'l' },
                  { ro: 'ro', m: 's' }, { ro: 'si', m: 's' }, { ro: 'pāh', m: 'l' }
                ]
              },
              'musaddas_salim': {
                ur: 'فقر کے ہیں معجزات تاج و سریر و سپاہ',
                ro: 'faqr ke haiñ mo.ajizāt taaj o sarīr o sipāh',
                hi: 'फ़क़्र के हैं मो़जिज़ात ताज-ओ-सरीत-ओ-सिपाह',
                ur2: 'فقر ہے میرِ سپاہ فقر ہے قلب و نگاہ',
                ro2: 'faqr hai mīr-e sipāh faqr hai qalb-o-nigāh',
                hi2: 'फ़क़्र है मीर-ए-सिपाह फ़क़्र है क़ल्ब-ओ-निगाह',
                poet: 'Iqbal',
                syls: [
                  { ro: 'faq', m: 's' }, { ro: 're', m: 'l' }, { ro: 'ke', m: 's' }, { ro: 'haiñ', m: 'l' },
                  { ro: 'mo', m: 's' }, { ro: 'a', m: 's' }, { ro: 'ji', m: 'l' }, { ro: 'zāt', m: 'l' }
                ]
              }
            }
          }
        ]
      },
      {
        id: 'muttafiq',
        nameEn: 'Dāʾira-e-Muttafiqa',
        transEn: 'The Agreeing Circle',
        nameUr: 'دائرہِ متفقہ',
        badge: 'Epic & Driving (Iqbal)',
        tagGold: false,
        whyNamed: 'Named "al-Muttafiq" (The Agreeing / Uniform) because all of its feet strictly agree in being compact 3-syllable / 5-letter units (faʿūlun and fāʿilun), creating an unbroken, driving rhythm.',
        urduPresence: 'Common in Urdu for narrative masnavis, dramatic dialogues, and rousing national anthems. Famous for epic poetry (Firdowsi’s Shahnama, Hali’s Musaddas) and Iqbal’s poetry.',
        structureDesc: 'Loop of 6 beats: uniform trisyllabic feet (– = = or = – =). Yields 2 base meters: Mutaqārib, Mutadārik.',
        cycle: ['s', 'l', 'l', 's', 'l', 'l'], // 6 beats
        footLen: 3,
        meters: [
          {
            id: 'mutaqarib',
            name: 'Mutaqārib',
            canonical: { length: 'musamman', bodyMod: 'base', endMod: 'mahzuuf', meterNum: 29, handbookNum: 9, nameEn: 'Mutaqārib Mus̱amman Maḥzūf', nameUr: 'بحرِ متقارب مثمن محذوف' },
            meaning: 'Approaching',
            nameUr: 'متقارب',
            startIdx: 0,
            baseFoot: '– = =',
            trimmedFoot: '– =',
            footUr: 'فعولن',
            footRo: 'faʿūlun',
            desc: 'Starting Beat 1',
            verses: {
              'musamman_salim': {
                ur: 'جہاں تیرا نقشِ قدم دیکھتے ہیں',
                ro: 'jahāñ terā naqsh-e qadam dekhte haiñ',
                hi: 'जहाँ तेरा नक़्श-ए-क़दम देखते हैं',
                ur2: 'خیاباں خیاباں ارم دیکھتے ہیں',
                ro2: 'khiyābāñ khiyābāñ iram dekhte haiñ',
                hi2: 'ख़ियाबाँ ख़ियाबाँ इरम देखते हैं',
                poet: 'Ghalib',
                syls: [
                  { ro: 'ja', m: 's' }, { ro: 'hāñ', m: 'l' }, { ro: 'te', m: 'l' },
                  { ro: 'rā', m: 's' }, { ro: 'naq', m: 'l' }, { ro: 'she', m: 'l' },
                  { ro: 'qa', m: 's' }, { ro: 'dam', m: 'l' }, { ro: 'dī', m: 'l' },
                  { ro: 'khe', m: 's' }, { ro: 'te', m: 'l' }, { ro: 'haiñ', m: 'l' }
                ]
              },
              'musamman_mahzuuf': {
                ur: 'فقیرانہ آئے صدا کر چلے',
                ro: 'faqīrānah āʾe ṣadā kar chale',
                hi: 'फ़क़ीराना आए सदा कर चले',
                ur2: 'میاں خوش رہو ہم دعا کر چلے',
                ro2: 'miyāñ khvush raho ham duʿā kar chale',
                hi2: 'मियाँ ख़ुश रहो हम दुआ कर चले',
                poet: 'Mir',
                syls: [
                  { ro: 'fa', m: 's' }, { ro: 'qī', m: 'l' }, { ro: 'rā', m: 'l' },
                  { ro: 'na', m: 's' }, { ro: 'ā', m: 'l' }, { ro: 'e', m: 'l' },
                  { ro: 'ṣa', m: 's' }, { ro: 'dā', m: 'l' }, { ro: 'kar', m: 'l' },
                  { ro: 'cha', m: 's' }, { ro: 'le', m: 'l' }
                ]
              },
              'musamman_maqtu': {
                ur: 'فقیرانہ آئے صدا کر چلے',
                ro: 'faqīrānah āʾe ṣadā kar chale',
                hi: 'फ़क़ीराना आए सदा कर चले',
                ur2: 'میاں خوش رہو ہم دعا کر چلے',
                ro2: 'miyāñ khvush raho ham duʿā kar chale',
                hi2: 'मियाँ ख़ुश रहो हम दुआ कर चले',
                poet: 'Mir',
                syls: [
                  { ro: 'fa', m: 's' }, { ro: 'qī', m: 'l' }, { ro: 'rā', m: 'l' },
                  { ro: 'na', m: 's' }, { ro: 'ā', m: 'l' }, { ro: 'e', m: 'l' },
                  { ro: 'ṣa', m: 's' }, { ro: 'dā', m: 'l' }, { ro: 'kar', m: 'l' },
                  { ro: 'cha', m: 's' }, { ro: 'le', m: 'l' }
                ]
              },
              'musaddas_salim': {
                ur: 'سارے جہاں سے اچھا ہندوستاں ہمارا',
                ro: 'sāre jahāñ se achchhā hindostāñ hamārā',
                hi: 'सारे जहाँ से अच्छा हिन्दोस्ताँ हमारा',
                ur2: 'ہم بلبلیں ہیں اس کی یہ گلستاں ہمارا',
                ro2: 'ham bulbuleñ haiñ is kī yeh gulsitāñ hamārā',
                hi2: 'हम बुलबुलें हैं इस की यह गुलसिताँ हमारा',
                poet: 'Iqbal',
                syls: [
                  { ro: 'sā', m: 'l' }, { ro: 're', m: 'l' }, { ro: 'ja', m: 's' }, { ro: 'hāñ', m: 'l' },
                  { ro: 'se', m: 'l' }, { ro: 'ach', m: 'l' }, { ro: 'chhā', m: 'l' }
                ]
              },
              'musaddas_mahzuuf': {
                ur: 'بہ دیدارِ یاراں شتابی کنید',
                ro: 'bih dīdār-e yārāñ shitābī kunīd',
                hi: 'ब दीदार-ए-याराँ शिताबे कुनेद',
                ur2: 'کہ عمرِ گرامی شتاباں رود',
                ro2: 'kih ʿumr-e girāmī shitābāñ ravī',
                hi2: 'कि उम्र-ए-गिरामी शिताबाँ रवी',
                poet: 'Saadi',
                syls: [
                  { ro: 'bi', m: 's' }, { ro: 'dī', m: 'l' }, { ro: 'dā', m: 'l' },
                  { ro: 're', m: 's' }, { ro: 'yā', m: 'l' }, { ro: 'rāñ', m: 'l' },
                  { ro: 'shi', m: 's' }, { ro: 'tā', m: 'l' }, { ro: 'bī', m: 'l' }
                ]
              }
            }
          },
          {
            id: 'mutadarik',
            name: 'Mutadārik',
            canonical: { length: 'musamman', bodyMod: 'base', endMod: 'salim', meterNum: 39, handbookNum: null, nameEn: 'Mutadārik Mus̱amman Sālim', nameUr: 'بحرِ متدارک مثمن سالم' },
            meaning: 'Overtaking',
            nameUr: 'متدارک',
            startIdx: 1,
            baseFoot: '= – =',
            trimmedFoot: '= =',
            footUr: 'فاعلن',
            footRo: 'fāʿilun',
            desc: 'Starting Beat 2',
            verses: {
              'musamman_salim': {
                ur: 'آپ کی یاد آتی رہی رات بھر',
                ro: 'aap kī yaad aatī rahī raat bhar',
                hi: 'आप की याद आती रही रात भर',
                ur2: 'چاندنی دل دکھاتی رہی رات بھر',
                ro2: 'chāndnī dil dukhātī rahī raat bhar',
                hi2: 'चाँदनी दिल दुखाती रही रात भर',
                poet: 'Faiz',
                syls: [
                  { ro: 'ā', m: 'l' }, { ro: 'pa', m: 's' }, { ro: 'kī', m: 'l' },
                  { ro: 'yā', m: 'l' }, { ro: 'da', m: 's' }, { ro: 'ā', m: 'l' },
                  { ro: 'tī', m: 'l' }, { ro: 'ra', m: 's' }, { ro: 'hī', m: 'l' },
                  { ro: 'rā', m: 'l' }, { ro: 'ta', m: 's' }, { ro: 'bhar', m: 'l' }
                ]
              },
              'musamman_mahzuuf': {
                ur: 'گل چراغوں کو کر ہم سرِ شام دیں',
                ro: 'gul chirāghoñ ko kar ham sar-e shām deñ',
                hi: 'गुल चराग़ों को कर हम सर-ए-शाम दें',
                ur2: 'شب کے ہاتھوں میں اب اپنا انجام دیں',
                ro2: 'shab ke hāthoñ meñ ab apnā anjām deñ',
                hi2: 'शब के हाथों में अब अपना अंजाम दें',
                poet: 'Irfan Abid',
                syls: [
                  { ro: 'gul', m: 'l' }, { ro: 'chi', m: 's' }, { ro: 'rā', m: 'l' },
                  { ro: 'ghoñ', m: 'l' }, { ro: 'ko', m: 's' }, { ro: 'kar', m: 'l' },
                  { ro: 'ham', m: 'l' }, { ro: 'sa', m: 's' }, { ro: 're', m: 'l' },
                  { ro: 'shām', m: 'l' }, { ro: 'deñ', m: 'l' }
                ]
              },
              'musaddas_salim': {
                ur: 'دل مرا ہو گیا بے قرار',
                ro: 'dil mirā ho gayā be-qarār',
                hi: 'दिल मिरा हो गया बे-क़रार',
                ur2: 'لے گیا چین و صبر و قرار',
                ro2: 'le gayā chain-o-ṣabr-o-qarār',
                hi2: 'ले गया चैन-ओ-सब्र-ओ-क़रार',
                poet: 'Nazeer',
                syls: [
                  { ro: 'dil', m: 'l' }, { ro: 'mi', m: 's' }, { ro: 'rā', m: 'l' },
                  { ro: 'ho', m: 'l' }, { ro: 'ga', m: 's' }, { ro: 'yā', m: 'l' },
                  { ro: 'be', m: 'l' }, { ro: 'qa', m: 's' }, { ro: 'rār', m: 'l' }
                ]
              },
              'musaddas_mahzuuf': {
                ur: 'دل مرا ہو گیا بے قرار',
                ro: 'dil mirā ho gayā be-qarār',
                hi: 'दिल मिरा हो गया बे-क़रार',
                ur2: 'لے گیا چین و صبر و قرار',
                ro2: 'le gayā chain-o-ṣabr-o-qarār',
                hi2: 'ले गया चैन-ओ-सब्र-ओ-क़रार',
                poet: 'Nazeer',
                syls: [
                  { ro: 'dil', m: 'l' }, { ro: 'mi', m: 's' }, { ro: 'rā', m: 'l' },
                  { ro: 'ho', m: 'l' }, { ro: 'ga', m: 's' }, { ro: 'yā', m: 'l' }
                ]
              }
            }
          }
        ]
      },
      {
        id: 'mutalif',
        nameEn: 'Dāʾira-e-Muʾtalifa',
        transEn: 'The Harmonious Circle',
        nameUr: 'دائرہِ مؤتلفہ',
        badge: 'Harmonious · Rare in Urdu',
        tagGold: false,
        whyNamed: 'Named "al-Muʾtalif" (The Harmonious / Concordant) because every foot contains a fāṣila ṣughrā (two consecutive short syllables, – – =), producing a continuous, rolling musical wave without abrupt stops.',
        urduPresence: 'Rare in Urdu. Because natural Urdu words rarely have double-short syllable clusters, composing in Kāmil or Wāfir is difficult. Urdu poets like Momin and Aatish, and Persian masters like Hatef Isfahani, used it as a technical demonstration.',
        structureDesc: 'Loop of 10 beats: (– – = – =) or (– = – – =). 5-syllable rolling feet. Yields 2 canonical meters: Kāmil, Wāfir.',
        cycle: ['s', 's', 'l', 's', 'l', 's', 's', 'l', 's', 'l'], // 10 beats
        footLen: 5,
        meters: [
          {
            id: 'kamil',
            name: 'Kāmil',
            canonical: { length: 'musamman', bodyMod: 'base', endMod: 'salim', meterNum: 37, handbookNum: 14, nameEn: 'Kāmil Mus̱amman Sālim', nameUr: 'بحرِ کامل مثمن سالم' },
            meaning: 'Complete',
            nameUr: 'کامل',
            startIdx: 0,
            baseFoot: '– – = – =',
            trimmedFoot: '– – = =',
            footUr: 'متفاعلن',
            footRo: 'mutafāʿilun',
            desc: 'Starting Beat 1',
            verses: {
              'musamman_salim': {
                ur: 'کبھی اے حقیقتِ منتظر نظر آ لباسِ مجاز میں',
                ro: 'kabhī ai haqīqat-e-muntazar nazar aa libās-e-majāz meñ',
                hi: 'कभी ऐ हक़ीक़त-ए-मुंतज़र नज़र आ लिबास-ए-मजाज़ में',
                ur2: 'کہ ہزاروں سجدے تڑپ رہے ہیں مری جبینِ نیاز میں',
                ro2: 'kih hazāroñ sajde taṛap rahe haiñ mirī jabīn-e niyāz meñ',
                hi2: 'कि हज़ारों सजदे तड़प रहे हैं मिरी जबीन-ए-नियाज़ में',
                poet: 'Iqbal',
                syls: [
                  { ro: 'ka', m: 's' }, { ro: 'bhī', m: 's' }, { ro: 'ai', m: 'l' }, { ro: 'ha', m: 's' }, { ro: 'qī', m: 'l' },
                  { ro: 'qa', m: 's' }, { ro: 'te', m: 's' }, { ro: 'mun', m: 'l' }, { ro: 'ta', m: 's' }, { ro: 'zar', m: 'l' },
                  { ro: 'na', m: 's' }, { ro: 'za', m: 's' }, { ro: 'rā', m: 'l' }, { ro: 'li', m: 's' }, { ro: 'bā', m: 'l' },
                  { ro: 'se', m: 's' }, { ro: 'ma', m: 's' }, { ro: 'jā', m: 'l' }, { ro: 'z', m: 's' }, { ro: 'meñ', m: 'l' }
                ]
              },
              'musaddas_salim': {
                ur: 'چه شود به چهرهٔ زرد من نظری برای خدا کنی',
                ro: 'chi sha-vad ba chihra-ye zard-e man naẓarī ba-rā-ye khudā kunī',
                hi: 'चि शवद ब चेहर-ए ज़र्द-ए मन नज़री बरा-ए ख़ुदा कुनी',
                ur2: 'که اگر کنی همه درد من به یکی نظاره دوا کنی',
                ro2: 'ki agar kunī hama dard-e man ba-yakē naẓāra davā kunī',
                hi2: 'कि अगर कुनी हम दर्द-ए मन ब-यके नज़ारा दवा कुनी',
                poet: 'Hatef Isfahani',
                genre: 'Ghazal (Persian)',
                url: 'https://ganjoor.net/hatef/divan-hatef/ghazalha-hatef/sh72',
                source: 'Ganjoor ↗',
                syls: [
                  { ro: 'chi', m: 's' }, { ro: 'sha', m: 's' }, { ro: 'vad', m: 'l' }, { ro: 'ba', m: 's' }, { ro: 'chih', m: 'l' },
                  { ro: 'ra', m: 's' }, { ro: 'ye', m: 's' }, { ro: 'zar', m: 'l' }, { ro: 'de', m: 's' }, { ro: 'man', m: 'l' }
                ]
              },
              'musamman_mahzuuf': {
                ur: 'چه شود به چهرهٔ زرد من نظری برای خدا کنی',
                ro: 'chi sha-vad ba chihra-ye zard-e man naẓarī ba-rā-ye khudā kunī',
                hi: 'चि शवद ब चेहर-ए ज़र्द-ए मन नज़री बरा-ए ख़ुदा कुनी',
                ur2: 'که اگر کنی همه درد من به یکی نظاره دوا کنی',
                ro2: 'ki agar kunī hama dard-e man ba-yakē naẓāra davā kunī',
                hi2: 'कि अगर कुनी हम दर्द-ए मन ब-यके नज़ारा दवा कुनी',
                poet: 'Hatef Isfahani',
                genre: 'Ghazal (Persian)',
                url: 'https://ganjoor.net/hatef/divan-hatef/ghazalha-hatef/sh72',
                source: 'Ganjoor ↗',
                syls: [
                  { ro: 'chi', m: 's' }, { ro: 'sha', m: 's' }, { ro: 'vad', m: 'l' }, { ro: 'ba', m: 's' }, { ro: 'chih', m: 'l' }
                ]
              },
              'musaddas_mahzuuf': {
                ur: 'چه شود به چهرهٔ زرد من نظری برای خدا کنی',
                ro: 'chi sha-vad ba chihra-ye zard-e man naẓarī ba-rā-ye khudā kunī',
                hi: 'चि शवद ब चेहर-ए ज़र्द-ए मन नज़री बरा-ए ख़ुदा कुनी',
                ur2: 'که اگر کنی همه درد من به یکی نظاره دوا کنی',
                ro2: 'ki agar kunī hama dard-e man ba-yakē naẓāra davā kunī',
                hi2: 'कि अगर कुनी हम दर्द-ए मन ब-यके नज़ारा दवा कुनी',
                poet: 'Hatef Isfahani',
                genre: 'Ghazal (Persian)',
                url: 'https://ganjoor.net/hatef/divan-hatef/ghazalha-hatef/sh72',
                source: 'Ganjoor ↗',
                syls: [
                  { ro: 'chi', m: 's' }, { ro: 'sha', m: 's' }, { ro: 'vad', m: 'l' }, { ro: 'ba', m: 's' }, { ro: 'chih', m: 'l' }
                ]
              }
            }
          },
          {
            id: 'wafir',
            name: 'Wāfir',
            canonical: { length: 'musamman', bodyMod: 'base', endMod: 'salim', isArabicOnly: true, nameEn: 'Wāfir Mus̱amman Sālim', nameUr: 'بحرِ وافر مثمن سالم' },
            meaning: 'Abundant',
            nameUr: 'وافر',
            startIdx: 2,
            baseFoot: '– = – – =',
            trimmedFoot: '– = – =',
            footUr: 'مفاعلتن',
            footRo: 'mufāʿalatun',
            desc: 'Starting Beat 3',
            verses: {
              'musaddas_salim': {
                ur: 'اگر آن نگارِ سمن‌برم به وثاقِ بنده گذر کند',
                ro: 'agar ān nigār-e saman-baram ba vis̱āq-e banda guzar kunad',
                hi: 'अगर आँ निगार-ए-समन-बरम ब विसाक़-ए-बंदा गुज़र कुनद',
                ur2: 'ز فروغِ طلعتِ خویشتن شبِ بنده روزِ دگر کند',
                ro2: 'zi furoogh-e talʿat-e kheshtan shab-e banda roz-e digar kunad',
                hi2: 'ज़े फ़रोग़-ए-तलअत-ए-ख़्वेशतन शब-ए-बंदा रोज़-ए-दिगर कुनद',
                poet: 'Shams Qais Razi',
                syls: [
                  { ro: 'a', m: 's' }, { ro: 'gar', m: 'l' }, { ro: 'ān', m: 's' }, { ro: 'ni', m: 's' }, { ro: 'gā', m: 'l' },
                  { ro: 're', m: 's' }, { ro: 'sa', m: 'l' }, { ro: 'man', m: 's' }, { ro: 'ba', m: 's' }, { ro: 'ram', m: 'l' }
                ]
              },
              'musamman_salim': {
                ur: 'اگر آن نگارِ سمن‌برم به وثاقِ بنده گذر کند',
                ro: 'agar ān nigār-e saman-baram ba vis̱āq-e banda guzar kunad',
                hi: 'अगर आँ निगार-ए-समन-बरम ब विसाक़-ए-बंदा गुज़र कुनद',
                ur2: 'ز فروغِ طلعتِ خویشتن شبِ بنده روزِ دگر کند',
                ro2: 'zi furoogh-e talʿat-e kheshtan shab-e banda roz-e digar kunad',
                hi2: 'ज़े फ़रोग़-ए-तलअत-ए-ख़्वेशतन शब-ए-बंदा रोज़-ए-दिगर कुनद',
                poet: 'Shams Qais Razi',
                syls: [
                  { ro: 'a', m: 's' }, { ro: 'gar', m: 'l' }, { ro: 'ān', m: 's' }, { ro: 'ni', m: 's' }, { ro: 'gā', m: 'l' }
                ]
              },
              'musaddas_mahzuuf': {
                ur: 'اگر آن نگارِ سمن‌برم به وثاقِ بنده گذر کند',
                ro: 'agar ān nigār-e saman-baram ba vis̱āq-e banda guzar kunad',
                hi: 'अगर आँ निगार-ए-समन-बरम ब विसाक़-ए-बंदा गुज़र कुनद',
                ur2: 'ز فروغِ طلعتِ خویشتن شبِ بنده روزِ دگر کند',
                ro2: 'zi furoogh-e talʿat-e kheshtan shab-e banda roz-e digar kunad',
                hi2: 'ज़े फ़रोग़-ए-तलअत-ए-ख़्वेशतन शब-ए-बंदा रोज़-ए-दिगर कुनद',
                poet: 'Shams Qais Razi',
                syls: [
                  { ro: 'a', m: 's' }, { ro: 'gar', m: 'l' }, { ro: 'ān', m: 's' }, { ro: 'ni', m: 's' }, { ro: 'gā', m: 'l' }
                ]
              },
              'musamman_mahzuuf': {
                ur: 'اگر آن نگارِ سمن‌برم به وثاقِ بنده گذر کند',
                ro: 'agar ān nigār-e saman-baram ba vis̱āq-e banda guzar kunad',
                hi: 'अगर आँ निगार-ए-समन-बरम ब विसाक़-ए-बंदा गुज़र कुनद',
                ur2: 'ز فروغِ طلعتِ خویشتن شبِ بنده روزِ دگر کند',
                ro2: 'zi furoogh-e talʿat-e kheshtan shab-e banda roz-e digar kunad',
                hi2: 'ज़े फ़रोग़-ए-तलअत-ए-ख़्वेशतन शब-ए-बंदा रोज़-ए-दिगर कुनद',
                poet: 'Shams Qais Razi',
                syls: [
                  { ro: 'a', m: 's' }, { ro: 'gar', m: 'l' }, { ro: 'ān', m: 's' }, { ro: 'ni', m: 's' }, { ro: 'gā', m: 'l' }
                ]
              }
            }
          }
        ]
      },
      {
        id: 'mukhtalif',
        nameEn: 'Dāʾira-e-Mukhtalifa',
        transEn: 'The Mixed Circle',
        nameUr: 'دائرہِ مختلفہ',
        badge: 'Desert Odes · Bypassed in Urdu',
        tagGold: false,
        whyNamed: 'Named "al-Mukhtalif" (The Mixed / Diverse) because its feet are inherently unequal, alternating between 5-syllable and 7-syllable units (faʿūlun then mafāʿīlun).',
        urduPresence: 'Bypassed by Urdu poets. While this was the preeminent meter of ancient pre-Islamic Arabic desert odes (Muʿallaqāt), classical Persian and Urdu prosodists classified it as matrūk (disused) because its alternating asymmetry does not match the natural musical cadence of Persian and Urdu.',
        structureDesc: 'Loop of 14 beats: alternating (– = = – = = =). Yields 3 classical meters: Ṭawīl, Madīd, Basīṭ.',
        cycle: ['s', 'l', 'l', 's', 'l', 'l', 'l', 's', 'l', 'l', 's', 'l', 'l', 'l'], // 14 beats
        footLen: 7,
        meters: [
          {
            id: 'tawil',
            name: 'Ṭawīl',
            canonical: { length: 'musamman', bodyMod: 'base', endMod: 'salim', isArabicOnly: true, nameEn: 'Ṭawīl Mus̱amman Sālim', nameUr: 'بحرِ طویل مثمن سالم' },
            meaning: 'Long',
            nameUr: 'طویل',
            startIdx: 0,
            baseFoot: '– = = / – = = =',
            trimmedFoot: '– = = / – = =',
            footUr: 'فعولن مفاعیلن',
            footRo: 'faʿūlun mafāʿīlun',
            desc: 'Starting Beat 1',
            verses: {
              'musamman_salim': {
                ur: 'نہ کسی کی آنکھ کا نور ہوں نہ کسی کے دل کا قرار ہوں',
                ro: 'nah kisī kī āṅkh kā nūr hūñ nah kisī ke dil kā qarār hūñ',
                hi: 'न किसी की आँख का नूर हूँ न किसी के दिल का क़रार हूँ',
                ur2: 'جو کسی کے کام نہ آ سکے میں وہ ایک مشتِ غبار ہوں',
                ro2: 'jo kisī ke kaam nah aa sake maiñ voh ek musht-e ghubār hūñ',
                hi2: 'जो किसी के काम न आ सके मैं वो एक मुश्त-ए-ग़ुबार हूँ',
                poet: 'Muztar Khairabadi',
                genre: 'Ghazal (Urdu)',
                url: 'https://www.rekhta.org/ghazals/na-kisii-kii-aankh-ka-nuur-huun-na-kisii-ke-dil-ka-qaraar-huun-muztar-khairabadi-ghazals',
                source: 'Rekhta ↗',
                syls: [
                  { ro: 'nah', m: 's' }, { ro: 'ki', m: 's' }, { ro: 'sī', m: 'l' },
                  { ro: 'kī', m: 's' }, { ro: 'āṅkh', m: 'l' }, { ro: 'kā', m: 'l' }, { ro: 'nūr', m: 'l' }
                ]
              },
              'musaddas_salim': {
                ur: 'مرا دل ز مهرت جدا کی شود گرچه دوری',
                ro: 'marā dil zi mihrat judā kay shaved garchih dūrī',
                hi: 'मरा दिल ज़े मेहरत जुदा कै शवद गरचे दूरी',
                ur2: 'وصالت مرا مدعا کی شود گرچه صبوری',
                ro2: 'vis̱ālat marā muddaʿā kay shaved garchih ṣabūrī',
                hi2: 'विसालत मरा मुद्दआ कै शवद गरचे सबूरी',
                poet: 'Nasir al-Din al-Tusi',
                genre: 'Miʿyār al-Ashʿār (Persian)',
                url: 'https://ganjoor.net',
                source: 'Ganjoor ↗',
                syls: [
                  { ro: 'ma', m: 's' }, { ro: 'rā', m: 'l' }, { ro: 'dil', m: 'l' },
                  { ro: 'zi', m: 's' }, { ro: 'mih', m: 'l' }, { ro: 'rat', m: 'l' }, { ro: 'ju', m: 'l' }
                ]
              },
              'musamman_mahzuuf': {
                ur: 'نہ کسی کی آنکھ کا نور ہوں نہ کسی کے دل کا قرار ہوں',
                ro: 'nah kisī kī āṅkh kā nūr hūñ nah kisī ke dil kā qarār hūñ',
                hi: 'न किसी की आँख का नूर हूँ न किसी के दिल का क़रार हूँ',
                ur2: 'جو کسی کے کام نہ آ سکے میں وہ ایک مشتِ غبار ہوں',
                ro2: 'jo kisī ke kaam nah aa sake maiñ voh ek musht-e ghubār hūñ',
                hi2: 'जो किसी के काम न आ सके मैं वो एक मुश्त-ए-ग़ुबार हूँ',
                poet: 'Muztar Khairabadi',
                genre: 'Ghazal (Urdu)',
                url: 'https://www.rekhta.org/ghazals/na-kisii-kii-aankh-ka-nuur-huun-na-kisii-ke-dil-ka-qaraar-huun-muztar-khairabadi-ghazals',
                source: 'Rekhta ↗',
                syls: [
                  { ro: 'nah', m: 's' }, { ro: 'ki', m: 's' }, { ro: 'sī', m: 'l' }, { ro: 'kī', m: 's' }, { ro: 'āṅkh', m: 'l' }
                ]
              },
              'musaddas_mahzuuf': {
                ur: 'مرا دل ز مهرت جدا کی شود گرچه دوری',
                ro: 'marā dil zi mihrat judā kay shaved garchih dūrī',
                hi: 'मरा दिल ज़े मेहरत जुदा कै शवद गरचे दूरी',
                ur2: 'وصالت مرا مدعا کی شود گرچه صبوری',
                ro2: 'vis̱ālat marā muddaʿā kay shaved garchih ṣabūrī',
                hi2: 'विसालत मरा मुद्दआ कै शवद गरचे सबूरी',
                poet: 'Nasir al-Din al-Tusi',
                genre: 'Miʿyār al-Ashʿār (Persian)',
                url: 'https://ganjoor.net',
                source: 'Ganjoor ↗',
                syls: [
                  { ro: 'ma', m: 's' }, { ro: 'rā', m: 'l' }, { ro: 'dil', m: 'l' }
                ]
              }
            }
          },
          {
            id: 'basit',
            name: 'Basīṭ',
            canonical: { length: 'musamman', bodyMod: 'base', endMod: 'salim', isArabicOnly: true, nameEn: 'Basīṭ Mus̱amman Sālim', nameUr: 'بحرِ بسیط مثمن سالم' },
            meaning: 'Outspread',
            nameUr: 'بسیط',
            startIdx: 3,
            baseFoot: '= = – = / = – =',
            trimmedFoot: '= = – = / = –',
            footUr: 'مستفعلن فاعلن',
            footRo: 'mustafʿilun fāʿilun',
            desc: 'Starting Beat 4',
            verses: {
              'musamman_salim': {
                ur: 'دل میں حسرت جو جاگ اٹھتی ہے خواب بن کر وہ مسکراتی ہے',
                ro: 'dil meñ ḥasrat jo jāg uṭhtī hai khvāb ban kar voh muskurātī hai',
                hi: 'दिल में हसरत जो जाग उठती है ख़्वाब बन कर वो मुस्कुराती है',
                ur2: 'یاد تیری جو دل میں آتی ہے اشک بن کر وہ جھلملاتی ہے',
                ro2: 'yaad terī jo dil meñ aatī hai ashk ban kar voh jhilmilātī hai',
                hi2: 'याद तेरी जो दिल में आती है अश्क बन कर वो झिलमिलाती है',
                poet: 'Classical Urdu',
                syls: [
                  { ro: 'dil', m: 'l' }, { ro: 'meñ', m: 'l' }, { ro: 'ḥas', m: 's' }, { ro: 'rat', m: 'l' },
                  { ro: 'jo', m: 'l' }, { ro: 'jāg', m: 's' }, { ro: 'uṭh', m: 'l' }
                ]
              },
              'musaddas_salim': {
                ur: 'تا کی تو ای دل ز یارِ خود بی‌خبر نشینی',
                ro: 'tā kay tū ay dil zi yār-e khud bī-khabar nishīnī',
                hi: 'ता कै तू ऐ दिल ज़े यार-ए-ख़ुद बे-ख़बर नशीनी',
                ur2: 'برخیز و رو تا رخِ نگارِ خویشتن ببینی',
                ro2: 'bar-khīz-o raw tā rukh-e nigār-e khēshtan bi-bīnī',
                hi2: 'बर-ख़ीज़-ओ रौ ता रुख़-ए-निगार-ए-ख़्वेशतन बि-बीनी',
                poet: 'Shams Qais Razi',
                genre: 'Al-Muʿjam (Classical Persian)',
                url: 'https://ganjoor.net',
                source: 'Ganjoor ↗',
                syls: [
                  { ro: 'tā', m: 'l' }, { ro: 'kay', m: 'l' }, { ro: 'tū', m: 's' }, { ro: 'ay', m: 'l' },
                  { ro: 'dil', m: 'l' }, { ro: 'zi', m: 's' }, { ro: 'yār', m: 'l' }
                ]
              },
              'musamman_mahzuuf': {
                ur: 'دل میں حسرت جو جاگ اٹھتی ہے خواب بن کر وہ مسکراتی ہے',
                ro: 'dil meñ ḥasrat jo jāg uṭhtī hai khvāb ban kar voh muskurātī hai',
                hi: 'दिल में हसरत जो जाग उठती है ख़्वाब बन कर वो मुस्कुराती है',
                ur2: 'یاد تیری جو دل میں آتی ہے اشک بن کر وہ جھلملاتی ہے',
                ro2: 'yaad terī jo dil meñ aatī hai ashk ban kar voh jhilmilātī hai',
                hi2: 'याद तेरी जो दिल में आती है अश्क बन कर वो झिलमिलाती है',
                poet: 'Classical Urdu',
                syls: [
                  { ro: 'dil', m: 'l' }, { ro: 'meñ', m: 'l' }, { ro: 'ḥas', m: 's' }, { ro: 'rat', m: 'l' }
                ]
              },
              'musaddas_mahzuuf': {
                ur: 'تا کی تو ای دل ز یارِ خود بی‌خبر نشینی',
                ro: 'tā kay tū ay dil zi yār-e khud bī-khabar nishīnī',
                hi: 'ता कै तू ऐ दिल ज़े यार-ए-ख़ुद बे-ख़बर नशीनी',
                ur2: 'برخیز و رو تا رخِ نگارِ خویشتن ببینی',
                ro2: 'bar-khīz-o raw tā rukh-e nigār-e khēshtan bi-bīnī',
                hi2: 'बर-ख़ीज़-ओ रौ ता रुख़-ए-निगार-ए-ख़्वेशतन बि-बीनी',
                poet: 'Shams Qais Razi',
                genre: 'Al-Muʿjam (Classical Persian)',
                url: 'https://ganjoor.net',
                source: 'Ganjoor ↗',
                syls: [
                  { ro: 'tā', m: 'l' }, { ro: 'kay', m: 'l' }, { ro: 'tū', m: 's' }, { ro: 'ay', m: 'l' }
                ]
              }
            }
          }
        ]
      }
    ];
/* =========================================================================
   2. STATE & CONTROLLER (EXACT INITIAL MOCKUP LOGIC)
   ========================================================================= */
let curCircleIdx = 0;
let curMeterIdx = 0;
let curLength = 'musamman'; // 'musamman' (8 feet / 4 per line) or 'musaddas' (6 feet / 3 per line)
let curBodyMod = 'base';    // 'base' (standard intact foot) or 'makhbun' (softened internal beat)
let curEndMod = 'salim';    // 'salim' (intact), 'mahzuuf' (truncated), or 'maqtu' (severed)

let lastRenderedCircleId = null;
let currentArcA1 = null;
let arcAnimId = null;
let isCircleAudioPlaying = false;

const LENS_R = 201;
const LENS_GAP = 0.046; // radians gap between segments (~9.2px)

function renderCircles() {
  renderCircleTabs();
  renderCircleContext();
  renderCircleMeterOptions();
  renderCircleWheel();
  updateCircleAssembledBanner();
}
window.renderCircles = renderCircles;

function renderCircleTabs() {
  const host = document.getElementById('circleCardTabs');
  if (!host) return;

  host.innerHTML = CIRCLES.map((c, i) => {
    const on = (i === curCircleIdx);
    const transliteratedName = c.nameEn.replace('Dāʾira-e-', '');
    return `
      <button class="circle-tab-btn ${on ? 'active' : ''}" role="tab" aria-selected="${on}" onclick="selectCircle(${i})">
        ${transliteratedName}
      </button>
    `;
  }).join('');
}

function renderCircleContext() {
  const headerHost = document.getElementById('circleCardHeader');
  const bodyHost = document.getElementById('circleCardBody');
  if (!headerHost || !bodyHost) return;

  const c = CIRCLES[curCircleIdx];
  headerHost.innerHTML = `
    <div class="circle-card-title-group">
      <span class="urdu ur-always">${c.nameUr}</span>
      <span class="roman">${c.nameEn} &middot; ${c.transEn}</span>
    </div>
    <span class="circle-card-tag ${c.tagGold ? 'gold' : ''}">${c.badge}</span>
  `;

  bodyHost.innerHTML = `
    <div class="context-field">
      <h5>Why Khalil Named It</h5>
      <p>${c.whyNamed}</p>
    </div>
    <div class="context-field">
      <h5>Urdu &amp; Persian Tradition</h5>
      <p>${c.urduPresence}</p>
    </div>
  `;
}

function canonicalPoetName(poetRaw) {
  if (!poetRaw) return '';
  const p = poetRaw.replace(/\s*\([^)]*\)/g, '').trim();
  if (/Ghalib/i.test(p)) return 'Ghalib';
  if (/Mir Taqi Mir|M[iī]r\b/i.test(p) && !/Dard|Hasan/i.test(p)) return 'Mir';
  if (/Zauq/i.test(p)) return 'Zauq';
  if (/Dard/i.test(p)) return 'Dard';
  if (/Momin/i.test(p)) return 'Momin';
  if (/Aatish|Atish/i.test(p)) return 'Atish';
  if (/Faiz/i.test(p)) return 'Faiz';
  if (/Iqbal/i.test(p)) return 'Iqbal';
  if (/Hasrat/i.test(p)) return 'Hasrat';
  if (/Dagh/i.test(p)) return 'Dagh';
  if (/Mir Hasan/i.test(p)) return 'Mir Hasan';
  if (/Nazeer/i.test(p)) return 'Nazeer';
  if (/Bekhud/i.test(p)) return 'Bekhud Dehlvi';
  if (/Muztar/i.test(p)) return 'Muztar Khairabadi';
  if (/Saadi/i.test(p)) return 'Saadi';
  if (/Hatef/i.test(p)) return 'Hatef Isfahani';
  if (/Nasir al-Din|al-Tusi/i.test(p)) return 'Nasir al-Din al-Tusi';
  if (/Shams Qais/i.test(p)) return 'Shams Qais Razi';
  if (/Irfan Abid/i.test(p)) return 'Irfan Abid';
  if (/Classical/i.test(p)) return 'Classical Urdu';
  if (/Rumi/i.test(p)) return 'Rumi';
  if (/Sauda/i.test(p)) return 'Sauda';
  if (/Firdausi/i.test(p)) return 'Firdausi';
  if (/Saleem Ahmed/i.test(p)) return 'Saleem Ahmed';
  if (/Hatim/i.test(p)) return 'Hatim';
  if (/Nasim|Naseem/i.test(p)) return 'Daya Shankar Nasim';
  if (/Mohsin/i.test(p)) return 'Mohsin Kakorvi';
  return p;
}

const POET_TRANSLATIONS = {
  'Ghalib': { ur: 'غالب', hi: 'ग़ालिब' },
  'Mir': { ur: 'میر', hi: 'मीर' },
  'Zauq': { ur: 'ذوق', hi: 'ज़ौक़' },
  'Dard': { ur: 'درد', hi: 'दर्द' },
  'Momin': { ur: 'مومن', hi: 'मोमिन' },
  'Atish': { ur: 'آتش', hi: 'आतिश' },
  'Faiz': { ur: 'فیض', hi: 'फ़ैज़' },
  'Iqbal': { ur: 'اقبال', hi: 'इक़बाल' },
  'Hasrat': { ur: 'حسرت', hi: 'हसरत' },
  'Dagh': { ur: 'داغ', hi: 'दाग़' },
  'Mir Hasan': { ur: 'میر حسن', hi: 'मीर हसन' },
  'Nazeer': { ur: 'نظیر', hi: 'नज़ीर' },
  'Bekhud Dehlvi': { ur: 'بے خود دہلوی', hi: 'बेख़ुद देहलवी' },
  'Muztar Khairabadi': { ur: 'مضطر خیرآبادی', hi: 'मुज़्तर ख़ैराबादी' },
  'Saadi': { ur: 'سعدی', hi: 'सादी' },
  'Hatef Isfahani': { ur: 'ہاتف اصفہانی', hi: 'हातिफ़ इस्फ़हानी' },
  'Nasir al-Din al-Tusi': { ur: 'نصیر الدین طوسی', hi: 'नसीरुद्दीन तूसी' },
  'Shams Qais Razi': { ur: 'شمس قیس رازی', hi: 'शम्स क़ैस राज़ी' },
  'Irfan Abid': { ur: 'عرفان عابد', hi: 'इरफ़ान आबिद' },
  'Classical Urdu': { ur: 'کلاسیکی اردو', hi: 'शास्त्रीय उर्दू' },
  'Rumi': { ur: 'مولانا رومی', hi: 'मौलाना रूमी' },
  'Sauda': { ur: 'سودا', hi: 'सौदा' },
  'Firdausi': { ur: 'فردوسی', hi: 'फ़िरदौसी' },
  'Saleem Ahmed': { ur: 'سلیم احمد', hi: 'सलीम अहमद' },
  'Hatim': { ur: 'حاتم', hi: 'हातिम' },
  'Daya Shankar Nasim': { ur: 'دیا شنکر نسیم', hi: 'दया शंकर नसीम' },
  'Mohsin Kakorvi': { ur: 'محسن کاکوروی', hi: 'मोहसिन काकोरवी' },
  'Nezami': { ur: 'نظامی', hi: 'निज़ामी' }
};

function localizedPoetName(verseObj, poetCanonical) {
  const p = poetCanonical || canonicalPoetName((verseObj && verseObj.poet) || '');
  if (!p) return '';
  const script = window.currentScript || (document.documentElement && document.documentElement.getAttribute('data-script')) || 'ur';
  if (script === 'hi') {
    if (verseObj && verseObj.poetHi) return verseObj.poetHi;
    const m = POET_TRANSLATIONS[p];
    if (m && m.hi) return m.hi;
    return p;
  }
  if (script === 'ur') {
    if (verseObj && verseObj.poetUr) return verseObj.poetUr;
    const m = POET_TRANSLATIONS[p];
    if (m && m.ur) return m.ur;
    return p;
  }
  return p;
}

/* =========================================================================
   PATTERN GLYPH HELPERS (Orange Short, Blue Long — Match Prod Legend)
   ========================================================================= */
function patGlyphs(raw) {
  if (!raw) return '';
  return String(raw).split('').map(ch => {
    if (ch === '=') return '<span class="pg l">=</span>';
    if (ch === '-' || ch === '–' || ch === '—') return '<span class="pg s">–</span>';
    if (ch === '/') return '<span class="pg sep">/</span>';
    if (ch === 'x' || ch === 'X' || ch === '×') return '<span class="pg x">x</span>';
    if (ch === ' ') return ' ';
    return ch;
  }).join('');
}

function patGlyphsSvg(raw) {
  if (!raw) return '';
  return String(raw).split('').map(ch => {
    if (ch === '=') return '<tspan fill="var(--mark-l)" font-weight="700">=</tspan>';
    if (ch === '-' || ch === '–' || ch === '—') return '<tspan fill="var(--mark-s)" font-weight="700">–</tspan>';
    if (ch === '/') return '<tspan fill="var(--ghost)" font-weight="400"> / </tspan>';
    if (ch === ' ') return ' ';
    return `<tspan fill="var(--dim)">${ch}</tspan>`;
  }).join('');
}

function renderCircleMeterOptions() {
  const circ = CIRCLES[curCircleIdx];
  const host = document.getElementById('circleMeterOptions');
  if (!host) return;

  host.innerHTML = circ.meters.map((m, i) => {
    const on = (i === curMeterIdx);
    return `
      <div class="option-row ${on ? 'active' : ''}" onclick="selectCircleMeter(${i})">
        <div class="option-title-line">
          <span class="option-name">${m.name}</span>
          <span class="option-meaning">(${m.meaning})</span>
        </div>
        <div class="option-pat">${patGlyphs(m.baseFoot)}</div>
      </div>
    `;
  }).join('');
}

/* =========================================================================
   3. SVG RHYTHM WHEEL & MULTI-COLORED LENS ARC
   ========================================================================= */
function getArcD(cx, cy, r, a1, a2) {
  let da = a2 - a1;
  while (da < 0) da += 2 * Math.PI;
  while (da > 2 * Math.PI) da -= 2 * Math.PI;
  if (da === 0) da = 2 * Math.PI - 0.001;

  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);
  const largeArc = da > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function getBeatModifier(offsetInWindow, inLens, mtr, windowLen) {
  if (!inLens) return { isTrimmed: false, isMakhbun: false, label: '' };
  const res = { isTrimmed: false, isMakhbun: false, label: '' };

  const circ = CIRCLES[curCircleIdx];
  const curM = mtr || (circ && circ.meters[curMeterIdx]) || (circ && circ.meters[0]);
  const wLen = windowLen || (circ && circ.footLen) || 4;

  if (curEndMod === 'mahzuuf' && offsetInWindow === wLen - 1) {
    res.isTrimmed = true;
    res.label = '✂ Trimmed';
  } else if (curEndMod === 'maqtu' && offsetInWindow === wLen - 1) {
    res.isTrimmed = true;
    res.label = '✂ Maqṭū‘';
  }

  const isMakhbun = (curBodyMod === 'makhbun');
  if (isMakhbun && !res.isTrimmed) {
    if (curM && curM.id === 'ramal' && offsetInWindow === 0) {
      res.isMakhbun = true;
      res.label = 'Khabn (–)';
    } else if (curM && curM.id === 'rajaz' && offsetInWindow === 1) {
      res.isMakhbun = true;
      res.label = 'Khabn (–)';
    } else if (offsetInWindow === 0 || offsetInWindow === 1) {
      res.isMakhbun = true;
      res.label = 'Khabn (–)';
    }
  }

  return res;
}

function renderLensSegments(a0, circ, mtr) {
  const group = document.getElementById('wheelLensGroup');
  if (!group) return;

  const N = circ.cycle.length;
  const windowLen = circ.footLen;
  const start = mtr.startIdx;
  const stepAngle = (2 * Math.PI) / N;

  const pathsHtml = [];
  for (let k = 0; k < windowLen; k++) {
    const segA1 = a0 + k * stepAngle + LENS_GAP / 2;
    const segA2 = a0 + (k + 1) * stepAngle - LENS_GAP / 2;
    const d = getArcD(250, 250, LENS_R, segA1, segA2);

    const beatIdx = (start + k) % N;
    const tok = circ.cycle[beatIdx];
    const baseIsLong = (tok === 'l');
    const mod = getBeatModifier(k, true, mtr, windowLen);

    let isLong = baseIsLong;
    if (mod.isMakhbun) isLong = false;

    let cls = 'lens-seg';
    if (mod.isTrimmed) {
      cls += ' seg-trimmed';
    } else if (isLong) {
      cls += ' seg-long';
    } else {
      cls += ' seg-short';
    }
    pathsHtml.push(`<path class="${cls}" id="lensSeg_${k}" d="${d}"></path>`);
  }
  group.innerHTML = pathsHtml.join('');
}

function animateLensArc(targetA1, duration = 280) {
  const circ = CIRCLES[curCircleIdx];
  const mtr = circ.meters[curMeterIdx] || circ.meters[0];

  if (currentArcA1 === null || duration === 0) {
    currentArcA1 = targetA1;
    renderLensSegments(targetA1, circ, mtr);
    return;
  }

  if (typeof requestAnimationFrame === 'undefined') {
    currentArcA1 = targetA1;
    renderLensSegments(targetA1, circ, mtr);
    return;
  }

  let da1 = targetA1 - currentArcA1;
  while (da1 < -Math.PI) da1 += 2 * Math.PI;
  while (da1 > Math.PI) da1 -= 2 * Math.PI;

  const startA1 = currentArcA1;
  const destA1 = currentArcA1 + da1;

  if (arcAnimId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(arcAnimId);
  const nowFn = (typeof performance !== 'undefined' && performance.now) ? () => performance.now() : () => Date.now();
  const startTime = nowFn();

  function step(now) {
    const elapsed = (typeof now === 'number' ? now : nowFn()) - startTime;
    const progress = Math.min(1, elapsed / duration);
    const ease = 1 - Math.pow(1 - progress, 3);

    currentArcA1 = startA1 + da1 * ease;
    renderLensSegments(currentArcA1, circ, mtr);

    if (progress < 1) {
      arcAnimId = requestAnimationFrame(step);
    } else {
      currentArcA1 = destA1;
      renderLensSegments(currentArcA1, circ, mtr);
      arcAnimId = null;
    }
  }

  arcAnimId = requestAnimationFrame(step);
}

function renderCircleWheel() {
  const circ = CIRCLES[curCircleIdx];
  const mtr = circ.meters[curMeterIdx] || circ.meters[0];
  const pillsLayer = document.getElementById('wheelPillsLayer');
  const trackLabel = document.getElementById('wheelTrackLabel');
  const hubName = document.getElementById('hubMeterName');
  const hubSub = document.getElementById('hubSubTitle');
  const hubPat = document.getElementById('hubPattern');
  if (!pillsLayer || !trackLabel) return;

  const N = circ.cycle.length;
  const cx = 250, cy = 250, R = 175;
  const windowLen = circ.footLen;
  const start = mtr.startIdx;

  const isMusamman = (curLength === 'musamman');
  const lenRo = isMusamman ? 'Mus̱amman' : 'Musaddas';
  const feetCount = isMusamman ? 4 : 3;

  const isMakhbun = (curBodyMod === 'makhbun');
  const bodyRo = isMakhbun ? 'Makhbūn' : '';

  let endRo = 'Sālim';
  if (curEndMod === 'mahzuuf') endRo = 'Maḥẕūf';
  else if (curEndMod === 'maqtu') endRo = 'Maqṭū‘';

  const fullDescriptor = [lenRo, bodyRo, endRo].filter(Boolean).join(' · ');

  // 1. Update track label
  trackLabel.textContent = `FOOT REPEATS ${feetCount}× PER LINE (${lenRo.toUpperCase()})`;

  // 2. Update center hub text
  let displayedPattern = mtr.baseFoot;
  if (isMakhbun && mtr.makhbunFoot) {
    displayedPattern = mtr.makhbunFoot;
  } else if (curEndMod === 'mahzuuf') {
    displayedPattern = mtr.trimmedFoot || mtr.baseFoot;
  } else if (curEndMod === 'maqtu') {
    displayedPattern = mtr.maqtuFoot || '= =';
  }

  if (hubName) hubName.textContent = mtr.name;
  if (hubSub) {
    hubSub.textContent = fullDescriptor;
    if (fullDescriptor.length > 20) {
      if (typeof hubSub.setAttribute === 'function') {
        hubSub.setAttribute('textLength', '140');
        hubSub.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      }
    } else {
      if (typeof hubSub.removeAttribute === 'function') {
        hubSub.removeAttribute('textLength');
        hubSub.removeAttribute('lengthAdjust');
      }
    }
  }
  if (hubPat) hubPat.innerHTML = patGlyphsSvg(displayedPattern);

  // 3. Compute Lens Arc Angles and animate smoothly
  const stepAngle = (2 * Math.PI) / N;
  const startAngle = -Math.PI / 2 + start * stepAngle - stepAngle / 2;

  animateLensArc(startAngle, lastRenderedCircleId === circ.id ? 280 : 0);

  // 4. Render Syllable Pills with Radial Beat Numbers
  let html = '';
  for (let i = 0; i < N; i++) {
    const tok = circ.cycle[i];
    const baseIsLong = (tok === 'l');
    const angle = -Math.PI / 2 + i * stepAngle;
    const offsetInWindow = (i - start + N) % N;
    const inLens = offsetInWindow < windowLen;
    const mod = getBeatModifier(offsetInWindow, inLens, mtr, windowLen);

    // Note pill center (R = 175)
    const nx = cx + R * Math.cos(angle);
    const ny = cy + R * Math.sin(angle);

    // Beat number center radially inside pill (R_num = 146)
    const bx = cx + 146 * Math.cos(angle);
    const by = cy + 146 * Math.sin(angle);

    let isLong = baseIsLong;
    if (mod.isMakhbun) {
      isLong = false;
    }

    const pw = isLong ? 34 : 22;
    const ph = 21;
    let strokeColor = isLong ? 'var(--mark-l)' : 'var(--mark-s)';
    let textColor = isLong ? 'var(--mark-l)' : 'var(--mark-s)';
    let sym = isLong ? '=' : '–';

    let pillClasses = 'wheel-pill ' + (isLong ? 'pl-l' : 'pl-s');
    if (!inLens) pillClasses += ' dimmed';
    if (mod.isTrimmed) pillClasses += ' trimmed-beat';
    if (mod.isMakhbun) pillClasses += ' makhbun-beat';

    const beatNum = i + 1;
    const isStartBeat = (i === start);

    const cutLine = mod.isTrimmed ? `
      <line class="pill-cut-line" x1="${nx - pw/2 + 3}" y1="${ny + ph/2 - 3}" x2="${nx + pw/2 - 3}" y2="${ny - ph/2 + 3}"/>
    ` : '';


    html += `
      <g class="${pillClasses}" id="wpill_${i}" onclick="jumpWheelTo(${i})">
        <!-- Note Pill -->
        <rect class="pill-rect" x="${nx - pw/2}" y="${ny - ph/2}" width="${pw}" height="${ph}" rx="5"
              fill="var(--bg)" stroke="${strokeColor}" stroke-width="1.8"/>
        ${cutLine}
        <text class="pill-sym" x="${nx}" y="${ny + 4.5}" text-anchor="middle" font-family="var(--mono-pat)" font-size="13" font-weight="700" fill="${textColor}">
          ${sym}
        </text>

        <!-- Radial Beat Number (1 to ${N}) -->
        <text class="beat-num" x="${bx}" y="${by + 3.5}" text-anchor="middle" font-family="var(--sans)" font-size="10.5" font-weight="${isStartBeat ? '700' : '600'}" fill="${inLens ? 'var(--ink)' : 'var(--faint)'}">
          ${beatNum}
        </text>
      </g>
    `;
  }
  pillsLayer.innerHTML = html;
  lastRenderedCircleId = circ.id;
}

function jumpWheelTo(beatIdx) {
  const circ = CIRCLES[curCircleIdx];
  const foundIdx = circ.meters.findIndex(m => m.startIdx === beatIdx);
  if (foundIdx !== -1) {
    selectCircleMeter(foundIdx);
  }
}
window.jumpWheelTo = jumpWheelTo;

/* =========================================================================
   4. CALCULATED FORMULA & AUTHENTIC COUPLET SECTION
   ========================================================================= */
/* One line (misra) of the assembled bahr, foot by foot. A circle "unit" can hold one foot
   (Hazaj, Kamil...) or two (Khafif, Tawil...); the unit's feet repeat until the line has
   feetCount feet, so Musamman is always 4 feet per line (8 per sher) whatever the meter. */
const CIRCLE_FOOT_FS = {
  'mafāʿīlun': ['ma', 'fā', 'ʿī', 'lun'],
  'mustafʿilun': ['mus', 'taf', 'ʿi', 'lun'],
  'fāʿilātun': ['fā', 'ʿi', 'lā', 'tun'],
  'faʿilātun': ['fa', 'ʿi', 'lā', 'tun'],
  'faʿūlun': ['fa', 'ʿū', 'lun'],
  'fāʿilun': ['fā', 'ʿi', 'lun'],
  'mutafāʿilun': ['mu', 'ta', 'fā', 'ʿi', 'lun'],
  'mufāʿalatun': ['mu', 'fā', 'ʿa', 'la', 'tun'],
  'mafāʿilun': ['ma', 'fā', 'ʿi', 'lun'],
  'faʿlūn': ['faʿ', 'lūn'],
  'faʿilun': ['fa', 'ʿi', 'lun'],
  'faʿal': ['fa', 'ʿal'],
  'mafʿūlu': ['maf', 'ʿū', 'lu'],
  'fāʿilātu': ['fā', 'ʿi', 'lā', 'tu'],
  'mafāʿīlu': ['ma', 'fā', 'ʿī', 'lu'],
  'muftaʿilun': ['muf', 'ta', 'ʿi', 'lun'],
  'mafʿūlun': ['maf', 'ʿū', 'lun']
};

/* =========================================================================
   CANONICAL URDU RESOLUTION ENGINE
   Determines whether a circle configuration corresponds to an authentic,
   cataloged Urdu meter (1 of the verified 49 meters) or an abstract theoretical
   prototype from al-Khalīl's original circles.
   ========================================================================= */
function getMeterResolution(mtr, length, bodyMod, endMod) {
  if (!mtr) return { isCanonical: false, meterNum: null, theoreticalReason: '' };

  const id = mtr.id;
  const isMusamman = (length === 'musamman');
  const isMakhbun = (bodyMod === 'makhbun');

  // 1. Hazaj
  if (id === 'hazaj') {
    if (isMusamman && !isMakhbun && endMod === 'salim') {
      return { isCanonical: true, meterNum: 26, handbookNum: 15, nameEn: 'Hazaj Mus̱amman Sālim', nameUr: 'بحرِ ہزج مثمن سالم' };
    }
    if (!isMusamman && !isMakhbun && (endMod === 'mahzuuf' || endMod === 'maqtu')) {
      return { isCanonical: true, meterNum: 27, handbookNum: 19, nameEn: 'Hazaj Musaddas Maḥzūf', nameUr: 'بحرِ ہزج مسدس محذوف' };
    }
    return {
      isCanonical: false,
      nameEn: `Hazaj ${isMusamman ? 'Mus̱amman' : 'Musaddas'} ${isMakhbun ? 'Makhbūn ' : ''}${endMod}`,
      nameUr: `بحرِ ہزج ${isMusamman ? 'مثمن' : 'مسدس'} ${isMakhbun ? 'مخبون ' : ''}${endMod === 'salim' ? 'سالم' : (endMod === 'mahzuuf' ? 'محذوف' : 'مقطوع')}`,
      theoreticalReason: 'In classical Urdu literature, Baḥr-e-Hazaj is standardly composed in Mus̱amman Sālim (Meter #26) or Musaddas Maḥzūf (Meter #27).',
      canonical: mtr.canonical
    };
  }

  // 2. Rajaz
  if (id === 'rajaz') {
    if (isMusamman && !isMakhbun && endMod === 'salim') {
      return { isCanonical: true, meterNum: 3, handbookNum: null, nameEn: 'Rajaz Mus̱amman Sālim', nameUr: 'بحرِ رجز مثمن سالم' };
    }
    if (isMusamman && isMakhbun && endMod === 'salim') {
      return { isCanonical: true, meterNum: 25, handbookNum: null, nameEn: 'Rajaz Mus̱amman Matvī Makhbūn', nameUr: 'بحرِ رجز مثمن مطوی مخبون' };
    }
    return {
      isCanonical: false,
      nameEn: `Rajaz ${isMusamman ? 'Mus̱amman' : 'Musaddas'} ${endMod}`,
      nameUr: `بحرِ رجز ${isMusamman ? 'مثمن' : 'مسدس'}`,
      theoreticalReason: 'Rajaz is standardly composed as an 8-foot (Mus̱amman) meter in classical Urdu poetry.',
      canonical: mtr.canonical
    };
  }

  // 3. Ramal
  if (id === 'ramal') {
    if (isMusamman && isMakhbun && (endMod === 'mahzuuf' || endMod === 'maqtu')) {
      const isMaqtu = (endMod === 'maqtu');
      return {
        isCanonical: true,
        meterNum: isMaqtu ? 18 : 19,
        handbookNum: 1,
        nameEn: isMaqtu ? 'Ramal Mus̱amman Makhbūn Maqṭūʿ' : 'Ramal Mus̱amman Makhbūn Maḥzūf',
        nameUr: isMaqtu ? 'بحرِ رمل مثمن مخبون مقطوع' : 'بحرِ رمل مثمن مخبون محذوف'
      };
    }
    if (!isMusamman && isMakhbun && (endMod === 'mahzuuf' || endMod === 'maqtu')) {
      const isMaqtu = (endMod === 'maqtu');
      return {
        isCanonical: true,
        meterNum: isMaqtu ? 16 : 17,
        handbookNum: 3,
        nameEn: isMaqtu ? 'Ramal Musaddas Makhbūn Maqṭūʿ' : 'Ramal Musaddas Makhbūn Maḥzūf',
        nameUr: isMaqtu ? 'بحرِ رمل مسدس مخبون مقطوع' : 'بحرِ رمل مسدس مخبون محذوف'
      };
    }
    if (isMusamman && !isMakhbun && endMod === 'salim') {
      return { isCanonical: true, meterNum: 10, handbookNum: null, nameEn: 'Ramal Mus̱amman Sālim', nameUr: 'بحرِ رمل مثمن سالم' };
    }
    if (!isMusamman && !isMakhbun && endMod === 'salim') {
      return { isCanonical: true, meterNum: 11, handbookNum: null, nameEn: 'Ramal Musaddas Sālim', nameUr: 'بحرِ رمل مسدس سالم' };
    }
    return {
      isCanonical: false,
      nameEn: `Ramal ${isMusamman ? 'Mus̱amman' : 'Musaddas'} ${isMakhbun ? 'Makhbūn ' : ''}${endMod}`,
      nameUr: `بحرِ رمل ${isMusamman ? 'مثمن' : 'مسدس'}`,
      theoreticalReason: 'In Urdu, Ramal with Khabn (syllable softening) requires a truncated final foot (Maḥzūf or Maqṭū‘, Meters #16–#19).',
      canonical: mtr.canonical
    };
  }

  // 4. Khafīf
  if (id === 'khafif') {
    if (!isMusamman && isMakhbun && endMod === 'maqtu') {
      return { isCanonical: true, meterNum: 14, handbookNum: 17, nameEn: 'Khafīf Musaddas Makhbūn Maqṭūʿ', nameUr: 'بحرِ خفیف مسدس مخبون مقطوع' };
    }
    if (!isMusamman && isMakhbun && endMod === 'mahzuuf') {
      return { isCanonical: true, meterNum: 15, handbookNum: 17, nameEn: 'Khafīf Musaddas Makhbūn Maḥzūf', nameUr: 'بحرِ خفیف مسدس مخبون محذوف' };
    }
    if (isMusamman) {
      return {
        isCanonical: false,
        nameEn: `Khafīf Mus̱amman ${endMod === 'salim' ? 'Sālim' : endMod}`,
        nameUr: `بحرِ خفیف مثمن ${endMod === 'salim' ? 'سالم' : ''}`,
        theoreticalReason: 'al-Khalīl established Khafīf as an 8-foot circle parent (Mus̱amman Sālim), but classical Persian and Urdu poets never composed poems in 8-foot Khafīf. In Urdu literature, Khafīf is composed exclusively in 6-foot Musaddas (Meter #14 / #15).',
        canonical: mtr.canonical
      };
    }
    return {
      isCanonical: false,
      nameEn: `Khafīf Musaddas ${endMod}`,
      nameUr: `بحرِ خفیف مسدس`,
      theoreticalReason: 'Khafīf in Urdu requires the Makhbūn softening on the middle foot (mustafʿilun → mafāʿilun) and a truncated ending.',
      canonical: mtr.canonical
    };
  }

  // 5. Muḍāriʿ
  if (id === 'mudari') {
    if (isMusamman && isMakhbun && (endMod === 'mahzuuf' || endMod === 'maqtu')) {
      return { isCanonical: true, meterNum: 5, handbookNum: 21, nameEn: 'Muḍāriʿ Mus̱amman Akhrab Makfūf Maḥzūf', nameUr: 'بحرِ مضارع مثمن اخرب مکفوف محذوف' };
    }
    return {
      isCanonical: false,
      nameEn: `Muḍāriʿ ${isMusamman ? 'Mus̱amman' : 'Musaddas'} ${endMod}`,
      nameUr: `بحرِ مضارع ${isMusamman ? 'مثمن' : 'مسدس'}`,
      theoreticalReason: 'The intact circle parent of Muḍāriʿ (Sālim) was considered too heavy for lyrical verse; Urdu poets exclusively compose in the modified Akhrab/Makfūf form (Meter #5).',
      canonical: mtr.canonical
    };
  }

  // 6. Mujtathth
  if (id === 'mujtathth') {
    if (isMusamman && isMakhbun && (endMod === 'maqtu' || endMod === 'mahzuuf')) {
      const isMaqtu = (endMod === 'maqtu');
      return {
        isCanonical: true,
        meterNum: isMaqtu ? 33 : 34,
        handbookNum: 13,
        nameEn: isMaqtu ? 'Mujtathth Mus̱amman Makhbūn Maqṭūʿ' : 'Mujtathth Mus̱amman Makhbūn Maḥzūf',
        nameUr: isMaqtu ? 'بحرِ مجتث مثمن مخبون مقطوع' : 'بحرِ مجتث مثمن مخبون محذوف'
      };
    }
    if (!isMusamman) {
      return {
        isCanonical: false,
        nameEn: `Mujtathth Musaddas ${endMod}`,
        nameUr: `بحرِ مجتث مسدس`,
        theoreticalReason: 'In classical Urdu literature, Baḥr-e-Mujtathth is composed strictly as an 8-foot (Mus̱amman) meter (Meters #33 and #34). The 6-foot Musaddas form is an al-Khalīl circle permutation.',
        canonical: mtr.canonical
      };
    }
    return {
      isCanonical: false,
      nameEn: `Mujtathth ${isMusamman ? 'Mus̱amman' : 'Musaddas'} ${endMod}`,
      nameUr: `بحرِ مجتث ${isMusamman ? 'مثمن' : 'مسدس'}`,
      theoreticalReason: 'In Urdu, Mujtathth is composed with internal Khabn and a shortened final foot (Meter #33 / #34).',
      canonical: mtr.canonical
    };
  }

  // 7. Mutaqārib
  if (id === 'mutaqarib') {
    if (isMusamman && !isMakhbun && endMod === 'mahzuuf') {
      return { isCanonical: true, meterNum: 29, handbookNum: 9, nameEn: 'Mutaqārib Mus̱amman Maḥzūf', nameUr: 'بحرِ متقارب مثمن محذوف' };
    }
    if (isMusamman && !isMakhbun && endMod === 'salim') {
      return { isCanonical: true, meterNum: 28, handbookNum: null, nameEn: 'Mutaqārib Mus̱amman Sālim', nameUr: 'بحرِ متقارب مثمن سالم' };
    }
    return {
      isCanonical: false,
      nameEn: `Mutaqārib ${isMusamman ? 'Mus̱amman' : 'Musaddas'} ${endMod}`,
      nameUr: `بحرِ متقارب ${isMusamman ? 'مثمن' : 'مسدس'}`,
      theoreticalReason: 'Mutaqārib in Urdu is the classic epic meter, standardly composed in Mus̱amman Maḥzūf (Meter #29).',
      canonical: mtr.canonical
    };
  }

  // 8. Mutadārik
  if (id === 'mutadarik') {
    if (isMusamman && !isMakhbun && endMod === 'salim') {
      return { isCanonical: true, meterNum: 39, handbookNum: null, nameEn: 'Mutadārik Mus̱amman Sālim', nameUr: 'بحرِ متدارک مثمن سالم' };
    }
    return {
      isCanonical: false,
      nameEn: `Mutadārik ${isMusamman ? 'Mus̱amman' : 'Musaddas'} ${endMod}`,
      nameUr: `بحرِ متدارک ${isMusamman ? 'مثمن' : 'مسدس'}`,
      theoreticalReason: 'Mutadārik in Urdu is standardly composed in intact Mus̱amman Sālim (Meter #39).',
      canonical: mtr.canonical
    };
  }

  // 9. Kāmil
  if (id === 'kamil') {
    if (isMusamman && !isMakhbun && endMod === 'salim') {
      return { isCanonical: true, meterNum: 37, handbookNum: 14, nameEn: 'Kāmil Mus̱amman Sālim', nameUr: 'بحرِ کامل مثمن سالم' };
    }
    return {
      isCanonical: false,
      nameEn: `Kāmil ${isMusamman ? 'Mus̱amman' : 'Musaddas'} ${endMod}`,
      nameUr: `بحرِ کامل ${isMusamman ? 'مثمن' : 'مسدس'}`,
      theoreticalReason: 'Kāmil in classical Urdu poetry is standardly composed in Mus̱amman Sālim (Meter #37).',
      canonical: mtr.canonical
    };
  }

  // Classical Arabic meters (Wāfir, Ṭawīl, Basīṭ)
  return {
    isCanonical: false,
    nameEn: `${mtr.name} ${isMusamman ? 'Mus̱amman' : 'Musaddas'} ${endMod}`,
    nameUr: `بحرِ ${mtr.nameUr} ${isMusamman ? 'مثمن' : 'مسدس'}`,
    theoreticalReason: `${mtr.name} is a classical Arabic meter from al-Khalīl’s 8th-century system. It is preserved on the circle for metrical completeness, but is not part of the standard Urdu poetic canon.`,
    canonical: mtr.canonical
  };
}

/* =========================================================================
   CANONICAL SNAP HELPER
   Quickly restores the knobs to the primary verified Urdu form.
   ========================================================================= */
function snapToCanonicalMeter() {
  stopCircleAudio();
  const circ = CIRCLES[curCircleIdx];
  const mtr = circ.meters[curMeterIdx] || circ.meters[0];
  if (mtr && mtr.canonical && mtr.canonical.meterNum) {
    curLength = mtr.canonical.length || 'musamman';
    curBodyMod = mtr.canonical.bodyMod || 'base';
    curEndMod = mtr.canonical.endMod || 'salim';
    syncControlButtons();
    renderCircleWheel();
    updateCircleAssembledBanner();
    return;
  }
  // If this meter is an Arabic/Persian prototype without an Urdu canonical number (e.g. Wāfir, Ṭawīl, Basīṭ):
  // 1. Check if another meter in the same circle has a canonical Urdu meter (e.g. Kāmil in Circle 4)
  const canonSiblingIdx = circ.meters.findIndex(m => m.canonical && m.canonical.meterNum);
  if (canonSiblingIdx >= 0) {
    selectCircleMeter(canonSiblingIdx);
    return;
  }
  // 2. Otherwise jump to core Urdu canon (Circle 1: Mujtaliba › Hazaj Meter #26)
  selectCircle(0);
}
window.snapToCanonicalMeter = snapToCanonicalMeter;

/* Synchronizes button highlight states and provides contextual badges */
function syncControlButtons() {
  const circ = CIRCLES[curCircleIdx];
  const mtr = circ.meters[curMeterIdx] || circ.meters[0];

  // 1. Length Buttons
  const lenHost = document.getElementById('circleLengthButtons');
  if (lenHost) {
    const btns = lenHost.querySelectorAll('button');
    if (btns.length >= 2) {
      btns[0].classList.toggle('on', curLength === 'musamman');
      btns[1].classList.toggle('on', curLength === 'musaddas');

      if (mtr.id === 'khafif') {
        btns[0].innerHTML = 'Mus̱amman · 8 feet <span class="btn-sub-badge">Circle Parent</span>';
        btns[1].innerHTML = 'Musaddas · 6 feet <span class="btn-sub-badge green">Urdu Canon</span>';
      } else if (mtr.id === 'hazaj') {
        btns[0].innerHTML = 'Mus̱amman · 8 feet <span class="btn-sub-badge green">Urdu Canon #26</span>';
        btns[1].innerHTML = 'Musaddas · 6 feet <span class="btn-sub-badge green">Urdu Canon #27</span>';
      } else if (mtr.id === 'ramal') {
        btns[0].innerHTML = 'Mus̱amman · 8 feet <span class="btn-sub-badge green">Urdu Canon #18</span>';
        btns[1].innerHTML = 'Musaddas · 6 feet <span class="btn-sub-badge green">Urdu Canon #16</span>';
      } else {
        btns[0].innerHTML = 'Mus̱amman · 8 feet / sher';
        btns[1].innerHTML = 'Musaddas · 6 feet / sher';
      }
    }
  }

  // 2. Body Mod Buttons
  const bodyHost = document.getElementById('circleBodyModButtons');
  if (bodyHost) {
    const btns = bodyHost.querySelectorAll('button');
    if (btns.length >= 2) {
      btns[0].classList.toggle('on', curBodyMod === 'base');
      btns[1].classList.toggle('on', curBodyMod === 'makhbun');

      if (mtr.id === 'khafif' || mtr.id === 'mujtathth' || mtr.id === 'mudari') {
        btns[0].innerHTML = 'Base Foot · Intact <span class="btn-sub-badge">Circle Prototype</span>';
        btns[1].innerHTML = 'Makhbūn · Softened <span class="btn-sub-badge green">Urdu Standard</span>';
      } else if (mtr.id === 'ramal') {
        btns[0].innerHTML = 'Base Foot · Intact <span class="btn-sub-badge">Canon #10/#11</span>';
        btns[1].innerHTML = 'Makhbūn · Softened <span class="btn-sub-badge green">Canon #18/#16</span>';
      } else {
        btns[0].innerHTML = 'Base Foot · Intact';
        btns[1].innerHTML = 'Makhbūn · Softened';
      }
    }
  }

  // 3. End Mod Buttons
  const endHost = document.getElementById('circleEndModButtons');
  if (endHost) {
    const btns = endHost.querySelectorAll('button');
    const modes = ['salim', 'mahzuuf', 'maqtu'];
    btns.forEach((btn, idx) => {
      btn.classList.toggle('on', modes[idx] === curEndMod);
    });
  }
}
window.syncControlButtons = syncControlButtons;

/* Builds the exact foot groups with Arabic/Urdu names and syllable mnemonics */
function buildCircleLineFeet(mtr, feetCount) {
  const isMusamman = (feetCount === 4);
  const isMakhbun = (curBodyMod === 'makhbun');

  if (mtr.id === 'hazaj') {
    const isMaqtuOrMahzuuf = (curEndMod === 'mahzuuf' || curEndMod === 'maqtu');
    const out = [];
    for (let i = 0; i < feetCount; i++) {
      const isLast = (i === feetCount - 1);
      if (isLast && isMaqtuOrMahzuuf) {
        out.push({ pat: '– = =', ur: 'فعولن', fs: ['fa', 'ʿū', 'lun'] });
      } else {
        out.push({ pat: '– = = =', ur: 'مفاعیلن', fs: ['ma', 'fā', 'ʿī', 'lun'] });
      }
    }
    return out;
  }

  if (mtr.id === 'kamil') {
    const out = [];
    for (let i = 0; i < feetCount; i++) {
      const isLast = (i === feetCount - 1);
      if (isLast && (curEndMod === 'mahzuuf' || curEndMod === 'maqtu')) {
        out.push({ pat: '– – = =', ur: 'متفاعلن', fs: ['mu', 'ta', 'fā', 'ʿil'] });
      } else {
        out.push({ pat: '– – = – =', ur: 'متفاعلن', fs: ['mu', 'ta', 'fā', 'ʿi', 'lun'] });
      }
    }
    return out;
  }

  if (mtr.id === 'mutadarik') {
    const out = [];
    for (let i = 0; i < feetCount; i++) {
      const isLast = (i === feetCount - 1);
      if (isLast && curEndMod === 'mahzuuf') {
        out.push({ pat: '= =', ur: 'فعلن', fs: ['faʿ', 'lūn'] });
      } else if (isLast && curEndMod === 'maqtu') {
        out.push({ pat: '= –', ur: 'فعل', fs: ['fa', 'ʿal'] });
      } else {
        out.push({ pat: '= – =', ur: 'فاعلن', fs: ['fā', 'ʿi', 'lun'] });
      }
    }
    return out;
  }


  // Specialized canonical foot builders for compound and modified meters
  if (mtr.id === 'khafif') {
    if (!isMusamman) { // 3 feet (Musaddas - Standard in Urdu)
      if (isMakhbun) {
        const endPat = (curEndMod === 'mahzuuf') ? '– – =' : '= =';
        const endUr = (curEndMod === 'mahzuuf') ? 'فعلن' : 'فعلن';
        const endFs = (curEndMod === 'mahzuuf') ? ['fa', 'ʿi', 'lun'] : ['faʿ', 'lūn'];
        return [
          { pat: '= – = =', ur: 'فاعلاتن', fs: ['fā', 'ʿi', 'lā', 'tun'] },
          { pat: '– = – =', ur: 'مفاعلن', fs: ['ma', 'fā', 'ʿi', 'lun'] },
          { pat: endPat, ur: endUr, fs: endFs }
        ];
      } else {
        const endPat = (curEndMod === 'mahzuuf') ? '= – =' : (curEndMod === 'maqtu' ? '= =' : '= – = =');
        const endUr = (curEndMod === 'mahzuuf') ? 'فاعلن' : (curEndMod === 'maqtu' ? 'فعلن' : 'فاعلاتن');
        const endFs = (curEndMod === 'mahzuuf') ? ['fā', 'ʿi', 'lun'] : (curEndMod === 'maqtu' ? ['faʿ', 'lūn'] : ['fā', 'ʿi', 'lā', 'tun']);
        return [
          { pat: '= – = =', ur: 'فاعلاتن', fs: ['fā', 'ʿi', 'lā', 'tun'] },
          { pat: '– = = =', ur: 'مستفعلن', fs: ['mus', 'taf', 'ʿi', 'lun'] },
          { pat: endPat, ur: endUr, fs: endFs }
        ];
      }
    } else { // 4 feet (Mus̱amman - Theoretical)
      const endPat = (curEndMod === 'mahzuuf') ? '– = =' : (curEndMod === 'maqtu' ? '= =' : '– = = =');
      return [
        { pat: '= – = =', ur: 'فاعلاتن', fs: ['fā', 'ʿi', 'lā', 'tun'] },
        { pat: '– = = =', ur: 'مستفعلن', fs: ['mus', 'taf', 'ʿi', 'lun'] },
        { pat: '= – = =', ur: 'فاعلاتن', fs: ['fā', 'ʿi', 'lā', 'tun'] },
        { pat: endPat, ur: 'مستفعلن', fs: ['mus', 'taf', 'ʿi', 'lun'] }
      ];
    }
  }

  if (mtr.id === 'mujtathth') {
    if (isMusamman) { // 4 feet
      if (isMakhbun) {
        const endPat = (curEndMod === 'mahzuuf') ? '– – =' : '= =';
        const endUr = 'فعلن';
        const endFs = (curEndMod === 'mahzuuf') ? ['fa', 'ʿi', 'lun'] : ['faʿ', 'lūn'];
        return [
          { pat: '– = – =', ur: 'مفاعلن', fs: ['ma', 'fā', 'ʿi', 'lun'] },
          { pat: '– – = =', ur: 'فعلاتن', fs: ['fa', 'ʿi', 'lā', 'tun'] },
          { pat: '– = – =', ur: 'مفاعلن', fs: ['ma', 'fā', 'ʿi', 'lun'] },
          { pat: endPat, ur: endUr, fs: endFs }
        ];
      }
    }
  }

  if (mtr.id === 'mudari') {
    if (isMusamman && isMakhbun) {
      return [
        { pat: '= = –', ur: 'مفعول', fs: ['maf', 'ʿū', 'lu'] },
        { pat: '= – = –', ur: 'فاعلات', fs: ['fā', 'ʿi', 'lā', 'tu'] },
        { pat: '– = = –', ur: 'مفاعیل', fs: ['ma', 'fā', 'ʿī', 'lu'] },
        { pat: '= – =', ur: 'فاعلن', fs: ['fā', 'ʿi', 'lun'] }
      ];
    }
  }

  // Ramal
  if (mtr.id === 'ramal') {
    if (isMakhbun) {
      // Meters #16, #17, #18, #19: Ramal with Khabn
      // Sadr (Foot 1) in Urdu is fāʿilātun (= – = =)
      // Hashw (intermediate feet) are faʿilātun (– – = =)
      // Darb (final foot) is faʿlūn (= =) for Maqṭūʿ, or faʿilun (– – =) for Maḥzūf
      const out = [
        { pat: '= – = =', ur: 'فاعلاتن', fs: ['fā', 'ʿi', 'lā', 'tun'] }
      ];
      const middleCount = feetCount - 2;
      for (let i = 0; i < middleCount; i++) {
        out.push({ pat: '– – = =', ur: 'فعلاتن', fs: ['fa', 'ʿi', 'lā', 'tun'] });
      }
      if (curEndMod === 'maqtu') {
        out.push({ pat: '= =', ur: 'فعلن', fs: ['faʿ', 'lūn'] });
      } else if (curEndMod === 'mahzuuf') {
        out.push({ pat: '– – =', ur: 'فعلن', fs: ['fa', 'ʿi', 'lun'] });
      } else { // salim
        out.push({ pat: '– – = =', ur: 'فعلاتن', fs: ['fa', 'ʿi', 'lā', 'tun'] });
      }
      return out;
    } else {
      // Meters #10 and #11: Ramal Sālim (catalectic final foot fāʿilun in Urdu literature)
      const out = [];
      for (let i = 0; i < feetCount; i++) {
        const isLast = (i === feetCount - 1);
        if (isLast && (curEndMod === 'salim' || curEndMod === 'mahzuuf')) {
          out.push({ pat: '= – =', ur: 'فاعلن', fs: ['fā', 'ʿi', 'lun'] });
        } else if (isLast && curEndMod === 'maqtu') {
          out.push({ pat: '= =', ur: 'فعلن', fs: ['faʿ', 'lūn'] });
        } else {
          out.push({ pat: '= – = =', ur: 'فاعلاتن', fs: ['fā', 'ʿi', 'lā', 'tun'] });
        }
      }
      return out;
    }
  }

  // Rajaz
  if (mtr.id === 'rajaz') {
    if (isMusamman && isMakhbun) {
      // Meter #25: Rajaz Mus̱amman Matvī Makhbūn
      // Pattern: = - - = / - = - = // = - - = / - = - =
      return [
        { pat: '= – – =', ur: 'مفتعلن', fs: ['muf', 'ta', 'ʿi', 'lun'] },
        { pat: '– = – =', ur: 'مفاعلن', fs: ['ma', 'fā', 'ʿi', 'lun'] },
        { pat: '= – – =', ur: 'مفتعلن', fs: ['muf', 'ta', 'ʿi', 'lun'] },
        { pat: '– = – =', ur: 'مفاعلن', fs: ['ma', 'fā', 'ʿi', 'lun'] }
      ];
    }
    const out = [];
    for (let i = 0; i < feetCount; i++) {
      const isLast = (i === feetCount - 1);
      if (isLast && curEndMod === 'maqtu') {
        out.push({ pat: '= = =', ur: 'مفعولن', fs: ['maf', 'ʿū', 'lun'] });
      } else {
        out.push({ pat: '= = – =', ur: 'مستفعلن', fs: ['mus', 'taf', 'ʿi', 'lun'] });
      }
    }
    return out;
  }

  // Mutaqārib
  if (mtr.id === 'mutaqarib') {
    const out = [];
    for (let i = 0; i < feetCount; i++) {
      const isLast = (i === feetCount - 1);
      if (isLast && curEndMod === 'mahzuuf') {
        out.push({ pat: '– =', ur: 'فعل', fs: ['fa', 'ʿal'] });
      } else if (isLast && curEndMod === 'maqtu') {
        out.push({ pat: '= =', ur: 'فعلن', fs: ['faʿ', 'lūn'] });
      } else {
        out.push({ pat: '– = =', ur: 'فعولن', fs: ['fa', 'ʿū', 'lun'] });
      }
    }
    return out;
  }

  // General single-foot repetition meters (Hazaj, Rajaz, Ramal, Mutaqarib, Mutadarik, Kamil)
  const split = str => String(str || '').split(' / ').map(x => x.trim()).filter(Boolean);
  const baseFeet = split(mtr.baseFoot);
  const trimmedFeet = split(mtr.trimmedFoot);
  const namesUr = String(mtr.footUr || '').split(' ');
  const namesRo = String(mtr.footRo || '').split(' ');
  const n = baseFeet.length || 1;
  const out = [];

  for (let i = 0; i < feetCount; i++) {
    const j = i % n;
    const isLast = (i === feetCount - 1);
    let pat = baseFeet[j];
    let urName = namesUr[j] || '';
    let roName = namesRo[j] || '';
    let intact = true;

    if (isMakhbun && mtr.makhbunFoot) {
      pat = (isLast && curEndMod === 'salim' && mtr.makhbunEnding) ? mtr.makhbunEnding : mtr.makhbunFoot;
      urName = mtr.makhbunUr || 'فعلاتن';
      roName = mtr.makhbunRo || 'faʿilātun';
      intact = false;
    }

    if (isLast && curEndMod === 'mahzuuf') {
      pat = isMakhbun ? (mtr.makhbunEnding || pat) : (trimmedFeet[j] || pat);
      urName = isMakhbun ? 'فعلن' : (mtr.id === 'ramal' ? 'فاعلن' : (mtr.id === 'mutaqarib' ? 'فعل' : 'فعولن'));
      roName = isMakhbun ? 'faʿilun' : (mtr.id === 'ramal' ? 'fāʿilun' : 'faʿūlun');
      intact = false;
    } else if (isLast && curEndMod === 'maqtu') {
      pat = mtr.maqtuFoot || '= =';
      urName = 'فعلن';
      roName = 'faʿlūn';
      intact = false;
    }

    const fs = (CIRCLE_FOOT_FS[roName] && CIRCLE_FOOT_FS[roName].length === pat.split(' ').length) ? CIRCLE_FOOT_FS[roName] : null;
    out.push({ pat, ur: urName, fs });
  }
  return out;
}

/* =========================================================================
   ASSEMBLED BANNER (CALCULATOR OUTPUT)
   ========================================================================= */
function updateCircleAssembledBanner() {
  const circ = CIRCLES[curCircleIdx];
  const mtr = circ.meters[curMeterIdx] || circ.meters[0];
  const banner = document.getElementById('assembledBanner');
  if (!banner) return;

  const res = getMeterResolution(mtr, curLength, curBodyMod, curEndMod);
  const isMusamman = (curLength === 'musamman');
  const lenRo = isMusamman ? 'Mus̱amman' : 'Musaddas';
  const lenUr = isMusamman ? 'مثمن' : 'مسدس';
  const feetCount = isMusamman ? 4 : 3;

  const isMakhbun = (curBodyMod === 'makhbun');
  const bodyRo = isMakhbun ? 'Makhbūn' : '';
  const bodyUr = isMakhbun ? 'مخبون' : '';

  let endRo = 'Sālim';
  let endUr = 'سالم';
  let endExplanation = 'intact foot (Sālim)';

  if (curEndMod === 'mahzuuf') {
    endRo = 'Maḥẕūf';
    endUr = 'محذوف';
    endExplanation = 'truncated final foot (Maḥẕūf)';
  } else if (curEndMod === 'maqtu') {
    endRo = 'Maqṭū‘';
    endUr = 'مقطوع';
    endExplanation = 'severed final foot (Maqṭū‘)';
  }

  const fullRo = res.nameEn || `Baḥr-e-${mtr.name} ${lenRo} ${bodyRo ? bodyRo + ' ' : ''}${endRo}`;
  const fullUr = res.nameUr || `بحرِ ${mtr.nameUr} ${lenUr} ${bodyUr ? bodyUr + ' ' : ''}${endUr}`;

  const lineFeet = buildCircleLineFeet(mtr, feetCount);
  const patternFeet = lineFeet.map(f => f.pat);
  const patternStr = patternFeet.join(' / ');

  const bodyExplanation = isMakhbun ? ' + softened internal beat (Makhbūn)' : '';

  let statusTagHtml = '';
  if (res.isCanonical) {
    statusTagHtml = `<div class="meter-status-tag tag-canonical"><span class="status-dot green"></span><span>Canonical Urdu Meter &middot; <strong>Meter #${res.meterNum}</strong>${res.handbookNum ? ' (Handbook #' + res.handbookNum + ')' : ''}</span></div>`;
  } else {
    statusTagHtml = `<div class="meter-status-tag tag-theoretical"><span class="status-dot amber"></span><span>Theoretical Circle Prototype (al-Khalīl) &middot; Not composed in Urdu</span></div>`;
  }

  banner.innerHTML = `
    ${statusTagHtml}
    <div class="assembled-eyebrow">CALCULATED METER NAME &amp; FORMULA</div>
    <div class="assembled-title urdu ur-always" lang="ur">${fullUr}</div>
    <div class="assembled-name-en">${fullRo}</div>
    <div class="assembled-formula-box">
      <div class="assembled-pattern-line">${patGlyphs(patternStr)}</div>
      <div class="assembled-pattern-line">${patGlyphs(patternStr)}</div>
    </div>
    <div class="assembled-summary">
      <strong>Couplet Formula:</strong> ${feetCount} feet / line &times; 2 lines = <strong>${feetCount * 2} feet total per couplet (${lenRo})</strong> &middot; ${mtr.name} rhythm (${mtr.meaning})${bodyExplanation} + ${endExplanation}.
    </div>
  `;

  updateCircleVerseSection(mtr, res);
}

/* =========================================================================
   CANONICAL VERSE & SCANSION SECTION
   ========================================================================= */
function getCircleVerseLinks(verseObj, mtr, res) {
  if (!verseObj) return { meterNum: null, appGhazal: null, ghazalLabel: null, poet: '' };

  const ur = verseObj.ur || '';
  const poet = canonicalPoetName(verseObj.poet || '');
  let meterNum = res && res.meterNum;
  let appGhazal = null;
  let ghazalLabel = null;

  // Direct In-App Ghazal Corpus Mappings (all verified in site corpus)
  if (ur.includes('ہزاروں خواہشیں')) {
    meterNum = 26;
    appGhazal = '#/ghazals/ghalib/219';
    ghazalLabel = 'Ghalib #219';
  } else if (ur.includes('ہوس کو ہے نشاط')) {
    meterNum = 27;
    appGhazal = '#/ghazals/ghalib/21';
    ghazalLabel = 'Ghalib #21';
  } else if (ur.includes('ہو آدمی اے چرخ') || ur.includes('ہو آدمی اے چرخ')) {
    meterNum = 3;
    appGhazal = '#/ghazals/mir/71';
    ghazalLabel = 'Mir #71';
  } else if (ur.includes('دل ہی تو ہے')) {
    meterNum = 25;
    appGhazal = '#/ghazals/ghalib/115';
    ghazalLabel = 'Ghalib #115';
  } else if (ur.includes('سب کہاں کچھ لالہ')) {
    meterNum = 10;
    appGhazal = '#/ghazals/ghalib/111';
    ghazalLabel = 'Ghalib #111';
  } else if (ur.includes('کوئی دن گر زندگانی')) {
    meterNum = 11;
    appGhazal = '#/ghazals/ghalib/160';
    ghazalLabel = 'Ghalib #160';
  } else if (ur.includes('بسکہ دشوار')) {
    meterNum = 18;
    appGhazal = '#/ghazals/ghalib/17';
    ghazalLabel = 'Ghalib #17';
  } else if (ur.includes('دہر میں نقش')) {
    meterNum = 19;
    appGhazal = '#/ghazals/ghalib/8';
    ghazalLabel = 'Ghalib #8';
  } else if (ur.includes('شوق ہر رنگ')) {
    meterNum = 19;
    appGhazal = '#/ghazals/ghalib/6';
    ghazalLabel = 'Ghalib #6';
  } else if (ur.includes('عشق مجھ کو نہیں وحشت')) {
    meterNum = 17;
    appGhazal = '#/ghazals/ghalib/148';
    ghazalLabel = 'Ghalib #148';
  } else if (ur.includes('پھر مجھے دیدۂ تر') || ur.includes('پھر مجھے دیدۂ تر')) {
    meterNum = (res && res.meterNum) || 16;
    appGhazal = '#/ghazals/ghalib/35';
    ghazalLabel = 'Ghalib #35';
  } else if (ur.includes('یہ نہ تھی ہماری قسمت')) {
    meterNum = 36;
    appGhazal = '#/ghazals/ghalib/20';
    ghazalLabel = 'Ghalib #20';
  } else if (ur.includes('دل ناداں') || ur.includes('دلِ ناداں') || ur.includes('دلِ نا داں')) {
    meterNum = 14;
    appGhazal = '#/ghazals/ghalib/162';
    ghazalLabel = 'Ghalib #162';
  } else if (ur.includes('ہستی اپنی حباب') || ur.includes('نازکی اس کے')) {
    meterNum = 15;
    appGhazal = '#/ghazals/mir/141';
    ghazalLabel = 'Mir #141';
  } else if (ur.includes('دائم پڑا ہوا')) {
    meterNum = 5;
    appGhazal = '#/ghazals/ghalib/110';
    ghazalLabel = 'Ghalib #110';
  } else if (ur.includes('عشق پر زور نہیں')) {
    meterNum = 5;
    appGhazal = '#/ghazals/ghalib/191';
    ghazalLabel = 'Ghalib #191';
  } else if (ur.includes('گر خامشی سے فائدہ')) {
    meterNum = 5;
    appGhazal = '#/ghazals/ghalib/141';
    ghazalLabel = 'Ghalib #141';
  } else if (ur.includes('یہ آرزو تھی تجھے')) {
    meterNum = 33;
    appGhazal = '#/ghazals/atish/97';
    ghazalLabel = 'Atish #97';
  } else if (ur.includes('حنائے پائے خزاں') || ur.includes('حنائے پائے')) {
    meterNum = 34;
    appGhazal = '#/ghazals/ghalib/27';
    ghazalLabel = 'Ghalib #27';
  } else if (ur.includes('کب ٹھہرے گا')) {
    meterNum = 34;
    appGhazal = '#/ghazals/faiz/35';
    ghazalLabel = 'Faiz #35';
  } else if (ur.includes('فقر کے ہیں معجزات')) {
    meterNum = 22;
    appGhazal = '#/ghazals/iqbal/37';
    ghazalLabel = 'Iqbal #37';
  } else if (ur.includes('جہاں تیرا نقش')) {
    meterNum = 28;
    appGhazal = '#/ghazals/ghalib/96';
    ghazalLabel = 'Ghalib #96';
  } else if (ur.includes('فقیرانہ آئے صدا کر چلے') || ur.includes('فقیرانہ')) {
    meterNum = 29;
    appGhazal = '#/ghazals/mir/161';
    ghazalLabel = 'Mir #161';
  } else if (ur.includes('کبھی اے حقیقت')) {
    meterNum = 37;
    appGhazal = '#/ghazals/iqbal/54';
    ghazalLabel = 'Iqbal #54';
  } else if (ur.includes('گل چراغوں کو کر')) {
    meterNum = 39;
    appGhazal = '#/meter/lookup?open=39';
    ghazalLabel = 'Handbook Bahr';
  } else if (ur.includes('آپ کی یاد آتی رہی')) {
    meterNum = 39;
    appGhazal = '#/ghazals/faiz/3';
    ghazalLabel = 'Faiz #3';
  } else if (ur.includes('نہ تھا کچھ تو خدا تھا')) {
    meterNum = 26;
    appGhazal = '#/ghazals/ghalib/32';
    ghazalLabel = 'Ghalib #32';
  }

  return {
    meterNum,
    appGhazal,
    ghazalLabel,
    poet
  };
}

const METER_GENRE_NOTABLES = {
  29: [
    { type: 'Masnavi', typeUr: 'مثنوی', typeHi: 'मसनवी', title: 'Siḥr-ul-Bayān', titleUr: 'سحر البیان', titleHi: 'सहर-उल-बयान', poet: 'Mir Hasan', poetUr: 'میر حسن', poetHi: 'मीर हसन', url: 'https://www.rekhta.org/masnavii/sehr-ul-bayaan-meer-hasan-masnavii?lang=ur', site: 'Rekhta ↗' },
    { type: 'Epic', typeUr: 'رزمیہ', typeHi: 'महाकाव्य', title: 'Shāhnāma', titleUr: 'شاہنامہ', titleHi: 'शाहनामा', poet: 'Firdausi', poetUr: 'فردوسی', poetHi: 'फ़िरदौसी', url: 'https://ganjoor.net/ferdousi/shahnameh/aghaz/sh1', site: 'Ganjoor ↗' },
    { type: 'Masnavi', typeUr: 'مثنوی', typeHi: 'मसनवी', title: 'Būstān', titleUr: 'بوستاں', titleHi: 'बूस्ताँ', poet: 'Saʿdī', poetUr: 'سعدی', poetHi: 'सादी', url: 'https://ganjoor.net/saadi/boustan/d1', site: 'Ganjoor ↗' },
    { type: 'Masnavi', typeUr: 'مثنوی', typeHi: 'मसनवी', title: 'Daryā-e ʿIshq', titleUr: 'دریائے عشق', titleHi: 'दरिया-ए-इश्क़', poet: 'Mir', poetUr: 'میر', poetHi: 'मीर', url: 'https://www.rekhta.org/poets/meer-taqi-meer/masnavii', site: 'Rekhta ↗' },
    { type: 'Masnavi', typeUr: 'مثنوی', typeHi: 'मसनवी', title: 'Abr-e Gauhar-bār', titleUr: 'ابرِ گوہر بار', titleHi: 'अब्र-ए-गौहर-बार', poet: 'Ghalib', poetUr: 'غالب', poetHi: 'ग़ालिब', url: 'https://www.rekhta.org/poets/mirza-ghalib/masnavii', site: 'Rekhta ↗' }
  ],
  27: [
    { type: 'Masnavi', typeUr: 'مثنوی', typeHi: 'मसनवी', title: 'Khosrow va Shīrīn', titleUr: 'خسرو و شیریں', titleHi: 'ख़ुसरो व शीरीं', poet: 'Nezami', poetUr: 'نظامی', poetHi: 'निज़ामी', url: 'https://ganjoor.net/nezami/5ganj/khosro-shirin/sh1', site: 'Ganjoor ↗' },
    { type: 'Masnavi', typeUr: 'مثنوی', typeHi: 'मसनवी', title: 'Muʿāmalāt-e ʿIshq', titleUr: 'معاملاتِ عشق', titleHi: 'मुआमलात-ए-इश्क़', poet: 'Mir', poetUr: 'میر', poetHi: 'मीर', url: 'https://www.rekhta.org/poets/meer-taqi-meer/masnavii', site: 'Rekhta ↗' },
    { type: 'Masnavi', typeUr: 'مثنوی', typeHi: 'मसनवी', title: 'Holī', titleUr: 'ہولی', titleHi: 'होली', poet: 'Hatim', poetUr: 'حاتم', poetHi: 'हातिम', url: 'https://www.rekhta.org/masnavii/holii-shaikh-zahuruddin-hatim-masnavii', site: 'Rekhta ↗' },
    { type: 'Masnavi', typeUr: 'مثنوی', typeHi: 'मसनवी', title: 'Chirāgh-e Dair', titleUr: 'چراغِ دیر', titleHi: 'चिराग़-ए-दैर', poet: 'Ghalib', poetUr: 'غالب', poetHi: 'ग़ालिब', url: 'https://www.rekhta.org/poets/mirza-ghalib/masnavii', site: 'Rekhta ↗' }
  ],
  18: [
    { type: 'Qasida', typeUr: 'قصیدہ', typeHi: 'क़सीदा', title: 'Samt-e Kāshī se chalā', titleUr: 'سمتِ کاشی سے چلا', titleHi: 'समत-ए-काशी से चला', poet: 'Mohsin Kakorvi', poetUr: 'محسن کاکوروی', poetHi: 'मोहसिन काकोरवी', url: 'https://www.rekhta.org/qasiida/samt-e-kaashii-se-chalaa-jaanib-e-mathuraa-baadal-mohsin-kakorvi-qasiida?lang=ur', site: 'Rekhta ↗' },
    { type: 'Qasida', typeUr: 'قصیدہ', typeHi: 'क़सीदा', title: 'Uṭh gayā bahman-o-dai', titleUr: 'اٹھ گیا بہمن و دی', titleHi: 'उठ गया बहमन-ओ-दै', poet: 'Sauda', poetUr: 'سودا', poetHi: 'सौदा', url: 'https://www.rekhta.org/poets/mohammad-rafi-sauda/qasiida', site: 'Rekhta ↗' },
    { type: 'Qasida', typeUr: 'قصیدہ', typeHi: 'क़सीदा', title: 'Dahr meñ naqsh-e vafā', titleUr: 'دہر میں نقشِ وفا', titleHi: 'दहर में नक़्श-ए-वफ़ा', poet: 'Ghalib', poetUr: 'غالب', poetHi: 'ग़ालिब', url: 'https://www.rekhta.org/poets/mirza-ghalib/qasiida', site: 'Rekhta ↗' }
  ],
  19: [
    { type: 'Qasida', typeUr: 'قصیدہ', typeHi: 'क़सीदा', title: 'Sāz-e yak zarrah', titleUr: 'سازِ یک ذرّہ', titleHi: 'साज़-ए-यक ज़र्रा', poet: 'Ghalib', poetUr: 'غالب', poetHi: 'ग़ालिब', url: 'https://www.rekhta.org/poets/mirza-ghalib/qasiida', site: 'Rekhta ↗' },
    { type: 'Qasida', typeUr: 'قصیدہ', typeHi: 'क़सीदा', title: 'Tażḥīk-e Rozgār', titleUr: 'تضحیکِ روزگار', titleHi: 'तज़हीक-ए-रोज़गार', poet: 'Sauda', poetUr: 'سودا', poetHi: 'सौदा', url: 'https://www.rekhta.org/poets/mohammad-rafi-sauda/qasiida', site: 'Rekhta ↗' }
  ],
  15: [
    { type: 'Masnavi', typeUr: 'مثنوی', typeHi: 'मसनवी', title: 'Shar kā eḥsās ho', titleUr: 'شر کا احساس ہو', titleHi: 'शर का एहसास हो', poet: 'Saleem Ahmed', poetUr: 'سلیم احمد', poetHi: 'सलीम अहमद', url: 'https://www.rekhta.org/masnavii/shar-kaa-ehsaas-ho-ki-khair-mile-saleem-ahmed-masnavii', site: 'Rekhta ↗' }
  ],
  9: [
    { type: 'Masnavi', typeUr: 'مثنوی', typeHi: 'मसनवी', title: 'Gulzār-e-Nasīm', titleUr: 'گلزارِ نسیم', titleHi: 'गुलज़ार-ए-नसीम', poet: 'Daya Shankar Nasim', poetUr: 'دیا شنکر نسیم', poetHi: 'दया शंकर नसीम', url: 'https://www.rekhta.org/masnavii/gulzaar-e-nasiim-pandit-daya-shankar-naseem-lakhnavi-masnavii?lang=ur', site: 'Rekhta ↗' }
  ],
  1: [
    { type: 'Masnavi', typeUr: 'مثنوی', typeHi: 'मसनवी', title: 'Mas̱navī-ye Maʿnavī', titleUr: 'مثنوی معنوی', titleHi: 'मसनवी-ए-मा\'नवी', poet: 'Rumi', poetUr: 'مولانا رومی', poetHi: 'मौलाना रूमी', url: 'https://ganjoor.net/moulavi/masnavi/daftar1/sh1', site: 'Ganjoor ↗' },
    { type: 'Qasida', typeUr: 'قصیدہ', typeHi: 'क़सीदा', title: 'Hāñ mah-e nau suneñ', titleUr: 'ہاں مہِ نو سنیں', titleHi: 'हाँ मह-ए-नौ सुनें', poet: 'Ghalib', poetUr: 'غالب', poetHi: 'ग़ालिब', url: 'https://www.rekhta.org/poets/mirza-ghalib/qasiida', site: 'Rekhta ↗' }
  ]
};


function renderMisraPair(l1, l2) {
  if (!l1 && !l2) return '';
  if (!l2) return l1 || '';
  return `<div class="misra-line">${l1}</div><div class="misra-line">${l2}</div>`;
}

function updateCircleVerseSection(mtr, res) {
  if (!res) res = getMeterResolution(mtr, curLength, curBodyMod, curEndMod);
  const headLeft = document.getElementById('circleCoupletHeadLeft');
  const headRight = document.getElementById('circleCoupletHeadRight');
  const vVerseBox = document.getElementById('circleVerseBox');
  const vUr = document.getElementById('circleVerseUrdu');
  const vHi = document.getElementById('circleVerseHindi');
  const vRo = document.getElementById('circleVerseRoman');
  const vAttribution = document.getElementById('circleCoupletAttribution');
  const vScanBox = document.getElementById('circleScanBox');
  const sylRow = document.getElementById('circleSylRow');
  const theoCallout = document.getElementById('circleTheoCallout');
  const otherGenresHost = document.getElementById('circleOtherGenres');

  if (!res.isCanonical) {
    if (otherGenresHost) {
      otherGenresHost.innerHTML = '';
      otherGenresHost.style.display = 'none';
    }

    // Check if an authentic classical demonstration exists for this EXACT prototype (e.g. Muztar Khairabadi for Tawil, Hatef for Kamil, Rumi for Ramal Masnavi, Shams Qais for Basit/Wafir)
    let verseObj = null;
    if (mtr.canonical && mtr.canonical.isArabicOnly && mtr.verses) {
      verseObj = mtr.verses[`${curLength}_${curEndMod}`] || mtr.verses[`${curLength}_salim`];
    } else if (mtr.id === 'ramal' && curLength === 'musaddas' && curEndMod === 'mahzuuf' && curBodyMod === 'base') {
      verseObj = mtr.verses && mtr.verses['musaddas_mahzuuf']; // Rumi's Masnavi
    } else if (mtr.id === 'kamil' && curLength === 'musaddas' && curEndMod === 'salim') {
      verseObj = mtr.verses && mtr.verses['musaddas_salim']; // Hatef Isfahani
    }

    // Render header for Theoretical / Classical Prototype Card
    if (headLeft) {
      const genre = (verseObj && verseObj.genre) ? `${verseObj.genre} &rsaquo; Prototype` : 'Theoretical Prototype';
      headLeft.innerHTML = `<span class="vnum">${genre}</span>`;
    }
    if (headRight) {
      if (verseObj && verseObj.url) {
        headRight.innerHTML = `<a class="fran-link" href="${verseObj.url}" target="_blank" rel="noopener" title="Open source archive">${verseObj.source || 'Archive ↗'}</a>`;
      } else if (res.canonical && res.canonical.meterNum) {
        headRight.innerHTML = `<a class="fran-link" href="#/meter/lookup?open=${res.canonical.meterNum}" onclick="event.stopPropagation()" title="Open canonical meter in app">Standard Form: Meter #${res.canonical.meterNum} &rsaquo;</a>`;
      } else {
        headRight.innerHTML = '';
      }
    }

    const circ = CIRCLES[curCircleIdx];
    let jumpBtnHtml = '';
    if (res.canonical && res.canonical.meterNum) {
      jumpBtnHtml = `
        <button class="btn sm btn-jump-canon" onclick="snapToCanonicalMeter()">
          Switch to Canonical Urdu Form (${res.canonical.nameEn} &rsaquo; Meter #${res.canonical.meterNum}) &rarr;
        </button>
      `;
    } else {
      const canonSibling = circ.meters.find(m => m.canonical && m.canonical.meterNum);
      if (canonSibling && canonSibling.canonical) {
        jumpBtnHtml = `
          <button class="btn sm btn-jump-canon" onclick="snapToCanonicalMeter()">
            Switch to Canonical Urdu Meter in this Circle (${canonSibling.canonical.nameEn} &rsaquo; Meter #${canonSibling.canonical.meterNum}) &rarr;
          </button>
        `;
      } else {
        jumpBtnHtml = `
          <button class="btn sm btn-jump-canon" onclick="snapToCanonicalMeter()">
            Explore Core Canonical Urdu Meter (Hazaj Mus̱amman Sālim &rsaquo; Meter #26) &rarr;
          </button>
        `;
      }
    }

    const theoBoxHtml = `
      <div class="theoretical-box">
        <div class="theo-badge">Theoretical Circle Prototype</div>
        <div class="theo-title">${res.nameEn}</div>
        <p class="theo-desc">${res.theoreticalReason || 'This configuration represents al-Khalīl’s abstract circular permutation. In classical Urdu poetry, this bahr was not composed in this form; Urdu poets composed exclusively in the canonical form.'}</p>
        ${jumpBtnHtml}
      </div>
    `;

    if (verseObj && verseObj.ur) {
      if (vVerseBox) vVerseBox.style.display = '';
      if (vUr) vUr.innerHTML = renderMisraPair(verseObj.ur, verseObj.ur2);
      if (vHi) vHi.innerHTML = renderMisraPair(verseObj.hi, verseObj.hi2);
      if (vRo) vRo.innerHTML = renderMisraPair(verseObj.ro, verseObj.ro2);
      if (vAttribution) {
        const poetDisplay = localizedPoetName(verseObj, canonicalPoetName(verseObj.poet || ''));
        vAttribution.innerHTML = poetDisplay ? `<span class="vpoet">&mdash; ${poetDisplay}</span>` : '';
        vAttribution.style.display = poetDisplay ? '' : 'none';
      }

      const feetCount = (curLength === 'musamman') ? 4 : 3;
      const feet = buildCircleLineFeet(mtr, feetCount);
      let scansionHtml = '';
      if (verseObj.syls && verseObj.syls.length) {
        const chipOf = (sy, idx, fsLabel) =>
          `<span class="cw"><span class="chip roman ${sy.m}" id="scard_${idx}" data-i="${idx}">${sy.ro}</span><span class="fs">${fsLabel || ''}</span></span>`;
        let html = '';
        let pos = 0;
        feet.forEach((F, fi) => {
          const size = F.pat.split(' ').length;
          if (pos >= verseObj.syls.length) return;
          const group = verseObj.syls.slice(pos, pos + size);
          html += `<span class="fgrp" data-f="${fi}"><span class="fname">${F.ur}</span><span class="fchips">${group.map((sy, k) => chipOf(sy, pos + k, F.fs && F.fs[k])).join('')}</span></span>`;
          pos += size;
        });
        // Never emit unmapped orphan foot groups
        if (pos < verseObj.syls.length) {
          // remaining syllables ignored if verse exceeds line feet count
        }
        scansionHtml = html;
      }
      if (sylRow) sylRow.innerHTML = scansionHtml;
      if (vScanBox) vScanBox.style.display = scansionHtml ? '' : 'none';
    } else {
      if (vVerseBox) vVerseBox.style.display = 'none';
      if (vScanBox) vScanBox.style.display = 'none';
      if (vUr) vUr.innerHTML = '';
      if (vHi) vHi.innerHTML = '';
      if (vRo) vRo.innerHTML = '';
      if (vAttribution) vAttribution.innerHTML = '';
      if (sylRow) sylRow.innerHTML = '';
    }

    if (theoCallout) {
      theoCallout.innerHTML = theoBoxHtml;
      theoCallout.style.display = '';
    }
    return;
  }

  if (theoCallout) {
    theoCallout.innerHTML = '';
    theoCallout.style.display = 'none';
  }
  if (vVerseBox) vVerseBox.style.display = '';
  if (vScanBox) vScanBox.style.display = '';

  // It IS Canonical! Find the exact authentic verse for this meter
  let verseObj = null;
  const isMakhbun = (curBodyMod === 'makhbun');

  if (isMakhbun) {
    verseObj = (mtr.verses && mtr.verses[`${curLength}_makhbun_${curEndMod}`]) ||
               (mtr.verses && mtr.verses[`${curLength}_makhbun`]);
  }
  if (!verseObj) {
    if (curEndMod === 'maqtu') {
      verseObj = mtr.verses && (mtr.verses[`${curLength}_maqtu`] || mtr.verses['musamman_maqtu']);
    } else if (curEndMod === 'mahzuuf') {
      verseObj = mtr.verses && mtr.verses[`${curLength}_mahzuuf`];
    } else {
      verseObj = mtr.verses && (mtr.verses[`${curLength}_salim`] || mtr.verses['musamman_salim']);
    }
  }
  if (!verseObj) {
    verseObj = (mtr.verses && Object.values(mtr.verses)[0]);
  }

  if (!verseObj) {
    if (vUr) vUr.innerHTML = 'نمونۂ کلام دستیاب ہے';
    if (vHi) vHi.innerHTML = 'शास्त्रीय उदाहरण';
    if (vRo) vRo.innerHTML = 'Classical verse example';
    if (vAttribution) vAttribution.innerHTML = '';
    if (headLeft) headLeft.innerHTML = '';
    if (headRight) headRight.innerHTML = '';
    if (sylRow) sylRow.innerHTML = '';
    return;
  }

  const links = getCircleVerseLinks(verseObj, mtr, res);

  if (headLeft) {
    let leftHtml = '';
    if (res.meterNum) {
      leftHtml += `<a class="vnum" href="#/meter/lookup?open=${res.meterNum}" onclick="event.stopPropagation()" title="Open Meter #${res.meterNum} in app">Meter #${res.meterNum} &rsaquo;</a>`;
    }
    headLeft.innerHTML = leftHtml;
  }

  if (headRight) {
    let rightHtml = '';
    if (links.appGhazal) {
      rightHtml += `<a class="fran-link" href="${links.appGhazal}" onclick="event.stopPropagation()" title="Read Ghazal in App">${links.ghazalLabel} &rsaquo;</a>`;
    }
    headRight.innerHTML = rightHtml;
  }

  if (vUr) vUr.innerHTML = renderMisraPair(verseObj.ur, verseObj.ur2);
  if (vHi) vHi.innerHTML = renderMisraPair(verseObj.hi, verseObj.hi2);
  if (vRo) vRo.innerHTML = renderMisraPair(verseObj.ro, verseObj.ro2);

  if (vAttribution) {
    const poetDisplay = localizedPoetName(verseObj, links.poet);
    if (poetDisplay) {
      vAttribution.innerHTML = `<span class="vpoet">&mdash; ${poetDisplay}</span>`;
      vAttribution.style.display = '';
    } else {
      vAttribution.innerHTML = '';
      vAttribution.style.display = 'none';
    }
  }

  if (sylRow) {
    if (verseObj.syls && verseObj.syls.length) {
      const feetCount = (curLength === 'musamman') ? 4 : 3;
      const feet = buildCircleLineFeet(mtr, feetCount);
      const chipOf = (sy, idx, fsLabel) =>
        `<span class="cw"><span class="chip roman ${sy.m}" id="scard_${idx}" data-i="${idx}">${sy.ro}</span><span class="fs">${fsLabel || ''}</span></span>`;
      let html = '';
      let pos = 0;
      feet.forEach((F, fi) => {
        const size = F.pat.split(' ').length;
        if (pos >= verseObj.syls.length) return;
        const group = verseObj.syls.slice(pos, pos + size);
        html += `<span class="fgrp" data-f="${fi}"><span class="fname">${F.ur}</span><span class="fchips">${group.map((sy, k) => chipOf(sy, pos + k, F.fs && F.fs[k])).join('')}</span></span>`;
        pos += size;
      });
      // Never emit unmapped orphan foot groups
        if (pos < verseObj.syls.length) {
          // remaining syllables ignored if verse exceeds line feet count
        }
      sylRow.innerHTML = html;
    } else {
      sylRow.innerHTML = '';
    }
  }

  // Populate Notable Forms in Other Genres (Masnavi, Qasida, Epics)
  if (otherGenresHost) {
    const notables = (res && res.meterNum && METER_GENRE_NOTABLES[res.meterNum]) || null;
    if (notables && notables.length) {
      const script = window.currentScript || (document.documentElement && document.documentElement.getAttribute('data-script')) || 'ur';
      const label = (script === 'hi') ? 'अन्य काव्य रूपों में प्रसिद्ध (मसनवी · क़सीदा · महाकाव्य):' :
                    (script === 'ur') ? 'دیگر اصنافِ سخن میں مشہور (مثنوی · قصیدہ · رزمیہ):' :
                    'Celebrated in other poetic forms (Masnavi &middot; Qasida &middot; Epic):';
      otherGenresHost.innerHTML = `
        <div class="other-genres-label">${label}</div>
        <div class="other-genres-chips">
          ${notables.map(n => {
            const t = (script === 'hi' && n.titleHi) ? n.titleHi : (script === 'ur' && n.titleUr) ? n.titleUr : n.title;
            const p = (script === 'hi' && n.poetHi) ? n.poetHi : (script === 'ur' && n.poetUr) ? n.poetUr : n.poet;
            const tp = (script === 'hi' && n.typeHi) ? n.typeHi : (script === 'ur' && n.typeUr) ? n.typeUr : n.type;
            return `
              <a class="genre-chip" href="${n.url}" target="_blank" rel="noopener" title="${n.type} by ${n.poet}">
                <span class="genre-badge">${tp}</span>
                <span class="genre-title">${t}</span>
                <span class="genre-poet">&middot; ${p}</span>
                <span class="genre-src">${n.site}</span>
              </a>
            `;
          }).join('')}
        </div>
      `;
      otherGenresHost.style.display = '';
    } else {
      otherGenresHost.innerHTML = '';
      otherGenresHost.style.display = 'none';
    }
  }
}

/* =========================================================================
   5. INTERACTION & AUDIO ENGINE (WIRED TO WEBSITE SETTINGS)
   ========================================================================= */
function selectCircle(idx) {
  stopCircleAudio();
  curCircleIdx = idx;
  curMeterIdx = 0;
  currentArcA1 = null;
  const circ = CIRCLES[curCircleIdx];
  const mtr = circ.meters[0];
  if (mtr && mtr.canonical) {
    curLength = mtr.canonical.length || 'musamman';
    curBodyMod = mtr.canonical.bodyMod || 'base';
    curEndMod = mtr.canonical.endMod || 'salim';
  }
  syncControlButtons();
  renderCircleTabs();
  renderCircleContext();
  renderCircleMeterOptions();
  renderCircleWheel();
  updateCircleAssembledBanner();
}
window.selectCircle = selectCircle;

function selectCircleMeter(idx) {
  stopCircleAudio();
  curMeterIdx = idx;
  const circ = CIRCLES[curCircleIdx];
  const mtr = circ.meters[curMeterIdx] || circ.meters[0];
  if (mtr && mtr.canonical) {
    curLength = mtr.canonical.length || 'musamman';
    curBodyMod = mtr.canonical.bodyMod || 'base';
    curEndMod = mtr.canonical.endMod || 'salim';
  }
  syncControlButtons();
  renderCircleMeterOptions();
  renderCircleWheel();
  updateCircleAssembledBanner();
}
window.selectCircleMeter = selectCircleMeter;

function setCircleLength(len) {
  stopCircleAudio();
  curLength = len;
  syncControlButtons();
  renderCircleWheel();
  updateCircleAssembledBanner();
}
window.setCircleLength = setCircleLength;

function setCircleBodyMod(mod) {
  stopCircleAudio();
  curBodyMod = mod;
  syncControlButtons();
  renderCircleWheel();
  updateCircleAssembledBanner();
}
window.setCircleBodyMod = setCircleBodyMod;

function setCircleEndMod(end) {
  stopCircleAudio();
  curEndMod = end;
  syncControlButtons();
  renderCircleWheel();
  updateCircleAssembledBanner();
}
window.setCircleEndMod = setCircleEndMod;

function stopCircleAudio() {
  if (typeof stopAll === 'function') stopAll();
  isCircleAudioPlaying = false;
  const poly = document.getElementById('wheelPlayPoly');
  if (poly) {
    poly.setAttribute('points', '-3.5,-31 -3.5,-17 8.5,-24');
    poly.classList.remove('playing');
  }
  document.querySelectorAll('.wheel-pill').forEach(p => p.classList.remove('lit'));
  document.querySelectorAll('.lens-seg').forEach(s => s.classList.remove('lit'));
  document.querySelectorAll('#meterPanelCircles .chip').forEach(c => c.classList.remove('lit'));
  document.querySelectorAll('#meterPanelCircles .fgrp').forEach(g => g.classList.remove('litf'));
}
window.stopCircleAudio = stopCircleAudio;

function toggleCircleAudio() {
  if (isCircleAudioPlaying) {
    stopCircleAudio();
    return;
  }

  const circ = CIRCLES[curCircleIdx];
  const mtr = circ.meters[curMeterIdx] || circ.meters[0];
  const N = circ.cycle.length;
  const windowLen = circ.footLen;
  const start = mtr.startIdx;

  const isTrimmedEnd = (curEndMod === 'mahzuuf' || curEndMod === 'maqtu');
  const playLen = (isTrimmedEnd && windowLen > 2) ? (windowLen - 1) : windowLen;

  const activeTokens = [];
  const pillIndices = [];
  for (let k = 0; k < playLen; k++) {
    const beat = (start + k) % N;
    activeTokens.push(circ.cycle[beat]);
    pillIndices.push(beat);
  }

  isCircleAudioPlaying = true;
  const poly = document.getElementById('wheelPlayPoly');
  if (poly) {
    poly.setAttribute('points', '-4.5,-28.5 4.5,-28.5 4.5,-19.5 -4.5,-19.5');
    poly.classList.add('playing');
  }

  if (typeof play === 'function') {
    play(activeTokens, {
      cadence: false,
      onStep: (stepIdx) => {
        document.querySelectorAll('.wheel-pill').forEach(p => p.classList.remove('lit'));
        const pEl = document.getElementById(`wpill_${pillIndices[stepIdx]}`);
        if (pEl) pEl.classList.add('lit');

        document.querySelectorAll('.lens-seg').forEach(s => s.classList.remove('lit'));
        const segEl = document.getElementById(`lensSeg_${stepIdx}`);
        if (segEl) segEl.classList.add('lit');

        document.querySelectorAll('#meterPanelCircles .chip').forEach(c => c.classList.remove('lit'));
        document.querySelectorAll('#meterPanelCircles .fgrp').forEach(g => g.classList.remove('litf'));
        const sEl = document.getElementById(`scard_${stepIdx}`);
        if (sEl) { sEl.classList.add('lit'); const g = sEl.closest('.fgrp'); if (g) g.classList.add('litf'); }
      },
      onEnd: () => {
        stopCircleAudio();
      }
    });
  }
}
window.toggleCircleAudio = toggleCircleAudio;

// Initialize canonical defaults on load
const _firstMtr = CIRCLES[0].meters[0];
if (_firstMtr && _firstMtr.canonical) {
  curLength = _firstMtr.canonical.length || 'musamman';
  curBodyMod = _firstMtr.canonical.bodyMod || 'base';
  curEndMod = _firstMtr.canonical.endMod || 'salim';
}

window.CIRCLES = CIRCLES;
window.getMeterResolution = getMeterResolution;
window.getCircleVerseLinks = getCircleVerseLinks;

