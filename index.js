const targetDate = new Date("2026-05-11T19:30:00+02:00");
const isMobile = window.matchMedia("(max-width: 768px)").matches;
const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const isTablet = isTouch && window.innerWidth >= 768;

/* countdown */
const units = {
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds"),
};

const state = {};
const pad = n => String(n).padStart(2, "0");

const setDrop = (el, value) => {
    el.textContent = value;
    el.classList.add("show");
};

const updateDrop = (el, value) => {
    el.textContent = value;
};

/* countdown loop */
const tick = () => {
    const diff = targetDate - new Date();
    const total = Math.floor(diff / 1000);

    const values = {
        days: pad(Math.floor(total / 86400)),
        hours: pad(Math.floor((total % 86400) / 3600)),
        minutes: pad(Math.floor((total % 3600) / 60)),
        seconds: pad(total % 60),
    };

    Object.entries(values).forEach(([k, v]) => {
        const el = units[k];

        if (!state[k]) {
            setDrop(el, v);
            state[k] = v;
        } else if (state[k] !== v) {
            updateDrop(el, v);
            state[k] = v;
        }
    });
};

tick();
setInterval(tick, 1000);

/* =========================
   PHYSICS PARTICLE SYSTEM
   ========================= */

const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

const resize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
};
resize();
window.addEventListener("resize", resize);

/* =========================
   MOLECULAR SYSTEM v2
   ========================= */

const COLORS = [
    "rgba(124,77,255,0.7)",
    "rgba(0,212,255,0.7)",
    "rgba(255,255,255,0.6)",
    "rgba(255,100,200,0.6)"
];

const MOLECULE_COUNT = 10;

const molecules = [];

/* create molecule */
for (let i = 0; i < MOLECULE_COUNT; i++) {

    const atomsCount = 3 + Math.floor(Math.random() * 4);

    const molecule = {
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        rotation: Math.random() * Math.PI,
        atoms: []
    };

    for (let a = 0; a < atomsCount; a++) {

        const angle = (a / atomsCount) * Math.PI * 2;

        molecule.atoms.push({
            angle,
            distance: 20 + Math.random() * 40,
            radius: 2 + Math.random() * 4,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            phase: Math.random() * Math.PI * 2
        });
    }

    molecules.push(molecule);
}

/* physics loop */
const update = () => {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const m of molecules) {

        /* =========================
           FREE MOTION (KEY CHANGE)
           ========================= */

        m.vx += (Math.random() - 0.5) * 0.08;
        m.vy += (Math.random() - 0.5) * 0.08;

        /* damping */
        m.vx *= 0.995;
        m.vy *= 0.995;

        m.x += m.vx;
        m.y += m.vy;

        /* WALL BOUNCE (soft reflection) */
        if (m.x < 0) { m.x = 0; m.vx *= -1; }
        if (m.x > canvas.width) { m.x = canvas.width; m.vx *= -1; }

        if (m.y < 0) { m.y = 0; m.vy *= -1; }
        if (m.y > canvas.height) { m.y = canvas.height; m.vy *= -1; }

        /* =========================
           INTERNAL STRUCTURE (UNCHANGED VISUALS)
           ========================= */

        m.rotation += 0.01;

        for (const atom of m.atoms) {

            const wobble = Math.sin(Date.now() * 0.001 + atom.phase) * 4;

            const angle = atom.angle + m.rotation;

            const x = m.x + Math.cos(angle) * (atom.distance + wobble);
            const y = m.y + Math.sin(angle) * (atom.distance + wobble);

            /* bonds */
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(x, y);
            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth = 1;
            ctx.stroke();

            /* atoms */
            ctx.beginPath();
            ctx.arc(x, y, atom.radius, 0, Math.PI * 2);

            ctx.fillStyle = atom.color;
            ctx.fill();
        }
    }

    requestAnimationFrame(update);
};

update();


/* ORBS PARALLAX */
const orbs = document.querySelectorAll(".orb");

document.addEventListener("mousemove", e => {
    const x = (e.clientX / innerWidth - 0.5);
    const y = (e.clientY / innerHeight - 0.5);

    orbs.forEach((o, i) => {
        const f = i === 0 ? 40 : -40;
        o.style.transform = `translate(${x * f}px, ${y * f}px)`;
    });
});

// CLUE

let motionBuffer = [];
let lastX = null;
let lastY = null;
let unlocked = false;

if (!isMobile || isTablet) {

    document.addEventListener("mousemove", (e) => {

        if (unlocked) return;

        if (lastX === null) {
            lastX = e.clientX;
            lastY = e.clientY;
            return;
        }

        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {

            motionBuffer.push(dist);
            if (motionBuffer.length > 20) motionBuffer.shift();

            /* compute entropy-like variance */
            const avg =
                motionBuffer.reduce((a, b) => a + b, 0) / motionBuffer.length;

            const variance =
                motionBuffer.reduce((a, b) => a + Math.pow(b - avg, 2), 0) /
                motionBuffer.length;

            /* unlock condition */
            if (motionBuffer.length === 20 && variance > 1800) {

                unlocked = true;

                const clue = document.createElement("div");
                clue.id = "hidden-clue";
                clue.textContent = "Verba volant, musicae manent";
                document.body.appendChild(clue);

                clue.classList.add("visible");

                document.querySelectorAll(".drop")
                    .forEach(d => d.classList.add("bump"));

                setTimeout(() => {
                    clue.remove();
                }, 3500);
            }

            lastX = e.clientX;
            lastY = e.clientY;
        }
    });
}