import './style.css'

// 指定した範囲でランダムな整数を返す関数
function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// シャッフルされたパターンを取得する関数
function getShuffledPatterns(): number[] {
    const patterns = [0, 1, 2, 3, 4, 5, 6, 7];

    for (let i = patterns.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i+1);
        [patterns[i], patterns[j]] = [patterns[j], patterns[i]];
    }

    return patterns;
}

// 指定された領域の乱数を生成する関数
function getSpecifiedRandomValue(range: number): number {
    range = (range > 0) ? 1 : 0;
    return getRandomInt(128 * range, 127 + 128 * range);
}

// ランダムな色（16進数）を生成する関数
function getRandomColor(patternId: number): number[] {
  const r = getSpecifiedRandomValue(patternId & 1); 
  const g = getSpecifiedRandomValue(patternId & 2);
  const b = getSpecifiedRandomValue(patternId & 4);
  return [r, g, b];
}

let questionCount = 0;
let generatedRGB: number[][] = [];
let lastPattern = 0;
let patterns = [0, 1, 2, 3, 4, 5, 6, 7];
let lastSoundValue: number | null = null;
const moveSound = new Audio('sounds/move.mp3');
const stopSound = new Audio('sounds/stop.mp3');

// 質問を追加する関数
function addQuestion() {
    const continueBtn = document.getElementById('continue-btn') as HTMLButtonElement | null;

    questionCount++;
    const question = document.getElementById('question');

    const wrapper = document.createElement('div');
    wrapper.className = 'slider-wrapper';

    if (questionCount % 8 === 1) {
        lastPattern = patterns[7];
        patterns = getShuffledPatterns();
        if (lastPattern === patterns[0]) [patterns[0], patterns[7]] = [patterns[7], patterns[0]];
    }

    const currentColor = getRandomColor(patterns[(questionCount - 1) % 8]);
    generatedRGB.push([currentColor[0], currentColor[1], currentColor[2]])
    const boxColor = `rgb(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]})`;

    wrapper.innerHTML = `
        <div class="question-header" id="question-header-${questionCount}">
            <span>${questionCount}.</span>
            <div class="color-box" style="background-color: ${boxColor};" id="box-${questionCount}"></div>
        </div>
        <div class="value-display" id="val-${questionCount}">0</div>
        <input type="range" min="-100" max="100" value="0" 
            class="custom-slider" id="slider-${questionCount}">
            <div class="slider-background"></div>
        </input>
    `;

    question?.appendChild(wrapper);

    const box = document.getElementById(`box-${questionCount}`);

    box?.addEventListener('mouseenter', () => {
        document.body.style.setProperty('--bg-color', boxColor);
        if (currentColor[0] + currentColor[1] + currentColor[2] < 350) {
            document.body.style.setProperty('--text-color', "#f2f2f2");
        }
        document.body.classList.add('is-hovered');
    });

    box?.addEventListener('mouseleave', () => {
        document.body.style.setProperty('--bg-color', "");
        document.body.style.setProperty('--text-color', "");
        document.body.classList.remove('is-hovered');
    });

    const slider = wrapper.querySelector('input') as HTMLInputElement;
    const display = wrapper.querySelector('.value-display') as HTMLElement;

    if (questionCount >= 100 && continueBtn) {
        continueBtn.classList.add('hidden');
    }

    slider.style.setProperty('--thumb-size', '32px');

    slider.addEventListener('pointerdown', () => {
        slider.style.setProperty('--thumb-size', '38px');
    });

    slider.addEventListener('input', (e) => {
        const val = parseInt(slider.value);
        display.textContent = val.toString();

        const percent = ((val + 101) / 200) * 100 - val / 45;
        display.style.setProperty('--position', `${percent}%`);

        const intensity = (Math.abs(val) * 0.8 + 10) / 100;

        let background = '';

        const baseGray = '#ddd';
        if (val >= 0) {
            const color = `rgba(255, 20, 147, ${intensity})`;
            background = `linear-gradient(
                to right, 
                ${baseGray} 50%, 
                rgba(255, 20, 147, 0.1) 50%, 
                ${color} ${percent}%, 
                ${baseGray} ${percent}%
            )`;
        } else {
            const color = `rgba(30, 100, 255, ${intensity})`;
            background = `linear-gradient(
                to right, 
                ${baseGray} ${percent}%, 
                ${color} ${percent}%, 
                rgba(30, 144, 255, 0.1) 50%, 
                ${baseGray} 50%
            )`;
        }
        slider.style.setProperty('--track-color', background);

        const currentValue = parseInt((e.target as HTMLInputElement).value);

        if (currentValue !== 0 && currentValue % 5 === 0 && currentValue !== lastSoundValue) {
            moveSound.currentTime = 0;
            moveSound.play();

            lastSoundValue = currentValue;
        }
    });

    slider.addEventListener('pointerup', () => {
        slider.style.setProperty('--thumb-size', '32px');

        stopSound.currentTime = 0;
        stopSound.play();

        lastSoundValue = null;
    });
    
    slider.dispatchEvent(new Event('input'));
}

function add20Qs() {
    for (let index = 0; index < 20; index++) {
        addQuestion();
    }
}

function add10Qs() {
    for (let index = 0; index < 10; index++) {
        addQuestion();
    }
}

// 診断の表示を切り替える関数
const startDiagnosis = (): void => {
    const introdction = document.getElementById('introduction') as HTMLDivElement | null;
    const firstExp = document.getElementById('first-exp') as HTMLParagraphElement | null;
    const secondExp = document.getElementById('second-exp') as HTMLParagraphElement | null;
    const thirdExp = document.getElementById('third-exp') as HTMLParagraphElement | null;
    const startBtn = document.getElementById('start-btn') as HTMLButtonElement | null;
    const question = document.getElementById('question') as HTMLDivElement | null;
    const select = document.getElementById('select') as HTMLDivElement | null;
    const title = document.querySelector('h1')

    if (introdction && firstExp && secondExp && thirdExp && startBtn && question && select && title) {
        startBtn.addEventListener('click', () => {
            introdction.classList.replace('visible', 'hidden');
            startBtn.classList.replace('visible', 'hidden');

            document.body.style.justifyContent = 'flex-start';
            document.body.classList.add('is-diagnosing');

            setTimeout(() => {
                introdction.classList.add('fixed-header');
                thirdExp.classList.add('hidden');
                title.classList.add('diagnosis-mode');
                firstExp.classList.add('diagnosis-mode');
                secondExp.classList.add('diagnosis-mode');
                startBtn.style.display = 'none';
                introdction.classList.replace('hidden', 'visible');
            }, 500);

            setTimeout(() => {
                introdction.classList.add('is-diagnosing')
                question.classList.replace('hidden', 'visible');
                select.classList.replace('hidden', 'visible');
                add20Qs();
            }, 1000);
        });
    }
};

interface Answer {
    r: number;
    g: number;
    b: number;
    preference: number;
}

// 結果を集計する関数
function finish() {
    const allAnswers: Answer[] = [];

    for (let i = 1; i <= questionCount; i++) {
        const slider = document.getElementById(`slider-${i}`) as HTMLInputElement;
        
        if(slider) {
            allAnswers.push({
                r: generatedRGB[i-1][0],
                g: generatedRGB[i-1][1],
                b: generatedRGB[i-1][2],
                preference: parseInt(slider.value, 10)
            });
        }
    }

    const diagnosisData = {
        answeredCount: questionCount,
        answers: allAnswers,
        timestamp: new Date().getTime()
    };

    localStorage.setItem('color_personality_test_result', JSON.stringify(diagnosisData));
    window.location.href = '../result/index.html';
}

startDiagnosis();
document.getElementById('continue-btn')?.addEventListener('click', add10Qs);
document.getElementById('finish-btn')?.addEventListener('click', finish);