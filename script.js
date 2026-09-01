document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTS ---
    const menuToggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav');
    const navLinks = document.querySelectorAll('.nav a.item');
    const navGroups = document.querySelectorAll('.nav .navgroup');
    const tabContents = document.querySelectorAll('.tabcontent');

    // --- STATE & HELPERS ---
    // Mobile: the <nav> itself is the full-screen panel (see the responsive block in style.css).
    const closeMenu = () => {
        nav.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    const activateTab = (targetId) => {
        // Guard: an unknown or non-tab hash (#join-us, #Members summary, a typo, a stale link) must not
        // deactivate every tab and leave a blank screen. Fall back to Home unless targetId names a real tab.
        const match = document.getElementById(targetId);
        if (!match || !match.classList.contains('tabcontent')) targetId = 'Home';

        // Deactivate all tabs and links
        tabContents.forEach(tab => tab.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));
        navGroups.forEach(group => { group.classList.remove('active'); group.classList.remove('open'); });

        // Activate the target tab
        const targetTab = document.getElementById(targetId);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Activate the corresponding nav link
        const activeLink = document.querySelector(`.nav a[href="#${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');

            // If the link lives in the Members dropdown, mark that group active
            activeLink.closest('.navgroup')?.classList.add('active');
        }
        // Scroll to the top of the page
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });

        // Home chrome: at the very top of Home the bar floats over the hero (no plate).
        homeActive = (targetId === 'Home');
        updateHomeChrome();

        // Nudge scroll-linked (Motion) animations to re-measure the newly shown tab,
        // which was display:none until now (otherwise offsets can be stale).
        requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    };

    // --- HOME TOP CHROME ---
    // On Home, the fixed top bar is transparent at the very top of the hero and
    // gains its white plate + hairline rule once the user scrolls (see body.home-top in style.css).
    let homeActive = false;
    const revealThreshold = () => window.innerHeight * 0.2;
    const updateHomeChrome = () => {
        document.body.classList.toggle('home-top', homeActive && window.scrollY < revealThreshold());
    };


    // --- EVENT LISTENERS ---

    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const willOpen = !nav.classList.contains('open');
            nav.classList.toggle('open', willOpen);
            menuToggle.classList.toggle('open', willOpen);
            menuToggle.setAttribute('aria-expanded', String(willOpen));
            document.body.style.overflow = willOpen ? 'hidden' : '';
        });
    }

    // Members dropdown: hover/focus open it via CSS; this handles click + touch on desktop.
    navGroups.forEach((group) => {
        const label = group.querySelector('.navgroup-label');
        label?.addEventListener('click', () => {
            const willOpen = !group.classList.contains('open');
            navGroups.forEach(g => g.classList.remove('open'));
            group.classList.toggle('open', willOpen);
            label.setAttribute('aria-expanded', String(willOpen));
        });
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navgroup')) navGroups.forEach(g => g.classList.remove('open'));
    });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        navGroups.forEach(g => g.classList.remove('open'));
        closeMenu();
    });

    // Swap the bar's plate in/out as the user scrolls on Home (see updateHomeChrome).
    window.addEventListener('scroll', updateHomeChrome, { passive: true });
    window.addEventListener('resize', updateHomeChrome);

    // Automatic hash-based tab activation on page load
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash) {
        activateTab(currentHash);
    } else {
        activateTab('Home'); // Default tab
    }

    // Handle all navigation clicks (nav links + the logo, which routes Home)
    document.getElementById('topbar').addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (!target || !(target.classList.contains('item') || target.classList.contains('topbar-brand'))) return;

        e.preventDefault();
        const targetId = target.getAttribute('href').replace('#', '');
        
        // Update URL hash without jumping
        history.pushState(null, null, `#${targetId}`);
        
        activateTab(targetId);
        closeMenu();
    });

    // Handle home page button clicks to navigate to other tabs
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('a.btn');
        if (!target) return;

        const targetId = target.getAttribute('href')?.replace('#', '');
        if (targetId && document.getElementById(targetId)) {
            e.preventDefault();
            history.pushState(null, null, `#${targetId}`);
            activateTab(targetId);
        }
    });

    // Handle back/forward browser navigation
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.replace('#', '') || 'Home';
        activateTab(hash);
    });

    // Update copyright year
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- LAB AUTHOR EMPHASIS (publications) ---
    // Single source of truth: to feature a member's works, add their exact
    // citation token (surname + initials, e.g. "Park JH") below. Names are
    // matched as whole author entries, so ambiguous initials (e.g. "Kim H")
    // only get highlighted if you list them here. Trailing */# are preserved.
    const LAB_AUTHORS = new Set([
        'Park JH',        // Ji Hwan Park (PI)
        // 'Park G',      // Gunwoo Park
        // 'Um ES',       // Eunsol Um
        // 'Jang DM',     // Dongmin Jang
        // ...add lab members here (verify each token against the author list)
    ]);

    const emphasizeLabAuthors = () => {
        document.querySelectorAll('.pub-authors').forEach((el) => {
            let html = el.textContent;
            LAB_AUTHORS.forEach((tok) => {
                const esc = tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const re = new RegExp('(^|,\\s*)(' + esc + ')(?=[#*,.\\s]|$)', 'g');
                html = html.replace(re, (_m, pre, name) => `${pre}<span class="lab-author">${name}</span>`);
            });
            el.innerHTML = html;
        });
    };
    emphasizeLabAuthors();

    // --- SCROLL REVEAL (pnucolab-style smooth entrance; plain IntersectionObserver, no library) ---
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length && 'IntersectionObserver' in window) {
        revealEls.forEach((el) => el.classList.add('reveal-armed'));  // hide only now that JS is confirmed running
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) { e.target.classList.add('reveal-in'); io.unobserve(e.target); }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        revealEls.forEach((el) => io.observe(el));
    }
    // no IntersectionObserver / no JS: elements stay unarmed = visible (never hide content behind JS)

});
