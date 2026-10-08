/* VANGUARD | car.js : one controller, one DOMContentLoaded, zero duplicate handlers */
document.addEventListener('DOMContentLoaded', () => {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasIO = 'IntersectionObserver' in window;

    /* ---------- 1. Seamless marquee (clones are hidden from screen readers) ---------- */
    $$('.logo-track').forEach(track => {
        [...track.children].forEach(item => {
            const c = item.cloneNode(true);
            c.setAttribute('aria-hidden', 'true');
            track.appendChild(c);
        });
    });

    /* ---------- 2. Scroll reveal + card stagger index ---------- */
    $$('.services-grid, .preview-cards-track').forEach(p => [...p.children].forEach((c, i) => c.style.setProperty('--i', i)));
    const revealEls = $$('.reveal-on-scroll');
    if (hasIO) {
        const io = new IntersectionObserver((entries, o) => entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('is-visible'); o.unobserve(e.target); }
        }), { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
        revealEls.forEach(el => io.observe(el));
    } else revealEls.forEach(el => el.classList.add('is-visible'));

    /* ---------- 3. Pause background videos while off-screen ---------- */
    if (hasIO) {
        const vio = new IntersectionObserver(es => es.forEach(e => {
            const v = e.target;
            if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
        }), { threshold: 0.05 });
        $$('.hero-video, .section-video-bg').forEach(v => vio.observe(v));
    }

    /* ---------- 4. Counters ---------- */
    const count = el => {
        const to = +el.dataset.count, from = +(el.dataset.from ?? 0), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
        if (reduce) { el.textContent = to.toFixed(dec) + suf; return; }
        const t0 = performance.now();
        (function f(t) {
            const p = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - p, 3);
            el.textContent = (from + (to - from) * e).toFixed(dec) + suf;
            if (p < 1) requestAnimationFrame(f);
        })(t0);
    };
    const resetCount = el => { el.textContent = (+(el.dataset.from ?? 0)).toFixed(+(el.dataset.dec || 0)) + (el.dataset.suffix || ''); };
    const heroStat = $('[data-hero]');
    if (heroStat && !reduce) { resetCount(heroStat); setTimeout(() => count(heroStat), 1300); }

    /* ---------- 5. Sticky glass nav, progress bar, hero parallax, scroll-spy ---------- */
    const hero = $('#hero'), bar = $('#scrollProgress');
    const sticky = document.createElement('header');
    sticky.className = 'sticky-nav';
    sticky.innerHTML = $('.logo-container').outerHTML + $('.nav-links').outerHTML + $('.nav-actions .btn-primary').outerHTML;
    $$('.intro-anim', sticky).forEach(e => { e.className = e.className.replace(/\b(intro-anim|anim-delay-\d)\b/g, '').trim(); });
    $('.logo-container', sticky).addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(sticky);

    const spyLinks = $$('.nav-links a');
    const spyTargets = [...new Set(spyLinks.map(a => a.getAttribute('href')))].map(h => $(h)).filter(Boolean);
    let ticking = false;
    const onScroll = () => {
        const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        hero.style.setProperty('--hp', Math.min(1, y / (hero.offsetHeight * 0.8)).toFixed(3));
        sticky.classList.toggle('show', y > hero.offsetHeight * 0.7);
        let active = spyTargets[0];
        spyTargets.forEach(s => { if (s.getBoundingClientRect().top <= innerHeight * 0.4) active = s; });
        if (max - y < 40) active = spyTargets[spyTargets.length - 1];
        spyLinks.forEach(a => a.classList.toggle('is-active', active && a.getAttribute('href') === '#' + active.id));
        ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
    $('.scroll-prompt')?.addEventListener('click', () => $('#brand-showcase').scrollIntoView({ behavior: 'smooth' }));

    /* ---------- 6. Language dropdown (works on touch too) ---------- */
    const dd = $('.language-dropdown');
    if (dd) {
        $('.language-btn', dd).addEventListener('click', e => { e.stopPropagation(); dd.classList.toggle('open'); });
        $$('.language-options a', dd).forEach(a => a.addEventListener('click', e => {
            e.preventDefault();
            $$('.language-options a', dd).forEach(x => x.classList.remove('active'));
            a.classList.add('active');
            $('.language-btn span', dd).textContent = a.textContent.includes('Arabic') ? 'AR' : 'EN';
            dd.classList.remove('open');
        }));
        document.addEventListener('click', () => dd.classList.remove('open'));
    }

    /* ---------- 7. Engine start (synthesised V8, no audio file needed) ---------- */
    const engBtn = $('#engine-sound-btn');
    let ac, eng = null;
    const stopEngine = () => {
        if (!eng) return;
        const { g, nodes } = eng, t = ac.currentTime;
        g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.5);
        nodes.forEach(n => n.stop(t + 0.55));
        eng = null; engBtn.classList.remove('is-on'); $('.sound-text', engBtn).textContent = 'START ENGINE';
    };
    const startEngine = () => {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        ac.resume();
        const t = ac.currentTime, g = ac.createGain(), lp = ac.createBiquadFilter();
        lp.type = 'lowpass'; lp.Q.value = 6;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.32, t + 0.35);
        const o1 = ac.createOscillator(), o2 = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain();
        o1.type = 'sawtooth'; o2.type = 'square'; lfo.frequency.value = 9; lg.gain.value = 0.1;
        [[o1, 38], [o2, 57]].forEach(([o, f]) => {
            o.frequency.setValueAtTime(f * 0.8, t);
            o.frequency.exponentialRampToValueAtTime(f * 2.6, t + 0.7);
            o.frequency.exponentialRampToValueAtTime(f * 1.1, t + 1.7);
            o.connect(lp);
        });
        lp.frequency.setValueAtTime(300, t);
        lp.frequency.exponentialRampToValueAtTime(1500, t + 0.7);
        lp.frequency.exponentialRampToValueAtTime(480, t + 1.7);
        lfo.connect(lg); lg.connect(g.gain); lp.connect(g); g.connect(ac.destination);
        const nodes = [o1, o2, lfo]; nodes.forEach(n => n.start(t));
        eng = { g, nodes };
        engBtn.classList.add('is-on'); $('.sound-text', engBtn).textContent = 'ENGINE LIVE · STOP';
        setTimeout(stopEngine, 7000);
    };
    engBtn?.addEventListener('click', () => (eng ? stopEngine() : startEngine()));

    /* ---------- 8. HUD search + filter chips (single handler) ---------- */
    const input = $('#hudSearch'), status = $('#hudStatus'), cards = $$('.tactical-card'), chips = $$('.chip[data-scope]');
    let scope = 'all';
    const haystack = c => {
        const t = $('h3', c).textContent, d = $('.card-desc', c).textContent, s = $('.spec-grid', c).textContent, k = c.dataset.category || '';
        return ({ brand: t.split(' ')[0], model: t, horsepower: s, capacity: s + ' ' + d }[scope] || [t, d, s, k].join(' ')).toLowerCase();
    };
    const filter = () => {
        const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
        let n = 0;
        cards.forEach(c => {
            const ok = terms.every(w => haystack(c).includes(w));
            clearTimeout(c._t);
            if (ok) { n++; c.style.display = ''; void c.offsetWidth; c.classList.remove('is-out'); }
            else { c.classList.add('is-out'); c._t = setTimeout(() => { c.style.display = 'none'; }, 280); }
        });
        status.textContent = terms.length ? (n ? `${n} OF ${cards.length} VEHICLES MATCH` : 'NO MATCH. TRY A BRAND, MODEL OR SPEC') : '';
    };
    if (input) {
        input.addEventListener('input', filter);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') $('.preview-cards-track').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
        $('#hudGo')?.addEventListener('click', () => { filter(); $('.preview-cards-track').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
        chips.forEach(ch => ch.addEventListener('click', () => {
            chips.forEach(x => x.classList.remove('active')); ch.classList.add('active');
            scope = ch.dataset.scope; filter();
        }));
    }

    /* ---------- 9. 3D card tilt + glare (mouse only) ---------- */
    if (!reduce) cards.forEach(c => {
        c.addEventListener('pointermove', e => {
            if (e.pointerType !== 'mouse') return;
            const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
            c.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
            c.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
            c.style.setProperty('--gx', (x * 100).toFixed(0) + '%');
            c.style.setProperty('--gy', (y * 100).toFixed(0) + '%');
        });
        c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });

    /* ---------- 10. Telematics card: tap/keyboard toggle + live speed ---------- */
    const map = $('.map-interactive-card'), speed = $('.speed-readout');
    if (map) {
        const tog = () => map.classList.toggle('engaged');
        map.addEventListener('click', tog);
        map.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } });
        setInterval(() => { if (speed && (map.matches(':hover') || map.classList.contains('engaged'))) speed.textContent = (108 + Math.round(Math.random() * 10)) + ' KM/H'; }, 1100);
    }

    /* ---------- 11. About story: video-time-locked timeline ---------- */
    const story = $('#about-story'), vid = $('#aboutVideo'), L = $('#aboutLeftText'), Rt = $('#aboutRightText');
    if (story && vid) {
        let shown = false, finished = false;
        const show = () => {
            if (shown) return; shown = true;
            L.classList.add('text-active'); Rt.classList.add('text-active');
            $$('[data-count]', Rt).forEach((el, i) => setTimeout(() => count(el), 700 + i * 250));
        };
        const hide = () => {
            shown = false; L.classList.remove('text-active'); Rt.classList.remove('text-active');
            $$('[data-count]', Rt).forEach(resetCount);
        };
        const check = () => {
            const end = Math.min(13, (vid.duration || 13) - 0.15);
            if (vid.currentTime >= 1.5) show();
            if (vid.currentTime >= end) { vid.pause(); finished = true; show(); }
        };
        vid.addEventListener('play', () => { const tick = () => { if (!vid.paused) { check(); requestAnimationFrame(tick); } }; requestAnimationFrame(tick); });
        vid.addEventListener('ended', () => { finished = true; show(); });
        vid.addEventListener('loadeddata', () => { if (!vid.currentTime) vid.currentTime = 0.01; });
        if (hasIO) {
            new IntersectionObserver(es => es.forEach(e => {
                if (e.intersectionRatio >= 0.6 && !finished && vid.paused) {
                    vid.play().catch(() => setTimeout(show, 1500));
                } else if (e.intersectionRatio === 0) {
                    vid.pause(); vid.currentTime = 0.01; finished = false; hide();
                }
            }), { threshold: [0, 0.6] }).observe(story);
        } else show();
        if (reduce) show();
    }
});

/* ---------- shared energy: spotlight, cursor, hero mouse depth ---------- */
document.addEventListener('DOMContentLoaded',()=>{
  const root=document.documentElement,cur=document.getElementById('cur'),hero=document.getElementById('hero');
  let tx=0,ty=0,cx=0,cy=0,px=innerWidth/2,py=innerHeight/2;
  addEventListener('pointermove',e=>{tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5;px=e.clientX;py=e.clientY;
    root.style.setProperty('--mx',px+'px');root.style.setProperty('--my',py+'px')},{passive:true});
  document.querySelectorAll('a,button,.tactical-card,.map-interactive-card').forEach(el=>{
    el.addEventListener('pointerenter',()=>cur?.classList.add('big'));el.addEventListener('pointerleave',()=>cur?.classList.remove('big'))});
  const loop=()=>{cx+=(tx-cx)*.07;cy+=(ty-cy)*.07;
    if(hero){hero.style.setProperty('--tx',cx.toFixed(3));hero.style.setProperty('--ty',cy.toFixed(3))}
    if(cur)cur.style.transform=`translate(${px}px,${py}px)`;requestAnimationFrame(loop)};
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)loop();
});

/* shared page wipe: cover on leave, reveal on arrive */
(()=>{const w=document.getElementById('wipe');if(!w)return;
 if(sessionStorage.getItem('wipe')){sessionStorage.removeItem('wipe');w.classList.add('hold');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{w.classList.remove('hold');w.classList.add('out')}))}
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||a.target)return;
  const u=a.getAttribute('href');if(!/^(car|carts)\.html(#.*)?$/.test(u))return;
  e.preventDefault();sessionStorage.setItem('wipe','1');w.classList.add('cover');setTimeout(()=>location.href=u,520)});
 addEventListener('pageshow',e=>{if(e.persisted){w.className='wipe'}})})();