document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Scroll-Driven Animations & Header Change ---
    const header = document.querySelector('.main-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Fade-in entry using IntersectionObserver
    const fadeElements = document.querySelectorAll('.fade-in-trigger');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const elementObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(el => elementObserver.observe(el));


    // --- 2. Interactive Modals (Wellness Drawers) ---
    const modalTriggers = document.querySelectorAll('[data-target]');
    const modals = document.querySelectorAll('.modal-overlay');
    const closeButtons = document.querySelectorAll('.modal-close-btn');

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.getAttribute('data-target');
            const targetModal = document.getElementById(modalId);
            if (targetModal) {
                targetModal.classList.add('active');
                document.body.style.overflow = 'hidden'; // prevent page scroll
                
                // Special check to resize Examen canvas upon opening modal
                if (modalId === 'modal-examen') {
                    initExamenCanvas();
                }
            }
        });
    });

    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Custom resets upon modal closing
        if (modal.id === 'modal-centering') {
            stopBreathingSession();
        }
    }

    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const activeModal = e.target.closest('.modal-overlay');
            if (activeModal) closeModal(activeModal);
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });


    // --- 3. [정원의 선율] Web Audio API Ambient Synthesizer ---
    // Autonomous wellness soundscape - soft warm synth drone + random sweet chimes
    const bgmToggle = document.getElementById('bgm-toggle');
    const bgmText = bgmToggle.querySelector('.btn-text');
    let audioCtx = null;
    let synthActive = false;
    let droneOsc1, droneOsc2, droneGain, lfo;
    let chimeTimer = null;

    function initAmbientSynth() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Master volume
        droneGain = audioCtx.createGain();
        droneGain.gain.setValueAtTime(0.08, audioCtx.currentTime); // Soft volume

        // Low-pass filter for cozy warm tone
        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(350, audioCtx.currentTime);

        // Drone Oscillator 1 (Warm Deep Base)
        droneOsc1 = audioCtx.createOscillator();
        droneOsc1.type = 'sine';
        droneOsc1.frequency.setValueAtTime(110, audioCtx.currentTime); // A2 Note

        // Drone Oscillator 2 (Slightly detuned for warm movement)
        droneOsc2 = audioCtx.createOscillator();
        droneOsc2.type = 'sine';
        droneOsc2.frequency.setValueAtTime(110.5, audioCtx.currentTime);

        // Slow Modulator (LFO) for breathing effect
        lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime); // Very slow 8-second cycle
        
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.setValueAtTime(0.03, audioCtx.currentTime);

        // Connections
        lfo.connect(lfoGain);
        lfoGain.connect(droneGain.gain); // Modulate volume

        droneOsc1.connect(lowpass);
        droneOsc2.connect(lowpass);
        lowpass.connect(droneGain);
        droneGain.connect(audioCtx.destination);

        // Start Drone
        droneOsc1.start();
        droneOsc2.start();
        lfo.start();

        // Start Random Chime generator
        triggerRandomChime();
    }

    function triggerRandomChime() {
        if (!synthActive) return;

        // Sweet Pentatonic warm notes (Chimes / Singing bowl simulation)
        const notes = [293.66, 329.63, 392.00, 440.00, 587.33, 659.25, 783.99]; // D4, E4, G4, A4, D5, E5, G5
        const randomNote = notes[Math.floor(Math.random() * notes.length)];

        playChime(randomNote);

        // Schedule next chime between 6 and 14 seconds
        const nextTime = 6000 + Math.random() * 8000;
        chimeTimer = setTimeout(triggerRandomChime, nextTime);
    }

    function playChime(frequency) {
        if (!audioCtx || audioCtx.state === 'suspended') return;

        // Chime nodes
        const chimeOsc = audioCtx.createOscillator();
        chimeOsc.type = 'triangle'; // Pure, warm timbre
        chimeOsc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        const chimeGain = audioCtx.createGain();
        chimeGain.gain.setValueAtTime(0, audioCtx.currentTime);
        // Soft attack, long decay
        chimeGain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.5);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 6.0);

        // Soft low-pass delay effect
        const delay = audioCtx.createDelay();
        delay.delayTime.setValueAtTime(0.6, audioCtx.currentTime);

        const delayGain = audioCtx.createGain();
        delayGain.gain.setValueAtTime(0.3, audioCtx.currentTime);

        // Connections
        chimeOsc.connect(chimeGain);
        chimeGain.connect(audioCtx.destination);

        // Simple delay loop
        chimeGain.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(audioCtx.destination);
        delayGain.connect(delay); // Feedback

        chimeOsc.start();
        chimeOsc.stop(audioCtx.currentTime + 7);
    }

    function stopAmbientSynth() {
        if (droneOsc1) droneOsc1.stop();
        if (droneOsc2) droneOsc2.stop();
        if (lfo) lfo.stop();
        if (chimeTimer) clearTimeout(chimeTimer);
        if (audioCtx) audioCtx.close();
        audioCtx = null;
    }

    bgmToggle.addEventListener('click', () => {
        if (!synthActive) {
            // Start BGM
            synthActive = true;
            bgmToggle.classList.add('playing');
            bgmText.textContent = '선율 흐르는 중';
            initAmbientSynth();
        } else {
            // Stop BGM
            synthActive = false;
            bgmToggle.classList.remove('playing');
            bgmText.textContent = '정원의 선율';
            stopAmbientSynth();
        }
    });


    // --- 4. 말씀의 씨앗 (Lectio Divina) ---
    const potTrigger = document.getElementById('pot-trigger');
    const resultArea = document.querySelector('.lectio-result-area');
    const verseText = document.getElementById('verse-content');
    const verseRef = document.getElementById('verse-ref');
    const btnReseed = document.getElementById('btn-reseed');

    // Healing Bible Verses Comfort Pool
    const versePool = [
        { text: "수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라.", ref: "마태복음 11:28" },
        { text: "평안을 너희에게 끼치노니 곧 나의 평안을 너희에게 주노라 내가 너희에게 주는 것은 세상이 주는 것과 같지 아니하니라 너희는 마음에 근심하지도 말고 두려워하지도 말라.", ref: "요한복음 14:27" },
        { text: "두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 굳세게 하리라 참으로 너를 도와 주리라 참으로 나의 의로운 오른손으로 너를 붙들리라.", ref: "이사야 41:10" },
        { text: "여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다.", ref: "시편 23:1-2" },
        { text: "아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라 그리하면 모든 지각에 뛰어난 하나님의 평안이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라.", ref: "빌립보서 4:6-7" },
        { text: "나의 힘이신 여호와여 내가 주를 사랑하나이다 여호와는 나의 반석이시요 나의 요새시요 나를 건지시는 이시요 나의 하나님이시요 내가 그 안에 피할 나의 바위시요.", ref: "시편 18:1-2" },
        { text: "여호와께서 너를 실족하지 아니하게 하시며 너를 지키시는 이가 졸지 아니하시리로다... 여호와는 너를 지키시는 이시라 여호와께서 네 오른쪽에서 네 그늘이 되시나니.", ref: "시편 121:3-5" },
        { text: "평안히 눕고 자기도 하리니 나를 안전히 살게 하시는 이는 오직 여호와이시니이다.", ref: "시편 4:8" }
    ];

    potTrigger.addEventListener('click', () => {
        if (potTrigger.classList.contains('planted')) return;

        // Play sprout animation
        potTrigger.classList.add('planted');
        potTrigger.querySelector('.pot-label').textContent = '말씀이 피어나는 중...';

        setTimeout(() => {
            // Select random verse
            const randomVerse = versePool[Math.floor(Math.random() * versePool.length)];
            
            // Render result after animation
            potTrigger.style.display = 'none';
            resultArea.style.display = 'block';
            
            // Typewriter effect
            typewriter(verseText, randomVerse.text, 50, () => {
                verseRef.textContent = randomVerse.ref;
                verseRef.style.opacity = '1';
                verseRef.style.transform = 'translateY(0)';
            });

            // Trigger gentle chime sound if BGM is active
            if (synthActive && audioCtx) {
                playChime(659.25); // E5 soothing note
            }
        }, 2200); // sprout animation delay
    });

    btnReseed.addEventListener('click', () => {
        // Reset state
        resultArea.style.display = 'none';
        potTrigger.style.display = 'flex';
        potTrigger.classList.remove('planted');
        potTrigger.querySelector('.pot-label').textContent = '화분을 터치하여 씨앗을 심어보세요';
        verseText.textContent = '';
        verseRef.textContent = '';
        verseRef.style.opacity = '0';
        verseRef.style.transform = 'translateY(10px)';
    });

    function typewriter(element, text, speed, callback) {
        let i = 0;
        element.textContent = '';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else if (callback) {
                callback();
            }
        }
        type();
    }


    // --- 5. 머무름의 시간 (Centering Prayer Breath Guide) ---
    const breathingCircle = document.getElementById('breathing-circle');
    const breathingStatus = document.getElementById('breathing-status');
    const breathingToggle = document.getElementById('btn-breathing-toggle');
    const breathingVisual = document.querySelector('.breathing-visual-container');
    
    let breathingInterval = null;
    let breathingActive = false;
    let breathStep = 0; // 0: inhale, 1: hold, 2: exhale

    function startBreathingSession() {
        breathingActive = true;
        breathingToggle.textContent = '침묵 종료하기';
        breathingToggle.classList.add('gold-accent');
        
        runBreathingCycle();
        breathingInterval = setInterval(runBreathingCycle, 4000);
    }

    function stopBreathingSession() {
        breathingActive = false;
        breathingToggle.textContent = '침묵 시작하기';
        breathingToggle.classList.remove('gold-accent');
        
        clearInterval(breathingInterval);
        breathingInterval = null;
        
        breathingVisual.className = 'breathing-visual-container';
        breathingStatus.textContent = '숨 고르기';
        breathStep = 0;
    }

    function runBreathingCycle() {
        if (!breathingActive) return;

        if (breathStep === 0) {
            // Inhale
            breathingVisual.className = 'breathing-visual-container inhale';
            breathingStatus.textContent = '숨을 깊이 들이마십니다 (Inhale)';
            breathingStatus.style.color = '#8C714C';
            
            if (synthActive && audioCtx) playChime(392.00); // G4 Note
            breathStep = 1;
        } else if (breathStep === 1) {
            // Hold
            breathingVisual.className = 'breathing-visual-container hold';
            breathingStatus.textContent = '잠시 숨을 멈추고 머뭅니다 (Hold)';
            breathingStatus.style.color = '#C5A880';
            
            breathStep = 2;
        } else {
            // Exhale
            breathingVisual.className = 'breathing-visual-container exhale';
            breathingStatus.textContent = '남은 피로를 내쉽니다 (Exhale)';
            breathingStatus.style.color = '#5A6E5D';
            
            if (synthActive && audioCtx) playChime(329.63); // E4 Note
            breathStep = 0;
        }
    }

    breathingToggle.addEventListener('click', () => {
        if (!breathingActive) {
            startBreathingSession();
        } else {
            stopBreathingSession();
        }
    });


    // --- 6. 오늘의 가지치기 (Examen Worry Particle Disintegrator) ---
    const worryInput = document.getElementById('worry-input');
    const btnPruning = document.getElementById('btn-pruning');
    const pruningBoard = document.getElementById('pruning-board');
    const pruningResult = document.querySelector('.pruning-result-area');
    const btnExamenReset = document.getElementById('btn-examen-reset');
    const canvasContainer = document.getElementById('worry-canvas-container');
    const canvas = document.getElementById('disintegrate-canvas');
    let ctx = null;
    let particles = [];
    let animationFrameId = null;

    function initExamenCanvas() {
        ctx = canvas.getContext('2d');
        canvas.width = canvasContainer.clientWidth;
        canvas.height = canvasContainer.clientHeight;
    }

    // Capture textarea text, draw on canvas, explode, dissolve!
    btnPruning.addEventListener('click', () => {
        const text = worryInput.value.trim();
        if (!text) {
            worryInput.placeholder = "내려놓을 짐을 한 글자라도 적어보세요...";
            worryInput.focus();
            return;
        }

        btnPruning.disabled = true;
        btnPruning.textContent = '주님께 향하는 중...';

        // Prepare Canvas
        canvas.style.display = 'block';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Text on Canvas beautifully wrapped
        ctx.fillStyle = '#3E3A35';
        ctx.font = '15px "Noto Sans KR", sans-serif';
        ctx.textBaseline = 'top';
        
        const padding = 25;
        const maxWidth = canvas.width - (padding * 2);
        const lineHeight = 28;
        
        wrapText(ctx, text, padding, padding, maxWidth, lineHeight);
        
        // Hide standard input textarea
        worryInput.style.opacity = '0';
        
        // Extract pixels to make particles
        createParticlesFromCanvas();
        
        // Clear text immediately so particles are all that's left
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Start particle explosion loop
        animateParticles();

        if (synthActive && audioCtx) {
            playChime(293.66); // Soothing deep A chime
        }
    });

    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        // Simple lines wrap
        const words = text.split('');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n];
            let metrics = context.measureText(testLine);
            let testWidth = metrics.width;
            
            // Check for new line character
            if (words[n] === '\n') {
                context.fillText(line, x, currentY);
                line = '';
                currentY += lineHeight;
                continue;
            }

            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, currentY);
                line = words[n];
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, currentY);
    }

    function createParticlesFromCanvas() {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        particles = [];

        // Sample text pixels (increment step to avoid massive arrays)
        const sampleStep = 4; 
        
        for (let y = 0; y < canvas.height; y += sampleStep) {
            for (let x = 0; x < canvas.width; x += sampleStep) {
                const index = (y * canvas.width + x) * 4;
                const alpha = data[index + 3];
                
                if (alpha > 50) { // If pixel is printed
                    // Define particle styling (Soft sage and golden sparks)
                    const randomColor = Math.random() > 0.65 ? '#C5A880' : '#7B907E';
                    
                    particles.push({
                        x: x,
                        y: y,
                        originX: x,
                        originY: y,
                        vx: (Math.random() - 0.5) * 1.5,
                        vy: -0.6 - Math.random() * 1.5, // Float upwards
                        size: Math.random() * 2 + 1,
                        color: randomColor,
                        alpha: 1,
                        fadeRate: 0.008 + Math.random() * 0.012,
                        wobbleSpeed: Math.random() * 0.05,
                        wobbleWidth: Math.random() * 1.5
                    });
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let activeParticles = 0;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            if (p.alpha > 0) {
                activeParticles++;
                
                // Physics - drift up and wiggle sideways
                p.x += p.vx + Math.sin(p.y * p.wobbleSpeed) * p.wobbleWidth * 0.2;
                p.y += p.vy;
                p.alpha -= p.fadeRate;

                // Render particle
                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        if (activeParticles > 0) {
            animationFrameId = requestAnimationFrame(animateParticles);
        } else {
            // Particle dissolve fully finished, transition board to results blessing!
            cancelAnimationFrame(animationFrameId);
            pruningBoard.style.display = 'none';
            pruningResult.style.display = 'flex';
        }
    }

    btnExamenReset.addEventListener('click', () => {
        // Reset board
        pruningResult.style.display = 'none';
        pruningBoard.style.display = 'flex';
        
        worryInput.value = '';
        worryInput.style.opacity = '1';
        
        btnPruning.disabled = false;
        btnPruning.textContent = '주님의 십자가 아래 내려놓기';
        
        canvas.style.display = 'none';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles = [];
    });
});
