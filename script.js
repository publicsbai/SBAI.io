document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTS ---
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const navLinks = document.querySelectorAll('.nav a.item');
    const detailsElements = document.querySelectorAll('.nav details');
    const tabContents = document.querySelectorAll('.tabcontent');

    // --- STATE & HELPERS ---
    const closeSidebar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    };

    const activateTab = (targetId) => {
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
});
