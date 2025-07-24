import dotenv from "dotenv";
import OpenAI from "openai";
import { z } from "zod"; 
import fs from "fs";
import path from "path";
dotenv.config();


// 스키마 정의 ========================================

// 각 씬의 구조: script(대본), main_keyword(키워드)
const singleSceneSchema = z.object({
  script: z.string(),
  main_keyword: z.string()
});

// 18개의 씬을 scene_1 ~ scene_18 키로 갖는 객체로 정의
const scenesObjectSchema = z.object(
  Object.fromEntries(
    Array.from({ length: 18 }, (_, i) => [
      `scene_${i + 1}`,
      singleSceneSchema
    ])
  )
);

// 각 버전의 구조: version(버전 번호), scenes(씬 객체)
const versionSchema = z.object({
  version: z.number(),
  scenes: scenesObjectSchema
});

// 최종 응답 구조: versions(버전 4개 배열)
const responseSchema = z.object({
  versions: z.array(versionSchema).length(4)
});

// GPT에게 구조화된 결과 요청하는 함수 ========================================

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getSceneVersions(script) {
  // GPT에게 원하는 JSON 구조를 안내하는 프롬프트
  const prompt = `
아래 원고를 18개의 씬으로 나누고, 서로 다르게 분할한 버전을 4개 만들어줘.
각 버전은 1~18번 씬을 아래와 같이 "scenes" 객체의 "scene_1", "scene_2", ... 형태의 key로 반환해.
각 씬은 {script, main_keyword} 형태의 JSON 오브젝트여야 해.
최종 결과는 아래와 같은 JSON 구조로만 반환해줘(불필요한 텍스트 없이):

{
  "versions": [
    {
      "version": 1,
      "scenes": {
        "scene_1": { "script": "...", "main_keyword": "..." },
        ...
        "scene_18": { "script": "...", "main_keyword": "..." }
      }
    },
    ...
    {
      "version": 4,
      "scenes": {
        "scene_1": { "script": "...", "main_keyword": "..." },
        ...
        "scene_18": { "script": "...", "main_keyword": "..." }
      }
    }
  ]
}

원고:
"""${script}"""
`;

  // OpenAI GPT에 JSON 응답 요청
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  // 응답에서 JSON 파싱 및 스키마 검증
  let parsed;
  try {
    // response.choices[0].message.content는 JSON 문자열
    parsed = responseSchema.parse(JSON.parse(response.choices[0].message.content));
  } catch (e) {
    console.error("응답이 예상한 구조가 아닙니다:", e);
    throw e;
  }
  return parsed;
}


// 메인 실행부 ========================================

async function main() {
  // 1. script.txt 파일에서 원고 읽기
  let script;
  try {
    script = fs.readFileSync("script.txt", "utf-8");
  } catch (e) {
    console.error("script.txt 파일을 읽을 수 없습니다. 파일이 존재하는지 확인하세요.");
    process.exit(1);
  }

  // 2. 생성 시작 안내 메시지
  console.log("생성 중입니다. 잠시만 기다려주세요...");

  // 3. 결과 생성
  const result = await getSceneVersions(script);

  // 4. /result 폴더가 없으면 생성
  const resultDir = path.join(process.cwd(), "result");
  if (!fs.existsSync(resultDir)) {
    fs.mkdirSync(resultDir);
  }

  // 5. 버전별로 /result 폴더에 파일 저장
  result.versions.forEach(versionObj => {
    const filename = path.join(resultDir, `result${versionObj.version}.json`);
    fs.writeFileSync(filename, JSON.stringify(versionObj.scenes, null, 2), "utf-8");
    console.log(`${filename} 파일이 생성되었습니다.`);
  });
}

main();
