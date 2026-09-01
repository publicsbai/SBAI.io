document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTS ---
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const navLinks = document.querySelectorAll('.nav a.item');
    const detailsElements = document.querySelectorAll('.nav details');
    const tabContents = document.querySelectorAll('.tabcontent');
    const banner = document.querySelector('.banner');

    // --- STATE & HELPERS ---
    const closeSidebar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    };

    const activateTab = (targetId) => {
        // Guard: an unknown or non-tab hash (#join-us, #Members summary, a typo, a stale link) must not
        // deactivate every tab and leave a blank screen. Fall back to Home unless targetId names a real tab.
        const match = document.getElementById(targetId);
        if (!match || !match.classList.contains('tabcontent')) targetId = 'Home';

        // Hide the top banner on the Home tab for a cleaner look; show it on other tabs.
        if (banner) banner.style.display = (targetId === 'Home') ? 'none' : '';

        // Deactivate all tabs and links
        tabContents.forEach(tab => tab.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));
        detailsElements.forEach(detail => detail.querySelector('summary')?.classList.remove('active'));

        // Activate the target tab
        const targetTab = document.getElementById(targetId);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Activate the corresponding nav link
        const activeLink = document.querySelector(`.nav a[href="#${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');

            // If inside 'details', open it and highlight the summary
            const parentDetails = activeLink.closest('details');
            if (parentDetails) {
                parentDetails.open = true;
                parentDetails.querySelector('summary')?.classList.add('active');
            }
        }
        // Scroll to the top of the page
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });

        // Home immersive chrome: Home starts at the top → sidebar hidden until scroll.
        homeActive = (targetId === 'Home');
        updateHomeChrome();

        // Nudge scroll-linked (Motion) animations to re-measure the newly shown tab,
        // which was display:none until now (otherwise offsets can be stale).
        requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    };

    // --- HOME IMMERSIVE CHROME ---
    // On Home, hide the sidebar at the very top; reveal it once the user scrolls down.
    // (Desktop only — the CSS rule is scoped to min-width:1025px; mobile keeps its menu bar.)
    let homeActive = false;
    const revealThreshold = () => window.innerHeight * 0.2;
    const updateHomeChrome = () => {
        document.body.classList.toggle('home-top', homeActive && window.scrollY < revealThreshold());
    };


    // --- EVENT LISTENERS ---

    // Mobile sidebar toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const willOpen = !sidebar.classList.contains('open');
            sidebar.classList.toggle('open', willOpen);
            overlay.classList.toggle('show', willOpen);
            document.body.style.overflow = willOpen ? 'hidden' : '';
        });
    }

    // Close sidebar when overlay is clicked
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }
    
    // Reveal the sidebar as the user scrolls down on Home (see updateHomeChrome).
    window.addEventListener('scroll', updateHomeChrome, { passive: true });
    window.addEventListener('resize', updateHomeChrome);

    // Automatic hash-based tab activation on page load
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash) {
        activateTab(currentHash);
    } else {
        activateTab('Home'); // Default tab
    }

    // Handle all navigation clicks
    document.querySelector('.nav').addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (!target || !target.classList.contains('item')) return;

        e.preventDefault();
        const targetId = target.getAttribute('href').replace('#', '');
        
        // Update URL hash without jumping
        history.pushState(null, null, `#${targetId}`);
        
        activateTab(targetId);
        closeSidebar();
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

    // --- HERO BLOBS: pause the slow drift when the hero is off-screen / on another tab (mirrors the canvas off-screen pause) ---
    const heroBlobs = document.querySelector('.hero-blobs');
    const heroEl = document.getElementById('home-hero');
    if (heroBlobs && heroEl && 'IntersectionObserver' in window) {
        const blobIO = new IntersectionObserver((entries) => {
            entries.forEach((e) => heroBlobs.classList.toggle('paused', !e.isIntersecting));
        }, { threshold: 0 });
        blobIO.observe(heroEl);
    }
});
