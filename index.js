import axios from "axios";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

// 환경변수에서 OPENAI_API_KEY를 불러옵니다
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Express 앱(서버) 생성
const app = express();
// 서버가 실행될 포트 번호 (기본값 3001)
const PORT = process.env.PORT || 3001;

// CORS 허용(다른 도메인에서 요청 가능하게 함)
app.use(cors());

// JSON 형식의 요청 본문(body) 파싱 (최대 2MB)
app.use(express.json({ limit: "2mb" }));

``;
// __dirname 구하기 (ESM 환경에서)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// public 폴더의 정적 파일(HTML, CSS, JS 등) 서빙
app.use(express.static(path.join(__dirname, "public")));

// 실제 OpenAI API를 호출하여 대본을 10개 씬으로 분할하는 함수
async function getStructuredScenes(script) {
  const prompt = `
You are a helpful assistant that splits a given script into 10 scenes for a video. 
For each scene, extract the main keyword and write a concise script for that scene.
Return the result as a JSON array with the following structure:

[
  {
    "scene": 1,
    "script": "...",
    "main_keyword": "..."
  },
  ...
  {
    "scene": 10,
    "script": "...",
    "main_keyword": "..."
  }
]

Script:
"""${script}"""
`;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return JSON.parse(response.data.choices[0].message.content);
}

// 실제 OpenAI DALL·E API를 호출하여 이미지를 생성하는 함수
async function generateImage(prompt) {
  const response = await axios.post(
    "https://api.openai.com/v1/images/generations",
    {
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.data[0].url;
}

// [엔드포인트 1] 대본을 10개의 씬으로 분할 (실제 OpenAI 호출)
app.post("/api/scenes", async (req, res) => {
  // 요청에서 script(대본) 추출
  const { script } = req.body;
  if (!script) return res.status(400).json({ error: "script is required" });
  try {
    const scenes = await getStructuredScenes(script);
    // 씬 배열을 JSON으로 응답
    res.json({ scenes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [엔드포인트 2] 씬별 main_keyword로 이미지 생성 (실제 OpenAI 호출)
app.post("/api/images", async (req, res) => {
  // 요청에서 scenes 배열 추출
  const { scenes } = req.body;
  if (!scenes || !Array.isArray(scenes))
    return res.status(400).json({ error: "scenes array is required" });
  try {
    // 각 씬에 대해 이미지 생성
    const results = [];
    for (const scene of scenes) {
      const imagePrompt = `Create an image that represents the following keyword in the context of the script: "${scene.main_keyword}"`;
      const image_url = await generateImage(imagePrompt);
      results.push({ ...scene, image_url });
    }
    // 이미지가 추가된 씬 배열을 JSON으로 응답
    res.json({ scenes: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 서버 실행 (지정한 포트에서 요청 대기)
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
