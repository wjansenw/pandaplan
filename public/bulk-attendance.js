// Loaded by the team overview via dynamic script injection when Edit attendance is enabled.
(function () {
  let participantId = '', categoryId = '', startDate = '', endDate = '';
  function events() {
    if (typeof state === 'undefined' || !state.events) return [];
    return state.events.filter(e => (!categoryId || e.categoryId === categoryId) && (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate));
  }
  function render() {
    const edit = document.getElementById('editAttendance');
    if (!edit || !edit.textContent.startsWith('Done ')) { document.getElementById('bulkAttendance')?.remove(); return; }
    let block = document.getElementById('bulkAttendance');
    if (!block) {
      block = document.createElement('div'); block.id='bulkAttendance'; block.className='card bulk-attendance';
      block.innerHTML='<h2>Bulk attendance</h2><p class="sub">Set attendance for multiple events at once. Nothing changes until you choose an action and confirm it.</p><div class="bulk-fields"><label>Participant<select id="bulkPerson"><option value="">Select a participant…</option></select></label><label>Category<select id="bulkCategory"><option value="">All categories</option></select></label><label>From<input id="bulkFrom" type="date"></label><label>To<input id="bulkTo" type="date"></label></div><div class="bulk-actions"><span id="bulkCount"></span><div><button class="btn" data-bulk="yes">Going</button><button class="btn" data-bulk="maybe">Maybe</button><button class="btn" data-bulk="no">Not going</button></div></div>';
      document.querySelector('.calendar-section')?.insertAdjacentElement('afterend', block);
      const ps=state.persons.filter(p=>Array.isArray(p.roles)&&p.roles.includes('participant')).sort((a,b)=>a.name.localeCompare(b.name));
      ps.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.name;block.querySelector('#bulkPerson').appendChild(o)});
      state.categories.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;block.querySelector('#bulkCategory').appendChild(o)});
      block.querySelector('#bulkPerson').onchange=e=>{participantId=e.target.value;update()};
      block.querySelector('#bulkCategory').onchange=e=>{categoryId=e.target.value;update()};
      block.querySelector('#bulkFrom').onchange=e=>{startDate=e.target.value;update()};
      block.querySelector('#bulkTo').onchange=e=>{endDate=e.target.value;update()};
      block.querySelectorAll('[data-bulk]').forEach(b=>b.onclick=()=>apply(b.dataset.bulk));
    }
    block.querySelector('#bulkPerson').value=participantId; block.querySelector('#bulkCategory').value=categoryId; block.querySelector('#bulkFrom').value=startDate; block.querySelector('#bulkTo').value=endDate; update();
  }
  function update(){const b=document.getElementById('bulkAttendance');if(!b)return;const n=events().length;b.querySelector('#bulkCount').textContent=n+' event'+(n===1?'':'s')+' selected';b.querySelectorAll('[data-bulk]').forEach(x=>x.disabled=!participantId||!n)}
  async function apply(status){
    const list=events(); if(!participantId||!list.length)return;
    if(startDate&&endDate&&startDate>endDate){alert('The start date must not be after the end date.');return}
    const person=state.persons.find(p=>p.id===participantId), category=categoryId&&state.categories.find(c=>c.id===categoryId);
    if(!confirm('Set '+(status==='yes'?'Going':status==='maybe'?'Maybe':'Not going')+' for '+(person?.name||'this participant')+'?\n\n'+(category?.name||'All categories')+' · '+list.length+' events\n'+(startDate||'Any date')+' → '+(endDate||'Any date')+'\n\nThis will change attendance for all matching events.'))return;
    try {
      const result=await api('/api/teams/'+encodeURIComponent(slug)+'/attendance/bulk',{method:'POST',body:JSON.stringify({personId:participantId,status,startDate,endDate,categoryId})});
      if(!state.attendance[participantId])state.attendance[participantId]={}; list.forEach(e=>{const old=state.attendance[participantId][e.id]||{};state.attendance[participantId][e.id]={status,note:old.note||''}});
      window.render(); setTimeout(render,0); setTimeout(()=>{const c=document.getElementById('bulkCount');if(c)c.textContent=(result.updated||0)+' event'+(result.updated===1?'':'s')+' updated'},20);
    } catch(e){console.error(e);alert('Could not save attendance. Please try again.')}
  }
  const original=window.render;
  if(original)window.render=function(){original.apply(this,arguments);render()};
  document.addEventListener('click',e=>{if(e.target.closest('#editAttendance'))setTimeout(render,0)});
  document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='.bulk-attendance{margin-top:16px}.bulk-fields{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}.bulk-fields label{display:flex;flex-direction:column;gap:5px;font-size:.9rem;font-weight:600;min-width:160px}.bulk-fields select,.bulk-fields input{padding:8px 10px;border:1px solid #ccc;border-radius:6px;font:inherit;background:white}.bulk-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:14px}.bulk-actions button{margin-left:6px}.bulk-actions button:disabled{opacity:.5;cursor:not-allowed}';document.head.appendChild(s);setTimeout(render,0)});
})();
