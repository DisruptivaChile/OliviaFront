document.addEventListener('DOMContentLoaded', () => {

    // ── TOGGLE CONTRASEÑA ──
    function setupToggle(btnId, inputId) {
        const btn   = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        if (!btn || !input) return;
        btn.addEventListener('click', () => {
            const isPass = input.type === 'password';
            input.type   = isPass ? 'text' : 'password';
            btn.querySelector('i').className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    }
    setupToggle('togglePass', 'loginPassword');
});