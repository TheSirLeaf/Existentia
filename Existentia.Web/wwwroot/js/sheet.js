window.animateRibbon = function (ribbonEl, sectionEl) {
    if (!ribbonEl || !sectionEl) return;
    if (ribbonEl.dataset.animating === 'true') return;
    var expanded = ribbonEl.dataset.expanded === 'true';
    ribbonEl.dataset.expanded = expanded ? 'false' : 'true';
    ribbonEl.dataset.animating = 'true';
    ribbonEl.style.animation = expanded
        ? 'ribbon-close 1s ease forwards'
        : 'ribbon-open 1s ease forwards';
    sectionEl.classList.toggle('open');

    ribbonEl.addEventListener('animationend', function () {
        this.dataset.animating = 'false';
    }, { once: true });
};
