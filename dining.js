(function(){
  "use strict";
  const host=document.getElementById("records");
  const buttons=Array.from(document.querySelectorAll("[data-filter]"));
  let entries=[];
  let activeFilter="all";
  function el(tag,cls,txt){
    const x=document.createElement(tag);if(cls)x.className=cls;
    if(txt!==undefined&&txt!==null)x.textContent=String(txt);return x;
  }
  function add(parent,tag,cls,txt){const x=el(tag,cls,txt);parent.appendChild(x);return x;}
  function external(parent,label,url){
    if(!url)return;const a=add(parent,"a","",label);
    a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;
  }
  function render(){
    host.replaceChildren();
    const visible=entries.filter(x=>activeFilter==="all"||x.status===activeFilter);
    if(!visible.length){add(host,"p","empty","No entries in this category yet.");return;}
    visible.forEach((r,i)=>{
      const card=add(host,"article","record "+r.status);
      const top=add(card,"div","record-top");
      add(top,"span","status",r.status==="confirmed"?"Recorded visit":"Identity to confirm");
      add(top,"span","record-index",String(i+1).padStart(2,"0"));
      add(card,"p","record-city",r.city+" / "+r.region);
      add(card,"h3","",r.name);
      add(card,"p","record-date",r.visit.dateText);
      add(card,"p","record-summary",r.summary);
      if(r.kind==="restaurant"){
        const distinction=(r.guide.distinction==="selected"?"Michelin Selected":r.guide.distinction);
        add(card,"span","distinction",distinction+" · "+r.guide.edition+" Guide");
        add(card,"p","note","Date and recognition at the time of the meal are not yet established.");
        const bottom=add(card,"div","record-footer");
        external(bottom,"View Michelin listing ↗",r.guide.sourceUrl);
      }else if(r.candidates){
        const ul=add(card,"ul","candidates");
        r.candidates.forEach(c=>{
          const li=add(ul,"li","");
          const head=add(li,"div","candidate-head");
          external(head,c.name+" ↗",c.url);
          const grades=c.stars2023!==undefined?"2023: "+c.stars2023+" ★":"2016: "+(c.stars2016?"1 ★":"—")+" · 2017: "+(c.stars2017?"1 ★":"Bib");
          add(head,"span","candidate-stars",grades);
          add(li,"p","",c.reason);
        });
      }
      host.appendChild(card);
    });
  }
  function updateStats(){
    // Only unambiguous named visits with a star in the relevant guide edition count.
    const counted=entries.filter(x=>x.status==="confirmed"&&x.kind==="restaurant"&&x.guide&&x.guide.historicalVisitDistinction==="starred"&&x.guide.starsAtVisit>0);
    const visits=entries.filter(x=>x.status==="confirmed");
    const leads=entries.filter(x=>x.status==="researching");
    document.getElementById("stat-stars").textContent=String(counted.length);
    document.getElementById("stat-guide").textContent=String(visits.length);
    document.getElementById("stat-leads").textContent=String(leads.length);
  }
  buttons.forEach(button=>button.addEventListener("click",()=>{
    activeFilter=button.dataset.filter;
    buttons.forEach(b=>{const selected=b===button;b.classList.toggle("active",selected);b.setAttribute("aria-pressed",String(selected));});
    render();
  }));
  document.getElementById("copyright-year").textContent=String(new Date().getFullYear());
  fetch("./data/dining.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw new Error("data response "+r.status);return r.json();}).then(payload=>{
    if(!payload||!Array.isArray(payload.entries))throw new Error("invalid dining data");
    entries=payload.entries;updateStats();render();
  }).catch(()=>{host.replaceChildren();add(host,"p","empty","The dining archive could not be loaded. Please try refreshing this page.");});
})();
