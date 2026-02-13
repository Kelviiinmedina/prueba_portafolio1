const projects = [
    {
        id: "01",
        name: "UNOTRANS",
        logo: "Assets/Marcas/Logos/Isotipo - Unotrans.svg",
        startDate: "02/2025",
        endDate: "01/2026",
        color: "#1a1a1a",
        image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1000"
    },
    {
        id: "02",
        name: "Rentify",
        logo: "Assets/Marcas/Logos/Isotipo - Rentify.svg",
        startDate: "04/2024",
        endDate: "Present",
        color: "#0f0f0f",
        image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=1000"
    },
    {
        id: "03",
        name: "Macaw Digital",
        logo: "Assets/Marcas/Logos/Isotipo - MacawDigital.svg",
        startDate: "04/2024",
        endDate: "Present",
        color: "#151515",
        image: "https://images.unsplash.com/photo-1634942537034-2216436f59ba?auto=format&fit=crop&q=80&w=1000"
    },
    {
        id: "04",
        name: "Plc",
        logo: "Assets/Marcas/Logos/Isotipo - PLC.svg",
        startDate: "11/2025",
        endDate: "Present",
        color: "#0a0a0a",
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1000&auto=format&fit=crop"
    },
    {
        id: "05",
        name: "Tecnifibre",
        logo: "Assets/Marcas/Logos/Isotipo - Tecnifibre.svg",
        startDate: "02/2026",
        endDate: "Present",
        color: "#111111",
        image: "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?q=80&w=1000&auto=format&fit=crop"
    },
    {
        id: "06",
        name: "Mediplaza",
        logo: "Assets/Marcas/Logos/Isotipo - Mediplaza.svg",
        startDate: "05/2025",
        endDate: "07/2025",
        color: "#050505",
        image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1000&auto=format&fit=crop"
    },
    {
        id: "07",
        name: "Medicomania",
        logo: "Assets/Marcas/Logos/Isotipo -  MEDICOMANIA.svg",
        startDate: "07/2025",
        endDate: "Present",
        color: "#000000",
        image: "https://images.unsplash.com/photo-1542491509-300133c1ca9d?q=80&w=1000&auto=format&fit=crop"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    const portfolio = document.getElementById('portfolio');
    const portfolioContainer = document.querySelector('#portfolio');

    // 1. Render Projects
    projects.forEach((project, index) => {
        const row = document.createElement('section');
        row.className = 'project-row';
        row.id = `project-${index + 1}`;

        row.innerHTML = `
            <div class="column col-1">
                <div class="project-logo" style="font-size: 2rem;">${project.logo}</div>
                <h2 class="project-name">${project.name}</h2>
            </div>
            <div class="column col-2">
                <img src="${project.image}" alt="${project.name}" class="project-image">
            </div>
            <div class="column col-3">
                <span class="project-number">#${project.id}</span>
            </div>
            <div class="column col-4">
                <div class="date-item">
                    <p class="date-label">INICIO</p>
                    <p class="date-value">${project.startDate}</p>
                </div>
                <div class="date-item">
                    <p class="date-label">FINAL</p>
                    <p class="date-value">${project.endDate}</p>
                </div>
            </div>
        `;

        portfolioContainer.appendChild(row);
    });

    // 2. Handle Splash Transition
    setTimeout(() => {
        splash.style.opacity = '0';
        splash.style.visibility = 'hidden';

        portfolio.style.display = 'block';
        document.body.style.overflow = 'auto';
    }, 2500); // 2.5 seconds splash
});
