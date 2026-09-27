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
];
if ($('samples')) $('samples').innerHTML=SAMPLES.map((s,i)=>`<button class="chipbtn" onclick="loadSample(${i})">${s[0]}</button>`).join('');
if ($('exSel')) $('exSel').innerHTML='<option value="">Pritchett\'s exercise ghazals (1–24)…</option>'+EXERCISES.map((e,i)=>`<option value="${i}">${e.g}. ${e.poet}</option>`).join('');
let curEx=null;
/* answer-key meters: Scan's own EXERCISES use .m, corpus ghazals (Mir/Ghalib browse) use .meters */
function exMeters(ex){ const m = ex ? (ex.m || ex.meters || []) : []; return Array.isArray(m) ? m : [m]; }
function loadEx(v){ if(v===''){curEx=null;return;} curEx=EXERCISES[+v]; if($('scanIn')) $('scanIn').value=curEx.L; ovr={}; selWord=null; runScan(); }
function loadSample(i){ if($('scanIn')) $('scanIn').value=SAMPLES[i][1]; ovr={}; curEx=null; if($('exSel')) $('exSel').value=''; runScan(); }
let ovr={}, lastScan=null, selWord=null, scanRolls={};
function verdictOf(c){ return c<=2.5?['ok','Scans']:c<=5?['warn','Scans, with stretches']:['no','Strained — probably not']; }
/* colour a raw pattern string (= long, - short, x either, / foot break) */
function patGlyphs(raw){
  return String(raw).split('').map(ch=>ch==='='?'<span class="pg l">=</span>':ch==='-'?'<span class="pg s">-</span>':ch==='x'?'<span class="pg x">x</span>':ch==='/'?'<span class="pg sep">/</span>':ch).join('');
}
function legendHTML(cls){
  // one compact line; longer explanations live in the tooltips
  return `<div class="legend${cls?' '+cls:''}">`
    +`<span title="long syllable — sung 'dum'"><i class="sw c-l"></i><span class="lg-or">/</span><span class="pg l">=</span> long <span class="lg-note">(dum)</span></span>`
    +`<span title="short syllable — sung 'da'"><i class="sw c-s"></i><span class="lg-or">/</span><span class="pg s">–</span> short <span class="lg-note">(da)</span></span>`
    +`<span title="flexible: could be long or short; the meter decides"><i class="sw c-x"></i>flexible</span>`
    +`<span title="either: the meter allows long or short here"><span class="pg x">x</span> either</span>`
    +`<span title="cheat: an extra short syllable at the end of a line, outside the meter"><i class="sw c-c"></i>cheat</span>`
    +`<span title="grafted: words joined across the space"><i class="sw c-g"></i>grafted</span>`
    +`</div>`;
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
  37: "kāmil musamman sālim"
};

function meterTechName(m){
  if(!m || m.id==='H') return '';
  const raw = (typeof METERS_DATA !== 'undefined' && METERS_DATA.standard) ? ((METERS_DATA.standard.find(x => x.id === m.id) || {}).name || '') : (METER_TECH_NAMES[m.id] || '');
  return aruzName(raw).ro;
}
function meterLabel(m, opts){
  if(!m) return '';
  if(m.id==='H') return "Mir's Hindi meter";
  const showTech = !opts || opts.tech !== false;
  const numStr = m.kind==='rubai' ? ('rubāʿī ' + (''+m.id).replace(/^R/i,'')) : ('Meter #' + m.id);
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
function runScan(){
  const rawLines=$('scanIn').value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(typeof setHashQuiet==='function' && typeof location!=='undefined' && /^#\/scan/.test(location.hash||'')) setHashQuiet(rawLines.length ? '/scan?t=' + encodeURIComponent(rawLines.join('\n')) : '/scan');
  if(!rawLines.length){
    $('scanOut').innerHTML='';
    if($('studioResults')) $('studioResults').innerHTML='';
    const btn = $('btnPlayCouplet'); if(btn) btn.classList.add('hidden');
    return;
  }

  const lines = [];
  const lineObjs = [];
  rawLines.forEach(rawL => {
    rawL = (rawL || '').normalize('NFC');
    const nk = (typeof normVerseKey === 'function') ? normVerseKey(rawL) : '';
    let urduL = rawL;
    let lineObj = null;

    if(typeof KNOWN_VERSES !== 'undefined' && KNOWN_VERSES[nk]) {
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
        lineObj = { ur: rawL, hi: (typeof urduToDevanagari==='function'?urduToDevanagari(rawL):rawL), ro: (typeof urduToRoman==='function'?urduToRoman(rawL):rawL), ascii: rawL, isApprox: true };
      }
    } else if(/[\u0900-\u097F]/.test(rawL)) {
      const asc = (typeof devToAscii==='function') ? devToAscii(rawL) : rawL;
      let ur = '';
      try { if(window.p_ur) ur = window.p_ur.parse(asc); } catch(e){}
      let ro = '';
      try { if(window.p_di) ro = window.p_di.parse(asc); } catch(e){}
      urduL = ur || rawL;
      lineObj = { ur: urduL, hi: rawL, ro: ro || rawL, ascii: asc };
    } else {
      const asc = (typeof romanToAscii==='function') ? romanToAscii(rawL) : rawL;
      let ur = '';
      try { if(window.p_ur) ur = window.p_ur.parse(asc); } catch(e){}
      let hi = '';
      try { if(window.p_hi) hi = window.p_hi.parse(asc); } catch(e){}
      let ro = '';
      try { if(window.p_di) ro = window.p_di.parse(asc); } catch(e){}
      urduL = ur || rawL;
      lineObj = { ur: urduL, hi: hi || rawL, ro: ro || rawL, ascii: asc };
    }
    urduL = (urduL || '').normalize('NFC');
    lines.push(urduL);
    lineObjs.push(lineObj);
  });

  if($('studioInput') && $('studioInput').value !== $('scanIn').value) {
    $('studioInput').value = $('scanIn').value;
  }
  if(typeof runStudioScan === 'function') {
    runStudioScan();
  }
  const btnPlay = $('btnPlayCouplet');
  if(btnPlay) btnPlay.classList.toggle('hidden', lines.length <= 1);

  const results=lines.map((l,i)=>Scan.scanLine(l,ovr[i]));
  lastScan={lines,rawLines,lineObjs,results};
  let h='';
  /* stacking / multi-line harmony */
  let common=null;
  if(lines.length>1){
    const PAIRS=[[1,9],[14,15],[16,17],[18,19],[33,34]];
    const inPair=new Set(PAIRS.flat());
    const groups=Scan.METERS.map(m=>m.id).filter(id=>!inPair.has(id)).map(id=>[id]).concat(PAIRS).concat([['H']]);
    const tot=groups.map(g=>{let c=0,fits=[]; for(const r of results){const f=r.fits.filter(x=>g.includes(x.meter.id)).sort((a,b)=>a.c-b.c)[0]; if(!f){return null;} c+=f.c; fits.push(f);} return {id:g[0],group:g,c,fits};}).filter(Boolean).sort((a,b)=>a.c-b.c);
    common=tot[0]||null;
    if(!common){
      let bestG=null; groups.forEach(g=>{ let n=0,c=0; const miss=[]; results.forEach((r,li)=>{const f=r.fits.filter(x=>g.includes(x.meter.id)).sort((a,b)=>a.c-b.c)[0]; if(f){n++;c+=f.c;} else miss.push(li+1);});
        if(n>=2 && (!bestG||n>bestG.n||(n===bestG.n&&c<bestG.c))) bestG={g,n,c,miss}; });
      lastScan.near=bestG; }
    lastScan.forced = common && common.c/lines.length<=5 ? common.fits : null;
    if(lastScan.forced){
      const _fcd=lastScan.forced, _f0=_fcd[0], _m=_f0.meter, _per=common.c/lines.length, [_vc,_vt]=verdictOf(_per), _fam=famOfMeter[_m.id];
      const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
      const isRtl = (cs === 'ur');
      const famDisp = _fam ? famLabel(_fam) : null;
      const famTxt = famDisp ? ((typeof getLineDisplay === 'function') ? getLineDisplay(famDisp, cs) : famDisp.ur) : '';
      const _famIsWhatWasScanned = famDisp && lineObjs.some(lo => { const u = typeof lo==='string'?lo:(lo&&lo.ur)||''; return u && normVerseKey(u)===normVerseKey(famDisp.ur||''); });
      h+='<div class="card">';
      /* summary: verdict · meter number / name / pattern / reference verse · more link */
      { const _tech = meterTechName(_m);
        const _num = _m.id==='H' ? '' : (_m.kind==='rubai' ? ('Rubāʿī ' + (''+_m.id).replace(/^R/i,'')) : ('Meter #' + _m.id));
        h+=`<div class="scan-summary">`;
        h+=`<div class="ss-top"><span class="pill ${_vc}">${_vt}</span>${_num?`<span class="ss-num">${_num}</span>`:''}</div>`;
        h+=`<div class="ss-name">${_tech || meterLabel(_m,{tech:false})}</div>`;
        { const _rawTech = (typeof METERS_DATA !== 'undefined' && METERS_DATA.standard) ? ((METERS_DATA.standard.find(x => x.id === _m.id) || {}).name || '') : (METER_TECH_NAMES[_m.id] || '');
          const _ur = aruzName(_rawTech).ur; if(_ur) h+=`<div class="ss-name-ur">${_ur}</div>`; }
        if(_m.raw) h+=`<div class="ss-pat">${patGlyphs(_m.raw)}</div><div class="ss-pat-key"><span class="pg l">=</span> long <span class="pg s">-</span> short${/x/.test(_m.raw)?' <span class="pg x">x</span> either (long or short)':''} <span class="pg sep">/</span> foot break</div>`;
        if(_fam){
          if(_famIsWhatWasScanned) h+=`<div class="ss-ref"><span class="ss-lbl">This couplet is the reference example for this bahr</span></div>`;
          else h+=`<div class="ss-ref"><span class="ss-lbl">Same bahr as</span><span class="${isRtl?'urdu':'ro'} ss-verse">${famTxt}</span><span class="ss-cite">${cs==='ro'?famDisp.ref:famDisp.ro+' — '+famDisp.ref}</span></div>`;
          h+=`<button class="btn sm ss-more" onclick="go('bahr');document.getElementById('fam-${_fam.id}').scrollIntoView()">More in this bahr ›</button>`;
        }
        h+=`</div>`; }
      /* answer key if exercise */
      if(curEx){ const _hit=_fcd.every(f=>exMeters(curEx).includes(f.meter.id)); h+=`<p class="tiny muted mt-loose">Pritchett's answer key (ch. 11): <b class="t">${exMeters(curEx).map(x=>x==='H'?'Hindi meter':'#'+x).join(' / ')}</b> — ${_hit?'<span class="ok-text">the scanner agrees ✓</span>':'<span class="no-text">the scanner disagrees ✗</span>'}</p>`; }
      h+=legendHTML('legend-sticky');
      /* lines grouped into couplets (shers) of 2, each its own bordered card */
      for(let _i=0;_i<results.length;_i+=2){
        const _li2 = (_i+1<results.length) ? _i+1 : null;
        h+=coupletCard(_i,_li2,results[_i],_fcd[_i],lineObjs[_i],_li2!=null?results[_li2]:null,_li2!=null?_fcd[_li2]:null,_li2!=null?lineObjs[_li2]:null,`Couplet ${(_i/2)+1}`);
      }
      h+='</div>';
    } else {
      h+=legendHTML('legend-sticky');
      h+=`<div class="card callout-mismatch"><div class="row">Differing or Strained Meters Between Misras</div><div class="muted small note-sub">No single classical bahr fits every misra. Inspect individual misra scans below.</div></div>`;
      for(let _i=0;_i<results.length;_i+=2){
        const _li2 = (_i+1<results.length) ? _i+1 : null;
        h+=coupletCard(_i,_li2,results[_i],null,lineObjs[_i],_li2!=null?results[_li2]:null,null,_li2!=null?lineObjs[_li2]:null,`Couplet ${(_i/2)+1}`);
      }
    }
  } else {
    h+=legendHTML('legend-sticky');
    results.forEach((r,li)=>{ h+=lineHTML(r,li,null,lineObjs[0]); });
  }
  $('scanOut').innerHTML=h;
  scanRolls = {};
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
  const exps=common.fits.map((f,li)=>Scan.explain(results[li],f)), rows=exps.map(e=>e.syl);
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
    const fs=Scan.patternFeet(m.raw); let fh='<tr><td class="num"></td>';
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
  const exps=common.fits.map((f,li)=>Scan.explain(results[li],f)), rows=exps.map(e=>e.syl);
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
    const fs=Scan.patternFeet(m.raw); let fh='<tr><td class="num"></td>';
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
  const f=forced||r.fits[0];
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');
  const lObj = lineObj || (lastScan && lastScan.lineObjs && lastScan.lineObjs[li]) || (lastScan && lastScan.lines && lastScan.lines[li]);
  const dispL = (typeof getLineDisplay === 'function') ? getLineDisplay(lObj, cs) : (typeof lObj === 'string' ? lObj : (lObj ? lObj.ur : ''));

  let h=`<div class="card"><div class="row card-head"><span class="tiny muted">Misra ${li+1}</span>${f?`<span class="play sm" title="Hear this misra" aria-label="Hear this misra" data-label="Hear this misra" data-pb="line:${li}" onclick="playScan(${li},null,this)">▶︎</span>`:''}</div>`;
  if(dispL) h+=`<div class="misra-text ${isRtl ? '' : (cs==='hi'?'deva':'ltr')}">${dispL}</div>`;
  if(!f){
    h+=`<div class="words ${isRtl?'rtl':'ltr'}">${r.words.map((w,wi)=>{
      const wText = (cs === 'ur') ? w.raw : (typeof translitText === 'function' ? translitText(w.raw, cs) : w.raw);
      return `<button class="wbtn ${selWord&&selWord[0]===li&&selWord[1]===wi?'sel':''} ${ovr[li]&&ovr[li][wi]?'ov':''} ${!isRtl?'roman':''}" onclick="pickWord(${li},${wi})">${wText}</button>`;
    }).join('')}</div>`;
    if(selWord&&selWord[0]===li) h+=wordPanel(r,li,selWord[1]);
    h+=`<div class="verdict no-fit">Doesn't scan as typed</div><p class="small muted">No bahr fits any reading. Tap a word to change its reading, add or remove an iẓāfat, or check the text (a doubled letter without tashdīd is the most common slip).</p></div>`;
    return h;
  }
  const e=Scan.explain(r,f), [vc,vt]=verdictOf(f.c), fam=famOfMeter[f.meter.id];
  const famDisp = fam ? famLabel(fam) : null;
  const famTxt = famDisp ? ((typeof getLineDisplay === 'function') ? getLineDisplay(famDisp, cs) : famDisp.ur) : '';
  const _lineUr = typeof lObj==='string' ? lObj : (lObj && lObj.ur) || '';
  const _famIsThisLine = famDisp && (typeof normVerseKey==='function') && normVerseKey(_lineUr)===normVerseKey(famDisp.ur||'');
  h+=`<div class="row"><span class="pill ${vc}">${vt}</span>${fam?(_famIsThisLine?`<span class="small muted">This is the reference example for this bahr</span>`:`<span class="small muted">Same bahr as</span><span class="${isRtl?'urdu':''} fam-inline">${famTxt}</span>`):`<span class="small muted">${meterLabel(f.meter)}</span>`}</div>`;
  h+=`<div class="chips ${isRtl?'':'ltr'}" id="sc${li}">${chipsHTML(e.syl,e.feet,li)}</div>`;
  if(selWord&&selWord[0]===li) h+=wordPanel(r,li,selWord[1]);
  if(f.meter.id==='H' && lastScan.lines.length===1) h+=`<p class="tiny X mt-2">Mir's Hindi meter is loose enough that even some ordinary sentences fit it. One line proves little — add the rest of the ghazal.</p>`;
  const notes=[...new Set(e.notes.map(n=>`${n.word}: ${n.note}`))].filter(n=>!/: $/.test(n));
  if(notes.length) h+=`<p class="tiny muted mt-note">${notes.join(' · ')}</p>`;
  if(!forced){ const alts=r.fits.slice(1,4).filter(x=>x.c-f.c<1.2); if(alts.length) h+=`<p class="tiny muted">Also fits: ${alts.map(x=>famOfMeter[x.meter.id]?`<span class="${isRtl?'urdu':''} fam-inline xs">${(typeof getLineDisplay==='function')?getLineDisplay(famLabel(famOfMeter[x.meter.id]),cs):famLabel(famOfMeter[x.meter.id]).ur}</span>`:meterLabel(x.meter)).join(' · ')} — add the other misra to decide.</p>`; }
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
function misraScan(r,li,forced){
  const f=forced||r.fits[0];
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');
  let h='';
  if(!f){
    h+=`<div class="words ${isRtl?'rtl':'ltr'}">${r.words.map((w,wi)=>{
      const wText = (cs === 'ur') ? w.raw : (typeof translitText === 'function' ? translitText(w.raw, cs) : w.raw);
      return `<button class="wbtn ${selWord&&selWord[0]===li&&selWord[1]===wi?'sel':''} ${ovr[li]&&ovr[li][wi]?'ov':''} ${!isRtl?'roman':''}" onclick="pickWord(${li},${wi})">${wText}</button>`;
    }).join('')}</div>`;
    if(selWord&&selWord[0]===li) h+=wordPanel(r,li,selWord[1]);
    h+=`<div class="verdict no-fit">Doesn't scan as typed</div><p class="small muted">No bahr fits any reading. Tap a word to change its reading, add or remove an iẓāfat, or check the text (a doubled letter without tashdīd is the most common slip).</p>`;
    return h;
  }
  const e=Scan.explain(r,f);
  h+=`<div class="chips ${isRtl?'':'ltr'}" id="sc${li}">${chipsHTML(e.syl,e.feet,li)}</div>`;
  if(selWord&&selWord[0]===li) h+=wordPanel(r,li,selWord[1]);
  const notes=[...new Set(e.notes.map(n=>`${n.word}: ${n.note}`))].filter(n=>!/: $/.test(n));
  if(notes.length) h+=`<p class="scan-notes">${notes.join(' · ')}</p>`;
  return h;
}
/* one container per couplet: both misras' text together, then both misras' scansion stacked, one play button for the whole couplet */
function coupletCard(li1,li2,r1,f1,lineObj1,r2,f2,lineObj2,label){
  const canPlay = !!(f1 || (r2 && (f2||(r2.fits&&r2.fits[0]))));
  let h=`<div class="card misra-card"><div class="row card-head tight">`;
  h+=`<span class="tiny muted">${label}</span>`;
  h+=canPlay?`<span class="play sm" title="Hear this couplet" aria-label="Hear this couplet" data-label="Hear this couplet" data-pb="scan:${li1}${li2!=null?','+li2:''}" onclick="playCouplet(${li1},${li2!=null?li2:'null'},null,this)">▶︎</span>`:'';
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
      const r=lastScan.results[li], f=(lastScan.forced&&lastScan.forced[li])||r.fits[0];
      if(f && $('sc'+li)) out.push(Object.assign({e:Scan.explain(r,f)}, pbNodes($('sc'+li)))); });
    return out;
  }, start);
}
/* ▶ at the top of Scan: play every line in order, chips lighting, through the shared player */
function scanPlayAll(start,btn){
  if(!lastScan||!lastScan.results||!lastScan.results.length) return;
  btn = btn || $('btnPlayCouplet');
  pbToggle('scan:all', btn, ()=>{
    const out=[];
    lastScan.results.forEach((r,li)=>{ const f=(lastScan.forced&&lastScan.forced[li])||r.fits[0];
      if(f && $('sc'+li)) out.push(Object.assign({e:Scan.explain(r,f)}, pbNodes($('sc'+li)))); });
    return out;
  }, start);
}
window.scanPlayAll = scanPlayAll;
function playScan(li,start,btn){ if(!lastScan||!lastScan.results[li]) return;
  btn = btn || document.querySelector(`[data-pb="line:${li}"]`);
  pbToggle('line:'+li, btn, ()=>{ const r=lastScan.results[li]; const f=(lastScan.forced&&lastScan.forced[li])||r.fits[0];
    if(!f||!$('sc'+li)) return null;
    return [Object.assign({e:Scan.explain(r,f)}, pbNodes($('sc'+li)))]; }, start); }
function pickWord(li,wi){ selWord=(selWord&&selWord[0]===li&&selWord[1]===wi)?null:[li,wi]; runScan(); }
function wordPanel(r,li,wi){
  const w=r.words[wi]; const o=(ovr[li]&&ovr[li][wi])||{};
  const own=Scan.scanWord(w.raw,o.suffix!==undefined?o.suffix:null).opts;
  const wStr=op=>op.syl.map(s=>s.w==='l'?'=':s.w==='s'?'–':'x').join(' ');
  const cs = (typeof currentScript !== 'undefined') ? currentScript : 'ur';
  const isRtl = (cs === 'ur');
  const wDisp = (cs === 'ur') ? w.raw : ((typeof translitText === 'function') ? translitText(w.raw, cs) : w.raw);
  let h=`<div class="card word-card"><div class="tiny muted">Readings of <span class="${isRtl?'urdu':''} fam-inline">${wDisp}</span> — pick one, or let the meter choose</div>`;
  h+=`<div class="optrow ${o.opt==null?'on':''}" onclick="setOpt(${li},${wi},null)"><span class="mono small">auto</span><span class="tiny muted">let the bahr decide</span></div>`;
  own.forEach((op,oi)=>{ h+=`<div class="optrow ${o.opt===oi?'on':''}" onclick="setOpt(${li},${wi},${oi})"><span class="mono small opt-w">${wStr(op)}</span><span class="tiny muted">${op.n||''}</span></div>`; });
  h+=`<div class="row"><button class="btn sm" onclick="toggleIz(${li},${wi})">${(o.suffix!==undefined?o.suffix:w.suffix)==='iz'?'Remove iẓāfat':'Add iẓāfat ِ'}</button><button class="btn sm" onclick="toggleGraft(${li},${wi})">${o.noGraft?'Allow grafting':'No grafting here'}</button></div></div>`;
  return h;
}
function ens(li,wi){ ovr[li]=ovr[li]||{}; ovr[li][wi]=ovr[li][wi]||{}; return ovr[li][wi]; }
function setOpt(li,wi,oi){ ens(li,wi).opt=oi; runScan(); }
function toggleIz(li,wi){ const o=ens(li,wi), w=lastScan.results[li].words[wi]; const cur=o.suffix!==undefined?o.suffix:w.suffix; o.suffix=cur==='iz'?null:'iz'; o.opt=null; runScan(); }
function toggleGraft(li,wi){ const o=ens(li,wi); o.noGraft=!o.noGraft; runScan(); }
let scanTimer = null;
function onScanComposerInput() {
  ovr = {}; selWord = null; curEx = null; if($('exSel')) $('exSel').value = '';
  clearTimeout(scanTimer);
  scanTimer = setTimeout(runScan, 200);
}
function clearScan() {
  if ($('scanIn')) $('scanIn').value = '';
  if ($('studioInput')) $('studioInput').value = '';
  if ($('scanOut')) $('scanOut').innerHTML = '';
  if ($('studioResults')) $('studioResults').innerHTML = '';
  const btn = $('btnPlayCouplet'); if (btn) btn.classList.add('hidden');
  ovr = {}; selWord = null; curEx = null;
  if ($('exSel')) $('exSel').value = '';
  lastScan = null;
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
  const r = Scan.scanLine(urduL);
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
  } else {
    const e = Scan.explain(r, f);
    const id = 'lineScan_' + Math.random().toString(36).slice(2, 8);
    h += `<div class="chips ${isRtl?'':'ltr'}" id="${id}">${chipsHTML(e.syl, e.feet, null, { r, lineObj: lineObj || { ur: urduL } })}</div>`;
    const notes = [...new Set(e.notes.map(n => `${n.word}: ${n.note}`))].filter(n => !/: $/.test(n));
    if (notes.length) {
      h += `<p class="scan-notes">${notes.join(' · ')}</p>`;
    }
  }

  if (container) container.innerHTML = h;
  return h;
}
window.renderLineScan = renderLineScan;


