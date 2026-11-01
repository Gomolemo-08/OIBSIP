(function(){
  const $ = id => document.getElementById(id);
  const outEl=$('out'), exprEl=$('expr').firstElementChild;
  const MAX_DIGITS=15;
  let tokens=[];        // numbers (strings) and operators, alternating
  let cur='0';          // number being typed; '' means waiting for the next operand
  let done=false;       // true right after "="
  let error='';
  let history=[];

  /* ---------- Safe storage ---------- */
  const store={
    get(k){try{return localStorage.getItem(k)}catch(e){return null}},
    set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  };

  /* ---------- Custom expression evaluator (no eval) ---------- */
  function evaluate(list){
    // Pass 1: × and ÷ (higher precedence)
    const stack=[parseFloat(list[0])];
    for(let i=1;i<list.length;i+=2){
      const op=list[i], n=parseFloat(list[i+1]);
      if(op==='×'){stack.push(stack.pop()*n);}
      else if(op==='÷'){
        if(n===0) throw new Error('Cannot divide by zero');
        stack.push(stack.pop()/n);
      }else{stack.push(op==='+'?'+':'-');stack.push(n);}
    }
    // Pass 2: + and − left to right
    let total=stack[0];
    for(let i=1;i<stack.length;i+=2){
      const n=stack[i+1];
      switch(stack[i]){case '+':total+=n;break;case '-':total-=n;break;}
    }
    return parseFloat(total.toPrecision(12));
  }

  /* ---------- Formatting ---------- */
  function fmt(s){
    if(s===''||s==null) return '';
    if(/e/i.test(s)) return s;
    const neg=s[0]==='-'; if(neg) s=s.slice(1);
    const [i,d]=s.split('.');
    const grouped=i.replace(/\B(?=(\d{3})+(?!\d))/g,',');
    return (neg?'−':'')+grouped+(d!==undefined?'.'+d:'');
  }
  function render(){
    outEl.classList.toggle('err',!!error);
    if(error){outEl.textContent=error;exprEl.textContent='';return;}
    const shown=cur!==''?cur:tokens[tokens.length-2];
    outEl.textContent=fmt(shown);
    const len=outEl.textContent.length;
    outEl.style.fontSize=len>13?'26px':len>10?'34px':'';
    exprEl.textContent=tokens.map((t,i)=>i%2?t:fmt(t)).join(' ');
  }

  /* ---------- Actions ---------- */
  function clearAll(){tokens=[];cur='0';done=false;error='';}
  function digit(d){
    if(error||done){clearAll();}
    if(cur==='0') cur=d;
    else if(cur.replace(/[-.]/g,'').length<MAX_DIGITS) cur+=d;
  }
  function dot(){
    if(error||done){clearAll();}
    if(cur==='') cur='0.';
    else if(!cur.includes('.')) cur+='.';
  }
  function operator(op){
    if(error) return;
    if(done){tokens=[];done=false;}
    if(cur===''){tokens[tokens.length-1]=op;return;}   // swap operator
    tokens.push(cur,op);cur='';
  }
  function equals(){
    if(error||done||tokens.length===0) return;
    const list=tokens.slice();
    if(cur==='') list.pop(); else list.push(cur);
    if(list.length===0) return;
    const expr=list.map((t,i)=>i%2?t:fmt(t)).join(' ');
    try{
      const res=String(evaluate(list));
      addHistory(expr,res);
      tokens=[];cur=res;done=true;
    }catch(e){
      error=e.message;tokens=[];cur='0';done=false;
    }
  }
  function backspace(){
    if(error){clearAll();return;}
    if(done){tokens=[];done=false;cur='0';return;}
    if(cur!==''){cur=cur.length>1&&!(cur.length===2&&cur[0]==='-')?cur.slice(0,-1):'0';}
    else{tokens.pop();cur=tokens.pop()||'0';}   // remove operator, resume editing previous number
  }
  function percent(){
    if(error||cur==='') return;
    cur=String(parseFloat((parseFloat(cur)/100).toPrecision(12)));
  }
  function negate(){
    if(error||cur===''||cur==='0') return;
    cur=cur[0]==='-'?cur.slice(1):'-'+cur;
  }
  function press(k){
    if(/^[0-9]$/.test(k)) digit(k);
    else switch(k){
      case '.': dot();break;
      case '+': case '−': case '×': case '÷': operator(k);break;
      case '=': equals();break;
      case 'C': clearAll();break;
      case 'Backspace': backspace();break;
      case '%': percent();break;
      case '±': negate();break;
    }
    render();
  }

  /* ---------- Buttons ---------- */
  $('keys').addEventListener('click',e=>{
    const b=e.target.closest('.key'); if(b) press(b.dataset.k);
  });

  /* ---------- Keyboard ---------- */
  const keyMap={'*':'×','x':'×','X':'×','/':'÷','-':'−','+':'+','Enter':'=','=':'=','Backspace':'Backspace','Delete':'C','Escape':'C','c':'C','C':'C','.':'.',',':'.','%':'%'};
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey) return;
    if($('history').classList.contains('open')){if(e.key==='Escape')toggleHistory(false);return;}
    let k=/^[0-9]$/.test(e.key)?e.key:keyMap[e.key];
    if(!k) return;
    e.preventDefault();
    press(k);
    const btn=document.querySelector('.key[data-k="'+k+'"]');
    if(btn){btn.classList.add('press');setTimeout(()=>btn.classList.remove('press'),110);}
  });

  /* ---------- History ---------- */
  function addHistory(expr,res){
    history.unshift({expr,res});
    history=history.slice(0,50);
    store.set('calc-history',JSON.stringify(history));
    renderHistory();
  }
  function renderHistory(){
    const list=$('histList');list.innerHTML='';
    if(!history.length){
      const p=document.createElement('p');p.className='empty';
      p.textContent='No calculations yet. Results appear here after you press =.';
      list.appendChild(p);return;
    }
    history.forEach(h=>{
      const li=document.createElement('li');
      const b=document.createElement('button');b.className='hist-item';
      const s=document.createElement('small');s.textContent=h.expr+' =';
      const r=document.createElement('b');r.textContent=fmt(h.res);
      b.append(s,r);
      b.addEventListener('click',()=>{clearAll();cur=h.res;render();toggleHistory(false);});
      li.appendChild(b);list.appendChild(li);
    });
  }
  function toggleHistory(open){
    const h=$('history');h.classList.toggle('open',open);
    h.setAttribute('aria-hidden',String(!open));
    if(open) $('closeHist').focus(); else $('histBtn').focus();
  }
  $('histBtn').addEventListener('click',()=>toggleHistory(true));
  $('closeHist').addEventListener('click',()=>toggleHistory(false));
  $('clearHist').addEventListener('click',()=>{history=[];store.set('calc-history','[]');renderHistory();});

  /* ---------- Theme ---------- */
  function applyTheme(t){document.documentElement.setAttribute('data-theme',t);}
  $('themeBtn').addEventListener('click',()=>{
    const root=document.documentElement;
    const isDark=root.getAttribute('data-theme')==='dark';
    const next=isDark?'light':'dark';
    applyTheme(next);store.set('calc-theme',next);
  });
  const savedTheme=store.get('calc-theme');
  if(savedTheme) applyTheme(savedTheme);
  else if(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches) applyTheme('dark');

  try{const h=JSON.parse(store.get('calc-history')||'[]');if(Array.isArray(h)) history=h;}catch(e){}
  renderHistory();render();
})();
