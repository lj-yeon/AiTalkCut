import fs from 'fs';
import { execSync } from 'child_process';
import textToSpeech from '@google-cloud/text-to-speech'; // Google Cloud TTS
import fsPromises from 'fs/promises';

// Google Cloud TTS를 사용하려면 서비스 계정 키가 필요합니다.
// GOOGLE_APPLICATION_CREDENTIALS 환경변수에 키 파일 경로를 지정하세요.

// 1. result1.json 읽기
const scenes = JSON.parse(fs.readFileSync('result/result1.json', 'utf-8'));

// 1-1. 씬별 TTS(mp3) 자동 생성 (audio/scene_1.mp3 ~ scene_18.mp3)
const ttsClient = new textToSpeech.TextToSpeechClient();
async function generateTTS(text, outputPath) {
  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: { languageCode: 'ko-KR', ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3' },
  });
  await fsPromises.writeFile(outputPath, response.audioContent, 'binary');
}

(async () => {
  // audio 폴더가 없으면 생성
  if (!fs.existsSync('audio')) fs.mkdirSync('audio');
  for (let i = 1; i <= 18; i++) {
    const scene = scenes[`scene_${i}`];
    if (!scene || !scene.script) continue;
    const outputPath = `audio/scene_${i}.mp3`;
    await generateTTS(scene.script, outputPath);
    console.log(`${outputPath} 생성 완료`);
  }

  // 2. ASS 자막 파일 생성
  let ass = '';
  let currentTime = 0;
  function toAssTime(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(1, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(sec % 60)).padStart(2, '0');
    const cs = String(Math.floor((sec % 1) * 100)).padStart(2, '0');
    return `${h}:${m}:${s}.${cs}`;
  }
  // ASS 헤더 및 스타일
  ass += `[Script Info]\n`;
  ass += `; 이 파일은 자동 생성된 ASS(Advanced SubStation Alpha) 자막 파일입니다.\n`;
  ass += `ScriptType: v4.00+\n`;
  ass += `PlayResX: 720\n`;
  ass += `PlayResY: 1280\n`;
  ass += `\n`;
  ass += `[V4+ Styles]\n`;
  ass += `Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n`;
  ass += `; Style: 스타일명, 글꼴, 크기, 글자색, 테두리색, 배경색, 굵게, 이탤릭, 밑줄, 취소선, 가로/세로 비율, 자간, 각도, 테두리/그림자, 정렬, 여백, 인코딩\n`;
  // PrimaryColour: &H00000000 (검정), OutlineColour: &H00000000 (투명), Outline: 0, Shadow: 0, Fontname: Malgun Gothic(맑은 고딕), Bold: 1(굵게)
  ass += `Style: Default,Malgun Gothic,62,&H00000000,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,8,30,30,250,1\n`;
  ass += `\n`;
  ass += `[Events]\n`;
  ass += `Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  for (let i = 1; i <= 18; i++) {
    const scene = scenes[`scene_${i}`];
    if (!scene || !scene.script) continue;
    const start = toAssTime(currentTime);
    const end = toAssTime(currentTime + 3.5);
    ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${scene.script.replace(/\n/g, ' ')}\n`;
    currentTime += 3.5;
  }
  fs.writeFileSync('subtitles.ass', ass, 'utf-8');
  console.log('subtitles.ass 생성 완료');

  // 3. ffmpeg로 ass 자막 입힌 영상 자동 생성
  try {
    execSync('ffmpeg -i images/result.mp4 -vf ass=subtitles.ass -c:a copy output_with_subs.mp4', { stdio: 'inherit' });
    console.log('output_with_subs.mp4 생성 완료!');
  } catch (e) {
    console.error('ffmpeg 실행 중 오류 발생:', e.message);
  }
})(); 