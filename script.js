document.addEventListener('DOMContentLoaded', () => {
    const intro = document.getElementById('intro');
    const headers = Array.from(document.querySelectorAll('.project-header'));
    const rows = Array.from(document.querySelectorAll('.project-row'));
    const centerLabel = document.getElementById('center-label');
    const headerHeight = 21;

    const projectNames = [
        "UNOTRANS",
        "RENTIFY",
        "MACAW DIGITAL",
        "PLC",
        "TECNIFIBRE",
        "MEDIPLAZA",
        "MEDICOMANIA"
    ];

    // Splash Screen & Page Fade-in
    if (intro) {
        if (window.location.hash === '#bottom') {
            // Returning from CV: Jump to bottom while invisible
            intro.style.display = 'none';
            document.body.classList.remove('intro-active');

            setTimeout(() => {
                window.scrollTo(0, document.documentElement.scrollHeight);
                // Now fade in at the bottom
                setTimeout(() => {
                    document.body.classList.remove('transitioning');
                }, 100);
            }, 50);
        } else {
            // Normal entry: Fade in to show video
            const introVideo = document.getElementById('intro-video');

            setTimeout(() => {
                document.body.classList.remove('transitioning');
            }, 100);

            // Start fade in shortly after
            setTimeout(() => {
                if (introVideo) introVideo.classList.add('fade-in');
            }, 400);

            // Then slide up after 2s (adjusted for fade time)
            setTimeout(() => {
                intro.classList.add('slide-up');
                document.body.classList.remove('intro-active');

                // Completely hide intro after transition to avoid any "line" or residual gap
                setTimeout(() => {
                    intro.style.display = 'none';
                }, 1200);
            }, 2200);
        }
    } else {
        // CV page: Normal fade in
        setTimeout(() => {
            document.body.classList.remove('transitioning');
        }, 100);
    }

    let lastActiveIndex = -1;

    const updateRollingHeaders = () => {
        const vh = window.innerHeight;
        const stackBottom = 4 * headerHeight;

        // Reset scroll position to 100% width context (avoiding vw offsets)
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Cumulative rolling logic based on "touch"
        let windowStart = 0;
        for (let i = 4; i < headers.length; i++) {
            const rowTop = rows[i].getBoundingClientRect().top;
            if (rowTop <= stackBottom) {
                windowStart = i - 3;
            } else {
                break;
            }
        }

        // Active project index for center label
        let activeProjectIndex = 0;
        rows.forEach((row, i) => {
            const rect = row.getBoundingClientRect();
            if (rect.top <= vh / 2) {
                activeProjectIndex = i;
            }
        });
        if (centerLabel) {
            centerLabel.innerText = projectNames[activeProjectIndex] || "PROJECT →";
        }



        headers.forEach((header, j) => {
            const row = rows[j];
            const rowRect = row.getBoundingClientRect();
            const media = row.querySelector('img, video');

            const isInStack = (j >= windowStart && j < windowStart + 4);
            const isArriving = (rowRect.top < vh && rowRect.bottom > 0);

            // Optimized Pixelation Logic: Only update when active index changes or on first load
            // NEW: Exclude UNOTRANS (Project 0) from pixelation to keep the splash video clear
            if (media && activeProjectIndex !== lastActiveIndex) {
                if (j === activeProjectIndex || j === 0) {
                    media.classList.remove('pixelated');
                } else {
                    media.classList.add('pixelated');
                }
            }

            if (isInStack || isArriving) {
                header.style.visibility = 'visible';
                header.style.display = 'block';
                header.style.zIndex = 1000 + j;

                const slotIndex = j - windowStart;
                const slotTop = slotIndex * headerHeight;
                const finalTop = Math.max(slotTop, rowRect.top);

                header.style.top = `${finalTop}px`;

                // Toggle docked state:
                // Make it solid as soon as it reaches its slot
                // Increased tolerance to 5px for better reliability on all DPI settings
                if (finalTop <= slotTop + 5) {
                    header.classList.add('docked');
                } else {
                    header.classList.remove('docked');
                }
            } else {
                header.style.visibility = 'hidden';
                header.style.display = 'none';
            }
        });

        lastActiveIndex = activeProjectIndex;
    };

    window.addEventListener('scroll', () => {
        requestAnimationFrame(updateRollingHeaders);
    });
    window.addEventListener('resize', updateRollingHeaders);
    updateRollingHeaders();

    // Smooth reveal for images and videos
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const media = entry.target.querySelector('img, video');
            if (entry.isIntersecting) {
                if (media) {
                    media.style.opacity = '1';
                    media.style.transform = 'scale(1)';
                }
            } else {
                if (media) {
                    media.style.opacity = '0';
                    media.style.transform = 'scale(1.05)';
                }
            }
        });
    }, { threshold: 0.1 });

    rows.forEach(row => {
        const media = row.querySelector('img, video');
        if (media) {
            media.style.opacity = '0';
            media.style.transform = 'scale(1.05)';
            media.style.transition = 'all 1.2s cubic-bezier(0.165, 0.84, 0.44, 1)';
        }
        observer.observe(row);
    });

    // Add click navigation to headers
    headers.forEach((header, i) => {
        header.addEventListener('click', () => {
            rows[i].scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Fix Latest Button scroll to bottom
    const latestBtn = document.querySelector('.latest-button');
    if (latestBtn) {
        latestBtn.addEventListener('click', () => {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
            });
        });
    }

    // Toggle CV Button visiblity
    const menuBtn = document.querySelector('.menu-btn');
    const globalNav = document.querySelector('.global-nav');
    if (menuBtn && globalNav) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            globalNav.classList.toggle('nav-closed');
        });
    }

    // Marquee click to CV
    const marquee = document.querySelector('.marquee-strip');
    if (marquee) {
        marquee.style.cursor = 'pointer';
        marquee.addEventListener('click', () => {
            navigateTo('cv.html', 'transitioning');
        });
    }

    // Bidirectional Navigation Logic (Index <-> CV)
    let isTransitioning = false;
    const isCVPage = window.location.pathname.toLowerCase().includes('cv.html');

    const navigateTo = (url, transitionClass = 'transitioning') => {
        if (isTransitioning) return;
        isTransitioning = true;
        document.body.classList.add(transitionClass);
        setTimeout(() => {
            window.location.href = url;
        }, 800);
    };

    // Shared Delta-based Navigation
    const handleOverscroll = (deltaY) => {
        if (isTransitioning) return;

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;

        if (isCVPage) {
            // CV -> INDEX (Scroll Up at top)
            if (scrollTop <= 2 && deltaY < -15) {
                navigateTo('index.html#bottom', 'transitioning');
            }
        } else {
            // INDEX -> CV (Scroll Down at bottom)
            if (scrollTop + clientHeight >= scrollHeight - 2 && deltaY > 15) {
                navigateTo('cv.html', 'transitioning');
            }
        }
    };

    window.addEventListener('wheel', (e) => {
        handleOverscroll(e.deltaY);
    }, { passive: true });

    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        const touchCurrentY = e.touches[0].clientY;
        const deltaY = touchStartY - touchCurrentY; // Positive = Scroll Down
        handleOverscroll(deltaY);
    }, { passive: true });
});
