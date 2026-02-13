document.addEventListener('DOMContentLoaded', () => {
    const intro = document.getElementById('intro');
    const headers = Array.from(document.querySelectorAll('.project-header'));
    const rows = Array.from(document.querySelectorAll('.project-row'));
    const centerLabel = document.getElementById('center-label');
    const headerHeight = 21;

    const projectNames = [
        "UNOTRANS →",
        "RENTIFY →",
        "MACAW DIGITAL →",
        "PLC →",
        "TECNIFIBRE →",
        "MEDIPLAZA →",
        "MEDICOMANIA →"
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
            setTimeout(() => {
                document.body.classList.remove('transitioning');
            }, 100);

            // Then slide up after 1.5s
            setTimeout(() => {
                intro.classList.add('slide-up');
                document.body.classList.remove('intro-active');
            }, 1800);
        }
    } else {
        // CV page: Normal fade in
        setTimeout(() => {
            document.body.classList.remove('transitioning');
        }, 100);
    }

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

        // Determine the highest index header that has reached its slot
        let lastDockedIndex = -1;
        headers.forEach((h, j) => {
            const rowRect = rows[j].getBoundingClientRect();
            const slotIndex = j - windowStart;
            const slotTop = slotIndex * headerHeight;
            if (rowRect.top <= slotTop + 1) {
                lastDockedIndex = j;
            }
        });

        headers.forEach((header, j) => {
            const row = rows[j];
            const rowRect = row.getBoundingClientRect();

            const isInStack = (j >= windowStart && j < windowStart + 4);
            const isArriving = (rowRect.top < vh && rowRect.bottom > 0);

            if (isInStack || isArriving) {
                header.style.visibility = 'visible';
                header.style.display = 'block';
                header.style.zIndex = 1000 + j;

                const slotIndex = j - windowStart;
                const slotTop = slotIndex * headerHeight;
                const finalTop = Math.max(slotTop, rowRect.top);

                header.style.top = `${finalTop}px`;

                // Toggle docked state:
                // If a header with a higher index has already docked (reached its slot),
                // then this one (j) must be solid. Otherwise, stay transparent.
                if (j < lastDockedIndex) {
                    header.classList.add('docked');
                } else {
                    header.classList.remove('docked');
                }
            } else {
                header.style.visibility = 'hidden';
                header.style.display = 'none';
            }
        });
    };

    window.addEventListener('scroll', () => {
        requestAnimationFrame(updateRollingHeaders);
    });
    window.addEventListener('resize', updateRollingHeaders);
    updateRollingHeaders();

    // Smooth reveal for images
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const img = entry.target.querySelector('img');
            if (entry.isIntersecting) {
                if (img) {
                    img.style.opacity = '1';
                    img.style.transform = 'scale(1)';
                }
            } else {
                if (img) {
                    img.style.opacity = '0';
                    img.style.transform = 'scale(1.05)';
                }
            }
        });
    }, { threshold: 0.1 });

    rows.forEach(row => {
        const img = row.querySelector('img');
        if (img) {
            img.style.opacity = '0';
            img.style.transform = 'scale(1.05)';
            img.style.transition = 'all 1.2s cubic-bezier(0.165, 0.84, 0.44, 1)';
        }
        observer.observe(row);
    });

    // Add click navigation to headers
    headers.forEach((header, i) => {
        header.addEventListener('click', () => {
            rows[i].scrollIntoView({ behavior: 'smooth' });
        });
    });

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
