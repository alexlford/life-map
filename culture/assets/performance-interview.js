(function(){
"use strict";
const list=document.getElementById("performance-candidates");
const progress=document.getElementById("performance-progress");
const summary=document.getElementById("performance-summary");
const notes=document.getElementById("performance-notes");
const copyStatus=document.getElementById("performance-copy-status");
const storageKey="culture:performance-interview:v1";
const labels={yes:"I saw this",maybe:"Possibly",no:"Not this show"};
let choices={},noteText="";
try{
  const d=JSON.parse(localStorage.getItem(storageKey)||"{}");
  if(d&&typeof d==="object"&&!Array.isArray(d)){
    choices=d.choices&&typeof d.choices==="object"?d.choices:{};
    noteText=typeof d.notes==="string"?d.notes:"";
  }
}catch(_){}
notes.value=noteText;
const node=(tag,cls,value)=>{
  const x=document.createElement(tag);
  if(cls)x.className=cls;
  if(value!==undefined)x.textContent=value;
  return x;
};
let candidates=[];
function answerText(){
  const answers=candidates.filter(c=>labels[choices[c.id]]).map(c=>c.city+" — "+c.name+" ("+labels[choices[c.id]]+")"+(c.year?" · "+c.year:""));
  summary.value="CULTURE PASSPORT — THEATER INTERVIEW\n\n"+(answers.join("\n")||"No shows selected yet.")+"\n\nANOTHER DENVER SHOW / CLUES:\n"+(noteText||"No notes yet.")+"\n\nThese are local research answers, not published attendance records.";
  const reviewed=answers.length;
  progress.textContent=reviewed+" of "+candidates.length+" leads reviewed";
}
function save(){
  try{localStorage.setItem(storageKey,JSON.stringify({choices,notes:noteText}));}
  catch(_){copyStatus.textContent="Browser storage unavailable. Please copy your answers to preserve them.";}
  answerText();
}
function display(db){
  candidates=db.candidates.filter(c=>c.id!=="denver-unknown-play");
  list.replaceChildren();
  for(const c of candidates){
    const card=node("article","interview-item");
    card.append(node("p","tag",(c.city||"")+(c.year?" / "+c.year:"")),node("h3","",c.name));
    if(c.engagement)card.append(node("p","",c.engagement));
    if(c.userMemory&&c.confirmation!=="unreviewed_candidate")card.append(node("p","performance-lead-context",c.userMemory));
    if(c.detail)card.append(node("p","",c.detail));
    const hint=node("p","qualifies neutral",c.confirmation==="probable"?"Likely identity · still unconfirmed":c.confirmation==="possible"?"Possible production identity":"Historical candidate · no attendance claimed");
    card.append(hint);
    const group=node("div","choices");group.setAttribute("role","group");group.setAttribute("aria-label","Did you see "+c.name+"?");
    const buttons={};
    for(const key of Object.keys(labels)){
      const button=node("button",choices[c.id]===key?"active":"",labels[key]);
      button.type="button";button.setAttribute("aria-pressed",String(choices[c.id]===key));
      button.addEventListener("click",()=>{
        if(choices[c.id]===key)delete choices[c.id];else choices[c.id]=key;
        for(const k of Object.keys(buttons)){
          const active=choices[c.id]===k;
          buttons[k].classList.toggle("active",active);
          buttons[k].setAttribute("aria-pressed",String(active));
        }
        save(); // Deliberately preserve the entire card, its focus and scroll position.
      });
      buttons[key]=button;group.append(button);
    }
    card.append(group);
    if(c.sourceUrl){const a=node("a","source-link","Historical production source ↗");a.href=c.sourceUrl;a.target="_blank";a.rel="noopener noreferrer";card.append(a);}
    list.append(card);
  }
  answerText();
}
notes.addEventListener("input",()=>{noteText=notes.value;save();});
document.getElementById("copy-performance").addEventListener("click",async()=>{
  try{
    await navigator.clipboard.writeText(summary.value);copyStatus.textContent="Copied. Paste the answers into ChatGPT to update the master archive.";
  }catch(_){
    summary.focus();summary.select();copyStatus.textContent="Select and copy the highlighted notes.";
  }
});
document.getElementById("clear-performance").addEventListener("click",()=>{
  if(!window.confirm("Clear your locally saved theater answers? Published memories remain unchanged."))return;
  choices={};noteText="";notes.value="";display({candidates});save();copyStatus.textContent="Local edits cleared; the published timeline is unchanged.";
});
fetch("./data/performance-interview.json",{cache:"no-cache"}).then(r=>{
  if(!r.ok)throw Error("Could not load interview data");
  return r.json();
}).then(db=>{if(!Array.isArray(db.candidates))throw Error("Invalid interview data");display(db);})
.catch(()=>{list.replaceChildren(node("p","empty","The performance interview could not load. Try refreshing."));});
})();