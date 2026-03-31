<script>
(function(){
  const ADMIN_KEY = '144000%';

  // Touch toggle: tap 5 times top-right to show panel
  let tapCount = 0;
  let lastTap = 0;
  const panel = document.createElement('div');
  panel.id = 'goldenDomePanel';
  panel.style.position = 'fixed';
  panel.style.bottom = '10px';
  panel.style.right = '10px';
  panel.style.width = '300px';
  panel.style.height = '250px';
  panel.style.background = 'rgba(0,0,0,0.8)';
  panel.style.color = 'white';
  panel.style.padding = '10px';
  panel.style.zIndex = '9999';
  panel.style.display = 'none';
  panel.style.overflow = 'auto';
  panel.innerHTML = `
    <input type="password" id="goldenKey" placeholder="Enter Golden Dome key" style="width:100%;margin-bottom:5px;">
    <textarea id="goldenCommand" placeholder="Type AI command" style="width:100%;height:100px;"></textarea>
    <button id="goldenRunBtn" style="width:100%;margin-top:5px;">Run Command</button>
    <div id="goldenOutput" style="margin-top:5px;max-height:70px;overflow:auto;"></div>
  `;
  document.body.appendChild(panel);

  document.addEventListener('touchstart', e=>{
    const now = Date.now();
    if(now - lastTap < 500) tapCount++; else tapCount = 1;
    lastTap = now;
    if(tapCount === 5){
      panel.style.display = panel.style.display==='none'?'block':'none';
      tapCount = 0;
    }
  });

  const output = panel.querySelector('#goldenOutput');

  function runCommand(cmd, key){
    if(key !== ADMIN_KEY){ output.innerHTML+="🔒 Invalid key<br>"; return; }
    cmd = cmd.trim();

    if(cmd.startsWith('create ')){
      const name = cmd.split(' ')[1];
      let el = document.createElement('div');
      el.id = name;
      el.className = 'goldenComponent draggable';
      el.style.position='absolute';
      el.style.top='50px';
      el.style.left='50px';
      el.style.padding='10px';
      el.style.background='gold';
      el.style.touchAction='none';
      el.innerText = name;
      document.body.appendChild(el);
      output.innerHTML+=`✅ Created element '${name}'<br>`;
      initDraggable(el);
      if(navigator.vibrate) navigator.vibrate(50);
    }
    else if(cmd.startsWith('edit ')){
      const parts = cmd.split(' ');
      const name = parts[1];
      const content = cmd.split("'")[1];
      const el = document.getElementById(name);
      if(el){ el.innerHTML = content; output.innerHTML+=`✏️ Edited '${name}'<br>`; if(navigator.vibrate) navigator.vibrate(30);}
      else output.innerHTML+=`⚠️ '${name}' not found<br>`;
    }
    else if(cmd.startsWith('delete ')){
      const name = cmd.split(' ')[1];
      const el = document.getElementById(name);
      if(el){ el.remove(); output.innerHTML+=`❌ Deleted '${name}'<br>`; if(navigator.vibrate) navigator.vibrate(40);}
      else output.innerHTML+=`⚠️ '${name}' not found<br>`;
    }
    else{
      try{
        const temp = document.createElement('div');
        temp.innerHTML = cmd;
        document.body.appendChild(temp);
        output.innerHTML+="⚡ Added raw HTML<br>";
        if(navigator.vibrate) navigator.vibrate(20);
      }catch(e){ output.innerHTML+="⚠️ Error<br>"; }
    }
  }

  function initDraggable(el){
    let startX=0,startY=0,origX=0,origY=0,dragging=false;
    el.addEventListener('touchstart', e=>{
      dragging=true;
      startX=e.touches[0].clientX;
      startY=e.touches[0].clientY;
      const rect=el.getBoundingClientRect();
      origX=rect.left;
      origY=rect.top;
    });
    el.addEventListener('touchmove', e=>{
      if(!dragging) return;
      const dx = e.touches[0].clientX-startX;
      const dy = e.touches[0].clientY-startY;
      el.style.left = origX + dx + 'px';
      el.style.top = origY + dy + 'px';
    });
    el.addEventListener('touchend', e=>{ dragging=false; });
  }

  panel.querySelector('#goldenRunBtn').onclick=()=>{
    const key = panel.querySelector('#goldenKey').value;
    const cmd = panel.querySelector('#goldenCommand').value;
    runCommand(cmd,key);
    panel.querySelector('#goldenCommand').value='';
  };

})();
</script>