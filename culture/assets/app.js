(function(){
  "use strict";
  const page=document.body.dataset.page||"home";
  const $=(selector,root=document)=>root.querySelector(selector);
  const all=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined&&text!==null)x.textContent=String(text);return x;};
  const link=(label,url,cls)=>{const a=el("a",cls,label);a.href=url;return a;};
  const byId=(id)=>document.getElementById(id);
  const href=(r)=>"./record.html?id="+encodeURIComponent(r.id);
  // The archive keeps precision; the public UI favors memories and meaningful periods.
  const storyPeriod=(r)=>{
    if(r.memory?.period)return r.memory.period;
    if(r.visit?.year)return String(r.visit.year);
    const yrs=r.visit?.possibleYears||[];
    if(yrs.length===1)return String(yrs[0]);
    if(yrs.length>1)return String(yrs[0])+"–"+String(yrs[yrs.length-1]).slice(-2);
    return "A time worth remembering";
  };
  const storyTeaser=(r)=>r.memory?.teaser||(r.visit?.evidenceType==="completed_reservation"?"A restaurant that surfaced in the reservation archive. Its personal story is still to be told.":r.summary);
  const timelineChapter=(r)=>{
    if(r.visit?.year)return String(r.visit.year);
    const yrs=r.visit?.possibleYears||[];
    return yrs.length?String(yrs[0]):"Other memories";
  };
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
    const h=el("h3","",r.title),description=el("p","",storyTeaser(r));
    const bottom=el("div","record-footer");
    bottom.append(el("span","",storyPeriod(r)+(r.favorite?" · A favorite":"")),el("span","","Open record ↗"));
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
      a.append(el("span","feature-year",timelineChapter(r)==="Other memories"?"✳":timelineChapter(r)));
      const mid=el("div");mid.append(el("strong","",r.title),el("small","",v.city+" · "+(r.memory?.headline||"A place in the collection")));
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
        const content=[r.title,r.summary,r.memory?.headline,r.memory?.teaser,r.memory?.story,v?.city,v?.region,v?.name].join(" ").toLocaleLowerCase();
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
      for(const r of results){const label=timelineChapter(r);if(!grouped.has(label))grouped.set(label,[]);grouped.get(label).push(r);}
      count.textContent=results.length+" recorded experience"+(results.length===1?"":"s");
      host.replaceChildren();
      if(!results.length){empty(host,"Nothing confirmed in this chapter yet.","The timeline is ready for your first verified memory.");return;}
      for(const [label,rows] of grouped){
        const section=el("section","timeline-group"),year=el("div","timeline-year",label),stack=el("div","timeline-stack");
        rows.forEach(r=>{const v=venues.get(r.venueId);const a=link("",href(r),"timeline-entry"),mid=el("div");
          mid.append(el("small","",r.type.toUpperCase()+" · "+v.city+" · "+storyPeriod(r)),el("h3","",r.title),el("p","timeline-memory",storyTeaser(r)));
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
    if(!r){empty(host,"Experience not found.","This record may have moved or has not been confirmed.","./explore.html","Back to the archive →");return;}
    document.title=r.title+" | Culture Passport";
    const v=db.venues.find(x=>x.id===r.venueId)||{},context=r.memory;
    host.replaceChildren();
    host.append(el("p","eyebrow",r.type.toUpperCase()+" / "+(v.city||"")),el("h1","",r.title));
    const period=el("p","memory-period",storyPeriod(r)+" · "+[v.city,v.region].filter(Boolean).join(", "));
    host.append(period);
    if(context){
      host.append(el("h2","memory-heading",context.headline),el("p","memory-quote",context.story));
    }else{
      host.append(el("h2","memory-heading","A page in the collection"),
        el("p","memory-quote",storyTeaser(r)));
    }
    if(r.favorite||r.editorial?.featuredException){
      host.append(el("p","eyebrow memory-favorite","✳ KEPT FOR THE MEMORY"));
    }
    if(["dining","bar"].includes(r.type)&&!r.editorial?.awardQualified){
      host.append(el("p","memory-disclosure",r.editorial?.featuredException?
        "A personal favorite, kept for the experience rather than an award.":
        "A remembered place, with no verified Michelin or James Beard qualification."));
    }
    const badges=el("div","award-list"),g=r.guide;
    if(g?.distinction==="starred"){
      const b=el("div","award-card");b.append(el("strong","","Michelin · "+g.stars+" star"+(g.stars===1?"":"s")),el("p","","Recognition belongs to the restaurant, but may differ from the date of the meal."));if(g.sourceUrl)b.append(link("Guide source ↗",g.sourceUrl));badges.append(b);
    }else if(g?.distinction==="bib"){const b=el("div","award-card");b.append(el("strong","","Michelin Bib Gourmand"),el("p","",g.note||"Michelin recognition for great food at good value, not a Michelin star."));if(g.sourceUrl)b.append(link("Guide source ↗",g.sourceUrl));badges.append(b);}
    else if(g?.distinction==="plate"||g?.distinction==="selected"){
      const b=el("div","award-card");b.append(el("strong","",g.distinction==="plate"?"Michelin · The Plate (historical)":"Michelin Selected"),el("p","","Guide recognition, not a Michelin star. The listing year may differ from the dining year."));if(g.sourceUrl)b.append(link("Guide source ↗",g.sourceUrl));badges.append(b);
    }
    for(const a of r.recognitions||[]){
      if(a.recognitionAtDifferentVenue)continue;
      const b=el("div","award-card");
      b.append(el("strong","",a.organization+" · "+a.category+" · "+a.year),
        el("p","",a.recipient+" · "+a.result));
      if(a.relationship)b.append(el("p","",a.relationship));
      if(a.timingRelativeToVisit==="after_visit")b.append(el("p","","Recognized after the remembered visit."));
      if(a.sourceUrl)b.append(link("Award source ↗",a.sourceUrl));
      badges.append(b);
    }
    if(badges.childElementCount)host.append(el("h2","","Why it stands out"),badges);
    // Retain dates and party size for provenance without making them the story.
    const details=el("details","archive-details"),heading=el("summary","","Archive details & sources"),body=el("div","archive-details-body");
    details.append(heading);
    const note=(label,value)=>{if(!value)return;const row=el("p");row.append(el("strong","",label+" "));row.append(document.createTextNode(String(value)));body.append(row);};
    note("Place:",[v.name||r.title,v.city,v.region].filter(Boolean).join(" · "));
    note("Date on file:",r.visit?.date||r.visit?.label||"Not established");
    if(r.visit?.partySize)note("Reservation party:",r.visit.partySize);
    note("Evidence:",r.visit?.source);
    if(r.visit?.evidenceType==="completed_reservation"||r.visit?.attendanceCertainty==="not_independently_verified")note("Reservation status:","A completed reservation does not independently prove the meal occurred.");
    note("Award context:",r.editorial?.note);
    details.append(body);host.append(details);
  }
  const key="alexford:culture-interview:v1";
  function interview(db){
    const list=byId("interview-list"),progress=byId("interview-progress"),summary=byId("interview-summary"),output=byId("copy-status"),savedStatus=byId("interview-save-status");
    const pageInfo=byId("interview-page-state"),previous=byId("interview-previous"),next=byId("interview-next");
    const batchSize=12,uiKey=key+":navigation";
    let active="Denver Metro",screen="awards",page=0,answers={},storageAvailable=true;
    const labels={visited:"Visited",maybe:"Possibly visited",not_visited:"Did not visit"};
    const statuses=["visited","maybe","not_visited"];
    const locked=(x)=>["confirmed","not_visited","maybe"].includes(x.visitStatus);
    const answer=(x)=>x.visitStatus==="confirmed"?"visited":x.visitStatus==="not_visited"?"not_visited":x.visitStatus==="maybe"?"maybe":answers[x.id];
    const included=db.candidates.filter(x=>!x.excludedFromPublication);
    try{
      const saved=JSON.parse(localStorage.getItem(key)||"{}");
      if(saved&&typeof saved==="object"&&!Array.isArray(saved))answers=saved;
      const nav=JSON.parse(localStorage.getItem(uiKey)||"{}");
      if(included.some(x=>x.area===nav.area))active=nav.area;
      if(["awards","leads","all"].includes(nav.screen))screen=nav.screen;
      if(Number.isInteger(nav.page)&&nav.page>=0)page=nav.page;
    }catch(_){storageAvailable=false;}
    const persist=()=>{
      try{
        localStorage.setItem(key,JSON.stringify(answers));
        localStorage.setItem(uiKey,JSON.stringify({area:active,screen,page}));
        storageAvailable=true;
      }catch(_){storageAvailable=false;}
      if(savedStatus)savedStatus.textContent=storageAvailable?"Your responses are saved in this browser.":"Browser storage is unavailable; copy your answers below to preserve them.";
    };
    const candidateFilter=(x)=>x.area===active&&(screen==="all"||screen==="awards"&&x.screening?.status==="award_qualified"||screen==="leads"&&(x.userMemoryLead&&!x.userMemoryLead.identityConfirmed||x.screening?.status!=="award_qualified"));
    const relevant=()=>included.filter(candidateFilter);
    const tabBox=$(".interview-actions .tabstrip");
    const allAreas=[...new Set(included.map(x=>x.area))];
    allAreas.filter(a=>!all("[data-area]").some(b=>b.dataset.area===a)).forEach(a=>{
      const b=el("button","",a);b.dataset.area=a;b.type="button";b.setAttribute("aria-pressed","false");tabBox.append(b);
    });
    const areaButtons=all("[data-area]"),screeningButtons=all("[data-screen]");
    const syncTabs=()=>{
      areaButtons.forEach(b=>{const on=b.dataset.area===active;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));});
      screeningButtons.forEach(b=>{const on=b.dataset.screen===screen;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));});
    };
    const updateSummary=()=>{
      const grouped={visited:[],maybe:[],not_visited:[]};
      for(const x of included){const a=answer(x);if(statuses.includes(a))grouped[a].push(x.area+" — "+x.name+(locked(x)?" (confirmed interview answer)":" (saved response)"));}
      const pending=included.filter(x=>x.userMemoryLead&&!x.userMemoryLead.identityConfirmed);
      summary.value="CULTURE PASSPORT — RESTAURANT AND BAR INTERVIEW\n\n"+statuses.map(s=>labels[s]+" ("+grouped[s].length+"):\n"+(grouped[s].map(n=>"• "+n).join("\n")||"None yet")).join("\n\n")+"\n\nVENUE IDENTITY TO CONFIRM:\n"+(pending.map(x=>"• "+x.name+" — "+x.userMemoryLead.recalled).join("\n")||"None")+"\n\nYour editable responses are saved locally and do not publish to the public passport automatically.";
      const completed=included.filter(x=>statuses.includes(answer(x))).length;
      const local=Object.keys(answers).filter(id=>included.some(c=>c.id===id)).length;
      progress.textContent=completed+" / "+included.length+" reviewed · "+local+" local answers";
    };
    const updatePagination=(count)=>{
      const pages=Math.max(1,Math.ceil(count/batchSize));
      if(page>=pages)page=pages-1;
      if(previous)previous.disabled=page===0;
      if(next)next.disabled=page>=pages-1;
      if(pageInfo)pageInfo.textContent=count?"Batch "+(page+1)+" of "+pages+" · "+(page*batchSize+1)+"–"+Math.min(count,(page+1)*batchSize)+" of "+count+" places":"No places in this selection";
    };
    function render(){
      const candidates=relevant();
      updatePagination(candidates.length);
      syncTabs();
      list.replaceChildren();
      const period=byId("interview-period");
      if(period)period.textContent=db.periods?.[active]?"HISTORICAL INTERVIEW WINDOW / "+db.periods[active]:"";
      const sc=byId("screening-count");
      if(sc)sc.textContent=candidates.length+" in "+active+" · "+(screen==="awards"?"Michelin / James Beard candidates":screen==="leads"?"memory leads":"all historical candidates");
      if(!candidates.length){
        empty(list,"No candidates in this selection.","Switch between Michelin / James Beard, Memory leads, and All candidates.");
        persist();return;
      }
      const slice=candidates.slice(page*batchSize,(page+1)*batchSize);
      slice.forEach((x,i)=>{
        const card=el("article","interview-item");
        card.append(el("span","tag",(x.venueType==="cocktail_bar"?"COCKTAIL BAR ":"RESTAURANT ")+String(page*batchSize+i+1).padStart(2,"0")+" / "+x.area),
          el("h3","",x.name),el("p","",x.interviewCue),el("p","",x.recognition));
        if(x.screening?.status==="award_qualified")card.append(el("p","qualifies","Award candidate · "+(x.screening.basis==="michelin"?"Michelin Guide":"James Beard")));
        else card.append(el("p","qualifies neutral","Personal memory / recognition not yet verified"));
        if(x.userMemoryLead&&!x.userMemoryLead.identityConfirmed)card.append(el("p","tag","Identification lead: "+x.userMemoryLead.recalled));
        if(locked(x)){
          const style=x.visitStatus==="maybe"?"locked maybe":x.visitStatus==="not_visited"?"locked no":"locked";
          card.append(el("div",style,x.visitStatus==="confirmed"?"✓ Confirmed visit"+(x.visitPeriod?" · "+x.visitPeriod:""):x.visitStatus==="not_visited"?"✕ Confirmed not visited":"? Possibly visited, pending confirmation"));
        }else{
          const choices=el("div","choices");
          choices.setAttribute("role","group");choices.setAttribute("aria-label","Have you visited "+x.name+"?");
          const buttons={};
          for(const status of statuses){
            const b=el("button",answers[x.id]===status?"active":"",labels[status]);
            b.type="button";b.setAttribute("aria-pressed",String(answers[x.id]===status));
            buttons[status]=b;
            b.addEventListener("click",()=>{
              if(answers[x.id]===status)delete answers[x.id];else answers[x.id]=status;
              for(const s of statuses){const selected=answers[x.id]===s;buttons[s].classList.toggle("active",selected);buttons[s].setAttribute("aria-pressed",String(selected));}
              // Crucially, do not rebuild the card or page after answering: this preserves focus and scroll.
              output.textContent="";
              updateSummary();persist();
            });
            choices.append(b);
          }
          card.append(choices);
        }
        if(x.sourceUrl){const a=link("Source / restaurant ↗",x.sourceUrl,"source-link");a.target="_blank";a.rel="noopener noreferrer";card.append(a);}
        list.append(card);
      });
      persist();
    }
    for(const b of areaButtons)b.addEventListener("click",()=>{active=b.dataset.area;page=0;render();});
    for(const b of screeningButtons)b.addEventListener("click",()=>{screen=b.dataset.screen;page=0;render();});
    if(previous)previous.addEventListener("click",()=>{if(page>0){page--;render();}});
    if(next)next.addEventListener("click",()=>{if((page+1)*batchSize<relevant().length){page++;render();}});
    byId("reset-interview").addEventListener("click",()=>{
      if(!window.confirm("Clear your locally saved interview answers? Historical confirmed responses will remain."))return;
      answers={};output.textContent="Local edits cleared; historical answers are unchanged.";updateSummary();render();
    });
    byId("copy-interview").addEventListener("click",async()=>{
      try{
        if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(summary.value);output.textContent="Answers copied. Paste them into ChatGPT for review.";}
        else {summary.focus();summary.select();output.textContent="Select and copy the highlighted answers.";}
      }catch(_){summary.focus();summary.select();output.textContent="Select and copy the highlighted answers.";}
    });
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
