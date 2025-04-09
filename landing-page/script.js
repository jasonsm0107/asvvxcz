// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Custom Cursor
    const cursor = document.querySelector('.cursor');
    const cursorGrowElements = document.querySelectorAll('button, a, .nav-links li');
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
    
    cursorGrowElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.classList.add('cursor-grow');
            if (element.tagName === 'BUTTON') {
                cursor.classList.add('cursor-color');
            }
        });
        
        element.addEventListener('mouseleave', () => {
            cursor.classList.remove('cursor-grow');
            cursor.classList.remove('cursor-color');
        });
    });
    
    // Block Scrolling
    const sections = document.querySelectorAll('.block');
    let currentSection = 0;
    let isScrolling = false;
    
    function scrollToSection(index) {
        if (index >= 0 && index < sections.length && !isScrolling) {
            isScrolling = true;
            currentSection = index;
            
            sections[index].scrollIntoView({
                behavior: 'smooth'
            });
            
            // Update active state in navigation
            document.querySelectorAll('.nav-links a').forEach((link, i) => {
                if (i === index) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
            
            setTimeout(() => {
                isScrolling = false;
            }, 1000);
        }
    }
    
    // Mouse wheel event for block scrolling
    window.addEventListener('wheel', (e) => {
        if (isScrolling) return;
        
        if (e.deltaY > 0) {
            // Scroll down
            scrollToSection(currentSection + 1);
        } else {
            // Scroll up
            scrollToSection(currentSection - 1);
        }
    });
    
    // Navigation click events
    document.querySelectorAll('.nav-links a').forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToSection(index);
        });
    });
    
    // Scroll Arrow Click
    document.querySelector('.scroll-arrow').addEventListener('click', () => {
        scrollToSection(currentSection + 1);
    });
    
    // Counter Animation
    const counters = document.querySelectorAll('.counter');
    
    // Function to animate counters when they become visible
    function animateCounters() {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText;
            
            // Calculate increment based on target value
            let increment = target / 100;
            
            // If counter is not yet at target and is in viewport
            if (count < target && isInViewport(counter)) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(animateCounters, 30);
            } else if (count >= target) {
                counter.innerText = new Intl.NumberFormat().format(target);
            }
        });
    }
    
    // Check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Start animating counters when page loads
    window.addEventListener('load', animateCounters);
    
    // Continue animation when scrolling
    window.addEventListener('scroll', () => {
        if (isInViewport(document.querySelector('.hero-stats'))) {
            animateCounters();
        }
    });
    
    // Parallax effect for hero section
    document.addEventListener('mousemove', (e) => {
        const heroContent = document.querySelector('.hero-content');
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        
        heroContent.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
    
    // Launch App Button Events
    document.querySelectorAll('.launch-btn, .primary-btn').forEach(button => {
        button.addEventListener('click', () => {
            // Here you would typically redirect to the swap page
            // For now, we'll just show an alert
            alert('Connecting to wallet... This would redirect to the Swap page in a production environment.');
        });
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.25
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);
    
    // Observe all sections for animation
    sections.forEach(section => {
        observer.observe(section);
    });
    
    // Add dynamic reflection effect to cards
    const cards = document.querySelectorAll('.fee-card, .privacy-feature');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const angleX = (y - centerY) / 10;
            const angleY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.05, 1.05, 1.05)`;
            card.style.backgroundImage = `linear-gradient(${angleY}deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            card.style.backgroundImage = 'none';
        });
    });
    
    // Initialize the page at the first section
    scrollToSection(0);
});