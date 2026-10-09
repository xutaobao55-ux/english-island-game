(()=>{'use strict';
const KEY='english-island-voice-v2';
const defaults={locale:'en-US',rate:0.90,voiceURI:''};
let settings={...defaults};
try{settings={...settings,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){}
let session=0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(e){}};
const supported=()=>('speechSynthesis'in window&&'SpeechSynthesisUtterance'in window);
function voiceList(){
 if(!supported())return [];
 try{return speechSynthesis.getVoices().filter(v=>/^en(?:-|_)/i.test(v.lang))}catch(e){return []}
}
function priority(v){
 const n=v.name.toLowerCase();let score=0;
 if(n.includes('natural')||n.includes('neural'))score+=50;
 if(n.includes('google us english')||n.includes('google uk english'))score+=45;
 if(n.includes('microsoft')&&/aria|jenny|sonia|ryan/.test(n))score+=35;
 if(/samantha|daniel/.test(n))score+=30;
 if(n.includes('compact'))score-=20;
 if(/bad news|boing|bubbles|whisper|robot|zarvox|trinoids|hysterical|bells|organ|cellos/.test(n))score-=200;
 return score;
}
function candidates(){
 return voiceList().sort((a,b)=>priority(b)-priority(a)||a.name.localeCompare(b.name));
}
function choice(){
 const list=candidates();
 const explicit=list.find(v=>settings.voiceURI&&v.voiceURI===settings.voiceURI);
 if(explicit)return explicit;
 const local=list.filter(v=>v.lang.toLowerCase().replace('_','-')===settings.locale.toLowerCase());
 return(local.length?local:list)[0]||null;
}
function choiceOptions(){
 return '<option value="">自动推荐英语发音人</option>'+candidates().map(v=>'<option value="'+esc(v.voiceURI)+'" '+(settings.voiceURI===v.voiceURI?'selected':'')+'>'+esc(v.name)+' ('+esc(v.lang)+')</option>').join('');
}
function status(){
 if(!supported())return '当前浏览器不支持语音合成，请使用最新版 Edge 或 Chrome。';
 const v=choice();
 return v?'当前发音人：'+v.name+'（'+v.lang+'）。可以试听比较，选择更清晰的一种。':
 '没有检测到英文语音。请尝试重新检测；若仍异常，请在电脑系统中安装英语语音，或改用 Edge 浏览器。';
}
function panel(){
 return '<div class="note" style="margin:14px 0" aria-label="英语发音设置">'+
 '<b>🔊 英语发音设置</b><p style="margin:6px 0">若发音不自然，可切换美式/英式英语、英语发音人和语速。</p>'+
 '<div class="voice-controls"><label>口音 <select id="island-accent">'+
 '<option value="en-US" '+(settings.locale==='en-US'?'selected':'')+'>美式英语</option>'+
 '<option value="en-GB" '+(settings.locale==='en-GB'?'selected':'')+'>英式英语</option></select></label> '+
 '<label>发音人 <select id="island-voice">'+choiceOptions()+'</select></label> '+
 '<label>语速 <select id="island-rate">'+
 '<option value="0.75" '+(Number(settings.rate)===0.75?'selected':'')+'>慢速</option>'+
 '<option value="0.9" '+(Number(settings.rate)===0.9?'selected':'')+'>正常</option>'+
 '<option value="1" '+(Number(settings.rate)===1?'selected':'')+'>自然</option></select></label></div>'+
 '<p id="island-voice-status" style="font-size:12px;margin:9px 0" aria-live="polite">'+esc(status())+'</p>'+
 '<button class="btn" type="button" data-a="island-test-voice">▶ 试听 apple</button> '+
 '<button class="btn" type="button" data-a="island-refresh-voice">↻ 重新检测</button></div>';
}
function refresh(){
 const dropdown=document.getElementById('island-voice');
 if(dropdown)dropdown.innerHTML=choiceOptions();
 const tip=document.getElementById('island-voice-status');
 if(tip)tip.textContent=status();
}
function speak(raw){
 const text=String(raw||'').trim();
 if(!text)return;
 if(!supported()){refresh();return}
 try{
  session++;const id=session, voice=choice(), synth=speechSynthesis;
  synth.cancel();
  const phrases=text.length>160?(text.match(/[^.!?]+[.!?]?/g)||[text]).map(v=>v.trim()).filter(Boolean):[text];
  let i=0;
  function next(){
   if(id!==session||i>=phrases.length)return;
   const u=new SpeechSynthesisUtterance(phrases[i++]);
   u.lang=voice?voice.lang:settings.locale;
   if(voice)u.voice=voice;
   u.rate=Number(settings.rate)||0.9;
   u.pitch=1;
   u.onend=()=>{if(session===id)next()};
   u.onerror=err=>{if(session!==id)return;const tip=document.getElementById('island-voice-status');if(tip)tip.textContent='语音播放失败（'+(err.error||'未知原因')+'）。请换一个英语发音人试听。'};
   synth.speak(u);
  }
  next();
 }catch(e){
  const tip=document.getElementById('island-voice-status');
  if(tip)tip.textContent='语音功能异常，请使用最新版 Edge 或 Chrome，并检查系统英语语音。';
 }
}
document.addEventListener('change',e=>{
 const el=e.target;if(!el)return;
 if(el.id==='island-accent'){settings.locale=el.value;settings.voiceURI='';save();refresh()}
 if(el.id==='island-voice'){settings.voiceURI=el.value;save();refresh()}
 if(el.id==='island-rate'){settings.rate=Number(el.value)||0.9;save();refresh()}
});
document.addEventListener('click',e=>{
 const btn=e.target.closest('button[data-a]');if(!btn)return;
 if(btn.dataset.a==='island-test-voice')speak('apple');
 if(btn.dataset.a==='island-refresh-voice')refresh();
});
if(supported())try{speechSynthesis.addEventListener('voiceschanged',refresh)}catch(e){speechSynthesis.onvoiceschanged=refresh}
window.IslandSpeech={speak,panel,refresh};
})();