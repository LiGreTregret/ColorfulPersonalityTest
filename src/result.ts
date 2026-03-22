import './result.css'
import { supabase } from './supabaseClient';

export interface Answer {
    r: number;
    g: number;
    b: number;
    preference: number;
}

interface FeedbackSummary {
    personalityType: string;
    favoriteworldScore: number;
    informationScore: number;
    decisionsScore: number;
    structureScore: number;
    pastType: string;
    fit: number;
}

// 結果判定の際に使うリスト
export const typeList = [
    [
        [
            ["ISTJ", "ISTP"], ["ISFJ", "ISFP"]
        ],
        [
            ["INTJ", "INTP"], ["INFJ", "INFP"]
        ]
    ],
    [
        [
            ["ESTJ", "ESTP"], ["ESFJ", "ESFP"]
        ],
        [
            ["ENTJ", "ENTP"], ["ENFJ", "ENFP"]
        ]
    ]
];

// アルファベットと型名の対応object
const typeMapping = [
    ["内向型", "外向型"],
    ["感覚型", "直感型"],
    ["思考型", "感情型"],
    ["判断型", "知覚型"]
];

// 性格タイプの特徴を確認するサイトへのリンク
const personalityLink: { [key: string]: string } = {
    "ISTJ" : "https://www.16personalities.com/ja/istj%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "ISTP" : "https://www.16personalities.com/ja/istp%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "ISFJ" : "https://www.16personalities.com/ja/isfj%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "ISFP" : "https://www.16personalities.com/ja/isfp%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "INTJ" : "https://www.16personalities.com/ja/intj%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "INTP" : "https://www.16personalities.com/ja/intp%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "INFJ" : "https://www.16personalities.com/ja/infj%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "INFP" : "https://www.16personalities.com/ja/infp%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "ESTJ" : "https://www.16personalities.com/ja/estj%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "ESTP" : "https://www.16personalities.com/ja/estp%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "ESFJ" : "https://www.16personalities.com/ja/esfj%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "ESFP" : "https://www.16personalities.com/ja/esfp%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "ENTJ" : "https://www.16personalities.com/ja/entj%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "ENTP" : "https://www.16personalities.com/ja/entp%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "ENFJ" : "https://www.16personalities.com/ja/enfj%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC",
    "ENFP" : "https://www.16personalities.com/ja/enfp%E5%9E%8B%E3%81%AE%E6%80%A7%E6%A0%BC"
};


/** 各要素のスコアを求めるときに使用される関数を定義 */
// 色相を返す関数
export function hue(r: number, g: number, b: number): number {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    let h = 0;
    if (max === r) h = (g - b) / (max - min);
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;

    h *= 60;
    if (h < 0) h += 360;
    
    return h;
}

// 彩度を返す関数
function saturation(r: number, g: number, b: number): number {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    let s = 0;
    if (max > 0) {
        s = (max - min) / max;
    }
    
    return s * 100;
}

// 明度を返す関数
function brightness(r: number, g: number, b: number): number {
    const max = Math.max(r, g, b);
    return (max / 255) * 100;
}

// RGB値をHSB値に変換する関数
function RGBtoHSB(r: number, g: number, b: number): number[] {
    const h = hue(r, g, b);
    const s = saturation(r, g, b);
    const br = brightness(r, g, b);

    return [h, s, br];
}

// HSB値をRGB値に変換する関数
function HSBtoRGB(h: number, s: number, br:number): number[] {
    const max = br * 255 / 100;
    const min = max - (s * max / 100);

    if (0 <= h && h < 60) {
        return [max, (h / 60) * (max - min) + min, min];
    } else if (60 <= h && h < 120) {
        return [((120 - h) / 60) * (max - min) + min, max, min];
    } else if (120 <= h && h < 180) {
        return [min, max, ((120 - h) / 60) * (max - min) + min];
    } else if (180 <= h && h < 240) {
        return [min, ((240 - h) / 60) * (max - min) + min, max];
    } else if (240 <= h && h < 300) {
        return [((h - 240) / 60) * (max - min) + min, min, max];
    } else if (300 <= h && h < 360) {
        return [max, min, ((360 - h) / 60) * (max - min) + min];
    }

    // エラー返り値
    return [-1, -1, -1];
}

// 好き度が負のときに反転させる関数
function makePreferencePositive(score: number, pref: number): number[] {
    if (pref >= 0) {
        return [score, pref];
    } else {
        return [100-score, -pref];
    }
}


/** 各要素のスコアを求める関数を定義 */
// 興味関心の方向を評価する関数(値が大きくなるほど外向的(E))
export function calculateFavoriteworldScore(ans: Answer): number[] {
    const max = Math.max(ans.r, ans.g, ans.b);
    const min = Math.min(ans.r, ans.g, ans.b);

    let h = 0;
    if (max - min > 9) {
        h = hue(ans.r, ans.g, ans.b);
    } else {
        return [50, 0];
    }

    let score = 0;
    if (h <= 270) score = (270 - h) / 2.7;
    else score = (h - 270) / 0.9;

    return makePreferencePositive(score, ans.preference);
}

// ものの見方を評価する関数(値が大きくなるほど直感型(N))
export function calculateInformationScore(ans:Answer): number[] {
    const s = saturation(ans.r, ans.g, ans.b);

    return makePreferencePositive(s, ans.preference);
}

// 判断の仕方を評価する関数(値が大きくなるほど感情型(F))
export function calculateDecisionsScore(ans: Answer): number[] {
    const max = Math.max(ans.r, ans.g, ans.b);
    const min = Math.min(ans.r, ans.g, ans.b);

    let h = 0;
    if (max - min > 9) {
        h = hue(ans.r, ans.g, ans.b);
    } else {
        return [50, 0];
    }

    let score = 0;
    if (h <= 180) {
        score = 100 - (h / 1.8);
    } else {
        score = (h - 180) / 1.8;
    }

    return makePreferencePositive(score, ans.preference);
}

// 外界への接し方を評価する(値が大きくなるほど知覚型(P))
export function calculateStructureScore(ans: Answer): number[] {
    const rgb = [ans.r, ans.g, ans.b];
    const sortedRGB = rgb.sort((a, b) => a - b);

    const lowerDifference = sortedRGB[1] - sortedRGB[0];
    const largerDifference = sortedRGB[2] - sortedRGB[1];

    const score = Math.max(lowerDifference - largerDifference, 0) / 2.55;

    return makePreferencePositive(score, ans.preference);
}


/** 診断結果を表示するための計算を行うときに使う関数を定義 */
// 各要素についてどちらの傾向かを判断する関数
function assessTendency(score: number): number {
    if (score < 50) return 0;
    else return 1;
}

// 1番好きだと思われる色をつくる準備をする関数
export function makeColorPreferenceInformation(ans: Answer): number[] {
    if (ans.preference >= 0) {
        return [ans.r, ans.g, ans.b, ans.preference];
    } else {
        return [255-ans.r, 255-ans.g, 255-ans.b, -ans.preference]; // 反対の色に変える
    }
}

// 重み付き平均を求める関数（重みの合計が0のときに50を返す）
function calculateWeightedAverage(score: number, sum: number): number {
    if (sum > 0) return score / sum;
    else return 50;
}

// 各要素の割合を求める関数
function calculateRatio(score: number): number {
    if (score < 50) return Math.floor(100 - score);
    else return Math.floor(score); 
}

function setMarker(score: number): number {
    score = Math.floor(score);
    if (score < 3) {
        return 0;
    } else if (score < 98) {
        return 380 * score / 100 + (score - 55) * 0.2;
    } else {
        return 380;
    }
}


/** 診断結果を表示するために直接用いられる関数を定義 */
// 回答データから診断結果を計算する関数
export function diagnose(answers: Answer[]) {
    let favoriteworldScore = 0;
    let favoriteworldWeightSum = 0;
    let informationScore = 0;
    let informationWeightSum = 0;
    let decisionsScore = 0;
    let decisionsWeightSum = 0;
    let structureScore = 0;
    let structureWeightSum = 0;
    let v = [0, 0];

    for (let ans of answers) {
        v = calculateFavoriteworldScore(ans);
        favoriteworldScore += v[0] * v[1];
        favoriteworldWeightSum += v[1];

        v = calculateInformationScore(ans);
        informationScore += v[0] * v[1];
        informationWeightSum += v[1];

        v = calculateDecisionsScore(ans);
        decisionsScore += v[0] * v[1];
        decisionsWeightSum += v[1];

        v = calculateStructureScore(ans);
        structureScore += v[0] * v[1];
        structureWeightSum += v[1];
    }

    favoriteworldScore = calculateWeightedAverage(favoriteworldScore, favoriteworldWeightSum);
    informationScore = calculateWeightedAverage(informationScore, informationWeightSum);
    decisionsScore = calculateWeightedAverage(decisionsScore, decisionsWeightSum);
    structureScore = calculateWeightedAverage(structureScore, structureWeightSum);

    const extravertion = assessTendency(favoriteworldScore);
    const intuition = assessTendency(informationScore);
    const feeling = assessTendency(decisionsScore);
    const perceiving = assessTendency(structureScore);

    return {
        "type" : typeList[extravertion][intuition][feeling][perceiving],
        "favoriteworldScore" : favoriteworldScore,
        "informationScore" : informationScore,
        "decisionsScore" : decisionsScore,
        "structureScore" : structureScore,
        "extravertion" : extravertion,
        "intuition" : intuition,
        "feeling" : feeling,
        "perceiving" : perceiving
    }
}

// ユーザが最も好きであると思われる色をつくる関数
export function makeFavoriteColor(answers: Answer[]) : number[] {
    let rPallet = 0;
    let gPallet = 0;
    let bPallet = 0;
    let colorWeightSum = 0;
    let w = [0, 0, 0, 0];

    for (let ans of answers) {
        w = makeColorPreferenceInformation(ans);
        rPallet += w[0] * w[3];
        gPallet += w[1] * w[3];
        bPallet += w[2] * w[3];
        colorWeightSum += w[3];
    }

    rPallet /= colorWeightSum;
    gPallet /= colorWeightSum;
    bPallet /= colorWeightSum;

    return [rPallet, gPallet, bPallet];
}

// 背景の色をつくる関数
function makeBackgroundColor(r: number, g: number, b: number): number[] {
    const hsb = RGBtoHSB(r, g, b);
    if (hsb[1] > 30) {
        return HSBtoRGB(hsb[0], hsb[1], hsb[2]);
    } else {
        return [r, g, b];
    }
}

// 結果表示の文字色をつくる関数
function makeResultColor(r: number, g: number, b: number): number[] {
    const hsb = RGBtoHSB(r, g, b);
    if (hsb[1] > 30) {
        return [r, g, b];
    } else {
        return HSBtoRGB(hsb[0], 100, 50);
    }
}

// データベースに回答概要データを記録する関数
async function saveFeedbackSummary(summary: FeedbackSummary): Promise<string | null> {
    const { data, error } = await supabase
        .from('feedback_summary')
        .insert([
            {
                personality_type: summary.personalityType,
                favoriteworld_score: summary.favoriteworldScore,
                information_score: summary.informationScore,
                decisions_score: summary.decisionsScore,
                structure_score: summary.structureScore,
                past_type: summary.pastType,
                fit: summary.fit
            }
        ])
        .select('id')
        .single();
    
    if (error) {
        console.error('詳細なエラー内容(feedback_summary)', error);
        return null;
    } else {
        return data.id;
    }
}

// データベースに回答データを記録する関数
async function saveAnswers(answers: Answer[], sessionId: string): Promise<number> {
    const answersToInsert = answers.map((ans, i) => ({
        session_id: sessionId,
        question_index: i + 1,
        r: ans.r,
        g: ans.g,
        b: ans.b,
        preference: ans.preference
    }));

    const { error } = await supabase
        .from('answer')
        .insert(answersToInsert);

    if (error) {
        console.error('詳細なエラー内容(answers)', error);
        return 1;
    } else {
        return 0;
    }
}


/** 回答後に実行される処理 */
// データの取得
const rawData = localStorage.getItem('color_personality_test_result') as string;
if (!rawData) {
    alert('診断できませんでした。回答ページに戻ります。')
    window.location.href = 'index.html';
}

// データのパース
const data = JSON.parse(rawData);
const answers: Answer[] = data.answers;

// 計算
const result = diagnose(answers);
const favoriteColor = makeFavoriteColor(answers);
const backgroundColor = makeBackgroundColor(favoriteColor[0], favoriteColor[1], favoriteColor[2]);
const resultColor = makeResultColor(favoriteColor[0], favoriteColor[1], favoriteColor[2]);

// 診断結果の表示、性格タイプ文字色の変更
const result2Element = document.getElementById('result2');
if (result2Element) {
    result2Element.textContent = result["type"];
    result2Element.style.color = `
        rgb(${resultColor[0]}, ${resultColor[1]}, ${resultColor[2]})
    `;
}

// 背景色の変更
document.body.style.backgroundColor = `
    rgb(${backgroundColor[0]}, ${backgroundColor[1]}, ${backgroundColor[2]})
`;

// 文字色の変更
if (backgroundColor[0] + backgroundColor[1] + backgroundColor[2] < 350) {
    document.getElementById('ratio')?.style.setProperty('--text-color', "#f2f2f2");
    document.body.style.setProperty('--text-color', "#f2f2f2");
    
}

// 型の表示
const favoriteworldLabel = document.getElementById('favoriteworld-label');
const informationLabel = document.getElementById('information-label');
const decisionsLabel = document.getElementById('decisions-label');
const structureLabel = document.getElementById('structure-label');

if (favoriteworldLabel) favoriteworldLabel.textContent = typeMapping[0][result["extravertion"]];
if (informationLabel) informationLabel.textContent = typeMapping[1][result["intuition"]];
if (decisionsLabel) decisionsLabel.textContent = typeMapping[2][result["feeling"]];
if (structureLabel) structureLabel.textContent = typeMapping[3][result["perceiving"]];

// 割合を棒グラフで表現
const favoriteworldBar = document.getElementById('favoriteworld-bar-fill');
const informationBar = document.getElementById('information-bar-fill');
const decisionsBar = document.getElementById('decisions-bar-fill');
const structureBar = document.getElementById('structure-bar-fill');

if (favoriteworldBar) favoriteworldBar.style.width = `${Math.floor(result["favoriteworldScore"])}%`;
if (informationBar) informationBar.style.width = `${Math.floor(result["informationScore"])}%`;
if (decisionsBar) decisionsBar.style.width = `${Math.floor(result["decisionsScore"])}%`;
if (structureBar) structureBar.style.width = `${Math.floor(result["structureScore"])}%`;

//  色の境目にマーカーを設置
const favoriteworldMarker = document.getElementById('favoriteworld-marker');
const informationMarker = document.getElementById('information-marker');
const decisionsMarker = document.getElementById('decisions-marker');
const structureMarker = document.getElementById('structure-marker');

if (favoriteworldMarker) favoriteworldMarker.style.setProperty('--position-favoriteworld', `${setMarker(result['favoriteworldScore'])}px`);
if (informationMarker) informationMarker.style.setProperty('--position-information', `${setMarker(result['informationScore'])}px`);
if (decisionsMarker) decisionsMarker.style.setProperty('--position-decisions', `${setMarker(result['decisionsScore'])}px`);
if (structureMarker) structureMarker.style.setProperty('--position-structure', `${setMarker(result['structureScore'])}px`);

// 割合の表示
const favoriteworldRatioValue = document.getElementById('favoriteworld-ratio-value');
const informationRatioValue = document.getElementById('information-ratio-value');
const decisionsRatioValue = document.getElementById('decisions-ratio-value');
const structureRatioValue = document.getElementById('structure-ratio-value');

if (favoriteworldRatioValue) favoriteworldRatioValue.textContent = `${calculateRatio(result["favoriteworldScore"])}%`;
if (informationRatioValue) informationRatioValue.textContent = `${calculateRatio(result["informationScore"])}%`;
if (decisionsRatioValue) decisionsRatioValue.textContent = `${calculateRatio(result["decisionsScore"])}%`;
if (structureRatioValue) structureRatioValue.textContent = `${calculateRatio(result["structureScore"])}%`;

// 特徴閲覧ボタンの文字を入れる
const featureButton = document.getElementById('feature-button');
if (featureButton) featureButton.textContent = `別タブで${result["type"]}の特徴を見る(16Personalitiesの性格説明ページに飛びます)`;

// 特徴閲覧ボタンにリンクを埋め込む
featureButton?.addEventListener('click', () => {
    window.open(personalityLink[result["type"]], '_blank');
})

// XボタンにX投稿機能を埋め込む
const xButton = document.getElementById('X');
xButton?.addEventListener('click', () => {
    const postText = `カラフルパーソナリティ診断で「${result["type"]}」と診断されました！`;
    const shareUrl = window.location.origin + window.location.pathname;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(xUrl, '_blank', 'noreferrer');
});

// 星を動かす動作をつくる
const starInput = document.getElementById('star-input') as HTMLInputElement | null;
const starRate = document.getElementById('rate');

starInput?.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    starRate?.style.setProperty('--percent', `${value}%`);
});

// フィードバック送信ボタンが押されたときの動作
const selectPastresult = document.getElementById('select-pastresult') as HTMLSelectElement | null;
const sendButtton = document.getElementById('send') as HTMLButtonElement | null;
sendButtton?.addEventListener('click', async () => {
    const summary: FeedbackSummary = {
        personalityType: result['type'],
        favoriteworldScore: result['favoriteworldScore'],
        informationScore: result['informationScore'],
        decisionsScore: result['decisionsScore'],
        structureScore: result['structureScore'],
        pastType: selectPastresult?.value ?? "error",
        fit: parseInt(starInput?.value ?? "-1")
    };

    const sessionId = await saveFeedbackSummary(summary);
    let errAnswers = 0;
    if (sessionId) {
        errAnswers = await saveAnswers(answers, sessionId);
    }

    if (sessionId && (errAnswers === 0)) {
        if (selectPastresult) {
            selectPastresult.disabled = true;
            selectPastresult.style.backgroundColor = 'rgb(218, 218, 218)';
        }
        if (starInput) starInput.disabled = true;
        sendButtton.textContent = "送信ありがとうございました";
        sendButtton.disabled = true;
        sendButtton.style.backgroundColor = 'rgb(214, 172, 113)';
    } else {
        alert('もう一度送信してください！');
    }
});