import json
import re

SECOND_LINES = {
    'ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے': {
        'ur2': 'بہت نکلے مرے ارمان لیکن پھر بھی کم نکلے',
        'ro2': 'bohat nikle mire armān lekin phir bhī kam nikle',
        'hi2': 'बहुत निकले मिरे अरमान लेकिन फिर भी कम निकले'
    },
    'ہوس کو ہے نشاطِ کار کیا کیا': {
        'ur2': 'نہ ہو مرنا تو جینے کا مزا کیا',
        'ro2': 'nah ho marnā to jīne kā mazā kyā',
        'hi2': 'न हो मरना तो जीने का मज़ा क्या'
    },
    'دل ہی تو ہے نہ سنگ و خشت درد سے بھر نہ آئے کیوں': {
        'ur2': 'روئیں گے ہم ہزار بار کوئی ہمیں ستائے کیوں',
        'ro2': 'roʾeñge ham hazār bār koʾī hameñ satāʾe kyoñ',
        'hi2': 'रोएँगे हम हज़ार बार कोई हमें सताए क्यों'
    },
    'دل ہی تو ہے نہ سنگ و خشت درد سے بھر نہ آئے کیوں': {
        'ur2': 'روئیں گے ہم ہزار بار کوئی ہمیں ستائے کیوں',
        'ro2': 'roʾeñge ham hazār bār koʾī hameñ satāʾe kyoñ',
        'hi2': 'रोएँगे हम हज़ार बार कोई हमें सताए क्यों'
    },
    'محبت نے نکالا ہے تری گھر سے': {
        'ur2': 'نہ چھوڑا اس نے کچھ بھی اپنے جی ڈر سے',
        'ro2': 'nah chhoṛā us ne kuchh bhī apne jī ḍar se',
        'hi2': 'न छोड़ा उस ने कुछ भी अपने जी डर से'
    },
    'نہ تھا کچھ تو خدا تھا کچھ نہ ہوتا تو خدا ہوتا': {
        'ur2': 'ڈبویا مجھ کو ہونے نے نہ ہوتا میں تو کیا ہوتا',
        'ro2': 'ḍuboyā mujh ko hone ne nah hotā maiñ to kyā hotā',
        'hi2': 'डुबोया मुझ को होने ने न होता मैं तो क्या होता'
    },
    'عشق پر زور نہیں ہے یہ وہ آتش غالب': {
        'ur2': 'کہ لگائے نہ لگے اور بجھائے نہ بنے',
        'ro2': 'kih lagāʾe nah lage aur bujhāʾe nah bane',
        'hi2': 'कि लगाए न लगे और बुझाए न बने'
    },
    'ہو آدمی اے چرخ ترکِ گردشِ ایّام کر': {
        'ur2': 'یا صبح کو مت شام کر یا شام کو مت صبح کر',
        'ro2': 'yā subḥ ko mat shām kar yā shām ko mat subḥ kar',
        'hi2': 'या सुब्ह को मत शाम कर या शाम को मत सुब्ह कर'
    },
    'ہو آدمی اے چرخ ترکِ گردشِ ایّام کر': {
        'ur2': 'یا صبح کو مت شام کر یا شام کو مت صبح کر',
        'ro2': 'yā subḥ ko mat shām kar yā shām ko mat subḥ kar',
        'hi2': 'या सुब्ह को मत शाम कर या शाम को मत सुब्ह कर'
    },
    'گھر میں نہیں کچھ رات کو': {
        'ur2': 'روٹی نہ ہو تو بات کیا',
        'ro2': 'roṭī nah ho to baat kyā',
        'hi2': 'रोटी न हो तो बात क्या'
    },
    'اے ہم‌نشیں مت پوچھ تو کیفیتِ حالِ مرا': {
        'ur2': 'تجھ پر کہیں کھل جائے نہ احوالِ دل کے ماجرا',
        'ro2': 'tujh par kahīñ khul jāʾe nah aḥvāl-e dil ke mājarā',
        'hi2': 'ऐ हम-नशीं मत पूछ तू कैफ़ियत-ए-हाल-ए-मरा'
    },
    'دیکھا تجھے تو دل گیا': {
        'ur2': 'رویا تو جی پگھل گیا',
        'ro2': 'royā to jī pighal gayā',
        'hi2': 'रोया तो जी पिघल गया'
    },
    'چپکے چپکے رات دن آنسو بہانا یاد ہے': {
        'ur2': 'ہم کو اب تک عاشقی کا وہ زمانہ یاد ہے',
        'ro2': 'ham ko ab tak ʿāshiqī kā voh zamāna yaad hai',
        'hi2': 'हम को अब तक आशिक़ी का वो ज़माना याद है'
    },
    'سب کہاں کچھ لالہ و گل میں نمایاں ہو گئیں': {
        'ur2': 'خاک میں کیا صورتیں ہوں گی کہ پنہاں ہو گئیں',
        'ro2': 'khāk meñ kyā sūrateñ hoñgī kih pinhāñ ho gaʾīñ',
        'hi2': 'ख़ाक में क्या सूरतें होंगी कि पिन्हाँ हो गईं'
    },
    'کوئی دن گر زندگانی اور ہے': {
        'ur2': 'اپنے جی میں ہم نے ٹھانی اور ہے',
        'ro2': 'apne jī meñ ham ne ṭhānī aur hai',
        'hi2': 'अपने जी में हम ने ठानी और है'
    },
    'بسکہ دشوار ہے ہر کام کا آساں ہونا': {
        'ur2': 'آدمی کو بھی میسر نہیں انساں ہونا',
        'ro2': 'aadmī ko bhī muyassar nahīñ insāñ honā',
        'hi2': 'आदमी को भी मुयस्सर नहीं इंसाँ होना'
    },
    'شوق ہر رنگ رقیبِ سر و ساماں نکلا': {
        'ur2': 'قیس تصویر کے پردے میں بھی عریاں نکلا',
        'ro2': 'qais tasvīr ke parde meñ bhī ʿuryāñ niklā',
        'hi2': 'क़ैस तस्वीर के पर्दे में भी उर्याँ निकला'
    },
    'یہ نہ تھی ہماری قسمت کہ وصالِ یار ہوتا': {
        'ur2': 'اگر اور جیتے رہتے یہی انتظار ہوتا',
        'ro2': 'agar aur jīte rahte yahī intizār hotā',
        'hi2': 'अगर और जीते रहते यही इंतज़ार होता'
    },
    'پھر مجھے دیدۂ تر یاد آیا': {
        'ur2': 'دلِ جگر تشنۂ فریاد آیا',
        'ro2': 'dil-e jigar tishnah-e faryād aayā',
        'hi2': 'दिल-ए-जिगर तिश्ना-ए-फ़रियाद आया'
    },
    'بشنو این نی چون شکایت می‌کند': {
        'ur2': 'از جدایی‌ها حکایت می‌کند',
        'ro2': 'az judāʾī-hā ḥikāyat mī-kunad',
        'hi2': 'अज़ जुदाई-हा हिकायत मी-कुनद'
    },
    'دلِ ناداں تجھے ہوا کیا ہے': {
        'ur2': 'آخر اس درد کی دوا کیا ہے',
        'ro2': 'ākhir is dard kī davā kyā hai',
        'hi2': 'आख़िर इस दर्द की दवा क्या है'
    },
    'نازکی اس کے لب کی کیا کہیے': {
        'ur2': 'پنکھڑی اک گلاب کی سی ہے',
        'ro2': 'pankhaṛī ik gulāb kī sī hai',
        'hi2': 'पंखुड़ी इक गुलाब की सी है'
    },
    'یا رب ہے بخش دینا بندے کو کام تیرا': {
        'ur2': 'تجھ بن نہیں سہارا کوئی مدام تیرا',
        'ro2': 'tujh bin nahīñ sahārā koʾī mudām terā',
        'hi2': 'तुझ बिन नहीं सहारा कोई मुदाम तेरा'
    },
    'یہ آرزو تھی تجھے گل کے رو بہ رو کرتے': {
        'ur2': 'ہم اور بلبلِ بے تاب گفتگو کرتے',
        'ro2': 'ham aur bulbul-e be-tāb guftugū karte',
        'hi2': 'हम और बुलबुल-ए-बे-ताब गुफ़्तुगू करते'
    },
    'کب ٹھہرے گا درد اے دل کب رات بسر ہوگی': {
        'ur2': 'سنتے تھے وہ آئیں گے سنتے تھے سحر ہوگی',
        'ro2': 'sunte the voh āʾeñge sunte the saḥar hogī',
        'hi2': 'सुनते थे वो आएँगे सुनते थे सहर होगी'
    },
    'فقر کے ہیں معجزات تاج و سریر و سپاہ': {
        'ur2': 'فقر ہے میرِ سپاہ فقر ہے قلب و نگاہ',
        'ro2': 'faqr hai mīr-e sipāh faqr hai qalb-o-nigāh',
        'hi2': 'फ़क़्र है मीर-ए-सिपाह फ़क़्र है क़ल्ब-ओ-निगाह'
    },
    'جہاں تیرا نقشِ قدم دیکھتے ہیں': {
        'ur2': 'خیاباں خیاباں ارم دیکھتے ہیں',
        'ro2': 'khiyābāñ khiyābāñ iram dekhte haiñ',
        'hi2': 'ख़ियाबाँ ख़ियाबाँ इरम देखते हैं'
    },
    'فقیرانہ آئے صدا کر چلے': {
        'ur2': 'میاں خوش رہو ہم دعا کر چلے',
        'ro2': 'miyāñ khvush raho ham duʿā kar chale',
        'hi2': 'मियाँ ख़ुश रहो हम दुआ कर चले'
    },
    'سارے جہاں سے اچھا ہندوستاں ہمارا': {
        'ur2': 'ہم بلبلیں ہیں اس کی یہ گلستاں ہمارا',
        'ro2': 'ham bulbuleñ haiñ is kī yeh gulsitāñ hamārā',
        'hi2': 'हम बुलबुलें हैं इस की यह गुलसिताँ हमारा'
    },
    'بہ دیدارِ یاراں شتابی کنید': {
        'ur2': 'کہ عمرِ گرامی شتاباں رود',
        'ro2': 'kih ʿumr-e girāmī shitābāñ ravī',
        'hi2': 'कि उम्र-ए-गिरामी शिताबाँ रवी'
    },
    'آپ کی یاد آتی رہی رات بھر': {
        'ur2': 'چاندنی دل دکھاتی رہی رات بھر',
        'ro2': 'chāndnī dil dukhātī rahī raat bhar',
        'hi2': 'चाँदनी दिल दुखाती रही रात भर'
    },
    'گل چراغوں کو کر ہم سرِ شام دیں': {
        'ur2': 'شب کے ہاتھوں میں اب اپنا انجام دیں',
        'ro2': 'shab ke hāthoñ meñ ab apnā anjām deñ',
        'hi2': 'शब के हाथों में अब अपना अंजाम दें'
    },
    'دل مرا ہو گیا بے قرار': {
        'ur2': 'لے گیا چین و صبر و قرار',
        'ro2': 'le gayā chain-o-ṣabr-o-qarār',
        'hi2': 'ले गया चैन-ओ-सब्र-ओ-क़रार'
    },
    'کبھی اے حقیقتِ منتظر نظر آ لباسِ مجاز میں': {
        'ur2': 'کہ ہزاروں سجدے تڑپ رہے ہیں مری جبینِ نیاز میں',
        'ro2': 'kih hazāroñ sajde taṛap rahe haiñ mirī jabīn-e niyāz meñ',
        'hi2': 'कि हज़ारों सजदे तड़प रहे हैं मिरी जबीन-ए-नियाज़ में'
    },
    'چه شود به چهرهٔ زرد من نظری برای خدا کنی': {
        'ur2': 'که اگر کنی همه درد من به یکی نظاره دوا کنی',
        'ro2': 'ki agar kunī hama dard-e man ba-yakē naẓāra davā kunī',
        'hi2': 'कि अगर कुनी हम दर्द-ए मन ब-यके नज़ारा दवा कुनी'
    },
    'اگر آن نگارِ سمن‌برم به وثاقِ بنده گذر کند': {
        'ur2': 'ز فروغِ طلعتِ خویشتن شبِ بنده روزِ دگر کند',
        'ro2': 'zi furoogh-e tal\'at-e kheshtan shab-e banda roz-e digar kunad',
        'hi2': 'ज़े फ़रोग़-ए-तलअत-ए-ख़्वेशतन शब-ए-बंदा रोज़-ए-दिगर कुनद'
    },
    'نہ کسی کی آنکھ کا نور ہوں نہ کسی کے دل کا قرار ہوں': {
        'ur2': 'جو کسی کے کام نہ آ سکے میں وہ ایک مشتِ غبار ہوں',
        'ro2': 'jo kisī ke kaam nah aa sake maiñ voh ek musht-e ghubār hūñ',
        'hi2': 'जो किसी के काम न आ सके मैं वो एक मुश्त-ए-ग़ुबार हूँ'
    },
    'مرا دل ز مهرت جدا کی شود گرچه دوری': {
        'ur2': 'وصالت مرا مدعا کی شود گرچه صبوری',
        'ro2': 'vis̱ālat marā muddaʿā kay shaved garchih ṣabūrī',
        'hi2': 'विसालत मरा मुद्दआ कै शवद गरचे सबूरी'
    },
    'دل میں حسرت جو جاگ اٹھتی ہے خواب بن کر وہ مسکراتی ہے': {
        'ur2': 'یاد تیری جو دل میں آتی ہے اشک بن کر وہ جھلملاتی ہے',
        'ro2': 'yaad terī jo dil meñ aatī hai ashk ban kar voh jhilmilātī hai',
        'hi2': 'याद तेरी जो दिल में आती है अश्क बन कर वो झिलमिलाती है'
    },
    'تا کی تو ای دل ز یارِ خود بی‌خبر نشینی': {
        'ur2': 'برخیز و رو تا رخِ نگارِ خویشتن ببینی',
        'ro2': 'bar-khīz-o raw tā rukh-e nigār-e khēshtan bi-bīnī',
        'hi2': 'बर-ख़ीज़-ओ रौ ता रुख़-ए-निगार-ए-ख़्वेशतन बि-बीनी'
    }
}

def main():
    with open('src/js/17c-circles.js', 'r', encoding='utf-8') as f:
        content = f.read()

    updated_count = 0

    for ur_text, second in SECOND_LINES.items():
        pattern = re.compile(
            r"(ur:\s*['\"]" + re.escape(ur_text) + r"['\"],\s*\n\s*ro:\s*['\"]([^'\"]+)['\"],\s*\n\s*hi:\s*['\"]([^'\"]+)['\"])(\s*,?\n)(?!\s*ur2:)"
        )
        def replacer(m):
            nonlocal updated_count
            updated_count += 1
            return (
                f"{m.group(1)},\n"
                f"                ur2: '{second['ur2']}',\n"
                f"                ro2: '{second['ro2']}',\n"
                f"                hi2: '{second['hi2']}'{m.group(4)}"
            )
        content = pattern.sub(replacer, content)

    print(f'Applied updates to {updated_count} verse entries.')

    # Add renderMisraPair helper if not present
    if 'function renderMisraPair(' not in content:
        helper = """
function renderMisraPair(l1, l2) {
  if (!l1 && !l2) return '';
  if (!l2) return l1 || '';
  return `<div class=\"misra-line\">${l1}</div><div class=\"misra-line\">${l2}</div>`;
}
"""
        content = content.replace('function updateCircleVerseSection(mtr, res) {', helper + '\nfunction updateCircleVerseSection(mtr, res) {')

    # Update vUr, vHi, vRo assignments
    # For theoretical prototype:
    content = re.sub(
        r"if \(vUr\) vUr\.innerHTML = verseObj\.ur;\s*\n\s*if \(vHi\) vHi\.innerHTML = verseObj\.hi \|\| '';\s*\n\s*if \(vRo\) vRo\.innerHTML = verseObj\.ro \|\| '';",
        """if (vUr) vUr.innerHTML = renderMisraPair(verseObj.ur, verseObj.ur2);
      if (vHi) vHi.innerHTML = renderMisraPair(verseObj.hi, verseObj.hi2);
      if (vRo) vRo.innerHTML = renderMisraPair(verseObj.ro, verseObj.ro2);""",
        content
    )

    # For canonical meter:
    content = re.sub(
        r"if \(vUr\) vUr\.innerHTML = verseObj\.ur;\s*\n\s*if \(vHi\) vHi\.innerHTML = verseObj\.hi \|\| '';\s*\n\s*if \(vRo\) vRo\.innerHTML = verseObj\.ro;",
        """if (vUr) vUr.innerHTML = renderMisraPair(verseObj.ur, verseObj.ur2);
  if (vHi) vHi.innerHTML = renderMisraPair(verseObj.hi, verseObj.hi2);
  if (vRo) vRo.innerHTML = renderMisraPair(verseObj.ro, verseObj.ro2);""",
        content
    )

    with open('src/js/17c-circles.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print('Updated src/js/17c-circles.js successfully!')

if __name__ == '__main__':
    main()
