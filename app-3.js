(()=>{
  const icon='/pwa-icon.jpg?v=8';
  document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]').forEach(l=>l.href=icon);
  let deferred=null;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const btn=document.createElement('button');btn.id='installPwa';btn.className='install-pwa';btn.textContent='Instalar Bluetooth';if(!standalone())document.getElementById('app')?.appendChild(btn);
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;});
  window.addEventListener('appinstalled',()=>btn.remove());
  btn.addEventListener('click',async()=>{if(deferred){deferred.prompt();try{await deferred.userChoice}catch{}deferred=null;return;}const t=document.getElementById('toast');if(t){t.textContent='Chrome: menú ⋮ → Instalar aplicación';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}});
  ['screenBluetooth','screenAirpods'].forEach(id=>{const s=document.getElementById(id),c=s?.querySelector('.scroll');if(!s||!c)return;const u=()=>s.classList.toggle('scrolled',c.scrollTop>42);c.addEventListener('scroll',u,{passive:true});u();});
  const base=document.createElement('script');base.src='/app-3-base.js?v=8';base.async=false;base.onload=()=>{if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js?v=8').catch(()=>{});};document.body.appendChild(base);
})();
