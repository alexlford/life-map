(function(){
  "use strict";
  const page=document.body.dataset.page||"home";
  const $=(selector,root=document)=>root.querySelector(selector);
  const all=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined&&text!==null)x.textContent=String(text);return x;};
  const link=(label,url,cls)=>{const a=el("a",cls,label);a.href=url;return a;};
  const byId=(id)=>document.getElementById(id);
  const href=(r)=>"./record.html?id="+encodeURIComponent(r.id);
  const yearLabel=(r)=>r.visit?.label||"Date uncertain";
  const displayYear=(r)=>{
    if(r.visit?.year)return String(r.visit.year);
    const yrs=r.visit?.possibleYears||[];
    if(yrs.length===1)return String(yrs[0]);
    if(yrs.length>1)return yrs[0]+"–"+yrs[yrs.length-1];
    return "Date unknown";
  };
  const yearForSorting=(r)=>r.visit?.year||r.visit?.possibleYears?.[0]||-1;
  const byDate=(a,b)=>yearForSorting(b)-yearForSorting(a)||(b.visit?.month||0)-(a.visit?.month||0)||a.title.localeCompare(b.title);
  const titleFor={dining:"Restaurants",bar:"Cocktail Bars",concert:"Concerts",opera:"Opera",theater:"Theater"};
  function empty(parent,title,description,url,label){
    parent.replaceChildren();
    const block=el("div","empty");
    block.append(el("h3","",title),el("p","",description));
    if(url)block.append(link(label||"Explore →",url));
    parent.append(block);
  }
  function setActiveNav(){
    const target=page==="record"?"explore":page;
    all(".nav a").forEach(a=>{const current=a.dataset.nav===target;a.classList.toggle("active",current);if(current)a.setAttribute("aria-current","page");});
  }
  function card(r,v){
    const a=link(" ",href(r),"record-card");
    a.textContent="";
    const top=el("p","eyebrow",r.type.toUpperCase()+" / "+(v?.city||"LOCATION UNKNOWN"));
    const h=el("h3","",r.title),description=el("p","",r.summary);
    const bottom=el("div","record-footer");
    bottom.append(el("span","",yearLabel(r)+(r.favorite?" · A favorite":"")),el("span","","Open record ↗"));
    a.append(top,h,description,bottom);
    return a;
  }
  function siteStats(db){
    const records=db.records.filter(r=>r.status==="confirmed");
    const venues=new Map(db.venues.map(v=>[v.id,v]));
    const cities=new Set(records.map(r=>venues.get(r.venueId)?.city).filter(Boolean));
    const starred=records.filter(r=>r.type==="dining"&&r.guide?.distinction==="starred"&&r.guide.stars>0);
    const awardDining=records.filter(r=>["dining","bar"].includes(r.type)&&r.editorial?.awardQualified);
    const st=[["total-records",awardDining.length],["total-venues",new Set(records.filter(r=>["dining","bar"].includes(r.type)).map(r=>r.venueId)).size],["total-cities",cities.size],["total-starred",starred.length]];
    st.forEach(([key,value])=>{const target=byId(key);if(target)target.textContent=value;});
    for(const key of Object.keys(titleFor)){const target=byId(key+"-count");if(target)target.textContent=key==="dining"?records.filter(r=>r.type==="dining"&&(r.editorial?.awardQualified||r.editorial?.featuredException)).length+" included":key==="bar"?records.filter(r=>r.type==="bar").length+" bars":records.filter(r=>r.type===key).length+" recorded";}
  }
  function home(db){
    siteStats(db);
    const venues=new Map(db.venues.map(v=>[v.id,v]));
    const host=byId("featured-records");
    const records=db.records.filter(r=>r.status==="confirmed"&&(r.editorial?.awardQualified||r.editorial?.featuredException||r.type!=="dining"&&r.type!=="bar")).sort((a,b)=>Number(!!b.editorial?.featuredException)-Number(!!a.editorial?.featuredException)||Number(!!b.favorite)-Number(!!a.favorite)||byDate(a,b)).slice(0,6);
    host.replaceChildren();
    records.forEach(r=>{
      const v=venues.get(r.venueId);
      const a=link("",href(r),"feature-row");
      a.append(el("span","feature-year",displayYear(r)));
      const mid=el("div");mid.append(el("strong","",r.title),el("small","",v.city+" · "+(r.favorite?"Personal favorite":"Confirmed visit")));
      a.append(mid,el("span","feature-arrow","↗"));host.append(a);
    });
  }
  function explore(db){
    const host=byId("explore-results"),city=byId("city-filter"),search=byId("search"),count=byId("result-count"),includeMemories=byId("include-memories");
    const venues=new Map(db.venues.map(v=>[v.id,v]));
    const availableCities=[...new Set(db.records.map(r=>venues.get(r.venueId)?.city).filter(Boolean))].sort();
    availableCities.forEach(n=>{const option=el("option","",n);option.value=n;city.append(option);});
    const params=new URLSearchParams(window.location.search);
    let filter=Object.prototype.hasOwnProperty.call(titleFor,params.get("type"))?params.get("type"):"all";
    includeMemories.checked=params.get("memories")==="1";
    const buttons=all(".tabstrip button[data-type]");
    function update(){
      buttons.forEach(b=>{const active=b.dataset.type===filter;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
      const q=search.value.trim().toLocaleLowerCase();
      const rows=db.records.filter(r=>{
        const v=venues.get(r.venueId);
        const content=[r.title,r.summary,v?.city,v?.region,v?.name].join(" ").toLocaleLowerCase();
        return r.status==="confirmed"&&(!["dining","bar"].includes(r.type)||r.editorial?.awardQualified||r.editorial?.featuredException||includeMemories.checked)&&(filter==="all"||r.type===filter)&&(!city.value||city.value===v?.city)&&(!q||content.includes(q));
      }).sort(byDate);
      count.textContent=rows.length+" confirmed experience"+(rows.length===1?"":"s");
      host.replaceChildren();
      if(rows.length===0){empty(host,filter!=="all"?"This chapter is awaiting its first entry.":"No matching experiences yet.",filter!=="all"?"No "+titleFor[filter].toLowerCase()+" have been confirmed in this archive. Names and dates will be added as you recall them.":"Try changing the category, city, or search terms.",filter==="dining"?"./interview.html":null,"Continue the interview →");return;}
      rows.forEach(r=>host.append(card(r,venues.get(r.venueId))));
    }
    buttons.forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.type;const url=new URL(location.href);if(filter==="all")url.searchParams.delete("type");else url.searchParams.set("type",filter);history.replaceState(null,"",url);update();}));
    city.addEventListener("change",update);search.addEventListener("input",update);includeMemories.addEventListener("change",()=>{const url=new URL(location.href);if(includeMemories.checked)url.searchParams.set("memories","1");else url.searchParams.delete("memories");history.replaceState(null,"",url);update();});update();
  }
  function timeline(db){
    const host=byId("timeline-results"),select=byId("timeline-type"),count=byId("timeline-count"),includeMemories=byId("timeline-memories");
    const venues=new Map(db.venues.map(v=>[v.id,v]));
    function render(){
      const grouped=new Map();
      const results=db.records.filter(r=>r.status==="confirmed"&&(includeMemories.checked||!["dining","bar"].includes(r.type)||r.editorial?.awardQualified||r.editorial?.featuredException)&&(select.value==="all"||r.type===select.value)).sort(byDate);
      for(const r of results){const label=displayYear(r);if(!grouped.has(label))grouped.set(label,[]);grouped.get(label).push(r);}
      count.textContent=results.length+" recorded experience"+(results.length===1?"":"s");
      host.replaceChildren();
      if(!results.length){empty(host,"Nothing confirmed in this chapter yet.","The timeline is ready for your first verified memory.");return;}
      for(const [label,rows] of grouped){
        const section=el("section","timeline-group"),year=el("div","timeline-year",label),stack=el("div","timeline-stack");
        rows.forEach(r=>{const v=venues.get(r.venueId);const a=link("",href(r),"timeline-entry"),mid=el("div");
          mid.append(el("small","",r.type.toUpperCase()+" · "+v.city+" · "+yearLabel(r)),el("h3","",r.title));
          a.append(mid,el("span","","↗"));stack.append(a);
        });
        section.append(year,stack);host.append(section);
      }
    }
    select.addEventListener("change",render);includeMemories.addEventListener("change",render);render();
  }
  function map(db){
    const host=byId("culture-map"),list=byId("city-list"),venues=new Map(db.venues.map(v=>[v.id,v])),groups=new Map();
    for(const r of db.records.filter(x=>x.status==="confirmed"&&(!["dining","bar"].includes(x.type)||x.editorial?.awardQualified||x.editorial?.featuredException))){
      const v=venues.get(r.venueId);if(!v||!v.location)continue;
      if(!groups.has(v.city))groups.set(v.city,{city:v.city,lat:v.location.lat,lng:v.location.lng,records:[]});
      groups.get(v.city).records.push(r);
    }
    list.replaceChildren();
    if(!groups.size){host.textContent="No mapped experiences yet.";list.textContent="No cities yet.";return;}
    if(typeof window.L==="undefined"){host.textContent="Map library unavailable. Use the city list to browse each destination."; }
    let leafletMap=null;
    if(typeof window.L!=="undefined"){
      host.replaceChildren();
      leafletMap=L.map(host,{scrollWheelZoom:false,zoomControl:true});
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{attribution:"&copy; OpenStreetMap contributors &copy; CARTO",maxZoom:18}).addTo(leafletMap);
    }
    const bounds=[];
    [...groups.values()].sort((a,b)=>a.city.localeCompare(b.city)).forEach(g=>{
      if(leafletMap){
        const marker=L.marker([g.lat,g.lng],{icon:L.divIcon({className:"",html:'<div class="culture-marker">'+g.records.length+'</div>',iconSize:[28,28],iconAnchor:[14,14]})}).addTo(leafletMap);
        const popup=el("div");popup.append(el("strong","",g.city),el("p","",g.records.length+" recorded visits · approximate city location"));
        const ul=el("ul");g.records.forEach(r=>{const li=el("li");li.append(link(r.title,href(r)));ul.append(li);});popup.append(ul);marker.bindPopup(popup);
        bounds.push([g.lat,g.lng]);
      }
      const b=el("button","city-item");b.type="button";b.append(el("strong","",g.city),el("span","",g.records.length+" experience"+(g.records.length===1?"":"s")));
      b.addEventListener("click",()=>{if(leafletMap)leafletMap.setView([g.lat,g.lng],11,{animate:true});else window.location.href="./explore.html";});list.append(b);
    });
    if(leafletMap){if(bounds.length===1)leafletMap.setView(bounds[0],10);else leafletMap.fitBounds(bounds,{padding:[45,45],maxZoom:10});}
  }
  function detail(db){
    const host=byId("record-detail"),params=new URLSearchParams(window.location.search),id=params.get("id");
    const r=db.records.find(x=>x.id===id&&x.status==="confirmed");
    if(!r){empty(host,"Experience not found.","This record may have moved or has not been confirmed.", "./explore.html","Back to the archive →");return;}
    document.title=r.title+" | Culture Passport";
    const v=db.venues.find(x=>x.id===r.venueId)||{};
    host.replaceChildren();
    host.append(el("p","eyebrow",r.type.toUpperCase()+" / "+(v.city||"")),
                el("h1","",r.title),el("p","detail-lead",r.summary));
    if(r.favorite){const favorite=el("p","eyebrow","✳ A PERSONAL FAVORITE");host.append(favorite);}if(["dining","bar"].includes(r.type)&&!r.editorial?.awardQualified){host.append(el("div","caveat",r.editorial?.featuredException?"Included as a personal favorite by your explicit choice. No Michelin or James Beard distinction is claimed for this venue.":"This remains a personal memory, not a Michelin / James Beard qualifying record. It is excluded from the default collection until venue-specific recognition is verified."));}
    const grid=el("div","detail-grid");
    for(const [label,value] of [["EXPERIENCE DATE",yearLabel(r)],["LOCATION",[v.city,v.region].filter(Boolean).join(", ")],["VENUE",v.name||r.title],["STATUS",r.visit?.evidenceType==="completed_reservation"?"Completed reservation documented; actual dining unverified":"Confirmed firsthand visit"]]){
      const block=el("div","detail-metric");block.append(el("small","",label),el("strong","",value));grid.append(block);
    }
    host.append(grid);
    if(v.address)host.append(el("p","detail-note","Venue address: "+v.address+". The geographic map currently uses city-level approximate markers."));
    if(r.story&&Array.isArray(r.story.paragraphs)&&r.story.paragraphs.length){
      const section=el("section","experience-story");section.append(el("p","eyebrow","THE STORY BEHIND THE PLACE"),el("h2","",r.story.headline||"A place worth remembering"));
      for(const paragraph of r.story.paragraphs)section.append(el("p","story-paragraph",paragraph));
      if(Array.isArray(r.story.chapters)&&r.story.chapters.length){
        section.append(el("h3","story-subheading","A few chapters in its history"));
        const list=el("div","story-chapters");
        for(const chapter of r.story.chapters){const item=el("div","story-chapter");item.append(el("strong","story-year",chapter.year),el("div","",chapter.title),el("p","",chapter.detail));list.append(item);}
        section.append(list);
      }
      if(Array.isArray(r.story.sourceUrls)&&r.story.sourceUrls.length){
        const sources=el("div","story-sources");sources.append(el("strong","","Historical references: "));
        for(const s of r.story.sourceUrls){const a=link(s.label+" ↗",s.url);a.target="_blank";a.rel="noopener noreferrer";sources.append(a);}
        section.append(sources);
      }
      host.append(section);
    }
    const note=el("div","caveat","Historical accuracy: the date of the visit and the date of external restaurant awards are separate facts. No unknown day is invented.");
    host.append(note);
    const badges=el("div","award-list");
    const g=r.guide;
    if(g&&g.distinction==="starred"){const card=el("div","award-card");card.append(el("strong","","Michelin · "+g.stars+" star"+(g.stars===1?"":"s")+(g.edition?" · "+g.edition+" guide":"")),el("p","","The precise meal date relative to the annual award may be unverified."));if(g.sourceUrl)card.append(link("Michelin source ↗",g.sourceUrl));badges.append(card);}
    else if(g&&g.distinction==="plate"){const card=el("div","award-card");card.append(el("strong","","Michelin · The Plate · "+g.edition),el("p","","The Plate is a historical recommendation, not a Michelin star. Recognition at the exact visit date is unknown."));if(g.sourceUrl)card.append(link("Guide source ↗",g.sourceUrl));badges.append(card);}
    else if(g&&g.distinction==="selected"){const card=el("div","award-card");card.append(el("strong","","Michelin Selected · "+g.edition),el("p","","Guide listing is distinct from Michelin star recognition, and may postdate the visit."));if(g.sourceUrl)card.append(link("Guide source ↗",g.sourceUrl));badges.append(card);}
    for(const award of r.recognitions||[]){const block=el("div","award-card");block.append(el("strong","",award.organization+" · "+award.year+" · "+award.result),el("p","",award.category+" — "+award.recipient));if(award.relationship)block.append(el("p","",award.relationship));if(award.timingRelativeToVisit==="after_visit")block.append(el("p","","Awarded after the remembered visit."));if(award.sourceUrl)block.append(link("Award source ↗",award.sourceUrl));badges.append(block);}
    if(badges.childElementCount){host.append(el("h2","","Recognition & context"),badges);}
    else host.append(el("h2","","Recognition & context"),el("p","detail-note","No Michelin star or James Beard honor is claimed for this visit. Its place in the collection comes from the memory itself."));
  }
  const key="alexford:culture-interview:v1";
  function interview(db){
    const list=byId("interview-list"),progress=byId("interview-progress"),summary=byId("interview-summary"),output=byId("copy-status");
    const areas=all("[data-area]");let active="Baltimore",screen="awards",answers={};
    try{const saved=JSON.parse(localStorage.getItem(key)||"{}");if(saved&&typeof saved==="object"&&!Array.isArray(saved))answers=saved;}catch(_){}
    const locked=(x)=>["confirmed","not_visited","maybe"].includes(x.visitStatus);
    const answer=(x)=>x.visitStatus==="confirmed"?"visited":x.visitStatus==="not_visited"?"not_visited":x.visitStatus==="maybe"?"maybe":answers[x.id];
    const label={visited:"Visited",maybe:"Possibly visited",not_visited:"Did not visit"};
    const statuses=["visited","maybe","not_visited"];
    function persist(){try{localStorage.setItem(key,JSON.stringify(answers));}catch(_){}}
    function updateSummary(){
      const grouped={visited:[],maybe:[],not_visited:[]};
      for(const x of db.candidates){const a=answer(x);if(statuses.includes(a))grouped[a].push(x.area+" — "+x.name+(locked(x)?" (confirmed interview answer)":" (local response)"));}
      const pending=db.candidates.filter(x=>x.userMemoryLead&&!x.userMemoryLead.identityConfirmed);
      summary.value="CULTURE PASSPORT — RESTAURANT AND BAR INTERVIEW\n\n"+statuses.map(s=>label[s]+" ("+grouped[s].length+"):\n"+(grouped[s].map(n=>"• "+n).join("\n")||"None yet")).join("\n\n")+"\n\nVENUE IDENTITY TO CONFIRM:\n"+(pending.map(x=>"• "+x.name+" — "+x.userMemoryLead.recalled).join("\n")||"None")+"\n\nUnverified answers do not appear in the public passport until explicitly reviewed.";
      const completed=db.candidates.filter(x=>statuses.includes(answer(x))).length;
      progress.textContent=completed+" / "+db.candidates.length+" reviewed";persist();
    }
    function render(){
      list.replaceChildren();
      const period=byId("interview-period");if(period)period.textContent=(db.periods&&db.periods[active])?"HISTORICAL INTERVIEW WINDOW  /  "+db.periods[active]:"";
      const candidates=db.candidates.filter(x=>x.area===active&&(screen==="all"||screen==="awards"&&x.screening?.status==="award_qualified"||screen==="leads"&&(x.userMemoryLead&&!x.userMemoryLead.identityConfirmed||x.screening?.status!=="award_qualified")));
      const screeningCount=byId("screening-count");if(screeningCount)screeningCount.textContent=candidates.length+" shown in "+active+" · "+(screen==="awards"?"documented Michelin / James Beard connections":screen==="leads"?"unqualified or unresolved memories":"all historical candidates");
      if(!candidates.length){empty(list,"No candidates in this area yet.","New historically relevant restaurants can be added over time.");return;}
      candidates.forEach((x,i)=>{
        const card=el("article","interview-item");
        card.append(el("span","tag",(x.venueType==="cocktail_bar"?"COCKTAIL BAR ":"RESTAURANT ")+String(i+1).padStart(2,"0")+" / "+x.area),el("h3","",x.name),el("p","",x.interviewCue),el("p","",x.recognition));if(x.screening?.status==="award_qualified")card.append(el("p","qualifies","Award candidate · "+(x.screening.basis==="michelin"?"Michelin Guide":"James Beard")+" · "+(x.screening.sourceTier==="primary"?"primary source":"published reporting")));else card.append(el("p","qualifies neutral","Personal memory / recognition not yet verified"));
        if(x.userMemoryLead&&!x.userMemoryLead.identityConfirmed){card.append(el("p","tag","Identification lead: "+x.userMemoryLead.recalled));}
        if(locked(x)){
          const style=x.visitStatus==="maybe"?"locked maybe":x.visitStatus==="not_visited"?"locked no":"locked";
          card.append(el("div",style,x.visitStatus==="confirmed"?"✓ Confirmed visit"+(x.visitPeriod?" · "+x.visitPeriod:""):x.visitStatus==="not_visited"?"✕ Confirmed not visited":"? Possibly visited, pending confirmation"));
        }else{
          const choices=el("div","choices");choices.setAttribute("role","group");choices.setAttribute("aria-label","Have you visited "+x.name+"?");
          statuses.forEach(status=>{
            const b=el("button",answers[x.id]===status?"active":"",label[status]);b.type="button";b.setAttribute("aria-pressed",String(answers[x.id]===status));
            b.addEventListener("click",()=>{if(answers[x.id]===status)delete answers[x.id];else answers[x.id]=status;output.textContent="";updateSummary();render();});
            choices.append(b);
          });card.append(choices);
        }
        if(x.sourceUrl){const a=link("View restaurant or recognition source ↗",x.sourceUrl,"source-link");a.target="_blank";a.rel="noopener noreferrer";card.append(a);}
        list.append(card);
      });
    }
    const screeningButtons=all("[data-screen]");screeningButtons.forEach(b=>b.addEventListener("click",()=>{screen=b.dataset.screen;screeningButtons.forEach(x=>{const on=x===b;x.classList.toggle("active",on);x.setAttribute("aria-pressed",String(on));});render();}));
    areas.forEach(b=>b.addEventListener("click",()=>{active=b.dataset.area;areas.forEach(x=>{const is=x===b;x.classList.toggle("active",is);x.setAttribute("aria-pressed",String(is));});render();}));
    const tabBox=$(".interview-actions .tabstrip");
    const allAreas=[...new Set(db.candidates.map(x=>x.area))];
    allAreas.filter(a=>!areas.some(b=>b.dataset.area===a)).forEach(a=>{const b=el("button","",a);b.dataset.area=a;b.type="button";b.setAttribute("aria-pressed","false");b.addEventListener("click",()=>{active=a;all("[data-area]").forEach(x=>{const is=x===b;x.classList.toggle("active",is);x.setAttribute("aria-pressed",String(is));});render();});tabBox.append(b);});
    byId("reset-interview").addEventListener("click",()=>{answers={};output.textContent="Local edits cleared; historical confirmed answers are unchanged.";updateSummary();render();});
    byId("copy-interview").addEventListener("click",async()=>{try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(summary.value);output.textContent="Answers copied. Paste them into ChatGPT for review.";}else{summary.focus();summary.select();output.textContent="Select and copy the highlighted answers.";}}catch(_){summary.focus();summary.select();output.textContent="Select and copy the highlighted answers."; }});
    updateSummary();render();
  }
  setActiveNav();
  async function boot(){
    try{
      const r=await fetch("./data/records.json",{cache:"no-cache"});if(!r.ok)throw Error("Records HTTP "+r.status);
      const db=await r.json();
      if(!Array.isArray(db.records)||!Array.isArray(db.venues))throw Error("Invalid culture data");
      if(page==="home")home(db);
      if(page==="explore")explore(db);
      if(page==="timeline")timeline(db);
      if(page==="map")map(db);
      if(page==="record")detail(db);
      if(page==="interview"){
        const q=await fetch("./data/interview.json",{cache:"no-cache"});if(!q.ok)throw Error("Interview HTTP "+q.status);
        const payload=await q.json();if(!Array.isArray(payload.candidates))throw Error("Invalid interview data");
        interview(payload);
      }
    }catch(err){
      const host=byId(page==="home"?"featured-records":page==="explore"?"explore-results":page==="timeline"?"timeline-results":page==="map"?"culture-map":page==="record"?"record-detail":"interview-list");
      if(host)empty(host,"Unable to load the archive.","The records could not be loaded. Try refreshing the page or check the deployment.");
      if(window.console&&console.error)console.error("Culture Passport load error:",err);
    }
  }
  boot();
})();
