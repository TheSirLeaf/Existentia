(function() {
    var t = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', t);
})();

window.themeSwitcher = {
  toggle: function () {
    var current = localStorage.getItem('theme') || 'light';
    var next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', next);
    localStorage.setItem('theme', next);
    return next;
  }
};
