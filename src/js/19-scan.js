/* ================= SCAN ================= */
const EXERCISES=[
{g:1,poet:'Vali',m:[26],L:`کیا مجھ عشق نے ظالم کو آب آہستہ آہستہ
کہ آتش گل کو کرتا ہے گلاب آہستہ آہستہ
وفاداری نے دلبر کی بجھایا آتشِ غم کوں
کہ گرمی دفع کرتی ہے گلاب آہستہ آہستہ
عجب کچھ لطف رکھتا ہے شبِ خلوت میں گلرو سوں
خطاب آہستہ آہستہ جواب آہستہ آہستہ
ادا و ناز سے آتا ہے وہ روشن جبیں گھر سوں
کہ جیوں مشرق سوں نکلے آفتاب آہستہ آہستہ
ولی مجھ دل میں آتا ہے خیالِ یار بے پروا
کہ جیوں انکھیاں منیں آتا ہے خواب آہستہ آہستہ`},
{g:2,poet:'Dard',m:[11],L:`تہمتیں چند اپنے ذمّے دھر چلے
جس لیے آئے تھے سو ہم کر چلے
زندگی ہے یا کوئی طوفان ہے
ہم تو اس جینے کے ہاتھوں مر چلے
شمع کے مانند ہم اس بزم میں
چشم تر آئے تھے دامن تر چلے
کیا ہمیں کام ان گلوں سے اے صبا
ایک دم آئے ادھر اودھر چلے
درد کچھ معلوم ہے یہ لوگ سب
کس طرف سے آئے تھے کیدھر چلے`},
{g:3,poet:'Mir',m:[25],L:`ملنے لگے ہو دیر دیر دیکھیے کیا ہے کیا نہیں
تم تو کرو ہو صاحبی بندے میں کچھ رہا نہیں
بوئے گل اور رنگِ گل دونوں ہیں دلکش اے نسیم
لیک بقدرِ یک نگاہ دیکھیے تو وفا نہیں
شکوہ کروں ہوں بخت کا اتنے غضب نہ ہو بتاں
مجھ کو خدا نہ خواستہ تم سے تو کچھ گلا نہیں
چشمِ سفید اشکِ سرخ آہِ دلِ حزیں ہے یاں
شیشہ نہیں ہے مے نہیں ابر نہیں ہوا نہیں
ایک فقط ہے سادگی تس پہ بلائے جاں ہے تو
عشوہ کرشمہ کچھ نہیں آن نہیں ادا نہیں`},
{g:4,poet:'Mir',m:[14,15],L:`ہستی اپنی حباب کی سی ہے
یہ نمائش سراب کی سی ہے
نازکی اس کے لب کی کیا کہیے
پنکھڑی اک گلاب کی سی ہے
بار بار اس کے در پہ جاتا ہوں
حالت اب اضطراب کی سی ہے
میں جو بولا کہا کہ یہ آواز
اسی خانہ خراب کی سی ہے
میر ان نیم باز آنکھوں میں
ساری مستی شراب کی سی ہے`},
{g:5,poet:'Mir',m:['H'],L:`عشق ہمارے خیال پڑا ہے خواب گئی آرام گیا
جی کا جانا ٹھہر گیا ہے صبح گیا یا شام گیا
عشق کیا سو دین گیا ایمان گیا اسلام گیا
دل نے ایسا کام کیا کچھ جس سے میں ناکام گیا
ہائے جوانی کیا کیا کہیے شور سروں میں رکھتے تھے
اب کیا ہے وہ عہد گیا وہ موسم وہ ہنگام گیا`},
{g:6,poet:"Mus'hafi",m:[26],L:`نہ وہ راتیں نہ وہ باتیں نہ وہ قصّہ کہانی ہے
فقط اک ہم ہیں بستر پر پڑے اور ناتوانی ہے
بھلا میں ہاتھ دھو بیٹھوں نہ اپنی جان سے کیوں کر
خرام اس کے میں اک آبِ رواں کی سی روانی ہے
تو یوں بے پردہ ہو جایا نہ کر ہر ایک کے آگے
نیا عالم ہے تیرا اور نئی کافر جوانی ہے
نہ تنہا گل گریباں پھاڑتے ہیں دیکھ اس سج کو
چمن میں آب جو بھی چال پر اس کی دوانی ہے
تری باتوں نے تو اے مصحفی جی کو جلا ڈالا
خدا کے واسطے چپ رہ یہ کیا آتش زبانی ہے`},
{g:7,poet:"Jur'at",m:[10],L:`بال سلجھانا ترا کنگھی سے دل الجھائے ہے
اور بکھرے دیکھ کر بس جی ہی بکھرا جائے ہے
سرخ ڈورے دیکھ کیا ہی جال میں پھنستا ہے دل
نکلیں ہیں کیا کیا ادائیں جب کہ تو شرمائے ہے
رنگ پر چہرے کے ہے کیا ہی جوانی کی چمک
اور بھرے گالوں پہ جی بوسے کو کیا للچائے ہے
غش میں ہو جاتا ہے جی بس عطر کی بو باس پر
جھٹ سے جرأت کے گلے جب آ کے تو لگ جائے ہے`},
{g:8,poet:"Jur'at",m:['H'],L:`بھول گئے تم جن روزوں ہم گھر پہ بلائے جاتے تھے
ہوتے تھے کیا کیا کچھ چرچے عیش منائے جاتے تھے
کیا کیا کچھ تھی خاطرداری کیا کیا پیار کی باتیں تھیں
کس کس ڈھب سے چاہ جتا کر ربط بڑھائے جاتے تھے
کرتے تھے تم ان کی خوشامد جو تھے ہمارے محرمِ راز
ہر ہر بات پہ کیا کیا ان کے ناز اٹھائے جاتے تھے
ننگ ہے یاں اب نام سے ایسا جہاں لکھا ہو مٹوا دو
یا پڑھنے کو جرأت ہی کے شعر لکھائے جاتے تھے`},
{g:9,poet:'Atish',m:[18,19],L:`حسرتِ جلوۂ دیدار لیے پھرتی ہے
پیشِ روزن پسِ دیوار لیے پھرتی ہے
مالِ مفلس مجھے سمجھا ہے جنوں نے شاید
وحشتِ دل سرِ بازار لیے پھرتی ہے
کعبہ و دیر میں وہ خانہ بر انداز کہاں
گردشِ کافر و دیندار لیے پھرتی ہے
کسی صورت سے نہیں جاں کو قرار اے آتش
تپشِ دل مجھے ناچار لیے پھرتی ہے`},
{g:10,poet:'Atish',m:[33,34],L:`یہ آرزو تھی تجھے گل کے رو بہ رو کرتے
ہم اور بلبلِ بیتاب گفتگو کرتے
مری طرح سے مہ و مہر بھی ہیں آوارہ
کسی حبیب کی یہ بھی ہیں جستجو کرتے
جو دیکھتے تری زنجیرِ زلف کا عالم
اسیر ہونے کی آزاد آرزو کرتے
نہ پوچھ عالمِ برگشتہ طالعی آتش
برستی آگ جو باراں کی آرزو کرتے`},
{g:11,poet:'Zauq',m:[27],L:`اسے ہم نے بہت ڈھونڈا نہ پایا
اگر پایا تو کھوج اپنا نہ پایا
مقدّر پر ہی گر سود و زیاں ہے
تو ہم نے یاں نہ کچھ کھویا نہ پایا
کہے کیا ہائے زخمِ دل ہمارا
دہن پایا لبِ گویا نہ پایا
نظیر اس کی کہاں عالم میں اے ذوق
کہیں ایسا نہ پائے گا نہ پایا`},
{g:12,poet:'Zauq',m:[5],L:`لائی حیات آئے قضا لے چلی چلے
اپنی خوشی نہ آئے نہ اپنی خوشی چلے
بہتر تو ہے یہی کہ نہ دنیا سے دل لگے
پر کیا کریں جو کام نہ بے دل لگی چلے
ہو عمرِ خضر بھی تو کہیں گے بوقتِ مرگ
ہم کیا رہے یہاں ابھی آئے ابھی چلے
نازاں نہ ہو خرد پہ جو ہونا ہو ہو وہی
دانش تری نہ کچھ مری دانشوری چلے
دنیا نے کس کا راہِ فنا میں دیا ہے ساتھ
تم بھی چلے چلو یوں ہی جب تک چلی چلے`},
{g:13,poet:'Momin',m:[14,15],L:`اثر اس کو ذرا نہیں ہوتا
رنج راحت فزا نہیں ہوتا
تم ہمارے کسی طرح نہ ہوئے
ورنہ دنیا میں کیا نہیں ہوتا
ایک دشمن کہ چرخ ہے نہ رہے
تجھ سے یہ اے دعا نہیں ہوتا
تم مرے پاس ہوتے ہو گویا
جب کوئی دوسرا نہیں ہوتا
کیوں سنے عرضِ مضطر اے مومن
صنم آخر خدا نہیں ہوتا`},
{g:14,poet:'Momin',m:[37],L:`وہ جو ہم میں تم میں قرار تھا تمہیں یاد ہو کہ نہ یاد ہو
وہی یعنی وعدہ نباہ کا تمہیں یاد ہو کہ نہ یاد ہو
وہ نئے گلے وہ شکایتیں وہ مزے مزے کی حکایتیں
وہ ہر ایک بات پہ روٹھنا تمہیں یاد ہو کہ نہ یاد ہو
ہوئے اتّفاق سے گر بہم تو وفا جتانے کو دم بہ دم
گلۂ ملامتِ اقربا تمہیں یاد ہو کہ نہ یاد ہو
کوئی بات ایسی اگر ہوئی کہ تمہارے جی کو بری لگی
تو بیاں سے پہلے ہی بھولنا تمہیں یاد ہو کہ نہ یاد ہو
جسے آپ گنتے تھے آشنا جسے آپ کہتے تھے باوفا
میں وہی ہوں مومنِ مبتلا تمہیں یاد ہو کہ نہ یاد ہو`},
{g:15,poet:'Ghalib',m:[18,19],L:`بسکہ دشوار ہے ہر کام کا آساں ہونا
آدمی کو بھی میسّر نہیں انساں ہونا
وائے دیوانگیٔ شوق کہ ہر دم مجھ کو
آپ جانا ادھر اور آپ ہی حیراں ہونا
عشرتِ قتل گہِ اہلِ تمنّا مت پوچھ
عیدِ نظّارہ ہے شمشیر کا عریاں ہونا
عشرتِ پارۂ دل زخمِ تمنّا کھانا
لذّتِ ریشِ جگر غرقِ نمکداں ہونا
حیف اس چار گرہ کپڑے کی قسمت غالب
جس کی قسمت میں ہو عاشق کا گریباں ہونا`},
{g:16,poet:'Ghalib',m:[36],L:`یہ نہ تھی ہماری قسمت کہ وصالِ یار ہوتا
اگر اور جیتے رہتے یہی انتظار ہوتا
ترے وعدے پر جیے ہم تو یہ جان جھوٹ جانا
کہ خوشی سے مر نہ جاتے اگر اعتبار ہوتا
کوئی میرے دل سے پوچھے ترے تیرِ نیم کش کو
یہ خلش کہاں سے ہوتی جو جگر کے پار ہوتا
غم اگرچہ جاں گسل ہے پہ کہاں بچیں کہ دل ہے
غمِ عشق اگر نہ ہوتا غمِ روزگار ہوتا
یہ مسائلِ تصوّف یہ ترا بیان غالب
تجھے ہم ولی سمجھتے جو نہ بادہ خوار ہوتا`},
{g:17,poet:'Ghalib',m:[18,19],L:`دہر میں نقشِ وفا وجہِ تسلّی نہ ہوا
ہے یہ وہ لفظ کہ شرمندۂ معنی نہ ہوا
میں نے چاہا تھا کہ اندوہِ وفا سے چھوٹوں
وہ ستمگر مرے مرنے پہ بھی راضی نہ ہوا
ہوں ترے وعدہ نہ کرنے پہ بھی راضی کہ کبھی
گوش منّت کشِ گلبانگِ تسلّی نہ ہوا
کس سے محرومیٔ قسمت کی شکایت کیجے
ہم نے چاہا تھا کہ مر جائیں سو وہ بھی نہ ہوا
مر گیا صدمۂ یک جنبشِ لب سے غالب
ناتوانی سے حریفِ دمِ عیسیٰ نہ ہوا`},
{g:18,poet:'Ghalib',m:[10],L:`سب کہاں کچھ لالہ و گل میں نمایاں ہو گئیں
خاک میں کیا صورتیں ہوں گی کہ پنہاں ہو گئیں
یاد تھیں ہم کو بھی رنگا رنگ بزم آرائیاں
لیکن اب نقش و نگارِ طاقِ نسیاں ہو گئیں
نیند اس کی ہے دماغ اس کا ہے راتیں اس کی ہیں
تیری زلفیں جس کے بازو پر پریشاں ہو گئیں
ہم موحّد ہیں ہمارا کیش ہے ترکِ رسوم
ملّتیں جب مٹ گئیں اجزائے ایماں ہو گئیں
یوں ہی گر روتا رہا غالب تو اے اہلِ جہاں
دیکھنا ان بستیوں کو تم کہ ویراں ہو گئیں`},
{g:19,poet:'Ghalib',m:[5],L:`گر خامشی سے فائدہ اخفائے حال ہے
خوش ہوں کہ میری بات سمجھنی محال ہے
کس پردے میں ہے آئنہ پرداز اے خدا
رحمت کہ عذر خواہ لبِ بے سوال ہے
ہے ہے خدا نخواستہ وہ اور دشمنی
اے شوقِ منفعل یہ تجھے کیا خیال ہے
ہستی کے مت فریب میں آ جائیو اسد
عالم تمام حلقۂ دامِ خیال ہے`},
{g:20,poet:'Ghalib',m:[8],L:`ہے بسکہ ہر اک ان کے اشارے میں نشاں اور
کرتے ہیں محبّت تو گزرتا ہے گماں اور
یا رب وہ نہ سمجھے ہیں نہ سمجھیں گے مری بات
دے اور دل ان کو جو نہ دے مجھ کو زباں اور
ہر چند سبک دست ہوئے بت شکنی میں
ہم ہیں تو ابھی راہ میں ہے سنگِ گراں اور
پاتے نہیں جب راہ تو چڑھ جاتے ہیں نالے
رکتی ہے مری طبع تو ہوتی ہے رواں اور
ہیں اور بھی دنیا میں سخنور بہت اچھّے
کہتے ہیں کہ غالب کا ہے اندازِ بیاں اور`},
{g:21,poet:'Dagh',m:[4],L:`یا رب ہے بخش دینا بندے کو کام تیرا
محروم رہ نہ جائے کل یہ غلام تیرا
جب تک ہے دل بغل میں ہر دم ہو یاد تیری
جب تک زباں ہے منہ میں جاری ہو نام تیرا
ہے تو ہی دینے والا پستی سے دے بلندی
اسفل مقام میرا اعلیٰ مقام تیرا
محروم کیوں رہوں میں جی بھر کے کیوں نہ لوں میں
دیتا ہے رزق سب کو ہے فیض عام تیرا
یہ داغ بھی نہ ہوگا تیرے سوا کسی کا
کونین میں ہے جو کچھ وہ ہے تمام تیرا`},
{g:22,poet:'Dagh',m:[36],L:`عجب اپنا حال ہوتا جو وصالِ یار ہوتا
کبھی جان صدقے ہوتی کبھی دل نثار ہوتا
کوئی فتنہ تا قیامت نہ پھر آشکار ہوتا
ترے دل پہ کاش ظالم مجھے اختیار ہوتا
یہ مزہ تھا دل لگی کا کہ برابر آگ لگتی
نہ تجھے قرار ہوتا نہ مجھے قرار ہوتا
ترے وعدے پر ستمگر ابھی اور صبر کرتے
اگر اپنی زندگی کا ہمیں اعتبار ہوتا
تمہیں ناز ہو نہ کیوں کر کہ لیا ہے داغ کا دل
یہ رقم نہ ہاتھ لگتی نہ یہ افتخار ہوتا`},
{g:23,poet:'Akbar',m:[27],L:`خدا حافظ مسلمانوں کا اکبر
مجھے تو ان کی خوشحالی سے ہے یاس
کہا مجنوں سے یہ لیلیٰ کی ماں نے
کہ بیٹا تو اگر کر لے ایم اے پاس
تو فوراً بیاہ دوں لیلیٰ کو تجھ سے
بلا دقّت میں بن جاؤں تری ساس
کہا مجنوں نے یہ اچھّی سنائی
کجا عاشق کجا کالج کی بکواس
دل اپنا خون کرنے کو ہوں موجود
نہیں منظور مغزِ سر کا آماس
یہی ٹھہری جو شرطِ وصلِ لیلیٰ
تو استعفا مرا با حسرت و یاس`},
{g:24,poet:'Iqbal',m:[37],L:`کبھی اے حقیقتِ منتظر نظر آ لباسِ مجاز میں
کہ ہزاروں سجدے تڑپ رہے ہیں مری جبینِ نیاز میں
تو بچا بچا کے نہ رکھ اسے ترا آئنہ ہے وہ آئنہ
کہ شکستہ ہو تو عزیز تر ہے نگاہِ آئنہ ساز میں
نہ کہیں جہاں میں اماں ملی جو اماں ملی تو کہاں ملی
مرے جرمِ خانہ خراب کو ترے عفوِ بندہ نواز میں
نہ وہ عشق میں رہیں گرمیاں نہ وہ حسن میں رہیں شوخیاں
نہ وہ غزنوی میں تڑپ رہی نہ وہ خم ہے زلفِ ایاز میں
جو میں سر بہ سجدہ ہوا کبھی تو زمیں سے آنے لگی صدا
ترا دل تو ہے صنم آشنا تجھے کیا ملے گا نماز میں`},
];
const SAMPLES=[
 ['Ghalib 162',"دلِ ناداں تجھے ہوا کیا ہے\nآخر اس درد کی دوا کیا ہے"],
 ['Ghalib 219',"ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے\nبہت نکلے مرے ارمان لیکن پھر بھی کم نکلے"],
 ['Ghalib 20',"یہ نہ تھی ہماری قسمت کہ وصالِ یار ہوتا\nاگر اور جیتے رہتے یہی انتظار ہوتا"],
 ['Mir 7',"الٹی ہو گئیں سب تدبیریں کچھ نہ دوا نے کام کیا\nدیکھا اس بیماریٔ دل نے آخر کام تمام کیا"],
 ['a broken line',"دلِ ناداں تجھے بہت ہوا کیا ہے"],
 ['Hafiz (Fārsī)',"دل می‌رود ز دستم صاحب‌دلان خدا را\nدردا که راز پنهان خواهد شد آشکارا"],
 ['Rumi (Fārsī)',"بشنو این نی چون شکایت می‌کند\nاز جدایی‌ها حکایت می‌کند"],
];
/* The empty state: three ghazals as cards (the first line in Urdu, its Roman, the poet), one tap scans the whole ghazal. Built
   by the shared sample component (18c-verse-shared.js); initScanEmptyState (02-store.js) draws it when the router opens Scan. */
const SCAN_TRY=[
 {poet:'Ghalib · 11 couplets',ref:'ghalib/162',text:"دلِ ناداں تجھے ہوا کیا ہے\nآخر اس درد کی دوا کیا ہے"},
 {poet:'Mir · 9 couplets',ref:'mir/141',text:"ہستی اپنی حباب کی سی ہے\nیہ نمائش سراب کی سی ہے"},
 {poet:'Iqbal · 7 couplets',ref:'iqbal/90',text:"ستاروں سے آگے جہاں اور بھی ہیں\nابھی عشق کے امتحان اور بھی ہیں"}
];
function renderScanSamples(){
  const host=$('samples'); if(!host) return;
  host.innerHTML=viSamplesHTML(SCAN_TRY.map(s=>{ const f=viFirstLine(s.text); let ro=''; try{ ro=lineScripts(f).ro||''; }catch(e){}
    return {poet:s.poet,first:[{text:f,script:'ur'},{text:ro,script:'ro'}],cta:'Scan ghazal'}; }),'scanTry');
}
function scanTry(i){
  const s=SCAN_TRY[i]; if(!s||!$('scanIn')) return;
  const full = s.ref && typeof ghazalScanText === 'function' ? ghazalScanText(s.ref) : null;
  scanGhazalRef = full ? s.ref : '';
  $('scanIn').value = full || s.text;
  ovr={}; selWord=null; curEx=null; if($('exSel')) $('exSel').value='';
  runScan();
}
window.scanTry=scanTry; window.renderScanSamples=renderScanSamples;
/* the Transliterator link under the input: the scanned text as it stands */
function scanTranscribeHref(text){ return '#/lab/transcribe?t='+encodeURIComponent(String(text||'')); }
if ($('exSel')) $('exSel').innerHTML='<option value="">Pritchett\'s exercise ghazals (1–24)…</option>'+EXERCISES.map((e,i)=>`<option value="${i}">${e.g}. ${e.poet}</option>`).join('');
let curEx=null;
/* answer-key meters: Scan's own EXERCISES use .m, corpus ghazals (Mir/Ghalib browse) use .meters */
function exMeters(ex){ const m = ex ? (ex.m || ex.meters || []) : []; return Array.isArray(m) ? m : [m]; }
function loadEx(v){ if(v===''){curEx=null;return;} curEx=EXERCISES[+v]; if($('scanIn')) $('scanIn').value=curEx.L; ovr={}; selWord=null; runScan(); }
function loadSample(i){ if($('scanIn')) $('scanIn').value=SAMPLES[i][1]; ovr={}; curEx=null; if($('exSel')) $('exSel').value=''; runScan(); }
let ovr={}, lastScan=null, selWord=null, scanRolls={};
function verdictOf(c){ return c<=2.5?['ok','Scans']:c<=5?['warn','Scans, with stretches']:['no','Strained — probably not']; }
/* colour a raw pattern string (= long, - short, x shortenable long, / foot break) */
function patGlyphs(raw){
  return String(raw).split('').map(ch =>
    ch === '=' ? '<span class="pg l">=</span>' :
    (ch === '-' || ch === '–' || ch === '—') ? '<span class="pg s">–</span>' :
    (ch === 'x' || ch === 'X' || ch === '×') ? '<span class="pg x">x</span>' :
    ch === '/' ? '<span class="pg sep">/</span>' :
    ch
  ).join('');
}
/* Legend entries. `rule` = engine-lab/rules.json id (cited as a Handbook section in the tooltip); `app: true` = this app's
   own notation or convention, not the handbook's. */
const LEGEND_ITEMS = [
  { rule: 'S1.5-weight', tip: "A long syllable: two letters. Shown as a solid underline or =. Sung 'dum' in this app.", body: `<i class="sw c-l"></i><span class="lg-or">/</span><span class="pg l">=</span> long <span class="lg-note">(dum)</span>` },
  { rule: 'S1.5-weight', tip: "A short syllable: one letter. Shown as a dotted underline or \u2013. Sung 'da' in this app.", body: `<i class="sw c-s"></i><span class="lg-or">/</span><span class="pg s">\u2013</span> short <span class="lg-note">(da)</span>` },
  { rule: 'F2.1-listed-monosyllable', tip: "A word or syllable that can be read long or short in Urdu (کو، سے، ہے…, and word-final vowels). Marked with a purple corner diamond (◆); the meter's rhythm locks it into long or short.", body: `<span class="sw-diamond"></span>flexible` },
  { rule: 'M6.1-anceps', sec: '7', tip: "In an abstract meter formula, x marks an 'anceps' slot where the formula itself permits either a long or a short syllable without penalty (such as the opening position of meters 14–19).", body: `<span class="pg x">x</span> anceps slot`, app: true },
  { rule: 'M6.1-cheat-final', tip: "One extra short syllable the meter doesn't count: allowed at the end of a line and, in some meters, just before the mid-line break. Pritchett calls it a 'cheat' syllable.", body: `<span class="sw-extra-tile"></span> extra` },
  { rule: 'M6.1-cheat-caesura', tip: "The break in the middle of the line, between its two hemistich halves. Where a meter has one, the pattern shows //. In some meters one extra short syllable may sit just before it.", body: `<span class="cae">//</span> caesura` },
  { rule: 'F3.1-graft', tip: "Words joined across the space and read as one, e.g. \u0101\u1e33hir is \u2192 \u0101\u00b7\u1e33hi\u00b7ris.", body: `<i class="sw c-g"></i>grafted` }
];
function legendHTML(cls){
  // one compact line; each item explains itself on hover or tap (data-tip, styled in verse.css)
  const item = it => { const sec = it.sec || ruleSec(it.rule); return `<span class="lg-item" tabindex="0" data-tip="${it.tip} (Handbook \u00a7${sec})">${it.body}</span>`; };
  return `<div class="legend${cls?' '+cls:''}">` + LEGEND_ITEMS.map(item).join('') + `</div>`;
}
const FAM_TITLES = {
  'hazaron': "Bahr of Hazāroñ Ḳhvāhisheñ",
  'dilenadan': "Bahr of Dil-e Nādāñ",
  'sadagi': "Bahr of Sādagī",
  'koidin': "Bahr of Koī Din",
  'bazicha': "Bahr of Bāzīchah",
  'yihnathi': "Bahr of Yih Nah Thī",
  'nuktachin': "Bahr of Nuktah-chīñ",
  'harek': "Bahr of Har Ek",
  'muddat': "Bahr of Muddat",
  'milne': "Bahr of Milne Lage Ho",
  'use': "Bahr of Use Ham Ne",
  'ulti': "Mīr's Hindi meter"
};

const METER_TECH_NAMES = {
  1: "hazaj musaddas axram ashtar mahzūf",
  2: "mutaqārib musamman asram",
  3: "rajaz musamman sālim",
  4: "muzāriʻ musamman axrab",
  5: "muzāriʻ musamman axrab makfūf mahzūf",
  6: "mutadārik musamman muzāʻaf maqtūʻ maxbūn",
  7: "hazaj musamman ashtar",
  8: "ramal musamman maxbūn maqbūz ashtar mahzūf",
  9: "hazaj musaddas axram ashtar maqtūʻ",
  10: "ramal musamman maxbūn mahzūf / maqtūʻ",
  11: "ramal musaddas maxbūn mahzūf / maqtūʻ",
  12: "ramal muṡamman musaddas",
  13: "ramal murabbaʻ",
  14: "xafīf musaddas maqbūz maqtūʻ",
  15: "xafīf musaddas maqbūz maxbūn aslam",
  16: "sarīʻ musaddas ma:twī makshūf",
  17: "sarīʻ musaddas ma:twī maqṣūr",
  18: "mujtas musamman maxbūn mahzūf / maqtūʻ",
  19: "mujtas musamman maxbūn aslam",
  20: "hazaj musamman axrab",
  21: "hazaj musamman axrab makfūf",
  22: "hazaj musamman axrab maqbūz",
  23: "hazaj musamman axrab maqbūz mahzūf",
  24: "hazaj musaddas axrab",
  25: "hazaj musamman ashtar",
  26: "hazaj musamman sālim",
  27: "hazaj musaddas mahzūf",
  28: "mutaqārib musamman sālim",
  29: "mutaqārib musamman mahzūf / maqṣūr",
  30: "mutadārik musamman sālim",
  31: "mutadārik musaddas sālim",
  32: "hazaj musamman maqbūz",
  33: "mużāriʻ musamman axrab makfūf mahzūf / maqtūʻ",
  34: "mużāriʻ musamman axrab makfūf aslam",
  35: "mużāriʻ musamman axrab makfūf",
  36: "ramal musamman mashkūl",
  37: "kāmil musamman sālim",
  38: "mutaqārib musamman sālim muzāʻaf",
  39: "mutadārik musamman sālim",
  40: "mutaqārib murabbaʻ muzāʻaf maqbūz aslam"
};

function meterTechName(m){
  if(!m || m.id==='H') return '';
  const pm = (typeof persianMeterMeta === 'function') ? persianMeterMeta(m.id) : null;
  if (pm) return pm.nameFa;
  const raw = (typeof METERS_DATA !== 'undefined' && METERS_DATA.standard) ? ((METERS_DATA.standard.find(x => x.id === m.id) || {}).name || '') : (METER_TECH_NAMES[m.id] || '');
  return aruzName(raw).ro;
}
function meterLabel(m, opts){
  if(!m) return '';
  if(m.id==='H') return "Mir's Hindi meter";
  const showTech = !opts || opts.tech !== false;
  const pm = (typeof persianMeterMeta === 'function') ? persianMeterMeta(m.id) : null;
  const numStr = pm ? pm.label : m.kind==='rubai' ? ('rubāʿī ' + (''+m.id).replace(/^R/i,'')) : ('Meter #' + m.id);
  const tech = showTech ? meterTechName(m) : '';
  const f = (typeof famOfMeter !== 'undefined') ? famOfMeter[m.id] : null;

  let famTitle = '';
  if (f && FAM_TITLES[f.id]) famTitle = FAM_TITLES[f.id];
  else if (f && f.gz && f.gz[0]) {
    const _w = (f.gz[0].ro||'').split(/\s+/).slice(0,3).join(' ');
    famTitle = _w ? `Bahr of ${_w.charAt(0).toUpperCase()+_w.slice(1)}` : '';
  }

  if (famTitle && tech) return `${famTitle} (${numStr}) — ${tech}`;
  if (famTitle) return `${famTitle} (${numStr})`;
  if (tech) return `${numStr} — ${tech}`;
  return numStr;
}
/* The poets' list (ROMAN_FALLBACK: typed Roman -> ASCII) read the other way: Urdu spelling -> its ASCII. Built once. A spelling
   two words share goes to the one more typed spellings lead to. */
let _poetsByUr = null;
function poetsUrduIndex(){
  if(_poetsByUr) return _poetsByUr;
  _poetsByUr = new Map();
  if(typeof ROMAN_FALLBACK === 'undefined' || !window.p_ur) return _poetsByUr;
  const n = new Map();
  Object.keys(ROMAN_FALLBACK).forEach(k => { const a = ROMAN_FALLBACK[k]; n.set(a, (n.get(a) || 0) + 1); });
  n.forEach((c, a) => {
    let ur = ''; try { ur = window.p_ur.parse(a); } catch(e) { return; }
    const key = lexKey(ur), had = _poetsByUr.get(key);
    if(!had || c > had.c) _poetsByUr.set(key, { a, c });
  });
  return _poetsByUr;
}
/* verbs and auxiliaries written joined to the word before (\u06C1\u0648\u06AF\u06CC\u0627 ho gay\u0101, \u06A9\u0631\u062F\u06CC\u0627 kar diy\u0101): a closed class */
const UR_JOINED_AUX = /(\u06AF\u06CC\u0627|\u06AF\u0626\u06CC|\u06AF\u0626\u06D2|\u06AF\u0626\u06CC\u06BA|\u062C\u0627\u0626\u06D2|\u062C\u0627\u062A\u0627|\u062C\u0627\u062A\u06CC|\u062C\u0627\u062A\u06D2|\u062C\u0627\u0626\u06CC\u06BA|\u062F\u06CC\u0627|\u062F\u06CC\u06BA|\u062F\u06CC\u06D2|\u062F\u06CC\u0626\u06D2|\u0644\u06CC\u0627|\u0644\u06CC\u06BA|\u0644\u06CC\u06D2|\u0644\u0626\u06D2|\u0633\u06A9\u0627|\u0633\u06A9\u06CC|\u0633\u06A9\u06D2|\u0633\u06A9\u062A\u0627|\u0633\u06A9\u062A\u06CC|\u0633\u06A9\u062A\u06D2|\u0631\u06C1\u0627|\u0631\u06C1\u06CC|\u0631\u06C1\u06D2|\u0686\u06A9\u0627|\u0686\u06A9\u06CC|\u0686\u06A9\u06D2)$/;
/* One Urdu-script word -> {tier, ro, hi, ascii?}: Pritchett's word map (known), the poets' list (poets), the Persian list
   (persian), a word and a joined auxiliary both listed (derived), else read as a Hindi reader reads it (guess: urduGuessAscii),
   else the letter map. prev / next: the neighbouring words (null at a line's edge), which settle a homograph (ctxReading).
   Scan's per-word fallback and Transcribe's reading of Urdu script both come from here. */
const UR_WORD_EDGES = new RegExp('^([^' + AR_RANGE + ']*)([\\s\\S]*?)([^' + AR_RANGE + '\\u064B-\\u065F\\u0670]*)$');   // what is not a letter of the script
function urduWordReading(word, literal, prev, next){
  const m = String(word || '').match(UR_WORD_EDGES);
  const lead = m ? m[1] : '', trail = m ? m[3] : '', core = (m ? m[2] : String(word || '')).replace(/[\u0614]/g, '');   // \u0614 the pen-name mark
  const wrap = r => ({ tier: r.tier, ascii: r.ascii, ro: lead + r.ro + trail, hi: lead + r.hi + trail });
  const viaAscii = (a, tier) => { try { const r = window.p_di.parse(a), h = window.p_hi.parse(a); return r ? { tier, ascii: a, ro: r, hi: h || '' } : null; } catch(e) { return null; } };
  if(!core) return { tier: 'plain', ro: String(word || ''), hi: String(word || '') };
  if(PA_LETTER.test(core)){   // پاݨی: by its letters
    const g = urduGuessAscii(core), r = g && viaAscii(g, 'guess');
    if(r) return wrap(r);
  }
  let r = null;
  const known = (!literal && typeof ctxReading === 'function' && wordAscii(core, false) && ctxReading(core, prev, next)) || wordAscii(core, literal);   // میں: maiñ or meñ by its neighbours
  if(known) r = viaAscii(known, 'known');
  const listed = w => { const a = wordAscii(w, false); if(a) return a; const p = poetsUrduIndex().get(lexKey(w)); return p ? p.a : null; };
  if(!r){ const p = poetsUrduIndex().get(lexKey(core)); if(p) r = viaAscii(p.a, 'poets'); }
  if(!r && typeof listedFormAscii === 'function'){ const f = listedFormAscii(core, listed); if(f) r = viaAscii(f, 'derived'); }
  /* the Persian list's own words only: its prefix and suffix splits misread Urdu (چاہئے chāh; tests/benchmark_urdu_input.js) */
  if(!r && typeof faKey === 'function' && typeof faLookup === 'function'){ const k = faKey(core), fa = k ? faLookup(k) : null; if(fa && fa.ro) r = { tier: 'persian', ro: fa.ro, hi: fa.hi || '' }; }
  if(!r){
    const j = lexKey(core).match(UR_JOINED_AUX);
    if(j && j.index > 0){
      const a1 = listed(lexKey(core).slice(0, j.index)), a2 = listed(j[1]);
      if(a1 && a2){ const p1 = viaAscii(a1, 'derived'), p2 = viaAscii(a2, 'derived'); if(p1 && p2) r = { tier: 'derived', ro: p1.ro + ' ' + p2.ro, hi: p1.hi + ' ' + p2.hi }; }
    }
  }
  if(!r && typeof urduGuessAscii === 'function'){ const g = urduGuessAscii(core); if(g) r = viaAscii(g, 'guess'); }
  if(!r) r = { tier: 'guess', ro: typeof urduToRoman === 'function' ? urduToRoman(core) : core, hi: typeof urduToDevanagari === 'function' ? urduToDevanagari(core) : core };
  return wrap(r);
}
/* A word written without a vowel letter (عشق, عجب, صبر) gives the engine two splits at the same cost: ʿish-q and ʿa-shq. Pritchett's
   verses say which: when every reading of the spelling in them (KNOWN_VERSES, seen at least 3 times, any iẓāfat aside) puts its
   vowels on the same consonants, the engine's one split that agrees is pinned (scanLine overrides). Words with an iẓāfat, or read
   two ways in her verses (qadr / qadar, t̤araf / t̤arf), are left free. Ghalib's meter top-1 goes from 91.33 to 91.88% with top-3
   unchanged (tests/benchmark.js meter.pasted*); a pasted مقامِ عشق بھی عجب بات ہے no longer passes for mutaqārib on ʿa-shq. */
let _verseReadings = null;
function verseReadings(){
  if(_verseReadings) return _verseReadings;
  _verseReadings = new Map();
  if(typeof KNOWN_VERSES === 'undefined') return _verseReadings;
  const seen = new Set();
  Object.keys(KNOWN_VERSES).forEach(k => { const v = KNOWN_VERSES[k];
    if(!v || !v.ur || !v.ascii || seen.has(v)) return; seen.add(v);
    const u = v.ur.split(/\s+/).filter(Boolean), a = v.ascii.split(/\s+/).filter(Boolean);
    if(u.length !== a.length) return;
    u.forEach((w, i) => { const key = lexKey(w); let e = _verseReadings.get(key); if(!e) _verseReadings.set(key, e = new Map());
      const r = a[i].replace(/-e$/, ''); e.set(r, (e.get(r) || 0) + 1); });
  });
  return _verseReadings;
}
/* which of a word's n consonant letters carry a vowel, by its ASCII; null when they do not line up one to one */
function asciiVoweled(a, n){
  const toks = []; let i = 0; a = String(a);
  while(i < a.length){
    const v = a.slice(i).match(/^(aa|ii|uu|ai|au|e|o|a|i|u)/); if(v){ toks.push(1); i += v[1].length; continue; }
    const c = a.slice(i).match(/^(\(\(|\)\)|[;:.][a-zA-Z]|chh|ch|sh|zh|kh|gh|ph|th|bh|dh|jh|[a-z])/); if(c){ toks.push(0); i += c[1].length; continue; }
    return null;
  }
  const out = []; toks.forEach((t, k) => { if(!t) out.push(toks[k + 1] === 1); });
  return out.length === n ? out : null;
}
const ROMAN_PIN_CONS = /^[بپتٹثجچحخدڈذرڑزژسشصضطظعغفقکگلمن]+$/;
function romanPins(line){
  if(typeof Scan === 'undefined' || typeof lexKey !== 'function') return null;
  let words; try { words = Scan.tokenize(String(line || '').normalize('NFC')); } catch(e) { return null; }
  const pins = {}; let n = 0;
  words.forEach((wd, i) => {
    const bare = lexKey(wd.raw), opts = wd.opts || [];
    if(!ROMAN_PIN_CONS.test(bare) || opts.length < 2 || /ِ/.test(wd.raw) || opts.some(o => o.syl.some(sy => sy.k === 'SUF' || sy.suf))) return;
    const rs = verseReadings().get(bare); if(!rs) return;
    let seen = 0, pat = null;
    for(const [r, c] of rs){ const V = asciiVoweled(r, [...bare].length); if(!V || (pat && pat.join() !== V.join())) return; pat = V; seen += c; }
    if(!pat || seen < 3) return;
    const ok = opts.map(o => { let p = 0, good = true;
      o.syl.forEach(sy => { const t = sy.t.filter(x => !/[ً-ٟ]/.test(x));
        if(t.length >= 2){ if(!pat[p]) good = false; for(let q = 1; q < t.length; q++) if(pat[p + q]) good = false; }   // a syllable opens on a voweled consonant and closes on bare ones
        p += t.length; });
      return good && p === pat.length; });
    if(ok.filter(Boolean).length === 1 && ok.some(x => !x)){ pins[i] = { opt: ok.indexOf(true) }; n++; }
  });
  return n ? pins : null;
}
window.romanPins = romanPins;
/* per-word Devanagari/Roman for a line only partly in the verified word map */
function urduWordsToScripts(line){
  if(typeof wordAscii!=='function' || !window.p_hi || !window.p_di) return null;
  const hi=[], ro=[], literal=/[\u064B-\u065F\u0670]/.test(line);
  const ws = line.split(/\s+/).filter(Boolean);
  for(let i = 0; i < ws.length; i++){
    const w = ws[i], r = urduWordReading(w, literal, i ? ws[i - 1] : null, i < ws.length - 1 ? ws[i + 1] : null);
    hi.push(r.hi); ro.push(r.ro);
  }
  return {hi:hi.join(' '), ro:ro.join(' ')};
}
/* one typed line → {ur, hi, ro, ascii, isApprox}: a known corpus verse verbatim, else
   Pue's parsers on the word-map ASCII, else word by word. opts.skipKnown bypasses the
   verbatim lookup (tests/benchmark.js uses it to measure the fallbacks on Fran's lines). */
function lineScripts(rawL, opts){
  opts = opts || {};
  rawL = (rawL || '').normalize('NFC');
  const nk = (typeof normVerseKey === 'function') ? normVerseKey(rawL) : '';
  let urduL = rawL;
  let lineObj = null;

  if(!opts.skipKnown && typeof KNOWN_VERSES !== 'undefined' && KNOWN_VERSES[nk]) {
    lineObj = KNOWN_VERSES[nk];
    urduL = lineObj.ur;
  } else if(/[\u0600-\u06FF]/.test(rawL)) {
    urduL = rawL;
    const wa = (typeof urduLineToAscii==='function') ? urduLineToAscii(rawL) : {allKnown:false};
    let hi='', ro='';
    if(wa.allKnown){
      try { if(window.p_hi) hi = window.p_hi.parse(wa.ascii); } catch(e){}
      try { if(window.p_di) ro = window.p_di.parse(wa.ascii); } catch(e){}
    }
    if(wa.allKnown && hi && ro){
      lineObj = { ur: rawL, hi, ro, ascii: wa.ascii, isApprox: false };
    } else {
      /* word by word: known words keep their verified spelling, only the unknown ones
         fall back to the letter map (which can't see short vowels: ستاروں → stāroñ) */
      const per = (typeof urduWordsToScripts==='function') ? urduWordsToScripts(rawL) : null;
      lineObj = { ur: rawL, hi: per ? per.hi : (typeof urduToDevanagari==='function'?urduToDevanagari(rawL):rawL), ro: per ? per.ro : (typeof urduToRoman==='function'?urduToRoman(rawL):rawL), ascii: rawL, isApprox: true };
    }
  } else if(/[\u0900-\u097F]/.test(rawL)) {
    const asc = (typeof devToAscii==='function') ? devToAscii(rawL) : rawL;
    const t = asciiToScripts(asc);
    urduL = t.ur || rawL;
    lineObj = { ur: urduL, hi: rawL, ro: t.ro || rawL, ascii: asc };
  } else {
    const asc = (typeof romanToAscii==='function') ? romanToAscii(rawL) : rawL;
    const t = asciiToScripts(asc);
    urduL = t.ur || rawL;
    lineObj = { ur: urduL, hi: t.hi || rawL, ro: t.ro || rawL, ascii: asc };
  }
  return lineObj;
}
/* set when Scan was opened on a whole ghazal ("ghalib/21"): the address then stays #/scan?g=ghalib/21 until the text is changed */
var scanGhazalRef;   // no initialiser: the router can set it before this file's top level runs
/* the engine the Scan tab is working with: the Persian one (ScanFa) for a Fārsī scan, else the Urdu one */
function SE() { return (typeof lastScan !== 'undefined' && lastScan && lastScan.lang === 'fa' && typeof ScanFa !== 'undefined') ? ScanFa : Scan; }

/* Language of the verse: Auto (detectScanLang), Urdu, or Fārsī. Fārsī lines are written the way the engine reads verse
   (faScanText: Iranian letters, the uncounted nūn after a long vowel) and never take Mir's Hindi meter, which is Urdu only. */
let scanLang = (typeof store !== 'undefined' && store.get) ? store.get('scanLang', 'auto') : 'auto';
function renderScanLangButtons(detected) {
  const host = $('scanLangBadge');
  if (!host) return;
  const det = viDetect($('scanIn') ? $('scanIn').value : '');
  const text = scanLang === 'ur' ? 'Urdu' : scanLang === 'fa' ? 'Fārsī' : (det ? det.label : (detected === 'fa' ? 'Fārsī script' : 'detected from the text'));
  host.innerHTML = viBadgeHTML({ id: 'scanLangMenu', valId: 'scanLangDetected', text, current: scanLang, onPick: 'setScanLang',
    options: [['auto', 'Detect from the text'], ['ur', 'Urdu'], ['fa', 'Fārsī']] });
}
function setScanLang(lang) {
  scanLang = lang;
  if (typeof store !== 'undefined' && store.set) store.set('scanLang', lang);
  renderScanLangButtons();
  if ($('scanIn') && $('scanIn').value.trim()) runScan();
}
window.setScanLang = setScanLang;
window.renderScanLangButtons = renderScanLangButtons;

/* Persian meters Urdu does not use (Ganjoor's list, data/persian_meters.json): tried only for a Fārsī line that no standard
   meter fits well, and reported under the results. Built from the engine's exported pieces; the engine is unchanged. */
let _faOnlyMeters = null;
function faOnlyMeters() {
  if (_faOnlyMeters) return _faOnlyMeters;
  const list = (typeof PERSIAN_METERS !== 'undefined' && Array.isArray(PERSIAN_METERS)) ? PERSIAN_METERS : [];
  const meter = p => { const seq = [...p].map(c => c === '=' ? 'l' : 's'); return { id: 'F', seq, cae: -1, kind: 'regular', cheatFinal: true, cheatCae: false, vars: [{ seq, extra: 0 }, { seq: seq.concat(['c']), extra: 0 }] }; };
  _faOnlyMeters = list.filter(m => !m.urdu.length && m.verses >= 300).map(m => {
    const pats = [m.pattern].concat(/^--==/.test(m.pattern) ? ['=' + m.pattern.slice(1)] : []);   // a makhbūn line may open with fāʿilātun
    return { m, meters: pats.map(meter) };
  });
  return _faOnlyMeters;
}
function faOnlyFit(line) {
  let best = null;
  try {
    const words = Scan.tokenize(line), units = Scan.buildUnits(words);
    faOnlyMeters().forEach(({ m, meters }) => meters.forEach(mt => {
      const r = Scan.matchMeter(units, words.length, mt);
      if (r && (!best || r.c < best.c)) best = { m, c: r.c };
    }));
  } catch (e) { return null; }
  return best;
}
function faOnlyNoteHTML(lines, results) {
  const rows = [];
  lines.forEach((l, i) => {
    const top = results[i].fits[0];
    if (top && top.c <= 2) return;
    const f = faOnlyFit(l);
    if (!f || f.c > 3 || (top && top.c <= f.c)) return;
    const url = 'https://ganjoor.net/simi/?v=' + encodeURIComponent(f.m.rhythm);
    rows.push(`<li>Line ${i + 1}: <span lang="fa" class="urdu fam-inline">${escapeHtml(f.m.rhythm.split('(')[0].trim())}</span>${f.m.name ? ` (<span lang="fa">${escapeHtml(f.m.name)}</span>)` : ''} · cost ${f.c.toFixed(1)} · <a class="fran-link" href="${url}" target="_blank" rel="noopener">${f.m.verses.toLocaleString('en-US')} verses on Ganjoor<span class="ext" aria-hidden="true">↗</span></a></li>`);
  });
  return rows.length ? `<div class="scan-fa-note"><div class="tiny muted">A Persian meter Urdu does not use fits better:</div><ul>${rows.join('')}</ul></div>` : '';
}

function runScan(){
  const rawLines=$('scanIn').value.split('\n').map(s=>s.trim()).filter(Boolean);
  const sameGhazal = !!scanGhazalRef && typeof ghazalScanText==='function' && ghazalScanText(scanGhazalRef)===rawLines.join('\n');
  if(!sameGhazal) scanGhazalRef='';
  if(typeof setHashQuiet==='function' && typeof location!=='undefined' && /^#\/scan/.test(location.hash||'')) setHashQuiet(rawLines.length ? (sameGhazal ? '/scan?g=' + scanGhazalRef : '/scan?t=' + encodeURIComponent(rawLines.join('\n'))) : '/scan');
  scanChrome(rawLines);
  if(!rawLines.length){
    $('scanOut').innerHTML='';
    if($('studioResults')) $('studioResults').innerHTML='';
    return;
  }

  const lines = [];
  const lineObjs = [];
  const lang = scanLang === 'auto' ? (typeof detectScanLang === 'function' ? detectScanLang(rawLines.join(' ')) : 'ur') : scanLang;
  renderScanLangButtons(lang);
  rawLines.forEach(rawL => {
    let lineObj = lineScripts(rawL);
    const urduL = ((lineObj && lineObj.ur) || rawL).normalize('NFC');
    lines.push(lang === 'fa' && typeof faScanText === 'function' ? faScanText(urduL) : urduL);
    /* a Fārsī line typed in Persian script: Roman and Devanagari from the Persian word list, not the Urdu letter map */
    if (lang === 'fa' && lineObj && lineObj.isApprox && typeof faLineScripts === 'function') {
      const fa = faLineScripts(urduL);
      lineObj = Object.assign({}, lineObj, { ro: fa.ro, hi: fa.hi, isApprox: fa.known < fa.words });
    }
    lineObjs.push(lineObj);
  });
  const eng = (lang === 'fa' && typeof ScanFa !== 'undefined') ? ScanFa : Scan;   // Fārsī: the Persian engine (Persian readings and meters)
  const scanL = (l, o) => {
    if (lang !== 'fa') { const p = romanPins(l); if (p) o = Object.assign({}, p, o || {}); }   // a learner's edit of a word overrides its pin
    const r = eng.scanLine(l, o); if (lang === 'fa') { r.fits = r.fits.filter(f => f.meter.id !== 'H'); r.__fa = 1; } return r; };

  if($('studioInput') && $('studioInput').value !== $('scanIn').value) {
    $('studioInput').value = $('scanIn').value;
  }
  if(typeof runStudioScan === 'function') {
    runStudioScan();
  }

  /* The bahr is decided on the text as written; a learner's edits are then judged only
     against that original bahr, even when the edited line happens to fit another one. */
  const base=lines.map(l=>scanL(l));
  /* pasted Fārsī: a line that misses the meter the others share is read again with liaison and the iẓāfat grammar allows
     (faPastedRescue); the line is then scanned, and edited, as that text */
  const faHow = {};
  if (lang === 'fa' && eng !== Scan && typeof faPastedRescue === 'function') {
    const inP = new Set(SCAN_PAIRS.flat());
    const gs = eng.METERS.map(m => m.id).filter(id => !inP.has(id) && id !== 'H').map(id => [id]).concat(SCAN_PAIRS);
    faPastedRescue(eng, lines, base, gs).forEach(x => { lines[x.i] = x.text; base[x.i] = x.r; faHow[x.i] = x.r.izGuess ? 'iz' : 'join'; });
  }
  const results=lines.map((l,i)=>hasEdits(i)?scanL(l,ovr[i]):base[i]);
  lastScan={lines,rawLines,lineObjs,results,base,lang,faHow};
  let h='';
  /* stacking / multi-line harmony */
  let common=null;
  if(lines.length>1){
    const PAIRS=SCAN_PAIRS;
    const inPair=new Set(PAIRS.flat());
    const groups=SE().METERS.map(m=>m.id).filter(id=>!inPair.has(id)).map(id=>[id]).concat(PAIRS).concat(lang==='fa'?[]:[['H']]);
    const tot=groups.map(g=>{let c=0,fits=[]; for(const r of base){const f=r.fits.filter(x=>g.includes(x.meter.id)).sort((a,b)=>a.c-b.c)[0]; if(!f){return null;} c+=f.c; fits.push(f);} return {id:g[0],group:g,c,fits};}).filter(Boolean).sort((a,b)=>a.c-b.c);
    common=tot[0]||null;
    if(!common){
      let bestG=null; groups.forEach(g=>{ let n=0,c=0; const miss=[]; base.forEach((r,li)=>{const f=r.fits.filter(x=>g.includes(x.meter.id)).sort((a,b)=>a.c-b.c)[0]; if(f){n++;c+=f.c;} else miss.push(li+1);});
        if(n>=2 && (!bestG||n>bestG.n||(n===bestG.n&&c<bestG.c))) bestG={g,n,c,miss}; });
      lastScan.near=bestG; }
    lastScan.forced = common && common.c/lines.length<=5 ? common.fits : null;
  }
  const okFit = f => f && f.c <= 5.0 ? f : null;
  lastScan.anchor = lines.map((l,li)=>(lastScan.forced && lastScan.forced[li]) || okFit(base[li].fits[0]) || null);
  lastScan.disp = lastScan.anchor.map((a,li)=>anchoredFit(li,a));
  if(lines.length>1){
    if(lastScan.forced){
      const _fcd=lastScan.disp, _f0=lastScan.anchor[0], _m=_f0.meter, _per=common.c/lines.length, [_vc,_vt]=verdictOf(_per), _fam=famOfMeter[_m.id];
      const _isPair = !!(common && common.group && common.group.length > 1);
      const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
      const isRtl = (cs === 'ur');
      const famDisp = _fam ? famLabel(_fam) : null;
      const famTxt = famDisp ? ((typeof getLineDisplay === 'function') ? getLineDisplay(famDisp, cs) : famDisp.ur) : '';
      const _famIsWhatWasScanned = famDisp && lineObjs.some(lo => { const u = typeof lo==='string'?lo:(lo&&lo.ur)||''; return u && normVerseKey(u)===normVerseKey(famDisp.ur||''); });
      h+='<div class="card">';
      /* summary: verdict · meter number / name / pattern / reference verse · more link */
      { const _tech = meterTechName(_m);
        const _pm = (typeof persianMeterMeta === 'function') ? persianMeterMeta(_m.id) : null;
        const _num = _m.id==='H' ? '' : _pm ? _pm.label : (_m.kind==='rubai' ? ('Rubāʿī ' + (''+_m.id).replace(/^R/i,'')) : (_isPair ? ('Meter #' + common.group.join(' / #')) : ('Meter #' + _m.id)));
        /* The summary leads with what a reader knows (the famous verse in this bahr) and the rhythm itself; the
           technical name, its number and the paired-bahr note follow in two quiet lines. */
        h+=`<div class="scan-summary">`;
        h+=`<div class="ss-top"><span class="pill ${_vc}">${_vt}</span>${_fam && !_famIsWhatWasScanned ? `<span class="ss-lbl">the same bahr as</span>` : ''}</div>`;
        if(_fam){
          if(_famIsWhatWasScanned) h+=`<div class="ss-ref"><span class="ss-lbl">This couplet is the reference example for this bahr</span></div>`;
          else h+=`<div class="ss-ref"><span class="${isRtl?'urdu':'ro'} ss-verse">${famTxt}</span><span class="ss-cite">${cs==='ro'?famDisp.ref:famDisp.ro+' — '+famDisp.ref}</span></div>`;
        }
        let _patStr = _m.raw ? patGlyphs(_m.raw) : '', _pairNote = '';
        if(_isPair && common.group && common.group.length === 2){
          const _g = common.group;
          const _m1 = SE().METERS.find(x => x.id === _g[0]);
          const _m2 = SE().METERS.find(x => x.id === _g[1]);
          const _r1 = _m1 ? (_m1.raw || _m1.pattern) : '';
          const _r2 = _m2 ? (_m2.raw || _m2.pattern) : '';
          if(_r1 && _r2){
            const _f1 = _r1.split('/').map(s => s.trim());
            const _f2 = _r2.split('/').map(s => s.trim());
            if(_f1.length === _f2.length && _f1.slice(0, -1).join('/') === _f2.slice(0, -1).join('/')){
              const _alt1 = patGlyphs(_f1[_f1.length - 1]), _alt2 = patGlyphs(_f2[_f2.length - 1]);
              _patStr = `${patGlyphs(_f1.slice(0, -1).join(' / '))} <span class="pg sep">/</span> <span class="pat-alt-cadence">[ ${_alt1} <span class="pg sep">|</span> ${_alt2} ]</span>`;
              _pairNote = 'the last foot may end either way';
            }
          }
        }
        if(_patStr) h+=`<div class="ss-pat" title="= long · – short · x long or short · / between feet">${_patStr}</div>`;
        if(_pairNote) h+=`<div class="ss-pair-note">${_pairNote}</div>`;
        { const _rawTech = (typeof METERS_DATA !== 'undefined' && METERS_DATA.standard) ? ((METERS_DATA.standard.find(x => x.id === _m.id) || {}).name || '') : (METER_TECH_NAMES[_m.id] || '');
          const _ur = aruzName(_rawTech).ur;
          const _pairTip = _isPair ? `Classic paired meters (#${common.group.join(' & #')}): in classical Urdu prosody these endings alternate freely within one poem without breaking the meter (Handbook §6.1).` : '';
          /* two quiet lines: the name, in the script being read (Urdu in اردو, else Roman); then number · paired · more */
          const name = (cs === 'ur' && _ur) ? `<span class="ss-name-ur" lang="ur" dir="rtl">${_ur}</span>` : `<span class="ss-name">${_tech || meterLabel(_m,{tech:false})}</span>`;
          const meta = [];
          if(_num) meta.push(`<span class="ss-num">${_num}</span>`);
          if(_isPair) meta.push(`<span class="tip-note" tabindex="0" data-tip="${_pairTip}">paired bahr</span>`);
          if(_fam) meta.push(`<button class="btn link sm ss-more" onclick="go('bahr');document.getElementById('fam-${_fam.id}').scrollIntoView()">More in this bahr →</button>`);
          h+=`<div class="ss-meta"><div class="ss-meta-name">${name}</div>${meta.length ? `<div class="ss-meta-row">${meta.join('<span class="ss-dot" aria-hidden="true">·</span>')}</div>` : ''}</div>`; }
        h+=`</div>`; }
      /* answer key if exercise */
      if(curEx){ const _hit=lastScan.forced.every(f=>exMeters(curEx).includes(f.meter.id)); h+=`<p class="tiny muted mt-loose">Pritchett's answer key (ch. 11): <b class="t">${exMeters(curEx).map(x=>x==='H'?'Hindi meter':'#'+x).join(' / ')}</b> — ${_hit?'<span class="ok-text">the scanner agrees ✓</span>':'<span class="no-text">the scanner disagrees ✗</span>'}</p>`; }
      h+=legendHTML('legend-sticky');
      h+=`<div id="scanMap" class="rmap-host"></div>`;
      /* lines grouped into couplets (shers) of 2, each its own bordered card */
      for(let _i=0;_i<results.length;_i+=2){
        const _li2 = (_i+1<results.length) ? _i+1 : null;
        h+=coupletCard(_i,_li2,results[_i],_fcd[_i],lineObjs[_i],_li2!=null?results[_li2]:null,_li2!=null?_fcd[_li2]:null,_li2!=null?lineObjs[_li2]:null,`Couplet ${(_i/2)+1}`,{isPair:_isPair,group:common&&common.group});
      }
      h+='</div>';
    } else {
      h+=legendHTML('legend-sticky');
      h+=`<div id="scanMap" class="rmap-host"></div>`;
      for(let _i=0;_i<results.length;_i+=2){
        const _li2 = (_i+1<results.length) ? _i+1 : null;
        const _f1 = lastScan.disp[_i];
        const _f2 = _li2!=null ? lastScan.disp[_li2] : null;
        h+=coupletCard(_i,_li2,results[_i],_f1,lineObjs[_i],_li2!=null?results[_li2]:null,_f2,_li2!=null?lineObjs[_li2]:null,`Couplet ${(_i/2)+1}`,{isPair:false});
      }
    }
  } else {
    h+=legendHTML('legend-sticky');
    results.forEach((r,li)=>{ h+=lineHTML(r,li,lastScan.disp[li],lineObjs[0]); });
  }
  if (lang === 'fa' && typeof ScanFa === 'undefined') h += faOnlyNoteHTML(lines, results);
  $('scanOut').innerHTML=h;
  scanRolls = {};
  renderScanMap(); renderScanRail();
}
/* what surrounds the results: the empty-state cards show only until there is text, the Transliterator hand-off follows the text,
   the input grows with it, and the map and rail go with the results */
function scanChrome(rawLines){
  const es=$('scanEmptyState'); if(es && es.classList) es.classList.toggle('hidden', rawLines.length>0);
  const tr=$('scanToTr'); if(tr){ if(tr.classList) tr.classList.toggle('hidden', !rawLines.length); if(rawLines.length) tr.href=scanTranscribeHref(rawLines.join('\n')); }
  viGrow($('scanIn'));
  if(!rawLines.length){ scanMapSel=null; const m=$('scanMap'); if(m) m.innerHTML=''; const r=$('scanRail'); if(r){ r.innerHTML=''; if(r.classList) r.classList.remove('has-items'); } renderScanLangButtons(); }
}
/* ---- the rhythm map: one row per misra, every syllable a mark, rows aligned by foot ----
   Built from what the chips are built from (lineExplain: syl + feet), never from a second scan. A mark is drawn in the
   legend's own signs: { w:'l'|'s' } a solid or dotted underline, { flex } the rose diamond (the meter settled it), { bad } a
   syllable the bahr has no room for or weighs otherwise (red), { gap } a slot the line leaves empty, { tick } the dashed tile
   of a counted-out final consonant. The map is a view of its own (Couplets | Rhythm map), and Play the ghazal lights it. */
let scanMapSel = null;
function rhythmMark(s){
  if(s.missing) return { w: s.expected==='s' ? 's' : 'l', gap: true };
  if(s.extra || s.clash) return { w: s.resolved==='l' ? 'l' : 's', bad: true };
  if(s.resolved==='c' || s.fsyl==='+') return { tick: true };
  return { w: s.resolved==='l' ? 'l' : 's', flex: s.native==='x' };
}
/* explains: [{syl, feet}] per misra (SE().explain or diagnose); fits: [bool] per misra.
   -> { cols: [{ name, n }] (a foot: its Urdu name, the most marks any row gives it), rows: [{ li, ok, feet: [[mark]] }] } */
function rhythmMapData(explains, fits){
  const nF = Math.max(0, ...explains.map(e => (e && e.feet) ? e.feet.length : 0));
  const cols = [];
  for(let fi=0; fi<nF; fi++){
    let n = 0, name = '';
    explains.forEach(e => { const F = e && e.feet && e.feet[fi]; if(!F) return; n = Math.max(n, F.idx.length); if(!name && F.ur) name = F.ur; });
    cols.push({ name, n });
  }
  const rows = explains.map((e, li) => ({ li, ok: !!(fits && fits[li]),
    feet: cols.map((_, fi) => { const F = e && e.feet && e.feet[fi]; return F ? F.idx.map(i => rhythmMark(e.syl[i])) : []; }),
    idx: cols.map((_, fi) => { const F = e && e.feet && e.feet[fi]; return F ? F.idx.slice() : []; }) }));
  return { cols, rows };
}
function scanMapInfo(){
  if(!lastScan || !lastScan.results || lastScan.results.length < 3) return null;
  const explains = lastScan.results.map((r, li) => { try { return lineExplain(li); } catch(e) { return { syl: [], feet: [] }; } });
  return rhythmMapData(explains, lastScan.results.map((r, li) => !!(lastScan.disp && lastScan.disp[li])));
}
function rmMarkHTML(m, i){
  const di = i != null ? ` data-i="${i}"` : '';
  if(m.tick) return `<i class="rm tick"${di}></i>`;
  return `<i class="rm ${m.w}${m.flex?' x':''}${m.bad?' bad':''}${m.gap?' gap':''}"${di}></i>`;
}
function renderScanMap(){
  const host = $('scanMap'); if(!host) return;
  const d = scanMapInfo();
  scanViewClass(!!d);
  if(!d){ host.innerHTML = ''; scanMapSel = null; return; }
  const fit = d.rows.filter(r => r.ok).length, n = d.rows.length, onMap = scanView() === 'map';
  let bar = `<div class="tk-box scan-viewwrap"><div class="scan-viewbar"><span class="small ${fit === n ? 'ok-text' : 'no-text'}">${fit === n ? `All ${n} misras fit` : `${fit} of ${n} misras fit one bahr`}</span>`;
  bar += `<button type="button" class="scan-playall" onclick="scanPlayAll(null, this.querySelector('.play'))"><span class="play sm" data-pb="scan:all" data-label="Play the ghazal" aria-hidden="true">▶︎</span><span class="lbl-play">Play the ghazal</span><span class="lbl-stop">Stop</span></button>`;
  bar += `<div class="tr-script-switch" role="group" aria-label="Show the scan as">` + [['cp', 'Couplets'], ['map', 'Rhythm map']].map(v =>
    `<button type="button" class="tr-script-btn${scanView() === v[0] ? ' on' : ''}" aria-pressed="${scanView() === v[0]}" onclick="scanSetView('${v[0]}')">${v[1]}</button>`).join('') + `</div></div>`;
  if(!onMap){ host.innerHTML = bar + `</div>`; return; }
  if(scanMapSel != null && scanMapSel >= d.rows.length) scanMapSel = null;
  const firstMiss = d.rows.find(r => !r.ok), shown = scanMapSel != null ? scanMapSel : (firstMiss ? firstMiss.li : null);
  const foot = (n, inner) => `<span class="rmap-foot rm-w${Math.min(6, Math.max(1, n))}">${inner}</span>`;
  let h = `<div class="rmap${d.cols.length >= 6 ? ' rmap-wide' : ''}" role="group" aria-label="Rhythm map of the whole ghazal">`;
  h += `<div class="rmap-detail" id="scanMapDetail" aria-live="polite">${scanMapDetailHTML(shown)}</div>`;
  h += `<div class="rmap-main"><div class="rmap-grid" dir="rtl">`;
  h += `<div class="rmap-row rmap-head" aria-hidden="true"><span class="rmap-num"></span>${d.cols.map(c => foot(c.n, c.name ? `<span class="urdu" lang="ur">${escapeHtml(c.name)}</span>` : '')).join('')}</div>`;
  d.rows.forEach(r => {
    const c = Math.floor(r.li / 2) + 1, m = r.li % 2 + 1;
    h += `<button type="button" class="rmap-row${r.ok ? '' : ' no'}${r.li%2===1 || r.li===d.rows.length-1 ? ' pair-end' : ''}${shown===r.li ? ' sel' : ''}" data-li="${r.li}" aria-label="Couplet ${c}, misra ${m}: ${r.ok ? 'fits the bahr' : 'does not fit'}" onmouseenter="scanMapShow(${r.li})" onfocus="scanMapShow(${r.li})" onclick="scanMapPick(${r.li})">`;
    h += `<span class="rmap-num">${r.li + 1}</span>` + r.feet.map((f, fi) => foot(d.cols[fi].n, f.map((m, k) => rmMarkHTML(m, r.idx[fi][k])).join(''))).join('') + `</button>`;
  });
  h += `</div></div></div>`;
  host.innerHTML = bar + h + `</div>`;
}
function scanMapDetailHTML(li){
  if(li == null || !lastScan || !lastScan.results[li]) return `<div class="eyebrow">Every misra</div><p class="tiny muted">Each row is a misra: hover or tap one to read it here.</p>`;
  const o = lastScan.lineObjs[li] || {}, ok = !!(lastScan.disp && lastScan.disp[li]), c = Math.floor(li / 2) + 1, m = li % 2 + 1;
  let why = '';
  if(!ok){ try { const w = unfitWhy(lineExplain(li), 'ur'); why = w.title ? ` ${w.title}.` : ''; } catch(e) {} }
  return `<div class="eyebrow">Couplet ${c}, misra ${m}</div>` +
    (o.ur ? `<div class="rmap-ur urdu" lang="ur" dir="rtl">${escapeHtml(o.ur)}</div>` : '') +
    (o.ro ? `<div class="rmap-ro" lang="und-Latn" dir="ltr">${escapeHtml(o.ro)}</div>` : '') +
    `<p class="small ${ok ? 'ok-text' : 'no-text'}">${ok ? '✓ fits the bahr' : '✗ does not fit.' + why}</p>` +
    `<button type="button" class="btn link sm" onclick="scanJump(${c})">Go to couplet ${c} ↓</button>`;
}
function scanMapShow(li){
  scanMapSel = li;
  const d = $('scanMapDetail'); if(d) d.innerHTML = scanMapDetailHTML(li);
  if(typeof document !== 'undefined' && document.querySelectorAll) document.querySelectorAll('#scanMap .rmap-row').forEach(b => b.classList.toggle('sel', +b.getAttribute('data-li') === li));
}
/* a click jumps to the couplet; on a touch screen (no hover) the first tap only shows the misra, the next one jumps */
function scanMapPick(li){
  let touch = false; try { touch = typeof matchMedia === 'function' && matchMedia('(hover: none)').matches; } catch(e) {}
  if(touch && scanMapSel !== li){ scanMapShow(li); return; }
  scanJump(Math.floor(li / 2) + 1);
}
function scanJump(n){
  if(scanView() === 'map'){ scanSetView('cp'); }
  viScrollTo($('scan-cp-' + n));
}
/* Couplets (the cards) or the Rhythm map (the whole ghazal at a glance): one at a time, the choice remembered */
let scanViewMode = null;   /* kept in memory too: storage may be off (a private window) */
function scanView(){
  if(scanViewMode == null){ try { scanViewMode = (typeof store !== 'undefined' && store.get && store.get('scanView', 'cp') === 'map') ? 'map' : 'cp'; } catch(e) { scanViewMode = 'cp'; } }
  return scanViewMode;
}
function scanViewClass(has){ const s = $('scan-section'); if(s && s.classList) s.classList.toggle('scan-mapview', !!has && scanView() === 'map'); }
function scanSetView(v){
  if(typeof PB !== 'undefined' && PB.playing && PB.key === 'scan:all' && typeof pbCancel === 'function') pbCancel();   /* the lit marks belong to the view that is going */
  scanViewMode = v === 'map' ? 'map' : 'cp'; try { if(typeof store !== 'undefined' && store.set) store.set('scanView', scanViewMode); } catch(e) {} renderScanMap(); }
/* ---- the outline rail (wide screens, three couplets or more) ---- */
function scanRailItems(){
  if(!lastScan || !lastScan.results) return [];
  const R = lastScan.results, out = [];
  for(let li=0; li<R.length; li+=2){
    const o = lastScan.lineObjs[li] || {}, ok = !!(lastScan.disp && lastScan.disp[li]) && (li+1>=R.length || !!lastScan.disp[li+1]);
    out.push({ n: li/2 + 1, ur: o.ur || R[li].words.map(w => w.raw).join(' '), ok });
  }
  return out;
}
function renderScanRail(){
  const host = $('scanRail'); if(!host) return;
  const items = scanRailItems(), on = items.length >= 3;
  if(host.classList) host.classList.toggle('has-items', on);
  host.innerHTML = on ? `<div class="outline-rail-label">Couplets</div>` + items.map(it =>
    `<button type="button" class="rail-item${it.ok ? '' : ' no'}" onclick="scanJump(${it.n})" aria-label="Couplet ${it.n}, ${it.ok ? 'fits' : 'does not fit'}"><span class="rail-n">${it.n}</span><span class="rail-t urdu" lang="ur" dir="rtl">${escapeHtml(it.ur)}</span><span class="rail-mark" aria-hidden="true">${it.ok ? '✓' : '✗'}</span></button>`).join('') : '';
}
function stackHTML(lines,results,common,tot){
  if(!common) {
    const nb=lastScan.near; let msg='';
    if(nb){ const f=famOfMeter[nb.g[0]]; const name=f?`<span class="${currentScript==='ur'?'urdu':'mono'} fam-inline">${(typeof getLineDisplay==='function'?getLineDisplay(famLabel(f),currentScript):famLabel(f).ur)}</span>`:(nb.g[0]==='H'?'Mir\'s Hindi meter':'#'+nb.g.join('/'));
      msg=`<p class="small">${nb.n} of ${lines.length} lines fit ${name}. Look closely at line${nb.miss.length>1?'s':''} <b class="t">${nb.miss.join(', ')}</b> — a reading, an unwritten iẓāfat, a missing tashdīd, or the text itself.</p>`; }
    let key=''; if(curEx) key=`<p class="tiny muted">Pritchett's answer key: <b class="t">${exMeters(curEx).map(x=>x==='H'?'Hindi meter':'#'+x).join(' / ')}</b></p>`;
    return `<div class="card"><div class="verdict no-fit">No single bahr fits every line</div>${msg}${key}</div>`;
  }
  const members=[...new Set(common.fits.map(f=>f.meter))].sort((a,b)=>b.seq?(b.seq.length-(a.seq?a.seq.length:0)):0);
  const m=members[0], per=common.c/lines.length, [vc,vt]=verdictOf(per), fam=famOfMeter[m.id];
  const exps=common.fits.map((f,li)=>SE().explain(results[li],f)), rows=exps.map(e=>e.syl);
  const cell=(s,k,r)=>`<td class="${s.resolved} ${s.native==='x'?'flex':''} ${r&&r[k+1]&&r[k+1].foot!==s.foot?'fend':''}">${s.text}</td>`;
  let head='', body='';
  if(m.id!=='H'){
    const uni=m.seq.slice(); if(m.cheatCae) uni.splice(m.cae,0,'c'); if(m.cheatFinal) uni.push('c');
    head=`<tr><td class="num"></td>${uni.map(t=>`<td class="hd ${t==='c'?'':t}">${t==='l'?'=':t==='s'?'–':t==='x'?'x':'+'}</td>`).join('')}</tr>`;
    /* where a paired meter has one long for two shorts, that cell spans two columns */
    const other=members[1]; let split=-1;
    if(other){ for(let k=0;k<m.seq.length;k++){ if(m.seq[k]!==other.seq[k]){ split=k; break; } } if(split>=0 && m.cheatCae && m.cae<=split) split++; }
    body=rows.map((r,li)=>{ const seq=common.fits[li].seq, short=common.fits[li].meter!==m; let j=0, tds='';
      for(let u=0;u<uni.length;u++){ const t=uni[u];
        if(t==='c' && seq[j]!=='c'){ tds+='<td class="cell-empty"></td>'; continue; }
        if(short && u===split){ tds+= r[j]?cell(r[j],j,r).replace('<td ','<td colspan="2" '):'<td colspan="2"></td>'; j++; u++; continue; }
        tds+= r[j]?cell(r[j],j,r):'<td></td>'; j++; }
      return `<tr><td class="num">${li+1}</td>${tds}</tr>`; }).join('');
    /* feet header from the fullest member */
    const fs=SE().patternFeet(m.raw); let fh='<tr><td class="num"></td>';
    fs.forEach((f,fi)=>{ let span=f.toks.length; if(m.cheatCae && fs[fi+1] && fs[fi+1].caeBefore) span++; if(fi===fs.length-1 && m.cheatFinal) span++;
      fh+=`<td class="fh" colspan="${span}">${f.ur}<br><i>${f.ro.join('·')}</i></td>`; });
    head=fh+'</tr>'+head;
  } else body=rows.map((r,li)=>`<tr><td class="num">${li+1}</td>${r.map((x,k)=>cell(x,k,r)).join('')}</tr>`).join('');
  const alt=tot.filter(x=>x!==common).slice(0,2).filter(x=>x.c-common.c<1.5).map(x=>famOfMeter[x.id]?`<span class="${currentScript==='ur'?'urdu':'mono'} fam-inline sm">${(typeof getLineDisplay==='function'?getLineDisplay(famLabel(famOfMeter[x.id]),currentScript):famLabel(famOfMeter[x.id]).ur)}</span>`:(x.id==='H'?'Hindi meter':'#'+x.id));
  let key='';
  if(curEx){ const hit=common.fits.every(f=>exMeters(curEx).includes(f.meter.id));
    key=`<div class="card key-card"><span class="tiny muted">Pritchett's answer key (ch. 11):</span> <b class="t">${exMeters(curEx).map(x=>x==='H'?'Hindi meter':'#'+x).join(' / ')}</b> — ${hit?'<span class="ok-text">the scanner agrees ✓</span>':'<span class="no-text">the scanner disagrees ✗</span>'}</div>`; }
  return `<div class="card">${key}<div class="row tight-top"><span class="pill ${vc}">${vt}</span><span class="tiny muted">all ${lines.length} lines stacked</span></div>
    ${m.id!=='H'&&!fam?'':''}${fam?`<div class="small muted">Same bahr as</div><div class="fam-name">${famLabel(fam).ur}</div><div class="ro">${famLabel(fam).ro} — ${famLabel(fam).ref}</div>`:`<div class="verdict">${meterLabel(m)}</div>`}
    <div class="grid"><table>${head}${body}</table></div>
    <p class="tiny muted">Columns are metrical positions (right → left, like the text). Pink cells are flexible syllables the meter resolved; dashed cells are unscanned cheat syllables.</p>
    ${alt.length?`<p class="tiny muted">Close runner-up: ${alt.join(' · ')}</p>`:''}
    ${fam?`<div class="row"><button class="btn sm" onclick="go('bahr');document.getElementById('fam-${fam.id}').scrollIntoView()">More ghazals in this bahr ›</button></div>`:''}</div>`;
}
function stackInner(lines,results,common,tot){
  const members=[...new Set(common.fits.map(f=>f.meter))].sort((a,b)=>b.seq?(b.seq.length-(a.seq?a.seq.length:0)):0);
  const m=members[0], per=common.c/lines.length, [vc,vt]=verdictOf(per), fam=famOfMeter[m.id];
  const exps=common.fits.map((f,li)=>SE().explain(results[li],f)), rows=exps.map(e=>e.syl);
  const cell=(s,k,r)=>`<td class="${s.resolved} ${s.native==='x'?'flex':''} ${r&&r[k+1]&&r[k+1].foot!==s.foot?'fend':''}">${s.text}</td>`;
  let head='', body='';
  if(m.id!=='H'){
    const uni=m.seq.slice(); if(m.cheatCae) uni.splice(m.cae,0,'c'); if(m.cheatFinal) uni.push('c');
    head=`<tr><td class="num"></td>${uni.map(t=>`<td class="hd ${t==='c'?'':t}">${t==='l'?'=':t==='s'?'–':t==='x'?'x':'+'}</td>`).join('')}</tr>`;
    const other=members[1]; let split=-1;
    if(other){ for(let k=0;k<m.seq.length;k++){ if(m.seq[k]!==other.seq[k]){ split=k; break; } } if(split>=0 && m.cheatCae && m.cae<=split) split++; }
    body=rows.map((r,li)=>{ const seq=common.fits[li].seq, short=common.fits[li].meter!==m; let j=0, tds='';
      for(let u=0;u<uni.length;u++){ const t=uni[u];
        if(t==='c' && seq[j]!=='c'){ tds+='<td class="cell-empty"></td>'; continue; }
        if(short && u===split){ tds+= r[j]?cell(r[j],j,r).replace('<td ','<td colspan="2" '):'<td colspan="2"></td>'; j++; u++; continue; }
        tds+= r[j]?cell(r[j],j,r):'<td></td>'; j++; }
      return `<tr><td class="num">${li+1}</td>${tds}</tr>`; }).join('');
    const fs=SE().patternFeet(m.raw); let fh='<tr><td class="num"></td>';
    fs.forEach((f,fi)=>{ let span=f.toks.length; if(m.cheatCae && fs[fi+1] && fs[fi+1].caeBefore) span++; if(fi===fs.length-1 && m.cheatFinal) span++;
      fh+=`<td class="fh" colspan="${span}">${f.ur}<br><i>${f.ro.join('·')}</i></td>`; });
    head=fh+'</tr>'+head;
  } else body=rows.map((r,li)=>`<tr><td class="num">${li+1}</td>${r.map((x,k)=>cell(x,k,r)).join('')}</tr>`).join('');
  const alt=tot.filter(x=>x!==common).slice(0,2).filter(x=>x.c-common.c<1.5).map(x=>famOfMeter[x.id]?`<span class="${currentScript==='ur'?'urdu':'mono'} fam-inline sm">${(typeof getLineDisplay==='function'?getLineDisplay(famLabel(famOfMeter[x.id]),currentScript):famLabel(famOfMeter[x.id]).ur)}</span>`:(x.id==='H'?'Hindi meter':'#'+x.id));
  let key='';
  if(curEx){ const hit=common.fits.every(f=>exMeters(curEx).includes(f.meter.id));
    key=`<div class="card key-card"><span class="tiny muted">Pritchett's answer key (ch. 11):</span> <b class="t">${exMeters(curEx).map(x=>x==='H'?'Hindi meter':'#'+x).join(' / ')}</b> — ${hit?'<span class="ok-text">the scanner agrees ✓</span>':'<span class="no-text">the scanner disagrees ✗</span>'}</div>`; }
  return `${key}<div class="row tight-top"><span class="pill ${vc}">${vt}</span><span class="tiny muted">all ${lines.length} lines stacked</span></div>
    ${m.id!=='H'&&!fam?'':''}${fam?`<div class="small muted">Same bahr as</div><div class="fam-name">${famLabel(fam).ur}</div><div class="ro">${famLabel(fam).ro} — ${famLabel(fam).ref}</div>`:`<div class="verdict">${meterLabel(m)}</div>`}
    <div class="grid"><table>${head}${body}</table></div>
    <p class="tiny muted">Columns are metrical positions (right → left, like the text). Pink cells are flexible syllables the meter resolved; dashed cells are unscanned cheat syllables.</p>
    ${alt.length?`<p class="tiny muted">Close runner-up: ${alt.join(' · ')}</p>`:''}
    ${fam?`<div class="row"><button class="btn sm" onclick="go('bahr');document.getElementById('fam-${fam.id}').scrollIntoView()">More ghazals in this bahr ›</button></div>`:''}`;
}
function lineHTML(r,li,forced,lineObj){
  const f=forced!==undefined ? forced : (r.fits && r.fits[0] && r.fits[0].c <= 5.0 ? r.fits[0] : null);   /* null: doesn't scan in its bahr */
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');
  const lObj = lineObj || (lastScan && lastScan.lineObjs && lastScan.lineObjs[li]) || (lastScan && lastScan.lines && lastScan.lines[li]);
  const dispL = (typeof getLineDisplay === 'function') ? getLineDisplay(lObj, cs) : (typeof lObj === 'string' ? lObj : (lObj ? lObj.ur : ''));
  const canPlay = !!(f || (r && r.words && r.words.length));

  let h=`<div class="card"><div class="row card-head"><span class="tiny muted">Misra ${li+1}</span>${canPlay?`<span class="play sm" title="Hear this misra" aria-label="Hear this misra" data-label="Hear this misra" data-pb="line:${li}" onclick="playScan(${li},null,this)">▶︎</span>`:''}</div>`;
  if(dispL) h+=`<div class="misra-text ${isRtl ? '' : (cs==='hi'?'deva':'ltr')}">${dispL}</div>`;
  if(!f){
    const e = explainUnscanned(r, li, benchmarkFit(li));
    h+=editCompareHTML(li, isRtl);
    h+=`<div class="chips bad-misra ${isRtl?'':'ltr'}" id="sc${li}">${chipsHTML(e.syl,e.feet,li)}</div>`;
    if(selWord&&selWord[0]===li) h+=wordPanel(r,li,selWord[1]);
    h+=renderUnscannedDiagnostic(e, cs, isRtl, li);
    h+='</div>';
    return h;
  }
  const e=SE().explain(r,f), [vc,vt]=verdictOf(f.c), fam=famOfMeter[f.meter.id];
  const famDisp = fam ? famLabel(fam) : null;
  const famTxt = famDisp ? ((typeof getLineDisplay === 'function') ? getLineDisplay(famDisp, cs) : famDisp.ur) : '';
  const _lineUr = typeof lObj==='string' ? lObj : (lObj && lObj.ur) || '';
  const _famIsThisLine = famDisp && (typeof normVerseKey==='function') && normVerseKey(_lineUr)===normVerseKey(famDisp.ur||'');
  h+=`<div class="row"><span class="pill ${vc}">${vt}</span>${fam?(_famIsThisLine?`<span class="small muted">This is the reference example for this bahr</span>`:`<span class="small muted">Same bahr as</span><span class="${isRtl?'urdu':''} fam-inline">${famTxt}</span>`):`<span class="small muted">${meterLabel(f.meter)}</span>`}</div>`;
  h+=editCompareHTML(li, isRtl);
  h+=`<div class="chips ${isRtl?'':'ltr'}" id="sc${li}">${chipsHTML(e.syl,e.feet,li)}</div>`;
  if(hasEdits(li)) h+=`<p class="tiny muted mt-note">Your edit still scans in the original bahr: the flexibility rules absorb it.</p>`;
  if(selWord&&selWord[0]===li) h+=wordPanel(r,li,selWord[1]);
  if(f.meter.id==='H' && lastScan.lines.length===1) h+=`<p class="tiny X mt-2">Mir's Hindi meter is loose enough that even some ordinary sentences fit it. One line proves little — add the rest of the ghazal.</p>`;
  const _lineRo = typeof lObj==='object' ? (lObj && lObj.ro) : '';
  if(!hasEdits(li) && _lineUr && typeof prPracticable==='function' && prPracticable(_lineUr,f.meter.id)) h+=`<p class="tiny mt-note"><a class="practice-this" href="${prLinkFor(_lineUr,f.meter.id,_lineRo)}">Practice this line: tap its rhythm →</a></p>`;
  if(!hasEdits(li) && !lastScan.forced){ const alts=r.fits.slice(1,4).filter(x=>x.c-f.c<1.2); if(alts.length) h+=`<p class="tiny muted">Also fits: ${alts.map(x=>famOfMeter[x.meter.id]?`<span class="${isRtl?'urdu':''} fam-inline xs">${(typeof getLineDisplay==='function')?getLineDisplay(famLabel(famOfMeter[x.meter.id]),cs):famLabel(famOfMeter[x.meter.id]).ur}</span>`:meterLabel(x.meter)).join(' · ')} — add the other misra to decide.</p>`; }
  return h+'</div>';
}
function misraText(li,lineObj){
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');
  const lObj = lineObj || (lastScan && lastScan.lineObjs && lastScan.lineObjs[li]) || (lastScan && lastScan.lines && lastScan.lines[li]);
  const dispL = (typeof getLineDisplay === 'function') ? getLineDisplay(lObj, cs) : (typeof lObj === 'string' ? lObj : (lObj ? lObj.ur : ''));
  if(!dispL) return '';
  return `<div class="misra-text ${isRtl ? '' : (cs==='hi'?'deva':'ltr')}">${dispL}</div>`;
}
const SCAN_PAIRS=[[1,9],[14,15],[16,17],[18,19],[33,34]];
const sameBahr=(a,b)=>a===b || SCAN_PAIRS.some(p=>p.includes(a)&&p.includes(b));
/* does line li carry any learner edit? (an override object left at its defaults doesn't count) */
function hasEdits(li){
  const L=ovr[li]; if(!L) return false;
  return Object.values(L).some(o=>o && (o.opt!=null || o.suffix!==undefined || o.tashdid!==undefined || o.noGraft || (o.force && Object.keys(o.force).length)));
}
/* the fit shown for line li: the original bahr's fit, or — once edited — the edited line's
   fit in that same bahr, or null (doesn't scan in it any more) */
function anchoredFit(li,anchor){
  if(!anchor || !hasEdits(li)) return anchor;
  const r=lastScan.results[li];
  return (r.fits||[]).filter(f=>sameBahr(f.meter.id,anchor.meter.id)).sort((x,y)=>x.c-y.c)[0] || null;
}
/* the meter an unscanned misra is measured against: its own original bahr, else its
   partner misra's, else the bahr most of the other lines share */
function benchmarkSource(li){
  const R = lastScan && lastScan.results; if(!R) return null;
  if(lastScan.anchor && lastScan.anchor[li]) return {fit:lastScan.anchor[li], kind:'own'};
  const p = li%2===0 ? (li+1<R.length ? li+1 : null) : li-1;
  const pf = p!=null && lastScan.anchor && lastScan.anchor[p];
  if(pf) return {fit:pf, kind:'partner', li:p};
  const g = lastScan.near && lastScan.near.g, m = g && SE().METERS.find(x=>x.id===g[0]);
  return m ? {fit:{meter:m}, kind:'common'} : null;
}
function benchmarkFit(li){ const b = benchmarkSource(li); return b ? b.fit : null; }
/* syllables of line li as displayed (and played): the anchored fit's scansion, or the diagnosis */
function lineExplain(li){
  const r=lastScan.results[li], f=lastScan.disp ? lastScan.disp[li] : (r.fits&&r.fits[0]);
  return f ? SE().explain(r,f) : explainUnscanned(r,li,benchmarkFit(li));
}
/* the original (unedited) line's scansion, for the A/B comparison */
function originalExplain(li){
  const a=lastScan.anchor && lastScan.anchor[li];
  return a ? SE().explain(lastScan.base[li],a) : null;
}
/* a line that no longer scans: aligned against the target bahr so clashing, extra and
   missing syllables are pinpointed; without a target (or in Mir's Hindi meter, which is
   counted in beats, not slots) it is shown as typed */
function explainUnscanned(r, li, targetFit) {
  if (!r || !r.words) return { syl: [], feet: [], notes: [] };
  const m = targetFit && targetFit.meter;
  if (m && m.vars) {
    const d = SE().diagnose(r, m);
    if (d) return Object.assign(d, { targetFit, diff: d.extraCount - d.missingCount });
  }
  const out = [];
  r.words.forEach((w, wi) => {
    const u = r.units && r.units[wi] && r.units[wi][0];
    const opt = u && u.opts[0]; if (!opt) return;
    const texts = SE().alignTexts([w.raw], opt.syl);
    opt.syl.forEach((sy, k) => out.push({ text: texts[k] || '·', native: sy.w, resolved: sy.w === 'x' ? 'l' : sy.w, word: wi, wordTo: wi, last: k === opt.syl.length - 1, oi: opt._oi, k, forced: !!sy.forced }));
  });
  const feet = [];
  out.forEach((s, i) => { const fi = Math.floor(i / 4); s.foot = fi; s.fsyl = s.resolved === 'l' ? '=' : '–';
    if (!feet[fi]) feet[fi] = { idx: [], ro: [], ur: '', name: '', cae: false }; feet[fi].idx.push(i); });
  return { syl: out, feet, notes: [], diff: 0, targetFit: null, clashCount: 0, extraCount: 0, missingCount: 0 };
}
/* A misra's text in the script being read, as one inline run (the partner misra named in a diagnosis) */
function misraInline(li, cs, isRtl){
  const lObj = lastScan && lastScan.lineObjs && lastScan.lineObjs[li];
  const t = (typeof getLineDisplay === 'function') ? getLineDisplay(lObj, cs) : (lObj ? lObj.ur : '');
  return t ? `<span class="${isRtl ? 'urdu' : cs==='hi' ? 'deva' : 'mono'} fam-inline sm" ${isRtl?'lang="ur" dir="rtl"':''}>${escapeHtml(t)}</span>` : '';
}
/* The words for what is wrong with a misra, from the aligned diagnosis (SE().diagnose): for each foot that has a clashing,
   extra or missing syllable, what the foot wants and what the line gives. Only what the alignment already knows: no licence
   is proposed (the handbook rules a learner may apply live in the word panel, sylRule). Returns { title, items:[html], flagged:n }. */
const FOOT_ORD = ['first','second','third','fourth','fifth','sixth'];
const countOf = (n, w) => `${n===1?'one':n} ${w}${n>1?'s':''}`;
function unfitWhy(e, cs){
  const feet = (e && e.feet) || [], syl = (e && e.syl) || [], nF = feet.filter(Boolean).length;
  const mark = w => w==='l' ? '=' : '–';
  const wantTxt = F => F && F.toks ? F.toks.map(t=>t==='x' ? '= or –' : mark(t)).join(' ') : (F && F.pat ? F.pat.split('').map(mark).join(' ') : '');
  const lab = x => { const t = x.text && x.text!=='·' ? x.text : ''; if(!t) return ''; const v = (cs==='ur' || typeof translitText!=='function') ? t : translitText(t, cs); return `<span class="${cs==='ur'?'urdu':'mono'}" ${cs==='ur'?'lang="ur" dir="rtl"':''}>${escapeHtml(v)}</span>`; };
  const items = []; let title = '';
  feet.forEach((F, fi) => {
    if(!F) return;
    const mine = syl.filter(x => x.foot===fi), bad = mine.filter(x => x.extra || x.clash || x.missing);
    if(!bad.length) return;
    const ord = fi===nF-1 ? 'last' : FOOT_ORD[fi] || ('#'+(fi+1));
    const name = F.ur ? `<span class="urdu" lang="ur" dir="rtl">${escapeHtml(F.ur)}</span>` : 'the foot';
    const has = mine.filter(x => !x.missing && !x.cheat && x.resolved!=='c').map(x => mark(x.resolved==='l'?'l':'s')).join(' ');
    const extra = bad.filter(x => x.extra), miss = bad.filter(x => x.missing), clash = bad.filter(x => x.clash);
    const want = wantTxt(F);
    const head = [];
    if(extra.length) head.push(`The ${ord} foot has ${countOf(extra.length,'syllable')} too many`);
    if(miss.length) head.push(`The ${ord} foot is ${countOf(miss.length,'syllable')} short`);
    if(!extra.length && !miss.length && clash.length) head.push(`In the ${ord} foot ${clash.length>1?'some syllables have':'a syllable has'} the wrong weight`);
    if(!title) title = head[0];
    let txt = `<span class="why-head">${head.join('; ')}.</span> ${name} wants <span class="mono-pat">${want}</span>${has ? `; the line gives <span class="mono-pat">${has}</span>` : ''}.`;
    clash.forEach(x => { txt += ` ${lab(x) || 'A syllable'} is ${x.resolved==='l'?'long':'short'}, and the bahr wants it ${x.expected==='l'?'long':'short'}.`; });
    extra.forEach(x => { const l = lab(x); if(l) txt += ` The syllable ${l} has no room.`; });
    if(miss.length) txt += ' The gap is heard as silence.';
    items.push(txt);
  });
  const shown = items.slice(0, 3); if(items.length > 3) shown.push(`…and ${items.length-3} more feet.`);
  return { title, items: shown, flagged: items.length };
}
function renderUnscannedDiagnostic(e, cs, isRtl, li) {
  let h = `<div class="unscanned-diag">`;
  const edited = li != null && hasEdits(li);
  if (e.targetFit) {
    const src = li != null ? benchmarkSource(li) : null, kind = src ? src.kind : 'common';
    const fam = famOfMeter[e.targetFit.meter.id];
    const famDisp = fam ? famLabel(fam) : null;
    const famTxt = famDisp ? ((typeof getLineDisplay === 'function') ? getLineDisplay(famDisp, cs) : famDisp.ur) : meterLabel(e.targetFit.meter);
    h += `<div class="verdict no-fit">${edited ? 'Your edit breaks the meter' : "Doesn't scan as typed"}</div>`;
    /* what it is measured against: the line's own bahr (named by the poem that stands for it), or its partner misra, the line itself */
    if (kind === 'partner') h += `<div class="diag-meta"><span class="tiny muted">Measured against the partner misra’s bahr:</span> ${misraInline(src.li, cs, isRtl)}</div>`;
    else h += `<div class="diag-meta"><span class="tiny muted">${kind === 'own' ? 'Measured against its original bahr:' : 'Measured against the bahr most misras share:'}</span> <span class="${isRtl ? 'urdu' : 'mono'} fam-inline sm">${famTxt}</span></div>`;
    if (e.targetFit.meter.raw) h += `<div class="diag-pat tiny"><span class="muted">The bahr wants</span> <span class="mono-pat">${patGlyphs(e.targetFit.meter.raw)}</span></div>`;
    const why = unfitWhy(e, cs);
    if (why.items.length) h += `<ul class="diag-why">${why.items.map(x => `<li>${x}</li>`).join('')}</ul>`;
    else {
      const parts = [];
      if (e.clashCount) parts.push(`<strong class="t">${countOf(e.clashCount, 'syllable')}</strong> with the wrong weight (dashed)`);
      if (e.extraCount) parts.push(`<strong class="t">${countOf(e.extraCount, 'extra syllable')}</strong> the bahr has no room for`);
      if (e.missingCount) parts.push(`<strong class="t">${countOf(e.missingCount, 'missing syllable')}</strong> (the gaps, heard as silence)`);
      h += `<div class="diag-body">${parts.length ? parts.join(' · ') + '.' : 'No classical bahr fits every syllable.'}</div>`;
    }
    h += `<div class="diag-body">The marked syllables are where it limps. Tap a syllable to change its word’s reading; tap ▶︎ to hear it${edited ? ', then play the original to compare' : ''}.</div>`;
  } else {
    h += `<div class="verdict no-fit">Doesn't scan as typed (${e.syl.length} syllables)</div>`;
    h += `<div class="diag-body">No classical bahr fits these syllables. Tap ▶︎ to hear the rhythm as typed, or tap a syllable to change its reading.</div>`;
  }
  h += `</div>`;
  return h;
}
/* the edit bar shown under an edited line: original chips with their own ▶︎, and a reset */
function editCompareHTML(li, isRtl) {
  if (!hasEdits(li)) return '';
  const o = originalExplain(li);
  let h = `<div class="edit-compare"><div class="row edit-compare-head"><span class="tiny muted">Original</span>`;
  if (o) h += `<span class="play sm" title="Hear the original" aria-label="Hear the original" data-label="Hear the original" data-pb="orig:${li}" onclick="playOriginal(${li},this)">▶︎</span>`;
  h += `<button type="button" class="btn link sm" onclick="resetEdits(${li})">Undo edits</button></div>`;
  if (o) h += `<div class="chips orig ${isRtl ? '' : 'ltr'}" id="sco${li}">${chipsHTML(o.syl, o.feet, null)}</div>`;
  h += `<div class="tiny muted edit-compare-foot">Your edit ↓</div></div>`;
  return h;
}
function playOriginal(li, btn) {
  if (!lastScan || !lastScan.base || !lastScan.base[li]) return;
  pbToggle('orig:' + li, btn, () => { const e = originalExplain(li), host = $('sco' + li); return e && host ? [Object.assign({ e }, pbNodes(host))] : null; });
}
function resetEdits(li) { delete ovr[li]; if (selWord && selWord[0] === li) selWord = null; runScan(); }
function misraScan(r,li,forced){
  const f=forced!==undefined ? forced : (r.fits && r.fits[0] && r.fits[0].c <= 5.0 ? r.fits[0] : null);
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');
  let h='';
  if(!f){
    const e = explainUnscanned(r, li, benchmarkFit(li));
    h+=editCompareHTML(li, isRtl);
    h+=`<div class="chips bad-misra ${isRtl?'':'ltr'}" id="sc${li}">${chipsHTML(e.syl,e.feet,li)}</div>`;
    if(selWord&&selWord[0]===li) h+=wordPanel(r,li,selWord[1]);
    h+=renderUnscannedDiagnostic(e, cs, isRtl, li);
    return h;
  }
  const e=SE().explain(r,f);
  h+=editCompareHTML(li, isRtl);
  h+=`<div class="chips ${isRtl?'':'ltr'}" id="sc${li}">${chipsHTML(e.syl,e.feet,li)}</div>`;
  if(hasEdits(li)) h+=`<p class="tiny muted mt-note">Your edit still scans in the original bahr: the flexibility rules absorb it.</p>`;
  if(selWord&&selWord[0]===li) h+=wordPanel(r,li,selWord[1]);
  const notes=[...new Set(e.notes.map(n=>`${n.word}: ${n.note}`))].filter(n=>!/: $/.test(n));
  const how = lastScan && lastScan.faHow && lastScan.faHow[li];
  if (how === 'iz') notes.push('The iẓāfat is guessed where the other lines’ meter needs one');
  if (how === 'join') notes.push('Read with its words run together where the other lines’ meter joins them');
  if(notes.length) h+=`<p class="scan-notes">${notes.join(' · ')}</p>`;
  return h;
}
function patEnding(raw){
  if(!raw) return '';
  const parts = String(raw).split('/');
  return parts[parts.length - 1].trim();
}

/* one container per couplet: both misras' text together, then both misras' scansion stacked, one play button for the whole couplet */
function coupletCard(li1,li2,r1,f1,lineObj1,r2,f2,lineObj2,label,opts){
  const canPlay = !!((r1 && r1.words && r1.words.length) || (r2 && r2.words && r2.words.length));
  const isPairPoem = !!(opts && opts.isPair);
  let pairBadge = '';
  if(f1 && f2 && f1.meter && f2.meter){
    const m1 = f1.meter.id, m2 = f2.meter.id;
    const isPairDiff = (m1 !== m2) && sameBahr(m1, m2);
    if(isPairDiff){
      const e1 = patEnding(f1.meter.raw || f1.meter.pattern);
      const e2 = patEnding(f2.meter.raw || f2.meter.pattern);
      const tip = `Misra 1 uses Meter #${m1} (${e1}), Misra 2 uses Meter #${m2} (${e2}). In Classical Urdu prosody, these alternating cadences form an accepted paired meter (Handbook \u00a76.1).`;
      pairBadge = `<span class="tip-note" tabindex="0" data-tip="${tip}">endings #${m1} &amp; #${m2}</span>`;
    } else if(isPairPoem && opts && opts.group && opts.group.length > 1 && m1 !== opts.group[0]){
      const e1 = patEnding(f1.meter.raw || f1.meter.pattern);
      const tip = `Both misras in this couplet use Meter #${m1} (${e1}), the secondary cadence in this paired bahr.`;
      pairBadge = `<span class="tip-note" tabindex="0" data-tip="${tip}">ending #${m1}</span>`;
    }
  }
  let h=`<div class="card misra-card" id="scan-cp-${(li1/2)+1}"><div class="row card-head tight">`;
  h+=`<div class="row couplet-head-left"><span class="tiny muted">${label}</span>${pairBadge}</div>`;
  h+=canPlay?`<span class="play sm" title="Hear this couplet" aria-label="Hear this couplet" data-label="Hear this couplet" data-pb="scan:${li1}${li2!=null?','+li2:''}" onclick="playCouplet(${li1},${li2!=null?li2:'null'},null,this)">▶︎</span>`:'';
  const _pr=[[li1,lineObj1,f1],[li2,lineObj2,f2]].map(([li,o,f])=>{ if(li==null||!f||hasEdits(li)) return null; const u=typeof o==='string'?o:(o&&o.ur)||''; const ro=typeof o==='object'?(o&&o.ro):''; return (u&&typeof prPracticable==='function'&&prPracticable(u,f.meter.id))?{u,m:f.meter.id,ro}:null; }).find(Boolean);
  if(_pr) h+=`<a class="btn ghost sm practice-this" href="${prLinkFor(_pr.u,_pr.m,_pr.ro)}" title="Tap this line's rhythm yourself">Practice</a>`;
  h+='</div>';
  h+='<div class="cbox-verse">'+misraText(li1,lineObj1)+(li2!=null && r2 ? misraText(li2,lineObj2) : '')+'</div>';
  h+='<div class="cbox-scan">'+misraScan(r1,li1,f1)+'</div>';
  if(li2!=null && r2) h+='<div class="cbox-scan">'+misraScan(r2,li2,f2)+'</div>';
  h+='</div>';
  return h;
}
function playCouplet(li1,li2,start,btn){
  if(!lastScan||!lastScan.results[li1]) return;
  btn = btn || document.querySelector(`[data-pb="scan:${li1}${li2!=null?','+li2:''}"]`);
  pbToggle('scan:'+li1+','+li2, btn, ()=>{
    const out=[];
    [li1,li2].forEach(li=>{ if(li==null||!lastScan.results[li]) return;
      const host = $('sc'+li);
      if(host) out.push(Object.assign({e:lineExplain(li)}, pbNodes(host)));
    });
    return out;
  }, start);
}
/* ▶ at the top of Scan: play every line in order, chips lighting, through the shared player */
function scanPlayAll(start,btn){
  if(!lastScan||!lastScan.results||!lastScan.results.length) return;
  btn = btn || (typeof document !== 'undefined' && document.querySelector ? document.querySelector('#scanMap [data-pb="scan:all"]') : null);
  const onMap = scanView() === 'map';
  pbToggle('scan:all', btn, ()=>{
    const out=[];
    lastScan.results.forEach((r,li)=>{
      if(onMap){
        const row = typeof document !== 'undefined' && document.querySelector ? document.querySelector(`#scanMap .rmap-row[data-li="${li}"]`) : null;
        if(!row) return;
        const nodes = []; row.querySelectorAll('.rm[data-i]').forEach(n => { nodes[+n.getAttribute('data-i')] = n; });
        out.push({ e: lineExplain(li), nodes, groups: null });
        return;
      }
      const host = $('sc'+li);
      if(host) out.push(Object.assign({e:lineExplain(li)}, pbNodes(host)));
    });
    return out;
  }, start);
}
window.scanPlayAll = scanPlayAll;
function playScan(li,start,btn){ if(!lastScan||!lastScan.results[li]) return;
  btn = btn || document.querySelector(`[data-pb="line:${li}"]`);
  pbToggle('line:'+li, btn, ()=>{
    const host = $('sc'+li);
    return host ? [Object.assign({e:lineExplain(li)}, pbNodes(host))] : null;
  }, start);
}
function pickWord(li,wi){ selWord=(selWord&&selWord[0]===li&&selWord[1]===wi)?null:[li,wi]; runScan(); }
/* tap a syllable chip: open its word's panel focused on that syllable (tap again to close) */
function pickSyl(li,wi,si){ selWord=(selWord&&selWord[0]===li&&selWord[1]===wi&&selWord[2]===si)?null:[li,wi,si]; runScan(); }
/* the per-syllable part of the word panel: long / short, each judged by SE().sylRule */
/* the engine's note on the grafted reading a syllable belongs to, in the fit the line is shown with ('' when none) */
function graftNote(li,syl){
  const r=lastScan.results[li], f=lastScan.disp ? lastScan.disp[li] : (r && r.fits && r.fits[0]);
  const st=f && f.path && f.path.find(p=>p.u && p.u.graft && p.u.from<=syl.word && syl.word<=p.u.to);
  const o=st && st.u.opts[st.oi];
  return (o && o.n) || '';
}
function sylRulesHTML(li,wi,allOpts,key){
  const ex=lineExplain(li), mine=ex.syl.map((s,i)=>Object.assign({i},s)).filter(s=>s.word<=wi && wi<=s.wordTo);
  if(!mine.length) return '';
  const focus=mine.find(s=>selWord && s.i===selWord[2]) || mine.find(s=>!s.missing) || mine[0];
  let h=`<div class="syl-rules">`;
  h+=`<div class="syl-pick">${mine.map(s=>`<button type="button" class="syl-tab ${s.i===focus.i?'on':''} ${s.missing?'missing':''}" onclick="pickSyl(${li},${wi},${s.i})">${s.missing?'·':s.text}</button>`).join('')}</div>`;
  if(focus.missing){
    h+=`<p class="syl-why">The bahr expects a ${focus.expected==='s'?'short':'long'} syllable here that the line doesn't have. Add a word, or pick a reading with more syllables.</p></div>`; return h;
  }
  if(focus.graft){
    h+=`<p class="syl-why">This syllable belongs to a grafted run: the words are scanned as one (3.1). Choose <i>No grafting</i> below to weigh this word's syllables on their own.</p>`;
    if(/aur grafted/.test(graftNote(li,focus))) h+=`<p class="syl-why">Here <i>aur</i> heads the graft: its r opens the next word's syllable, and its <i>au</i> is read short. The handbook's Glossary gives <i>aur</i> as (= -) or (=), and "with word-grafting (- -)".</p>`;
    return h+'</div>';
  }
  const op=allOpts[focus.oi];
  if(!op || !op.syl[focus.k]){ h+='</div>'; return h; }
  const rule=SE().sylRule(op,focus.k,key), native=op.syl[focus.k].w;
  const cur=focus.resolved==='c'||focus.resolved==='s'?'s':'l';
  const o=(ovr[li]&&ovr[li][wi])||{}, forcedHere=o.opt===focus.oi && o.force && o.force[focus.k];
  const btn=(w,label)=>{ const r=rule[w], on=cur===w, dis=r.v==='no' && !on;
    return `<button type="button" class="syl-opt ${on?'on':''} v-${r.v}" ${dis?'disabled':''} onclick="forceSyl(${li},${wi},${focus.oi},${focus.k},'${w}')" title="${r.why.replace(/"/g,'&quot;')}">
      <span class="syl-opt-w mono">${label}</span><span class="syl-opt-v">${r.v==='ok'?'✓':r.v==='rare'?'rare':'✗'}</span><span class="syl-opt-rule">§${r.rule}</span></button>`; };
  h+=`<div class="syl-opts">${btn('l','= long')}${btn('s','– short')}</div>`;
  const other=cur==='l'?'s':'l';
  h+=`<p class="syl-why"><b>${native==='x'?'Flexible.':(cur==='l'?'Long.':'Short.')}</b> ${rule[cur].why}${rule[other].v!=='ok'?` <span class="syl-why-no">${other==='l'?'Long':'Short'}: ${rule[other].why}</span>`:''}</p>`;
  if(native==='x' && !forcedHere) h+=`<p class="syl-why tiny muted">The meter reads it ${cur==='l'?'long':'short'} here. Force the other weight to hear the line limp.</p>`;
  if(forcedHere) h+=`<button type="button" class="btn link sm" onclick="unforceSyl(${li},${wi},${focus.k})">Let the meter decide</button>`;
  h+='</div>';
  return h;
}
function forceSyl(li,wi,oi,k,w){
  const o=ens(li,wi); if(o.opt!==oi){ o.opt=oi; o.force={}; }
  o.force=o.force||{}; o.force[k]=w; runScan();
}
function unforceSyl(li,wi,k){ const o=ens(li,wi); if(o.force) delete o.force[k]; runScan(); }
function wordPanel(r,li,wi){
  const w=r.words[wi]; const o=(ovr[li]&&ovr[li][wi])||{};
  const isTash = (o.tashdid !== undefined) ? !!o.tashdid : /[\u0651\uFE7C]/.test(w.raw);
  const rawWord = (typeof SE().applyTashdid === 'function') ? SE().applyTashdid(w.raw, isTash) : w.raw;
  const allOpts=SE().scanWord(rawWord,(o.suffix!==undefined?o.suffix:w.suffix)||null).opts;   /* same list buildUnits pins from */
  const wStr=op=>op.syl.map(s=>s.w==='l'?'=':s.w==='s'?'–':'x').join(' ');
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');
  const wDisp = (cs === 'ur') ? rawWord : ((typeof translitText === 'function') ? translitText(rawWord, cs) : rawWord);
  const isIz = (o.suffix !== undefined ? o.suffix : w.suffix) === 'iz';
  const isNoGraft = !!o.noGraft;

  // Prune phantom combinatorial options (cost >= 3.0 when lower-cost options exist)
  const minCost = Math.min(...allOpts.map(x => x.c));
  const validCost = allOpts.filter(op => op.c <= Math.max(minCost + 1.5, 2.0));

  // De-duplicate options that produce identical weight patterns
  const seen = new Set();
  const own = [];
  validCost.forEach(op => {
    const pat = wStr(op);
    if (!seen.has(pat)) {
      seen.add(pat);
      own.push({ op, origIndex: allOpts.indexOf(op) });   /* index into the full list: buildUnits pins own[ov.opt] */
    }
  });

  let h=`<div class="card word-card">`;
  h+=`<div class="word-card-head">`;
  h+=`<div class="word-card-title-group">`;
  h+=`<div class="word-card-title"><span class="muted">Readings for</span><span class="${isRtl?'urdu':''} fam-inline word-card-token">${wDisp}</span></div>`;
  const subMsg = own.length > 1
    ? 'Select an alternate weight or let the meter choose'
    : 'This word has a fixed metrical weight in Urdu prosody';
  h+=`<div class="word-card-sub">${subMsg}</div>`;
  h+=`</div>`;
  h+=`<button type="button" class="word-card-close" onclick="selWord=null; runScan();" aria-label="Close readings menu" title="Close">✕</button>`;
  h+=`</div>`;

  h+=sylRulesHTML(li,wi,allOpts,typeof lexKey==='function'?lexKey(rawWord):rawWord);
  if (own.length > 1) h+=`<div class="word-card-sub word-card-sec">Readings of the whole word</div>`;
  h+=`<div class="word-card-opts">`;
  if (own.length > 1) {
    h+=`<div class="optrow ${o.opt==null?'on':''}" onclick="setOpt(${li},${wi},null)" role="button" tabindex="0">`;
    h+=`<div class="optrow-main"><span class="mono word-badge">auto</span><span class="optrow-desc">let the bahr decide</span></div>`;
    h+=`<span class="optrow-mark">${o.opt==null?'✓':''}</span>`;
    h+=`</div>`;
  }

  function readingBreakdown(op) {
    return op.syl.map(s => {
      const glyphs = s.t.map(ch => ch === 'AA' ? 'آ' : ch).join('');
      return (cs === 'ur' || typeof translitText !== 'function') ? glyphs : translitText(glyphs, cs);
    }).join(' · ');
  }

  function readingDesc(op, oi) {
    if (op.n) return op.n;
    const brk = readingBreakdown(op);
    if (oi === 0) return `standard (${brk})`;
    return `alternate (${brk})`;
  }

  own.forEach(({ op, origIndex }, idx) => {
    const isSel = (own.length === 1) ? true : (o.opt === origIndex);
    h+=`<div class="optrow ${isSel?'on':''}" onclick="setOpt(${li},${wi},${origIndex})" role="button" tabindex="0">`;
    h+=`<div class="optrow-main"><span class="mono word-badge">${wStr(op)}</span><span class="optrow-desc">${own.length === 1 ? 'standard fixed weight (' + readingBreakdown(op) + ')' : readingDesc(op, idx)}</span></div>`;
    h+=`<span class="optrow-mark">${isSel?'✓':''}</span>`;
    h+=`</div>`;
  });
  h+=`</div>`;

  const NON_GRAM_MODS = new Set([
    'تجھے','مجھے','ہمیں','انہیں','انھیں','تمھیں','تمہیں','تمہارا','تمہاری','تمہارے','تمھارا','تمھاری','تمھارے',
    'تو','تُو','تھا','تھے','تھی','تھیں','جو','دو','سا','سے','سی','سو','کا','کے','کی','کو','میں','نے','وہ','یہ',
    'ہو','ہوں','ہی','ہے','ہیں','یوں','نہ','کہ','بہ','اور','ایک','اک','کیا','کیوں','کوئی','آپ','میرا','میری','میرے'
  ]);
  const lk = typeof lexKey === 'function' ? lexKey(w.raw) : w.raw.replace(/[\u064B-\u065F\u0670\u0640]/g,'');
  const allowIz = isIz || !NON_GRAM_MODS.has(lk);
  const allowTash = isTash || (!NON_GRAM_MODS.has(lk) && SE().applyTashdid(w.raw, true) !== w.raw);

  h+=`<div class="word-card-actions">`;
  if (allowIz) {
    h+=`<button type="button" class="word-action-btn ${isIz?'active':''}" onclick="toggleIz(${li},${wi})">${isIz ? 'Remove iẓāfat' : 'Add iẓāfat'}<span class="symbol-izafat">(-e)</span></button>`;
  }
  if (allowTash) {
    h+=`<button type="button" class="word-action-btn ${isTash?'active':''}" onclick="toggleTashdid(${li},${wi})">${isTash ? 'Remove tashdīd' : 'Add tashdīd'}<span class="symbol-tashdid">ـّ</span></button>`;
  }
  h+=`<button type="button" class="word-action-btn ${isNoGraft?'active':''}" onclick="toggleGraft(${li},${wi})">${isNoGraft ? 'Allow grafting' : 'No grafting'}</button>`;
  h+=`</div>`;
  h+=`</div>`;

  return h;
}
function ens(li,wi){ ovr[li]=ovr[li]||{}; ovr[li][wi]=ovr[li][wi]||{}; return ovr[li][wi]; }
function setOpt(li,wi,oi){ const o=ens(li,wi); o.opt=oi; o.force={}; runScan(); }
function toggleIz(li,wi){ const o=ens(li,wi), w=lastScan.results[li].words[wi]; const cur=o.suffix!==undefined?o.suffix:w.suffix; o.suffix=cur==='iz'?null:'iz'; o.opt=null; o.force={}; runScan(); }
function toggleTashdid(li,wi){
  const o=ens(li,wi), w=lastScan.results[li].words[wi];
  const curHas = (o.tashdid !== undefined) ? !!o.tashdid : /[\u0651\uFE7C]/.test(w.raw);
  o.tashdid = !curHas;
  o.opt = null; o.force = {};
  runScan();
}
function toggleGraft(li,wi){ const o=ens(li,wi); o.noGraft=!o.noGraft; runScan(); }
let scanTimer = null;
function onScanComposerInput() {
  viGrow($('scanIn'));
  ovr = {}; selWord = null; curEx = null; if($('exSel')) $('exSel').value = '';
  clearTimeout(scanTimer);
  scanTimer = setTimeout(runScan, 200);
}
function clearScan() {
  if ($('scanIn')) $('scanIn').value = '';
  if ($('studioInput')) $('studioInput').value = '';
  if ($('scanOut')) $('scanOut').innerHTML = '';
  if ($('studioResults')) $('studioResults').innerHTML = '';
  ovr = {}; selWord = null; curEx = null;
  if ($('exSel')) $('exSel').value = '';
  lastScan = null;
  scanChrome([]);
  window.lastStudioResults = lastStudioResults = [];
}
if ($('scanIn')) $('scanIn').addEventListener('input', onScanComposerInput);

function renderLineScan(text, container, lineObjIn, meterId) {
  if (!text) {
    if (container) container.innerHTML = '';
    return;
  }
  const rawL = (text || '').normalize('NFC');
  const nk = (typeof normVerseKey === 'function') ? normVerseKey(rawL) : '';
  let lineObj = (lineObjIn && lineObjIn.ur) ? lineObjIn : ((typeof KNOWN_VERSES !== 'undefined' && KNOWN_VERSES[nk]) ? KNOWN_VERSES[nk] : null);
  let urduL = lineObj ? lineObj.ur : rawL;
  /* Rekhta lines: with their Roman's hints; a Persian line on the Persian engine (scanCorpusLine), which is told the ghazal's
     meters so a sung refrain can be left out */
  const ownIds = Array.isArray(meterId) ? meterId : (meterId != null ? [meterId] : null);
  const r = (lineObj && typeof scanCorpusLine === 'function') ? scanCorpusLine(lineObj, ownIds) : Scan.scanLine(urduL);
  let f;
  if (Array.isArray(meterId)) {
    // The line belongs to a ghazal locked to one (or a paired pair) of these
    // meters — never fall back to the scanner's own top guess. Pick whichever
    // of the ghazal's own meters fits this line best; if none does, leave f
    // unset so the "no meter fits" message renders instead of silently
    // switching to a different bahr than the ghazal is actually written in.
    f = meterId
      .map(id => r.fits.find(x => String(x.meter.id) === String(id)))
      .filter(Boolean)
      .sort((a, b) => a.c - b.c)[0];
  } else {
    f = (meterId != null && r.fits.find(x => String(x.meter.id) === String(meterId))) || r.fits[0];
  }
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');

  let h = '';
  if (!f) {
    h += `<div class="verdict no-meter">No meter fits every syllable.</div>`;
    const nn = r.near && r.near[0], nd = nn && engineOf(r).diagnose(r, nn.meter);
    if (nd) {
      const pl = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`, bits = [];
      if (nn.clashes.length) bits.push(pl(nn.clashes.length, 'clashing syllable'));
      if (nn.extra) bits.push(pl(nn.extra, 'extra syllable'));
      if (nn.missing) bits.push(pl(nn.missing, 'missing syllable'));
      h += `<div class="diag-meta"><span class="tiny muted">Nearest:</span> <span class="${isRtl ? 'urdu' : 'mono'} fam-inline sm">${meterLabel(nn.meter)}</span> <span class="tiny muted">${bits.join(' · ')}</span></div>`;
      h += `<div class="chips ${isRtl?'':'ltr'}">${chipsHTML(nd.syl, nd.feet, null, { r, lineObj: lineObj || { ur: urduL } })}</div>`;
    }
  } else {
    const e = engineOf(r).explain(r, f);
    const id = 'lineScan_' + Math.random().toString(36).slice(2, 8);
    h += `<div class="chips ${isRtl?'':'ltr'}" id="${id}">${chipsHTML(e.syl, e.feet, null, { r, lineObj: lineObj || { ur: urduL } })}</div>`;
    const notes = [...new Set(e.notes.map(n => `${n.word}: ${n.note}`))].filter(n => !/: $/.test(n));
    if (f.mustazad) notes.push('Mustazād: after the // comes the added phrase, the meter’s first and last feet');
    if (r.refrain) notes.push(`Refrain: the last ${r.refrain} words repeat as sung and are left out of the scan`);
    if (f.roman) notes.push('Read by the line’s Roman, which writes the vowels the script leaves out');
    if (r.respelt) notes.push('Read with its words run together where the meter joins them');
    if (r.izGuess) notes.push('No Roman for this line: the iẓāfat is guessed');
    if (r.gv) notes.push('This text of the line misses the meter. Read as Ganjoor has it: ' + r.gv);
    if (notes.length) {
      h += `<p class="scan-notes">${notes.join(' · ')}</p>`;
    }
  }

  if (container) container.innerHTML = h;
  return h;
}
window.renderLineScan = renderLineScan;
renderScanLangButtons();
